# 🏀 SportsBetty: AI-Powered Sports Prediction & Behavioral Analytics Platform (Prototype 1)

## Overview

PredictWise is an AI-powered sports prediction platform designed to help users make predictions on real-world sports matches while promoting responsible decision-making and behavioral awareness.

Unlike traditional betting platforms, PredictWise does **not involve real money gambling**. Instead, users earn points, build streaks, and compete on leaderboards by predicting the outcomes of live sporting events.

The platform also leverages AI and behavioral analytics to study how users make decisions, identify cognitive biases, and provide personalized insights into prediction habits.

---

## Motivation

Sports betting has become increasingly popular worldwide, but it often exposes individuals to unhealthy behavioral patterns such as:

* Chasing losses
* Overconfidence
* Recency bias
* Herd behavior
* Risk escalation

PredictWise aims to provide a safer, educational alternative by transforming sports predictions into a skill-based and data-driven experience while helping users better understand their own decision-making processes.

---

## Key Features

### 📅 Real-Time Match Data

* Fetches real NBA schedules, fixtures, standings, and scores from publicly available sports data sources.
* Displays only upcoming, live, or completed real-world games.
* Automatically updates match information.

### 🎯 Sports Predictions

Users can:

* Predict winners of upcoming matches.
* Assign confidence levels to each prediction.
* Earn points for correct predictions.
* Build streaks and improve their leaderboard rankings.

### 🏆 Competitive Leaderboards

* Global leaderboard rankings.
* User prediction streaks.
* Accuracy-based scoring system.
* Seasonal competitions and challenges.

### 🤖 AI Behavioral Insights

The platform analyzes user behavior and generates personalized insights such as:

> "Your confidence is consistently higher than your actual prediction accuracy."

> "You tend to increase confidence after incorrect predictions."

> "Your predictions are more accurate when selecting underdog teams."

### 📊 Analytics Dashboard

Comprehensive analytics include:

* Overall prediction accuracy
* Confidence vs. actual performance
* Historical prediction trends
* Streak analysis
* Behavioral risk indicators

---

## Behavioral Patterns Studied

PredictWise investigates several well-known behavioral phenomena:

### Overconfidence Bias

Do users overestimate the likelihood of their predictions being correct?

### Recency Bias

Do recent team performances disproportionately influence future predictions?

### Chasing Losses

After an incorrect prediction, do users become more aggressive or increase confidence levels?

### Herd Behavior

Are users influenced by popular community predictions?

---

## Tech Stack

### Frontend

* Flutter
* Dart

### Backend

* Python
* FastAPI

### Database & Authentication

* Firebase Authentication
* Cloud Firestore

### Artificial Intelligence & Analytics

* Python
* Pandas
* NumPy
* Scikit-learn
* OpenAI API (for personalized insights)

### Data Sources

* NBA public statistics endpoints
* ESPN scoreboards
* Other publicly accessible sports data APIs

---

## System Architecture

1. Real-world match data is fetched from external sports APIs.
2. Users submit predictions and confidence levels.
3. Prediction outcomes are stored securely in Firebase.
4. Behavioral metrics are computed using analytics pipelines.
5. AI models generate personalized feedback and recommendations.
6. Results are displayed through interactive dashboards.

---

## Example AI Insights

* "You correctly predicted 68% of games this week."
* "Your average confidence level is 85%, but your accuracy is 54%."
* "You perform significantly better when predicting home teams."
* "You tend to increase confidence following losses, indicating possible loss-chasing behavior."

---

## Future Enhancements

* Support for additional sports leagues (Premier League, NFL, Formula 1, IPL, etc.)
* Social features and friend leaderboards
* Community prediction trends
* Gamification rewards and achievements
* Advanced machine learning models for behavioral analysis
* Research dashboard for aggregated anonymous insights

---

## Ethical Considerations

PredictWise is intended solely for educational, research, and responsible gaming awareness purposes.

* No real money transactions are supported.
* No gambling or wagering functionality is included.
* User data is anonymized for behavioral analysis.
* The platform promotes healthy decision-making and self-awareness.

---

## Installation

```bash
flutter pub get

flutter run
```

---

## Contributing

Contributions, suggestions, and feature requests are welcome. Please open an issue or submit a pull request.

---

## Author

Developed as a passion project exploring the intersection of:

**Artificial Intelligence • Behavioral Science • Sports Analytics • Responsible Gaming**
