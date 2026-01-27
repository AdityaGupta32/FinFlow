import os
import joblib
import pandas as pd
import uvicorn
from fastapi import FastAPI, Form
from fastapi.middleware.cors import CORSMiddleware
from supabase import create_client
from dotenv import load_dotenv
from datetime import datetime
from insights import generate_spending_insights 

# 1. Load environment variables
load_dotenv()

# 2. Initialize Standalone FastAPI App
app = FastAPI(title="Finance.AI Spending ML Service")

# 3. Add CORS (Essential for cross-service communication)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Initialize Supabase client
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"), 
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
)

# 5. Global Model Loading (Avoids reloading on every request to save RAM)
try:
    # Ensure this file is in the same directory on Render
    model = joblib.load("spending_model.pkl")
except Exception as e:
    print(f"CRITICAL: Model Load Error: {e}")
    model = None

@app.post("/predict")
async def predict_spending(
    user_id: str = Form(...),
    monthly_income: float = Form(...),
    job_title: str = Form(...),
    education: str = Form(...),
    employment: str = Form(...),
    has_loan: str = Form(...),
    loan_type: str = Form("None"),
    loan_term_months: int = Form(0),
    monthly_emi_usd: float = Form(0.0),
    loan_interest_rate_pct: float = Form(0.0),
    credit_score: int = Form(700)
):
    try:
        EXCHANGE_RATE = 1.0 
        
        # 1. Fetch Transaction History from Supabase
        response = supabase.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            return {"status": "error", "message": "No transaction history found."}

        # 2. Time-Period Normalization
        dates = [datetime.strptime(tx['date'], '%Y-%m-%d') for tx in response.data if tx.get('date')]
        days_diff = (max(dates) - min(dates)).days if len(dates) > 1 else 1
        
        raw_total_expense = sum(abs(float(tx['amount'])) for tx in response.data if float(tx['amount']) < 0)
        actual_monthly_expense = (raw_total_expense / max(days_diff, 1)) * 30.44

        # 3. Generate AI Insights (Imported from insights.py)
        profile_payload = {
            "monthly_income": monthly_income,
            "monthly_emi": monthly_emi_usd,
            "interest_rate": loan_interest_rate_pct,
            "job_title": job_title,
            "education_level": education
        }

        analysis = generate_spending_insights(
            profile_data=profile_payload, 
            transactions=response.data
        )

        # 4. ML Prediction Logic
        edu_map = {"Bachelor's": 0, "High School": 1, "Master's": 2, "Other": 3, "PhD": 4}
        emp_map = {'Employed': 0, 'Self-employed': 1, 'Student': 2, 'Unemployed': 3}
        job_map = {'Accountant': 0, 'Doctor': 1, 'Driver': 2, 'AI/ML Engineer': 3, 'Manager': 4, 'Salesperson': 5, 'Student': 6, 'Teacher': 7, 'Unemployed': 8}
        loan_type_map = {'Business': 0, 'Car': 1, 'Education': 2, 'Home': 3, 'Personal': 0, 'None': 4}

        is_loan_val = 1 if has_loan.lower() == "yes" else 0
        
        input_row = {
            "monthly_income_inr": monthly_income * EXCHANGE_RATE,
            "education_level": edu_map.get(education, 3), 
            "employment_status": emp_map.get(employment, 3),
            "job_title": job_map.get(job_title, 8),
            "has_loan": is_loan_val,
            "loan_type": loan_type_map.get(loan_type, 4),
            "loan_term_months": loan_term_months,
            "monthly_emi_inr": monthly_emi_usd * EXCHANGE_RATE,
            "loan_interest_rate_pct": loan_interest_rate_pct,
            "credit_score": credit_score
        }

        feature_order = [
            "monthly_income_inr", "education_level", "employment_status", 
            "job_title", "has_loan", "loan_type", "loan_term_months", 
            "monthly_emi_inr", "loan_interest_rate_pct", "credit_score"
        ]
        input_df = pd.DataFrame([input_row])[feature_order]

        if model:
            prediction_array = model.predict(input_df)
            predicted_amt = float(prediction_array[0])
        else:
            predicted_amt = monthly_income * 0.7

        # 5. Upsert Results to Supabase
        result_entry = {
            "user_id": user_id,
            "monthly_income_usd": monthly_income,
            "actual_monthly_expense": round(actual_monthly_expense, 2),
            "predicted_next_month_expense": round(predicted_amt, 2),
            "job_title": job_title,
            "education_level": education,
            "loan_interest_rate_pct": loan_interest_rate_pct,
            "suggestion": " | ".join(analysis.get("suggestions", [])),
            "calculation_date": datetime.now().isoformat()
        }
        
        supabase.table("spending_results").upsert(result_entry, on_conflict="user_id").execute()

        return {
            "status": "success",
            "prediction": round(predicted_amt, 2),
            "actual": round(actual_monthly_expense, 2),
            "suggestions": analysis.get("suggestions", []),
            "alerts": analysis.get("alerts", [])
        }

    except Exception as e:
        print(f"Prediction Error: {e}")
        return {"status": "error", "message": str(e)}

@app.get("/")
def health_check():
    return {"status": "Spending ML Service Online", "model_loaded": model is not None}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
