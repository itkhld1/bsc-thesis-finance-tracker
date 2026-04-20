import sys
import joblib
import pandas as pd
import json

def main():
    # take the montly income as first input and the current spending as second input 
    try:
        user_income = float(sys.argv[1])
        current_spending = {}
        if len(sys.argv) > 2:
            current_spending = json.loads(sys.argv[2])
    except Exception as e:
        print(json.dumps({"error": f"Invalid input: {str(e)}"}))
        return

    # load the trained model and category names
    try:
        model = joblib.load('budget_optimizer_model.pkl')
        categories = joblib.load('category_names.pkl')
    except:
        model = joblib.load('aura-finance-ai/budget_optimizer_model.pkl')
        categories = joblib.load('aura-finance-ai/category_names.pkl')

    # get the 'Ideal' prediction from dataset
    input_df = pd.DataFrame([[user_income]], columns=['Total_Income'])
    predictions = model.predict(input_df)[0]

    results = {}
    for cat, pred in zip(categories, predictions):
        ideal_val = float(pred)
        actual_val = float(current_spending.get(cat, ideal_val))
        
        # hybrid logic: 70% Ideal + 30% Actual
        # this nudges the user toward better habits without being unrealistic
        hybrid_val = (ideal_val * 0.7) + (actual_val * 0.3)
        
        results[cat] = round(hybrid_val, 2)

    print(json.dumps(results))

if __name__ == "__main__":
    main()
