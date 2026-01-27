import os
import re
import uuid
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form
from supabase import create_client
from dotenv import load_dotenv
import pdfplumber

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# Create router instead of app
app = APIRouter()

def clean_amount(amount_str: str) -> float:
    """
    Converts amount string like 'Rs. 1,234.56' or '+Rs. 500' to float.
    """
    # Remove Rs, currency symbols, spaces, and commas
    cleaned = re.sub(r'[Rs\.,\s₹+]', '', amount_str)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def extract_category_dynamic(block_text: str) -> str:
    """
    Dynamically extracts category by looking for the hashtag symbol.
    In Paytm statements, categories are preceded by # (e.g., #Food, #Medical).
    """
    # Look for # followed by letters, allowing for spaces like "# Bill Payments"
    tag_match = re.search(r'#\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)', block_text)
    
    if tag_match:
        category = tag_match.group(1).strip()
        # Clean up common variations to keep database consistent
        category = ' '.join(word.capitalize() for word in category.split())
        
        # Mapping specific statement tags to standard categories
        tag_map = {
            "Medical": "Healthcare",
            "Transfers": "Money Transfer",
            "Money Transfer": "Money Transfer",
            "Money Received": "Money Received"
        }
        return tag_map.get(category, category)
        
    return "Miscellaneous"

@app.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    """
    Endpoint to upload and parse PDF bank statements.
    Extracts transactions and stores them in Supabase.
    """
    temp_file = f"temp_{uuid.uuid4().hex}.pdf"
    transactions = []

    try:
        # Save uploaded file temporarily
        contents = await file.read()
        with open(temp_file, "wb") as f:
            f.write(contents)

        # Extract text from PDF
        full_text = ""
        with pdfplumber.open(temp_file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

        # Split into blocks starting with a Date (e.g., "16 Dec" or "Dec 16")
        lines = full_text.split('\n')
        current_block = []
        transaction_blocks = []
        
        for line in lines:
            # Matches "16 Dec" or "Dec 16"
            if re.match(r'^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})', line):
                if current_block:
                    transaction_blocks.append('\n'.join(current_block))
                current_block = [line]
            else:
                current_block.append(line)
        
        # Don't forget the last block
        if current_block:
            transaction_blocks.append('\n'.join(current_block))

        # Process each transaction block
        for block in transaction_blocks:
            # 1. Extract Merchant Name
            # Pattern: Captures everything after "Paid to/Received from" 
            name_pattern = r'(?:Paid to|Received from|Money sent to|Payment to|Automatic payment for)\s+(.*?)(?=\s{2,}|Tag:|UPI ID:|#|\n|$)'
            name_match = re.search(name_pattern, block, re.IGNORECASE | re.DOTALL)
            
            if not name_match:
                continue
            
            description = name_match.group(1).strip()
            # Clean up merchant name if it caught extra newlines
            description = description.split('\n')[0].strip()

            # 2. Extract Category Dynamically
            category = extract_category_dynamic(block)

            # 3. Extract Amount
            amount_match = re.search(r'[+-]?\s*Rs\.?\s*([\d,]+\.?\d*)', block)
            if not amount_match:
                continue
            amount_value = clean_amount(amount_match.group(0))

            # 4. Extract Date
            date_match = re.search(r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))', block)
            if not date_match:
                continue
            
            date_str = date_match.group(1).strip()
            # Dynamic year assignment - adjust this logic based on your needs
            # This assumes Dec transactions are from 2024, others from 2025
            year = "2024" if "Dec" in date_str else "2025"
            
            try:
                transaction_date = datetime.strptime(f"{date_str} {year}", "%d %b %Y").date().isoformat()
            except ValueError:
                continue

            # Build transaction object
            transactions.append({
                "user_id": user_id,
                "date": transaction_date,
                "description": description,
                "amount": amount_value,
                "category": category
            })

        # Insert transactions into Supabase
        if transactions:
            supabase.table("transactions").insert(transactions).execute()
            return {
                "status": "success", 
                "count": len(transactions),
                "message": f"Successfully parsed {len(transactions)} transactions"
            }

        return {
            "status": "error", 
            "message": "No valid transactions found in the PDF"
        }

    except Exception as e:
        print(f"Error processing PDF: {e}")
        return {
            "status": "error", 
            "message": f"Failed to process PDF: {str(e)}"
        }
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)
