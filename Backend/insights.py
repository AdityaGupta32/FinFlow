import numpy as np
import random
import google.generativeai as genai
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Predefined templates for hardcoded fallback
INSIGHT_TEMPLATES = {
    "high_savings": [
        "💎 Grok Insight: Your {rate}% savings rate is elite. Move your ₹{surplus} surplus into a high-growth Index Fund.",
        "🚀 Wealth Move: With a {rate}% cushion, you're crushing it. Grok suggests auto-investing your ₹{surplus} excess.",
        "🦁 King of Capital: Your {rate}% efficiency is rare. That ₹{surplus} surplus is 'lazy'—make it work in an SIP."
    ],
    "low_savings": [
        "⚠️ Grok Alert: Your rate is only {rate}%. Grok noticed ₹{top_amt} went to {top_merchant}. Is that a 'Need' or a 'Want'?",
        "📉 Efficiency Gap: You're at {rate}%. Cutting your {top_merchant} spend by 20% would save you ₹{potential} monthly.",
        "🧨 Budget Warning: At {rate}%, your buffer is thin. That ₹{top_amt} at {top_merchant} is leaking your future wealth."
    ],
    "debt_heavy": [
        "💳 Interest Trap: Your {loan_rate}% rate on the loan is a drag. Refinancing could save you thousands.",
        "🛑 Debt Weight: Your EMI is {emi_ratio}% of your income. Grok says: Stop all new credit immediately."
    ]
}

def generate_gemini_insights(monthly_income, transactions, emi, interest_rate, job_title, education):
    """Refined AI logic with correct model version and 3-month normalization"""
    try:
        genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
        
        # --- STEP 1: BLACKLIST FILTERING ---
        blacklist = ["Aakansha Lallan Gupta", "Cash", "Self", "Transfer", "BANARSHI"]
        filtered_tx = [
            tx for tx in transactions 
            if not any(name.lower() in tx.get('description', '').lower() for name in blacklist)
        ]
        
        # --- STEP 2: PERIOD NORMALIZATION ---
        dates = [datetime.strptime(tx['date'], '%Y-%m-%d') for tx in transactions if tx.get('date')]
        if len(dates) > 1:
            days_diff = (max(dates) - min(dates)).days
            num_months = max(1, round(days_diff / 30.44, 1))
        else:
            num_months = 1

        total_filtered_spent = sum(abs(float(tx['amount'])) for tx in filtered_tx if float(tx['amount']) < 0)
        avg_monthly_expense = total_filtered_spent / num_months
        
        savings_amt = monthly_income - avg_monthly_expense
        savings_rate = round((savings_amt / monthly_income * 100), 1) if monthly_income > 0 else 0
        
        # Identify Top Monthly Merchants
        expenses_list = [tx for tx in filtered_tx if float(tx['amount']) < 0]
        top_tx = sorted(expenses_list, key=lambda x: abs(float(x['amount'])), reverse=True)[:5]
        
        # --- STEP 3: CAREER-AWARE PROMPT ---
        prompt = f"""
        Act as 'Grok', a witty financial advisor for a {education} level student/professional working as a {job_title}. 
        
        Monthly Financial Context (Normalized from a {num_months} month period):
        - Income: ₹{monthly_income:,.0f}
        - Avg Monthly Expense: ₹{avg_monthly_expense:,.0f}
        - Savings Rate: {savings_rate}%
        - Debt: EMI of ₹{emi:,.0f} at {interest_rate}% interest.
        
        Top Spends (Normalized per month):
        {chr(10).join([f"- {tx['description']}: ₹{abs(float(tx['amount'])) / num_months:,.0f}/mo" for tx in top_tx])}
        
        RULES:
        1. NEVER mention personal names like 'Aakansha'.
        2. Provide 3 punchy bulleted insights starting with Emojis.
        3. Reference their role as a {job_title}.
        4. Focus on the ₹{savings_amt:,.0f} monthly surplus or deficit.
        """
        
        # USE THE CORRECT MODEL VERSION: gemini-2.0-flash
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        
        suggestions = [line.strip().replace('* ', '').replace('- ', '') for line in response.text.split('\n') if line.strip()]
        return [s for s in suggestions if '₹' in s or any(e in s for e in ['💎', '🚀', '🦁', '⚠️', '📉'])][:3]
        
    except Exception as e:
        print(f"AI Model Error: {e}")
        return None

