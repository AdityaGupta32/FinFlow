import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import joblib

# 1. Load Data
df = pd.read_csv('synthetic_personal_finance_dataset.csv')
EXCHANGE_RATE = 91.60

# 2. Feature Engineering & Currency Conversion
# Converting USD to INR to match your local transaction data
df['monthly_income_inr'] = df['monthly_income_usd'] * EXCHANGE_RATE
df['monthly_expenses_inr'] = df['monthly_expenses_usd'] * EXCHANGE_RATE
# Fill missing EMI values with 0 for users without loans before conversion
df['monthly_emi_inr'] = df['monthly_emi_usd'].fillna(0) * EXCHANGE_RATE

# 3. Encoding Categorical Values
# We use LabelEncoder to turn text into numerical values
le = LabelEncoder()

# List of columns to encode
categorical_cols = ['education_level', 'employment_status', 'job_title', 'loan_type']

# Dictionary to store mappings for the FastAPI backend
mappings = {}

for col in categorical_cols:
    # Fill NaN for loan_type specifically
    if col == 'loan_type':
        df[col] = df[col].fillna('None')
    
    df[col] = le.fit_transform(df[col])
    # Store the classes to generate the mapping dictionary for the backend
    mappings[col] = {label: index for index, label in enumerate(le.classes_)}

# Encode the binary 'has_loan' column
df['has_loan'] = df['has_loan'].apply(lambda x: 1 if x == "Yes" else 0)

# 4. Prepare Feature Matrix (X) and Target (y)
# The order of these 10 features MUST be preserved in FastAPI
features = [
    'monthly_income_inr', 
    'education_level', 
    'employment_status', 
    'job_title',
    'has_loan', 
    'loan_type', 
    'loan_term_months', 
    'monthly_emi_inr', 
    'loan_interest_rate_pct', 
    'credit_score'
]

X = df[features]
y = df['monthly_expenses_inr']

# 5. Train Model
# RandomForest handles complex interactions between Job Title and Credit Score
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# 6. Save Model
joblib.dump(model, 'spending_model.pkl')

# 7. Output Mappings for Backend
print("Model trained with 10 features and saved successfully.\n")
print("--- COPY THESE MAPPINGS TO YOUR FASTAPI spending.py ---")
for col, mapping in mappings.items():
    print(f"{col}_map = {mapping}")