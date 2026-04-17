import pandas as pd
import xgboost as xgb
from sklearn.multioutput import MultiOutputRegressor
from sklearn.model_selection import train_test_split
import joblib
import os

# 1. Load the new Indian Finance Dataset
dataset_path = 'Indian_Finance_Dataset.csv'
if not os.path.exists(dataset_path):
    # Fallback if the script is run from a different directory
    dataset_path = 'aura-finance-ai/Indian_Finance_Dataset.csv'

df = pd.read_csv(dataset_path)

# 2. Map the dataset columns to Aura Finance App categories
# We combine some columns to match the 8 categories in the UI
processed_df = pd.DataFrame()
processed_df['Total_Income'] = df['Income']

# Mapping logic:
processed_df['food'] = df['Groceries'] + df['Eating_Out']
processed_df['transport'] = df['Transport']
processed_df['shopping'] = df['Loan_Repayment'] + df['Insurance'] # Grouping fixed financial shopping/commitments
processed_df['entertainment'] = df['Entertainment']
processed_df['utilities'] = df['Rent'] + df['Utilities']
processed_df['health'] = df['Healthcare']
processed_df['travel'] = df['Income'] * 0.05 # The dataset lacks a 'Travel' column, so we assume a 5% allocation rule
processed_df['other'] = df['Miscellaneous'] + df['Education']

# 3. Define Features (X) and Targets (y)
X = processed_df[['Total_Income']]
target_cols = ['food', 'transport', 'shopping', 'entertainment', 'utilities', 'health', 'travel', 'other']
y = processed_df[target_cols]

# 4. Train the Model (Multi-Output XGBoost)
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Using slightly more robust parameters for the larger dataset
base_model = xgb.XGBRegressor(
    n_estimators=200, 
    learning_rate=0.05, 
    max_depth=6, 
    subsample=0.8,
    colsample_bytree=0.8
)
model = MultiOutputRegressor(base_model)

print(f"Starting training on {len(df)} records...")
model.fit(X_train, y_train)

# 5. Save the new Model and Categories
joblib.dump(model, 'budget_optimizer_model.pkl')
joblib.dump(target_cols, 'category_names.pkl')

print("Success! Model retrained with the new Indian Finance Dataset.")
print(f"Categories supported: {target_cols}")
