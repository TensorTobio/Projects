# 🏏 IPL Match Predictor 2025 — AI-Powered Cricket Match Forecasting

![Python](https://img.shields.io/badge/Python-3.10-blue?logo=python)
![Scikit-Learn](https://img.shields.io/badge/ML-Sklearn%2C%20XGBoost-orange)
![License](https://img.shields.io/badge/License-MIT-green)
![Platform](https://img.shields.io/badge/Run%20on-Google%20Colab-yellow?logo=googlecolab)

> ⚡ An intelligent machine learning application to **predict IPL match outcomes**, including live score forecasting, chase simulation, and win prediction!

---

## 🧠 Project Overview

The **IPL Match Predictor 2025** is a data-driven machine learning system that simulates and forecasts IPL match outcomes based on real-time conditions such as current overs, score, target, and venue. It has three major capabilities:

1. 🎯 **First Innings Final Score Prediction**  
   Given the current match situation, the model predicts the projected final score for the first innings.

2. 🔁 **Second Innings Chase Outcome Forecast**  
   Estimates the chasing team's expected performance based on current metrics and target.

3. 🏆 **Winning Team & Win Probability Prediction**  
   Uses a classification model to predict which team is likely to win, along with confidence percentages.

---

## 🔍 Key Features

- 🚀 Predicts outcomes within seconds using trained ML models
- 📊 Uses preprocessed IPL historical data for enhanced accuracy
- 🧠 Combines regression and classification models for multifaceted forecasting
- 🎨 Designed for use in Google Colab for ease of deployment
- 🔧 Modular ML pipeline with customizable input parameters
- 🏟️ Supports all IPL 2022–2025 teams and venues

---

## 📁 Files & Structure

```plaintext
📦 IPL-Match-Predictor/
├── ipl_predictor.ipynb                # Main Notebook
├── model.pkl                          # First innings score predictor
├── model2.pkl                         # Winner prediction model
├── feature_columns.pkl                # Feature columns for score predictor
├── feature_columns2.pkl               # Feature columns for win predictor
├── README.md                          # Project ReadMe
````

---

## 📥 How to Use This Project

### ✅ Step 1: Open the Notebook

> 🟡 **Recommended Platform:** [Google Colab](https://colab.research.google.com/) — zero setup and easy file upload.

### ✅ Step 2: Upload Required Files

Make sure to upload the following model files when prompted in the notebook:

* `model.pkl`
* `model2.pkl`
* `feature_columns.pkl`
* `feature_columns2.pkl`

These contain the serialized ML models and encodings used for prediction.

### ✅ Step 3: Run the Notebook

* Go through each cell in sequence
* Enter match data as prompted (team names, venue, runs, overs, wickets, etc.)
* View predicted outputs instantly

---

## 🎯 Example Predictions

### 🧪 First Innings

```text
Batting Team: MI
Bowling Team: CSK
Overs: 9.4
Runs: 83
Wickets: 2
Venue: Wankhede

➡️ Projected Final Score: 176
```

### 🧪 Second Innings

```text
Chasing Team: RCB
Target: 184
Overs: 14.5
Score: 125/4

➡️ Projected Final Score: 168
```

### 🧪 Match Winner

```text
Batting First: RR
Batting Second: KKR
Target: 175
Current Score: 155/6 in 18.1 overs

➡️ Predicted Winner: KKR
➡️ Win Probabilities — KKR: 65.2%, RR: 34.8%
```

---

## ⚙️ Machine Learning Breakdown

| Prediction Task         | Model Used              | Type           | Evaluation          |
| ----------------------- | ----------------------- | -------------- | ------------------- |
| First Innings Score     | `RandomForestRegressor` | Regression     | MAE / RMSE          |
| Second Innings Forecast | `LinearRegression`      | Regression     | R² Score            |
| Match Winner            | `XGBoostClassifier`     | Classification | Accuracy / F1 Score |

Each model was trained on pre-cleaned and feature-engineered IPL datasets using match-by-match ball-level data, including contextual information such as ground, teams, and performance metrics.

---

## 🧰 Libraries Used

* `pandas`, `numpy` — data wrangling
* `scikit-learn` — ML modeling and preprocessing
* `xgboost` — powerful classification
* `pickle` — model serialization
* `matplotlib`, `seaborn` — basic visualization (optional)

---

## 🛠 Future Enhancements

✅ Convert into a **Streamlit web app**
✅ Add **live API** integration (e.g. CricAPI) for real-time updates
✅ Include **player-level stats** and **form metrics**
✅ Visualize **win probability timelines**
✅ Add **momentum tracking** and **match phase analysis**

---

## ⚠️ Known Limitations

* Requires valid input names (e.g., “Royal Challengers Bangalore” not “RCB” unless pre-encoded)
* Assumes standard match progression without real-time anomalies (e.g., rain breaks, super overs)
* Does not yet account for player injuries or lineup differences

---

## 🙋‍♂️ About the Author(s)

👨‍💻 Nitish Reddy — Aspiring Data Scientist


## 🚀 Run Now on Google Colab

[![Open In Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/)

> ⚠️ Don’t forget to upload the model `.pkl` files first before running the code!

---

## 🌟 If You Liked This Project...

* ⭐ Star the repo
* 🍴 Fork and improve it
* 🧠 Suggest new features
* 📣 Share it with your data + cricket enthusiast friends!

---



