from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import pickle
import numpy as np

load_dotenv()

# load model at startup
with open("tsa_model.pkl", "rb") as f:
    model = pickle.load(f)
with open("airport_encoder.pkl", "rb") as f:
    le = pickle.load(f)

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

    predicted_wait = round(predicted_pax / (250 * 3) * 60)
    if data.has_precheck:
        predicted_wait = round(predicted_wait * 0.4)

    leave_by = data.distance_minutes + predicted_wait + 20

    recommendation = f"Flight {data.flight_number} — expect about {predicted_wait} min at TSA. Leave {leave_by} minutes before your flight. {'Use the PreCheck lane, it will be much faster.' if data.has_precheck else 'Standard lane — give yourself extra time.'}"

    return {
        "predicted_wait_minutes": predicted_wait,
        "predicted_pax": round(predicted_pax),
        "recommendation": recommendation
    }