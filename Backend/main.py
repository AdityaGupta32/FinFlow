from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Import your individual logic files
import Parser 
import spending

app = FastAPI()

# Enable CORS for your React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173",
                    https://fin-flow-mauve.vercel.app/],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes from parser.py and spending.py
# This maps the logic without changing the original files
app.include_router(Parser.app.router) 
app.include_router(spending.router)

@app.get("/")
def health_check():
    return {"status": "Finance.AI Backend Online"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
