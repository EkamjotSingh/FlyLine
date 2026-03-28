from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from supabase import create_client
import pickle
import numpy as np
import os
from datetime import datetime

load_dotenv()

# load ML model
with open("tsa_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("airport_encoder.pkl", "rb") as f:
    le = pickle.load(f)

# connect to supabase
supabase = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_KEY"))

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class FlightInput(BaseModel):
    flight_number: str
    airport_code: str
    departure_hour: int
    day_of_week: int
    month: int
    has_precheck: bool
    num_bags: int
    group_size: int
    distance_minutes: int

class WaitReport(BaseModel):
    flight_number: str
    airport_code: str
    reported_wait: int
    hour: int
    day_of_week: int
    month: int

def get_crowd_adjustment(airport_code: str, hour: int, day_of_week: int, month: int):
    # pull recent reports for this airport + hour
    result = supabase.table("wait_reports").select("reported_wait").eq(
        "airport_code", airport_code
    ).eq("hour", hour).eq("day_of_week", day_of_week).eq("month", month).execute()

    reports = result.data
    if not reports:
        return None, 0

    wait_times = [r["reported_wait"] for r in reports]
    count = len(wait_times)
    avg_reported = sum(wait_times) / count

    return avg_reported, count

@app.get("/")
def root():
    return {"status": "FlyTime backend running"}

@app.post("/predict")
def predict(data: FlightInput):
    try:
        airport_encoded = le.transform([data.airport_code])[0]
    except:
        airport_encoded = 0

    is_weekend = 1 if data.day_of_week in [5, 6] else 0
    features = np.array([[data.departure_hour, data.day_of_week, data.month, is_weekend, airport_encoded]])
    predicted_pax = model.predict(features)[0]

    ml_wait = round(predicted_pax / (250 * 3) * 60)
    if data.has_precheck:
        ml_wait = round(ml_wait * 0.4)

    # blend with crowdsourced data if available
    crowd_wait, report_count = get_crowd_adjustment(
        data.airport_code, data.departure_hour, data.day_of_week, data.month
    )

    if crowd_wait and report_count >= 1:
        if report_count >= 10:
            weight = 0.9  # mostly crowd
        elif report_count >= 5:
            weight = 0.6  # balanced
        else:
            weight = 0.2  # mostly ML
        predicted_wait = round((weight * crowd_wait) + ((1 - weight) * ml_wait))
    else:
        predicted_wait = ml_wait

    leave_by = data.distance_minutes + predicted_wait + 20

    recommendation = f"Flight {data.flight_number} — expect about {predicted_wait} min at TSA. Leave {leave_by} minutes before your flight. {'Use the PreCheck lane, it will be much faster.' if data.has_precheck else 'Standard lane — give yourself extra time.'}"

    # log prediction to supabase
    supabase.table("predictions").insert({
        "flight_number": data.flight_number,
        "airport_code": data.airport_code,
        "predicted_wait": predicted_wait,
        "predicted_pax": round(predicted_pax),
        "departure_hour": data.departure_hour,
        "day_of_week": data.day_of_week,
        "month": data.month,
        "has_precheck": data.has_precheck
    }).execute()

    return {
        "predicted_wait_minutes": predicted_wait,
        "predicted_pax": round(predicted_pax),
        "report_count": report_count,
        "recommendation": recommendation
    }

@app.post("/report")
def report(data: WaitReport):
    supabase.table("wait_reports").insert({
        "flight_number": data.flight_number,
        "airport_code": data.airport_code,
        "reported_wait": data.reported_wait,
        "hour": data.hour,
        "day_of_week": data.day_of_week,
        "month": data.month
    }).execute()

    return {"status": "report received, thank you!"}