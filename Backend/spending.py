from fastapi import APIRouter, Form
from supabase import create_client
import joblib
import os
import pandas as pd
from dotenv import load_dotenv
from datetime import datetime
from insights import generate_spending_insights 

load_dotenv(".env")
# Use lowercase 'supabase' to match the variable name used in the rest of your code
supabase = create_client(os.getenv("VITE_SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_ROLE_KEY"))

# Load the updated 10-feature model
try:
    model = joblib.load("spending_model.pkl")
except Exception as e:
    print(f"Model Load Error: {e}")
    model = None

router = APIRouter()

@router.post("/predict")
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
        # Standardize exchange rate logic (set to 1.0 for direct INR calculation)
        EXCHANGE_RATE = 1.0 
        
        # 1. Transaction History Processing
        response = supabase.table("transactions")\
            .select("*")\
            .eq("user_id", user_id)\
            .execute()
        
        if not response.data:
            return {"status": "error", "message": "No transaction history found."}

        # --- TIME-PERIOD NORMALIZATION ---
        # Calculate statement duration (e.g., 3 months) to get true monthly burn
        dates = [datetime.strptime(tx['date'], '%Y-%m-%d') for tx in response.data if tx.get('date')]
        if len(dates) > 1:
            days_diff = (max(dates) - min(dates)).days
            num_months = max(1, round(days_diff / 30.44, 1)) 
        else:
            num_months = 1

        # Calculate raw total and divide by months to lower the 'Actual' and 'Predicted' figures
        days_diff = (max(dates) - min(dates)).days
        raw_total_expense = sum(abs(float(tx['amount'])) for tx in response.data if float(tx['amount']) < 0)
        num_months = max(days_diff,7)/30.44
        actual_monthly_expense = (raw_total_expense / max(days_diff,1))*30.44

        # 2. Package Profile Data for Insights Engine
        profile_payload = {
            "monthly_income": monthly_income,
            "monthly_emi": monthly_emi_usd,
            "interest_rate": loan_interest_rate_pct,
            "job_title": job_title,
            "education_level": education
        }

        # Generates personalized advice based on your career
        analysis = generate_spending_insights(
            profile_data=profile_payload, 
            transactions=response.data
        )

        # 3. ML Feature Preparation (Strict Order required by Scikit-Learn)
        edu_map = {"Bachelor's": 0, "High School": 1, "Master's": 2, "Other": 3, "PhD": 4}
        emp_map = {'Employed': 0, 'Self-employed': 1, 'Student': 2, 'Unemployed': 3}
        job_map = {'Accountant': 0, 'Doctor': 1, 'Driver': 2, 'AI/ML Engineer': 3, 'Manager': 4, 'Salesperson': 5, 'Student': 6, 'Teacher': 7, 'Unemployed': 8}
        loan_type_map = {'Business': 0, 'Car': 1, 'Education': 2, 'Home': 3, 'Personal': 0, 'None': 4}

        is_loan_val = 1 if has_loan.lower() == "yes" else 0
        
        # Prepare row with normalized monthly values
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

        # Force exact column order used during training to fix prediction logic
        feature_order = [
            "monthly_income_inr", "education_level", "employment_status", 
            "job_title", "has_loan", "loan_type", "loan_term_months", 
            "monthly_emi_inr", "loan_interest_rate_pct", "credit_score"
        ]
        input_df = pd.DataFrame([input_row])[feature_order]

        # Generate ML Forecast based on normalized monthly behavior
        if model:
            prediction_array = model.predict(input_df)
            predicted_amt = float(prediction_array[0])
        else:
            predicted_amt = monthly_income * 0.7

        # 4. Store Results in Supabase (Clean Upsert)
        result_entry = {
            "user_id": user_id,
            "monthly_income_usd": monthly_income,
            "actual_monthly_expense": round(actual_monthly_expense, 2), # Normalized Monthly Burn
            "predicted_next_month_expense": round(predicted_amt, 2), # Corrected Prediction
            "job_title": job_title,
            "education_level": education,
            "loan_interest_rate_pct": loan_interest_rate_pct, # Now feeding correctly into DB
            "suggestion": " | ".join(analysis.get("suggestions", [])),
            "calculation_date": datetime.now().isoformat()
        }
        
        # Corrected variable case from 'Supabase' to 'supabase'
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
