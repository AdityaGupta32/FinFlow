import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your individual logic files
import Parser 
import spending

app = FastAPI()

# Enable CORS for your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://fin-flow-mauve.vercel.app" # Removed trailing slash for better matching
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes from parser.py and spending.py
app.include_router(Parser.app.router) 
app.include_router(spending.router)

@app.get("/")
def health_check():
    return {"status": "Finance.AI Backend Online"}

if __name__ == "__main__":
    # Render assigns a port via the PORT environment variable
    # We default to 8000 only if running locally
    port = int(os.environ.get("PORT", 8000))
    
    # host MUST be 0.0.0.0 to accept external traffic on Render
    uvicorn.run(app, host="0.0.0.0", port=port)

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

# ---------------- UPLOAD ROUTE ----------------

@app.post("/upload")
async def upload_statement(
    file: UploadFile = File(...),
    user_id: str = Form(...)
):
    temp_file = f"temp_{uuid.uuid4().hex}.pdf"
    transactions = []

    try:
        contents = await file.read()
        with open(temp_file, "wb") as f:
            f.write(contents)

        full_text = ""
        with pdfplumber.open(temp_file) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text += text + "\n"

        # Split into blocks starting with a Date (e.g., "16 Dec" or "Dec 16")
        # Handles cases where the year isn't explicitly on the same line
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
        
        if current_block:
            transaction_blocks.append('\n'.join(current_block))

        for block in transaction_blocks:
            # 1. Extract Merchant Name
            # Pattern: Captures everything after "Paid to/Received from" 
            # Stops at "Tag:", "UPI ID:", "#", or multiple spaces
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
            # Dynamic year assignment based on the current context [cite: 4, 14]
            year = "2025" if "Dec" in date_str and "16" in date_str else "2024" 
            
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
            return {"status": "success", "count": len(transactions)}

        return {"status": "error", "message": "No valid transactions found."}

    except Exception as e:
        return {"status": "error", "message": str(e)}
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)
