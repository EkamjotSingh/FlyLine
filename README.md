# FlyTime - Airport Time Intelligence Platform

> Know before you go. FlyTime predicts your TSA wait time and builds your personal airport timeline so you never miss a flight.

---

## The Problem

TSA wait times are unpredictable and passengers have zero visibility before they even get to the airport. Every existing tool - MyTSA, Google Maps, FlightAware - tells you what's happening right now. Nobody tells you what the line will look like when you actually get there. On top of that, most travelers waste time at the airport with no idea where to go, what amenities they have access to, or how to spend their buffer time without cutting it close.

---

## The Solution

FlyTime takes your flight number and traveler profile and gives you:

- A personalized TSA wait time prediction for when you'll actually arrive
- A leave-by time based on your location and predicted wait
- Lounge access information based on your card type
- Restaurant suggestions with estimated wait times so you can eat without missing your flight
- A complete airport timeline - every minute from leaving home to boarding

---

## How Users Input Information

Users go through a simple 3-step onboarding flow:

**Step 1 - Flight Info**
- Enter flight number (e.g. `DL 204`)
- App auto-pulls: airport, terminal, gate, departure time via AviationStack API
- No manual entry of airport or terminal needed

**Step 2 - Traveler Profile**
- TSA PreCheck? (yes / no)
- Number of bags (0, 1, 2, 3+)
- Traveling solo or with a group?
- How far are you from the airport? (used to calculate leave-by time)

**Step 3 - Card Access (optional)**
- Select your travel cards (Amex Platinum, Chase Sapphire Reserve, Priority Pass, etc.)
- App uses this to surface which lounges you can access at your airport

Once submitted, Claude synthesizes all of this into a plain-language recommendation and timeline.

---

## Core Features

### TSA Wait Prediction
ML model trained on years of TSA historical throughput data. Predicts your personal wait time based on:
- Time of day and day of week
- Airport and terminal
- Holiday proximity
- Flight volume at that hour
- Whether you have TSA PreCheck
- Group size and number of bags

### Personal Leave-By Time
Calculates: `predicted TSA wait + walk time to gate + 20 min buffer = leave home by [time]`

### Lounge Access
Based on your card type, surfaces which lounges are available at your airport and whether they're likely to be crowded given current flight volume.

### Restaurant Suggestions
Shows airport restaurants near your terminal with estimated wait times based on time of day and airport foot traffic patterns.

### Claude AI Layer
Claude wraps all predictions into a conversational recommendation:
> "Your flight is at 2:45pm. Based on current patterns, expect a 14-minute TSA wait at ATL's North checkpoint. Leave by 12:50pm. Your Amex Platinum gets you into the Centurion Lounge - it'll likely be quiet until around 1:30pm. Chicken + Beer is 5 minutes from your gate with a short wait right now."

---

## Tech Stack

| Layer | Tool |
|---|---|
| Frontend | Next.js + Tailwind CSS |
| Backend | FastAPI (Python) |
| ML Model | XGBoost |
| AI Layer | Claude API (claude-sonnet) |
| Database | Supabase |
| Deploy | Vercel (frontend) + Railway (backend) |

---

## APIs Used

| API | Purpose |
|---|---|
| AviationStack | Pull flight data from flight number - airport, terminal, departure time |
| TSA Throughput Dataset | Historical wait time data for ML training |
| Yelp Fusion API | Restaurant wait times and ratings at airports |
| Calendarific API | Holiday detection for ML features |
| Anthropic Claude API | Natural language recommendations and timeline generation |
| OurAirports | Open airport layout and metadata dataset |

---

## ML Model

We use an XGBoost regression model trained on TSA historical throughput data.

**Input features:**
- Hour of day
- Day of week
- Month
- Is holiday (binary)
- Airport
- Flight volume at that hour
- PreCheck lane vs standard

**Output:** Predicted wait time in minutes

**Why XGBoost:**
- Trains in seconds on tabular data
- More accurate than linear models on time-series patterns
- Feature importance is explainable to stakeholders
- No GPU needed

We focus on 6 major airports for the demo: ATL, JFK, LAX, ORD, DFW, MIA.

---

## Team Split

| Person | Responsibility |
|---|---|
| ML + Claude API | Train model, build FastAPI endpoints, integrate Claude |
| 3D / Frontend | Next.js app, UI components, input flow |
| Data + APIs | AviationStack, Yelp, lounge dataset, data pipeline |
| Design + Pitch | UI polish, demo flow, presentation |

---

## Known Limitations

- TSA data is historical and aggregated - this is a predictive tool, not a live feed
- Lounge capacity is estimated from flight volume, not a real-time API (no clean API exists)
- Restaurant wait times from Yelp have inconsistent coverage - fallback to time-of-day estimates
- ML accuracy is strongest for the 6 major airports in our training set

---

## Running Locally

```bash
# Frontend
cd client
npm install
npm run dev

# Backend
cd server
pip install -r requirements.txt
uvicorn main:app --reload
```

Set your environment variables:

```text
ANTHROPIC_API_KEY=
AVIATIONSTACK_API_KEY=
YELP_API_KEY=
SUPABASE_URL=
SUPABASE_KEY=
```

---

## Demo Flow

1. Enter flight number `DL 204`
2. Fill out traveler profile (PreCheck: yes, 1 bag, solo, 25 mins from airport)
3. Select card: Chase Sapphire Reserve
4. App returns: predicted wait, leave-by time, lounge access, restaurant rec
5. Claude gives a full plain-English airport plan

---