def generate_hardcoded_insights(monthly_income, transactions, emi, interest_rate):
    """ Fallback logic if AI fails """
    blacklist = ["Aakansha Lallan Gupta", "BANARSHI"]
    filtered_tx = [tx for tx in transactions if not any(n.lower() in tx.get('description', '').lower() for n in blacklist)]
    
    dates = [datetime.strptime(tx['date'], '%Y-%m-%d') for tx in transactions if tx.get('date')]
    num_months = max(1, round((max(dates) - min(dates)).days / 30.44, 1)) if len(dates) > 1 else 1
    
    total_spent = sum(abs(float(tx['amount'])) for tx in filtered_tx if float(tx['amount']) < 0)
    avg_monthly_spent = total_spent / num_months
    
    savings_amt = monthly_income - avg_monthly_spent
    savings_rate = round((savings_amt / monthly_income * 100), 1) if monthly_income > 0 else 0

    top_tx_list = [tx for tx in filtered_tx if float(tx['amount']) < 0]
    top_tx = sorted(top_tx_list, key=lambda x: abs(float(x['amount'])), reverse=True)[0] if top_tx_list else None
    top_amt_mo = (abs(float(top_tx['amount'])) / num_months) if top_tx else 0

    suggestions = []
    if savings_rate >= 20:
        tpl = random.choice(INSIGHT_TEMPLATES["high_savings"])
        suggestions.append(tpl.format(rate=savings_rate, surplus=f"{savings_amt:,.0f}"))
    else:
        tpl = random.choice(INSIGHT_TEMPLATES["low_savings"])
        suggestions.append(tpl.format(rate=savings_rate, top_merchant=top_tx['description'] if top_tx else "Retail", top_amt=f"{top_amt_mo:,.0f}", potential=f"{(top_amt_mo * 0.2):,.0f}"))

    if emi > 0:
        emi_ratio = round((emi / monthly_income * 100), 1)
        tpl = random.choice(INSIGHT_TEMPLATES["debt_heavy"])
        suggestions.append(tpl.format(loan_rate=interest_rate, emi_ratio=emi_ratio))

    return suggestions[:3]

def generate_spending_insights(profile_data, transactions):
    """ Main entry point """
    income = float(profile_data.get('monthly_income', 0))
    emi = float(profile_data.get('monthly_emi', 0))
    interest = float(profile_data.get('interest_rate', 0))
    job = profile_data.get('job_title', 'Student')
    edu = profile_data.get('education_level', "Bachelor's")

    try:
        suggestions = generate_gemini_insights(income, transactions, emi, interest, job, edu)
        if not suggestions: raise ValueError("AI Returned No Suggestions")
    except Exception as e:
        print(f"⚠️ Falling back: {e}")
        suggestions = generate_hardcoded_insights(income, transactions, emi, interest)

    # Anomaly Detection (Z-Score)
    alerts = []
    expenses_list = [tx for tx in transactions if float(tx['amount']) < 0 and "Aakansha" not in tx.get('description', '')]
    amounts = [abs(float(tx['amount'])) for tx in expenses_list]
    
    if len(amounts) > 3:
        mean_val, std_val = np.mean(amounts), np.std(amounts)
        for tx in expenses_list:
            val = abs(float(tx['amount']))
            if val > (mean_val + 2 * std_val) and val > 1000:
                alerts.append({
                    "date": tx['date'],
                    "description": tx['description'],
                    "reason": f"Spending is {round((val-mean_val)/std_val, 1)}x higher than typical."
                })

    # Recalculate Savings Rate for Final Return
    dates = [datetime.strptime(tx['date'], '%Y-%m-%d') for tx in transactions if tx.get('date')]
    num_months = max(1, round((max(dates) - min(dates)).days / 30.44, 1)) if len(dates) > 1 else 1
    total_spent = sum(abs(float(tx['amount'])) for tx in transactions if float(tx['amount']) < 0)
    savings_rate = round(((income - (total_spent / num_months)) / income * 100), 1) if income > 0 else 0

    return {
        "suggestions": suggestions,
        "alerts": alerts,
        "savings_rate": savings_rate
    }
