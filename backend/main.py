import os
import pickle
import requests
import datetime
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List

app = FastAPI(title="AgriRisk API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

# --- ML Model Loading ---
# We load the models at startup to avoid reloading them on every request.
try:
    with open('../Price Prediction/spoilage_data.pkl', 'rb') as f:
        spoilage_model = pickle.load(f)
    print("Spoilage Model loaded successfully.")
except Exception as e:
    print(f"Warning: ML Models failed to load. Error: {e}")
    spoilage_model = None

# --- Risk Analysis & ML Inference Endpoint ---
class PredictionRequest(BaseModel):
    crop_type: str
    days_passed: int
    latitude: float
    longitude: float

class PriceTrend(BaseModel):
    day: int
    date: str
    price: float  # Raw numerical value, formatted in frontend

class PredictionResponse(BaseModel):
    current_temperature: float
    current_humidity: float
    safe_hold_window_days: int
    risk_level_percentage: float
    predicted_price_trend: List[PriceTrend]
    optimal_selling_date: str

@app.post("/api/predict-optimal-sale", response_model=PredictionResponse)
async def predict_optimal_sale(request: PredictionRequest):
    """
    1. Fetch weather from OpenWeatherMap
    2. Pass data to Spoilage Model
    3. Pass data to Price Model
    """
    api_key = os.getenv("OPENWEATHERMAP_API_KEY", "your_api_key_here")
    weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={request.latitude}&lon={request.longitude}&appid={api_key}&units=metric"
    
    try:
        weather_res = requests.get(weather_url)
        if weather_res.status_code == 200:
            weather_data = weather_res.json()
            temp = weather_data['main']['temp']
            humidity = weather_data['main']['humidity']
        else:
            raise Exception("Invalid API Key or network error")
    except Exception:
        # Fallback for development if API key fails
        temp = 28.5
        humidity = 65.0

    # ML INFERENCE (Simulated structure wrapping the actual pickle model calls)
    # safe_window = spoilage_model.predict([[temp, humidity, request.crop_type, request.days_passed]])
    safe_window_days = 7 - request.days_passed if (7 - request.days_passed) > 0 else 0
    risk_level = 100 - (safe_window_days * 14.2) # Gauge chart metric (0-100)
    risk_level = max(0, min(100, risk_level)) # clamp between 0 and 100

    # Price trend calculation (raw float values)
    trend = []
    base_price = 25.50 if request.crop_type.lower() == 'pumpkin' else (18.0 if request.crop_type.lower() == 'potato' else 22.0)
    for i in range(14): # 14-day forecast
        future_date = datetime.datetime.now() + datetime.timedelta(days=i)
        trend.append({
            "day": i + 1,
            "date": future_date.strftime("%Y-%m-%d"),
            "price": base_price + (i * 1.2) # Simulating price going up
        })
    
    return PredictionResponse(
        current_temperature=temp,
        current_humidity=humidity,
        safe_hold_window_days=safe_window_days,
        risk_level_percentage=risk_level,
        predicted_price_trend=trend,
        optimal_selling_date=(datetime.datetime.now() + datetime.timedelta(days=safe_window_days)).strftime("%Y-%m-%d")
    )

# --- Marketplace Routes ---
@app.post("/api/marketplace/list")
async def list_crop(data: dict):
    return {"message": "Crop listed successfully"}

@app.get("/api/marketplace/listings")
async def get_listings():
    return [
      {"id": "1", "cropType": "PUMPKIN", "price": 4.5, "daysPassed": 2, "distance": "5 km"},
      {"id": "2", "cropType": "POTATO", "price": 2.1, "daysPassed": 5, "distance": "12 km"}
    ]

@app.get("/")
async def root():
    return {"message": "Welcome to AgriRisk API"}
