import sys
import joblib
import pandas as pd
import json

def main():
    # 1. Parse Inputs: [1] Income, [2] JSON string of current spending
    try:
        user_income = float(sys.argv[1])
        current_spending = {}
        if len(sys.argv) > 2:
            current_spending = json.loads(sys.argv[2])
    except Exception as e:
        print(json.dumps({"error": f"Invalid input: {str(e)}"}))
        return

    # 2. Load the trained model and category names
    try:
        model = joblib.load('budget_optimizer_model.pkl')
        categories = joblib.load('category_names.pkl')
    except:
        # Fallback for different execution contexts
        model = joblib.load('aura-finance-ai/budget_optimizer_model.pkl')
        categories = joblib.load('aura-finance-ai/category_names.pkl')

    # 3. Get the "Ideal" prediction from Kaggle data
    input_df = pd.DataFrame([[user_income]], columns=['Total_Income'])
    predictions = model.predict(input_df)[0]

    results = {}
    for cat, pred in zip(categories, predictions):
        ideal_val = float(pred)
        actual_val = float(current_spending.get(cat, ideal_val))
        
        # HYBRID LOGIC: 70% Ideal (Financial Coach) + 30% Actual (Personalization)
        # This nudges the user toward better habits without being unrealistic
        hybrid_val = (ideal_val * 0.7) + (actual_val * 0.3)
        
        results[cat] = round(hybrid_val, 2)

    print(json.dumps(results))

if __name__ == "__main__":
    main()
