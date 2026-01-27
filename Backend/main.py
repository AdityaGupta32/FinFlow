import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your spending logic (which includes insights.py internally)
import spending 

app = FastAPI(title="Finance.AI Dashboard & Insights")

# Enable CORS 
app.add_middleware(
    CORSMiddleware,
    # Keep your specific origins for security
    allow_origins=[
        "http://localhost:5173",
        "https://fin-flow-mauve.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include only the spending router
# This handles /predict and calls generate_spending_insights internally
app.include_router(spending.router)

@app.get("/")
def health_check():
    return {
        "status": "Finance.AI Dashboard Online",
        "services": ["Spending ML", "Gemini Insights"]
    }

if __name__ == "__main__":
    # Railway provides the PORT environment variable automatically
    port = int(os.environ.get("PORT", 8000))
    # host must be 0.0.0.0 for Railway to route traffic
    uvicorn.run(app, host="0.0.0.0", port=port)
