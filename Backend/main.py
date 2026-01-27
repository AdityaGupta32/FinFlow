import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your individual logic files
import Parser 
import spending

app = FastAPI()

# Enable CORS 
app.add_middleware(
    CORSMiddleware,
    # Added your Vercel URL and localhost
    allow_origins=[
        "http://localhost:5173",
        "https://fin-flow-mauve.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
# Note: Ensure Parser.app.router and spending.router are valid APIRouters
app.include_router(Parser.app.router) 
app.include_router(spending.router)

@app.get("/")
def health_check():
    return {"status": "Finance.AI Backend Online"}

if __name__ == "__main__":
    # Get the port from Render's environment variable, default to 8000 for local dev
    port = int(os.environ.get("PORT", 8000))
    # host must be 0.0.0.0 for Render to route traffic to it
    uvicorn.run(app, host="0.0.0.0", port=port)
