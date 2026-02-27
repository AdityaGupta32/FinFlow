import sys
import asyncio
from concurrent.futures import ThreadPoolExecutor
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# ── WINDOWS ASYNCIO FIX ──────────────────────────────────────────────────────
# This must be at the top to allow subprocesses (browsers) to run on Windows
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())

# ── IMPORT LOGIC MODULES ─────────────────────────────────────────────────────
import Parser
import spending_routes
from scraper import get_card_offers  # Ensure scraper.py uses sync_playwright

app = FastAPI(title="Finance.AI Backend")

# ── EXECUTOR SETUP ───────────────────────────────────────────────────────────
# ThreadPoolExecutor runs synchronous functions (the scraper) in a separate 
# thread so it doesn't block the main FastAPI async loop.
executor = ThreadPoolExecutor(max_workers=4)

# ── CORS CONFIGURATION ───────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://localhost:8000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── ROUTE INCLUSION ──────────────────────────────────────────────────────────
app.include_router(Parser.app.router)
app.include_router(spending_routes.router)

# ── DATA MODELS ──────────────────────────────────────────────────────────────
class CardRequest(BaseModel):
    card_name: str

# ── API ENDPOINTS ────────────────────────────────────────────────────────────

@app.get("/")
def health_check():
    return {"status": "Finance.AI Backend Online"}

@app.post("/scrape-offers")
async def scrape_offers(request: CardRequest):
    card_name = request.card_name.strip()
    
    if not card_name:
        raise HTTPException(status_code=400, detail="card_name cannot be empty")
    
    try:
        # Get the current running event loop
        loop = asyncio.get_running_loop()
        
        # OFF-LOAD TO THREAD:
        # run_in_executor off-loads the sync get_card_offers to the ThreadPool.
        # This is the "magic" that prevents NotImplementedError on Windows.
        offers = await loop.run_in_executor(executor, get_card_offers, card_name)
        
        return {
            "card": card_name,
            "total": len(offers),
            "offers": offers,
            "status": "success"
        }
    except Exception as e:
        print(f"CRITICAL: Scraper failed for {card_name} -> {str(e)}")
        raise HTTPException(status_code=500, detail=f"Scraper error: {str(e)}")

# ── SERVER START ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    # Using the string "main:app" is required for reload=True to work on Windows
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)