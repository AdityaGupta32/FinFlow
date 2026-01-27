import os
import re
import uuid
import uvicorn
from datetime import datetime
from fastapi import FastAPI, UploadFile, File, Form, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
import pdfplumber

# Load environment variables
load_dotenv()

# 1. Initialize FastAPI app (Standalone)
app = FastAPI(title="Finance Parser Service")

# 2. Add CORS so your React frontend can talk to it directly
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, replace with your Vercel URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Initialize Supabase client
# Ensure these variables are set in your Railway 'Variables' tab
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# 4. Define an APIRouter (Optional but good for modularity)
router = APIRouter()

def clean_amount(amount_str: str) -> float:
    """ Converts amount string like 'Rs. 1,234.56' or '+Rs. 500' to float. """
    cleaned = re.sub(r'[Rs\.,\s₹+]', '', amount_str)
    try:
        return float(cleaned)
    except ValueError:
        return 0.0

def extract_category_dynamic(block_text: str) -> str:
    """ Dynamically extracts category by looking for the hashtag symbol. """
    tag_match = re.search(r'#\s*([A-Za-z]+(?:\s+[A-Za-z]+)*)', block_text)
    
    if tag_match:
        category = tag_match.group(1).strip()
        category = ' '.join(word.capitalize() for word in category.split())
        
        tag_map = {
            "Medical": "Healthcare",
            "Transfers": "Money Transfer",
            "Money Transfer": "Money Transfer",
            "Money Received": "Money Received"
        }
        return tag_map.get(category, category)
        
    return "Miscellaneous"

@router.post("/upload")
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

        # Split into blocks starting with a Date
        lines = full_text.split('\n')
        current_block = []
        transaction_blocks = []
        
        for line in lines:
            if re.match(r'^(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2})', line):
                if current_block:
                    transaction_blocks.append('\n'.join(current_block))
                current_block = [line]
            else:
                current_block.append(line)
        
        if current_block:
            transaction_blocks.append('\n'.join(current_block))

        # Process each transaction block
        for block in transaction_blocks:
            name_pattern = r'(?:Paid to|Received from|Money sent to|Payment to|Automatic payment for)\s+(.*?)(?=\s{2,}|Tag:|UPI ID:|#|\n|$)'
            name_match = re.search(name_pattern, block, re.IGNORECASE | re.DOTALL)
            
            if not name_match:
                continue
            
            description = name_match.group(1).strip()
            description = description.split('\n')[0].strip()
            category = extract_category_dynamic(block)

            amount_match = re.search(r'[+-]?\s*Rs\.?\s*([\d,]+\.?\d*)', block)
            if not amount_match:
                continue
            amount_value = clean_amount(amount_match.group(0))

            date_match = re.search(r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec))', block)
            if not date_match:
                continue
            
            date_str = date_match.group(1).strip()
            year = "2024" if "Dec" in date_str else "2025"
            
            try:
                transaction_date = datetime.strptime(f"{date_str} {year}", "%d %b %Y").date().isoformat()
            except ValueError:
                continue

            transactions.append({
                "user_id": user_id,
                "date": transaction_date,
                "description": description,
                "amount": amount_value,
                "category": category
            })

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
        return {
            "status": "error", 
            "message": f"Failed to process PDF: {str(e)}"
        }
    
    finally:
        # Clean up temporary file
        if os.path.exists(temp_file):
            os.remove(temp_file)

# Include the router in the app
app.include_router(router)

@app.get("/")
def health_check():
    return {"status": "Parser Service is Live"}

# For Railway Deployment
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
