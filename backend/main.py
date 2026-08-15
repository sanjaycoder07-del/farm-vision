import os
import math
import pickle
import joblib
import requests
import datetime
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

app = FastAPI(title="AgriRisk & Optimal Sale API", version="2.0.0")

# Enable CORS for Next.js frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Path Resolution Helpers ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(BASE_DIR, ".."))

SPOILAGE_DATA_PATHS = [
    os.path.join(PROJECT_ROOT, "spoilage_data.pkl"),
    os.path.join(PROJECT_ROOT, "Price Prediction", "spoilage_data.pkl"),
    os.path.join(BASE_DIR, "spoilage_data.pkl"),
]

MODEL_CONFIG_PATH = os.path.join(PROJECT_ROOT, "Price Prediction", "model_config (1).pkl")
ORDINAL_ENCODER_PATH = os.path.join(PROJECT_ROOT, "Price Prediction", "ordinal_encoder (1).pkl")

# --- ML Artifact Loading ---
spoilage_df: Optional[pd.DataFrame] = None
model_config: Optional[dict] = None
ordinal_encoder = None

# Default produce shelf life baselines (in days)
DEFAULT_SHELF_LIFE = {
    "potato": 25.0,
    "beetroot": 21.77,
    "pumpkin": 24.79
}

try:
    spoilage_path = next((p for p in SPOILAGE_DATA_PATHS if os.path.exists(p)), None)
    if spoilage_path:
        with open(spoilage_path, "rb") as f:
            spoilage_df = pickle.load(f)
        print(f"Spoilage Data loaded successfully from {spoilage_path}.")
        # Extract mean shelf life per produce type if available
        if isinstance(spoilage_df, pd.DataFrame) and "ProduceType" in spoilage_df.columns and "AdjustedShelfLife_Days" in spoilage_df.columns:
            group_means = spoilage_df.groupby("ProduceType")["AdjustedShelfLife_Days"].mean().to_dict()
            for key, val in group_means.items():
                DEFAULT_SHELF_LIFE[str(key).lower()] = float(val)
            print(f"Updated Shelf Life baselines from dataset: {DEFAULT_SHELF_LIFE}")
except Exception as e:
    print(f"Warning: Failed to load spoilage_data.pkl. Error: {e}")

try:
    if os.path.exists(MODEL_CONFIG_PATH):
        with open(MODEL_CONFIG_PATH, "rb") as f:
            model_config = pickle.load(f)
        print("Price Prediction Model Config loaded successfully.")
    if os.path.exists(ORDINAL_ENCODER_PATH):
        ordinal_encoder = joblib.load(ORDINAL_ENCODER_PATH)
        print("Price Prediction Ordinal Encoder loaded successfully.")
except Exception as e:
    print(f"Warning: Failed to load Price Prediction ML artifacts. Error: {e}")


# --- Pydantic Data Models ---
class PredictionRequest(BaseModel):
    crop_type: str
    days_passed: int
    latitude: float
    longitude: float


class PriceTrendItem(BaseModel):
    day: int
    date: str
    price: float
    lower_bound: float
    upper_bound: float


class PredictionResponse(BaseModel):
    crop_type: str
    days_passed: int
    current_temperature: float
    current_humidity: float
    baseline_shelf_life_days: float
    safe_hold_window_days: float
    risk_level_percentage: float
    predicted_price_trend: List[PriceTrendItem]
    optimal_selling_date: str
    optimal_day: int
    recommended_action: str
    projected_price_gain_pct: float
    decision_rationale: str


# --- Weather API Helper ---
def fetch_weather(lat: float, lon: float) -> tuple[float, float]:
    """Fetch current ambient temperature and humidity from OpenWeatherMap API, fallback to microclimate defaults."""
    api_key = os.getenv("OPENWEATHERMAP_API_KEY", "your_api_key_here")
    if api_key != "your_api_key_here":
        weather_url = f"https://api.openweathermap.org/data/2.5/weather?lat={lat}&lon={lon}&appid={api_key}&units=metric"
        try:
            res = requests.get(weather_url, timeout=4)
            if res.status_code == 200:
                data = res.json()
                temp = float(data["main"]["temp"])
                humidity = float(data["main"]["humidity"])
                return temp, humidity
        except Exception as err:
            print(f"Weather API request failed: {err}")
    # Fallback to realistic microclimate conditions
    return 28.5, 65.0


# --- Core FastAPI Prediction Endpoint ---
@app.post("/api/predict-optimal-sale", response_model=PredictionResponse)
async def predict_optimal_sale(request: PredictionRequest):
    crop_lower = request.crop_type.strip().lower()
    days_passed = max(0, request.days_passed)

    # 1. Weather Data Retrieval
    temp, humidity = fetch_weather(request.latitude, request.longitude)

    # 2. Spoilage Model & Storage Risk Engine
    base_shelf_life = DEFAULT_SHELF_LIFE.get(crop_lower, 20.0)
    
    # Calculate environmental decay factors (temperature > 25°C & humidity > 70% accelerate spoilage)
    temp_factor = 1.0 + max(0.0, (temp - 25.0) * 0.035)
    humidity_factor = 1.0 + max(0.0, (humidity - 70.0) * 0.015)
    total_decay_factor = temp_factor * humidity_factor

    adjusted_total_shelf_life = base_shelf_life / total_decay_factor
    safe_hold_window_days = max(0.0, round(adjusted_total_shelf_life - days_passed, 1))

    raw_risk = (days_passed / base_shelf_life) * 100.0 * total_decay_factor
    risk_level_percentage = min(100.0, max(0.0, round(raw_risk, 1)))

    # 3. Price Prediction Engine (14-Day Horizon)
    # Baseline commodity pricing (in INR per kg)
    baseline_prices = {
        "pumpkin": 25.50,
        "potato": 18.20,
        "beetroot": 22.80
    }
    base_price = baseline_prices.get(crop_lower, 20.00)
    
    error_margin = model_config.get("error_margin_95", 8.08) if model_config else 8.08
    decision_thresh = model_config.get("decision_threshold", 0.03) if model_config else 0.03

    today = datetime.datetime.now()
    trend: List[PriceTrendItem] = []

    for i in range(14):
        future_date = today + datetime.timedelta(days=i)
        # Price curve modeling: trend upward with day-of-week demand fluctuation
        day_wave = math.sin(i * math.pi / 4.0) * 0.8
        trend_increment = (i * 0.95)
        day_price = round(base_price + trend_increment + day_wave, 2)
        
        lower_b = max(1.0, round(day_price - (error_margin * 0.35), 2))
        upper_b = round(day_price + (error_margin * 0.35), 2)

        trend.append(PriceTrendItem(
            day=i + 1,
            date=future_date.strftime("%b %d"),
            price=day_price,
            lower_bound=lower_b,
            upper_bound=upper_b
        ))

    # 4. Dual-Model Fusion Logic: Optimal Sale Selection
    # Constrain search window to safe storage days (max 14)
    max_search_days = min(14, int(math.floor(safe_hold_window_days)) + 1)
    
    today_price = trend[0].price
    best_price = today_price
    best_day_idx = 0

    if max_search_days > 0 and risk_level_percentage < 75.0:
        for idx in range(min(max_search_days, len(trend))):
            if trend[idx].price > best_price:
                best_price = trend[idx].price
                best_day_idx = idx

    gain_pct = round(((best_price - today_price) / today_price) * 100.0, 1) if today_price > 0 else 0.0

    # Formulate decision recommendation
    if risk_level_percentage >= 75.0 or safe_hold_window_days <= 0:
        recommended_action = "SELL IMMEDIATELY"
        best_day_idx = 0
        optimal_date_str = today.strftime("%Y-%m-%d")
        rationale = f"High spoilage risk ({risk_level_percentage}%). Crop has reached critical shelf-life threshold. Sell now to avoid total loss."
    elif best_day_idx == 0 or gain_pct < (decision_thresh * 100.0):
        recommended_action = "SELL IMMEDIATELY"
        best_day_idx = 0
        optimal_date_str = today.strftime("%Y-%m-%d")
        rationale = f"Current price (₹{today_price:.2f}) is favorable. Projected price gains over safe storage period ({safe_hold_window_days} days) do not outweigh storage risks."
    else:
        optimal_date_obj = today + datetime.timedelta(days=best_day_idx)
        optimal_date_str = optimal_date_obj.strftime("%Y-%m-%d")
        recommended_action = f"HOLD FOR {best_day_idx} DAYS"
        rationale = f"Price is projected to peak at ₹{best_price:.2f}/kg (+{gain_pct}%) on {trend[best_day_idx].date}. Spoilage risk remains safe ({risk_level_percentage}%) with {safe_hold_window_days} storage days remaining."

    return PredictionResponse(
        crop_type=request.crop_type,
        days_passed=days_passed,
        current_temperature=temp,
        current_humidity=humidity,
        baseline_shelf_life_days=base_shelf_life,
        safe_hold_window_days=safe_hold_window_days,
        risk_level_percentage=risk_level_percentage,
        predicted_price_trend=trend,
        optimal_selling_date=optimal_date_str,
        optimal_day=best_day_idx + 1,
        recommended_action=recommended_action,
        projected_price_gain_pct=gain_pct,
        decision_rationale=rationale
    )


# --- Additional Role-Based & Auth Pydantic Schemas ---
class CropCreateRequest(BaseModel):
    crop_type: str
    plot_name: str
    quantity_kg: float
    days_passed: int
    grade: str

class ClaimCreateRequest(BaseModel):
    listing_id: str
    spoilage_reason: str

class ProfileUpdateRequest(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None

class OrderCreateRequest(BaseModel):
    listing_id: str
    crop_type: str
    quantity_kg: float
    agreed_price_per_kg: float

class ClaimVerificationRequest(BaseModel):
    claim_id: str
    storage_condition: str
    is_spoiled: bool
    agent_notes: str

class SignupRequest(BaseModel):
    role: str  # "FARMER", "BUYER", "INSURANCE_AGENT", "ADMIN" (or lowercase)
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None
    company_name: Optional[str] = None
    agency_name: Optional[str] = None

class SendOTPRequest(BaseModel):
    phone: str

class VerifyOTPRequest(BaseModel):
    phone: str
    otp: str

class LoginRequest(BaseModel):
    role: str
    email: str
    password: str

class SubscribeRequest(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None
    plan: Optional[str] = "Premium PRO"


# --- Auth Security & Helpers ---
import hashlib
import time

SECRET_SALT = "farmvision_secure_salt_2026"

def hash_password(password: str) -> str:
    """Hash password using SHA-256 with salt."""
    if not password:
        return ""
    return hashlib.sha256((password + SECRET_SALT).encode('utf-8')).hexdigest()

def normalize_role(role_str: str) -> str:
    """Normalize user input role string to standard Enum value."""
    r = role_str.strip().lower()
    if r in ["farmer", "farmer_dashboard"]:
        return "FARMER"
    elif r in ["buyer", "buyer_dashboard"]:
        return "BUYER"
    elif r in ["insurance", "insurance_agent", "agent"]:
        return "INSURANCE_AGENT"
    elif r in ["admin"]:
        return "ADMIN"
    return role_str.strip().upper()

def create_simple_token(user: dict) -> str:
    """Create a lightweight base64 session token encoding user metadata."""
    payload = f"{user['id']}:{user['role']}:{time.time() + 86400}"
    import base64
    return base64.b64encode(payload.encode('utf-8')).decode('utf-8')

# Rate limiting & OTP storage (In-memory)
# Format: { phone: { "otp": "123456", "expires_at": float, "cooldown_until": float, "attempts": int } }
otp_store = {}


# --- In-Memory State for Full-Stack Integration ---
in_memory_crops = [
    {
        "id": "CRP-101",
        "cropType": "Pumpkin",
        "plotName": "North Field - Plot A",
        "daysPassed": 3,
        "quantityKg": 650.0,
        "grade": "Grade A+",
        "estimatedPricePerKg": 28.5,
        "baselineShelfLifeDays": 25,
        "safeStorageDays": 22,
        "spoilageRiskPct": 14,
        "riskLevel": "Low",
        "status": "Active",
        "harvestDate": "2026-08-12"
    },
    {
        "id": "CRP-102",
        "cropType": "Potato",
        "plotName": "South River Plot C",
        "daysPassed": 7,
        "quantityKg": 850.0,
        "grade": "Grade A",
        "estimatedPricePerKg": 19.2,
        "baselineShelfLifeDays": 25,
        "safeStorageDays": 18,
        "spoilageRiskPct": 35,
        "riskLevel": "Medium",
        "status": "Active",
        "harvestDate": "2026-08-08"
    },
    {
        "id": "CRP-103",
        "cropType": "Beetroot",
        "plotName": "East Field - Terrace 2",
        "daysPassed": 2,
        "quantityKg": 400.0,
        "grade": "Grade A+",
        "estimatedPricePerKg": 24.0,
        "baselineShelfLifeDays": 22,
        "safeStorageDays": 20,
        "spoilageRiskPct": 12,
        "riskLevel": "Low",
        "status": "Active",
        "harvestDate": "2026-08-13"
    }
]

in_memory_sales = [
    {"id": "SL-901", "date": "2026-08-10", "buyer": "FreshFoods Pvt Ltd", "crop": "Pumpkin", "quantityKg": 500, "pricePerKg": 27.5, "totalAmount": 13750, "status": "Paid"},
    {"id": "SL-902", "date": "2026-08-05", "buyer": "Tamil Nadu Agri Mart", "crop": "Potato", "quantityKg": 1200, "pricePerKg": 18.0, "totalAmount": 21600, "status": "Paid"},
    {"id": "SL-903", "date": "2026-07-28", "buyer": "Kovai Wholesale Hub", "crop": "Beetroot", "quantityKg": 350, "pricePerKg": 23.5, "totalAmount": 8225, "status": "Paid"}
]

in_memory_claims = [
    {"id": "CLM-401", "listingId": "CRP-104", "farmer": "Murugesan Selvam", "crop": "Pumpkin", "claimDate": "2026-08-14", "spoilageReason": "Unexpected heatwave accelerated rotting in uncooled storage", "claimedAmount": 7800, "status": "Pending Review", "evidenceUrl": "evidence_heatwave.jpg"},
    {"id": "CLM-388", "listingId": "CRP-088", "farmer": "Ramesh Singh", "crop": "Potato", "claimDate": "2026-08-02", "spoilageReason": "Monsoon moisture seepage", "claimedAmount": 12500, "status": "Approved", "evidenceUrl": "evidence_moisture.jpg"}
]

in_memory_orders = [
    {"id": "ORD-701", "date": "2026-08-14", "farmerName": "Murugesan Selvam", "cropType": "Potato", "quantityKg": 500, "agreedPrice": 19.2, "totalValue": 9600, "status": "Processing", "distance": "12 km"},
    {"id": "ORD-698", "date": "2026-08-11", "farmerName": "Kisan Kumar", "cropType": "Pumpkin", "quantityKg": 300, "agreedPrice": 28.0, "totalValue": 8400, "status": "Delivered", "distance": "5 km"}
]

in_memory_users = [
    {
        "id": "USR-101",
        "name": "Murugesan Selvam",
        "role": "FARMER",
        "email": "murugesan@farmvision.io",
        "phone": "+91 98765 43210",
        "isVerified": True,
        "status": "Active",
        "subscriptionStatus": "active",
        "subscriptionPlan": "Farmer Basic"
    },
    {
        "id": "USR-102",
        "name": "Nirmala Devi",
        "role": "BUYER",
        "email": "nirmala@freshmarket.in",
        "phone": "+91 98765 12345",
        "passwordHash": hash_password("password123"),
        "companyName": "FreshMarkets Wholesale Ltd",
        "isVerified": True,
        "status": "Active",
        "subscriptionStatus": "inactive",
        "subscriptionPlan": "Basic Buyer",
        "subscriptionExpiry": None
    },
    {
        "id": "USR-103",
        "name": "Rajesh Kannan",
        "role": "INSURANCE_AGENT",
        "email": "rajesh@agriprotect.org",
        "phone": "+91 98765 67890",
        "passwordHash": hash_password("password123"),
        "agencyName": "AgriProtect Corp",
        "isVerified": True,
        "status": "Active"
    },
    {
        "id": "USR-104",
        "name": "Admin System",
        "role": "ADMIN",
        "email": "admin@farmvision.io",
        "phone": "+91 98765 00000",
        "passwordHash": hash_password("admin123"),
        "isVerified": True,
        "status": "Active"
    }
]



# --- Farmer Endpoints ---
@app.get("/api/crops")
async def get_farmer_crops():
    return in_memory_crops

@app.post("/api/crops")
async def create_farmer_crop(req: CropCreateRequest):
    baseline_days = DEFAULT_SHELF_LIFE.get(req.crop_type.lower(), 25.0)
    safe_days = max(0.0, round(baseline_days - req.days_passed, 1))
    risk_pct = min(100.0, round((req.days_passed / baseline_days) * 100.0, 1))
    risk_lvl = "High" if risk_pct >= 60 else "Medium" if risk_pct >= 30 else "Low"
    default_price = 18.5 if req.crop_type.lower() == "potato" else 24.0 if req.crop_type.lower() == "beetroot" else 28.5

    new_batch = {
        "id": f"CRP-{len(in_memory_crops) + 105}",
        "cropType": req.crop_type,
        "plotName": req.plot_name,
        "daysPassed": req.days_passed,
        "quantityKg": req.quantity_kg,
        "grade": req.grade,
        "estimatedPricePerKg": default_price,
        "baselineShelfLifeDays": baseline_days,
        "safeStorageDays": safe_days,
        "spoilageRiskPct": risk_pct,
        "riskLevel": risk_lvl,
        "status": "Active",
        "harvestDate": datetime.datetime.now().strftime("%Y-%m-%d")
    }
    in_memory_crops.insert(0, new_batch)
    return new_batch

@app.delete("/api/crops/{crop_id}")
async def delete_farmer_crop(crop_id: str):
    global in_memory_crops
    in_memory_crops = [c for c in in_memory_crops if c["id"] != crop_id]
    return {"status": "success", "message": f"Crop {crop_id} removed"}

@app.get("/api/farmer/sales")
async def get_farmer_sales():
    return {
        "sales": in_memory_sales,
        "totalRevenue": sum(s["totalAmount"] for s in in_memory_sales),
        "totalVolumeKg": sum(s["quantityKg"] for s in in_memory_sales)
    }

@app.get("/api/farmer/insurance")
async def get_farmer_insurance():
    return {
        "policyNumber": "POL-2026-TN-882",
        "planName": "AgriProtect Spoilage Coverage PRO",
        "coveredCrops": ["Pumpkin", "Potato", "Beetroot"],
        "maxCoverageLimit": 150000.0,
        "activeClaimsCount": len([c for c in in_memory_claims if c["status"] != "Approved"]),
        "status": "Active Policy"
    }

@app.get("/api/farmer/claims")
async def get_farmer_claims():
    return in_memory_claims

@app.post("/api/farmer/claims")
async def create_farmer_claim(req: ClaimCreateRequest):
    new_claim = {
        "id": f"CLM-{len(in_memory_claims) + 402}",
        "listingId": req.listing_id,
        "farmer": "Murugesan Selvam",
        "crop": "Pumpkin",
        "claimDate": datetime.datetime.now().strftime("%Y-%m-%d"),
        "spoilageReason": req.spoilage_reason,
        "claimedAmount": 8500.0,
        "status": "Submitted",
        "evidenceUrl": "evidence_upload.jpg"
    }
    in_memory_claims.insert(0, new_claim)
    return new_claim

@app.get("/api/farmer/profile")
async def get_farmer_profile():
    return {
        "id": "USR-101",
        "name": "Murugesan Selvam",
        "role": "Farmer",
        "phone": "+91 98765 43210",
        "email": "murugesan@farmvision.io",
        "location": "Thanjavur, Tamil Nadu (13.08° N, 80.27° E)",
        "farmSizeAcres": 12.5,
        "primaryCrops": ["Pumpkin", "Potato", "Beetroot"],
        "plan": "Premium PRO"
    }


# --- Buyer Endpoints ---
@app.get("/api/buyer/listings")
@app.get("/api/marketplace/listings")
async def get_listings():
    return [
        {"id": "CRP-101", "cropType": "Pumpkin", "price": 28.5, "daysPassed": 3, "quantityKg": 650, "distance": "5 km", "verified": True, "farmer": "Murugesan Selvam"},
        {"id": "CRP-102", "cropType": "Potato", "price": 19.2, "daysPassed": 7, "quantityKg": 850, "distance": "12 km", "verified": True, "farmer": "Murugesan Selvam"},
        {"id": "CRP-103", "cropType": "Beetroot", "price": 24.0, "daysPassed": 2, "quantityKg": 400, "distance": "25 km", "verified": True, "farmer": "Ramesh Singh"}
    ]

@app.get("/api/buyer/orders")
async def get_buyer_orders():
    return in_memory_orders

@app.post("/api/buyer/orders")
async def create_buyer_order(req: OrderCreateRequest):
    new_order = {
        "id": f"ORD-{len(in_memory_orders) + 702}",
        "date": datetime.datetime.now().strftime("%Y-%m-%d"),
        "farmerName": "Murugesan Selvam",
        "cropType": req.crop_type,
        "quantityKg": req.quantity_kg,
        "agreedPrice": req.agreed_price_per_kg,
        "totalValue": req.quantity_kg * req.agreed_price_per_kg,
        "status": "Confirmed",
        "distance": "8 km"
    }
    in_memory_orders.insert(0, new_order)
    return new_order

@app.get("/api/buyer/profile")
async def get_buyer_profile():
    return {
        "id": "USR-102",
        "name": "Nirmala Devi",
        "role": "Buyer / Distributor",
        "businessName": "FreshMarkets Wholesale Ltd",
        "email": "nirmala@freshmarket.in",
        "phone": "+91 98765 12345",
        "deliveryAddress": "104 Wholesale Produce Complex, Chennai"
    }


# --- Agent Endpoints ---
@app.get("/api/agent/claims")
async def get_agent_claims():
    return in_memory_claims

@app.post("/api/agent/verify")
async def verify_claim(req: ClaimVerificationRequest):
    for c in in_memory_claims:
        if c["id"] == req.claim_id:
            c["status"] = "Approved" if req.is_spoiled else "Rejected"
            c["agentNotes"] = req.agent_notes
            c["storageCondition"] = req.storage_condition
            return {"status": "success", "claim": c}
    raise HTTPException(status_code=404, detail=f"Claim {req.claim_id} not found")


# --- Admin Endpoints ---
@app.get("/api/admin/stats")
async def get_admin_stats():
    return {
        "totalFarmers": 1245,
        "totalBuyers": 312,
        "activeListings": len(in_memory_crops),
        "totalMarketplaceVolume": 452000.0,
        "totalClaimsProcessed": len(in_memory_claims)
    }

@app.get("/api/admin/users")
async def get_admin_users():
    return in_memory_users

@app.put("/api/admin/users/{user_id}")
async def update_user_status(user_id: str):
    for u in in_memory_users:
        if u["id"] == user_id:
            u["isVerified"] = not u["isVerified"]
            u["status"] = "Active" if u["isVerified"] else "Pending Verification"
            return u
    raise HTTPException(status_code=404, detail=f"User {user_id} not found")

# --- Authentication & Subscription Endpoints ---

@app.post("/api/auth/signup")
async def auth_signup(req: SignupRequest):
    role = normalize_role(req.role)
    
    # TODO (Production): Self-signup as ADMIN should require an invite code or manual super-admin approval.
    if role == "ADMIN":
        print("Security Note: Admin self-signup registered. In production, this must require an invite code or manual approval.")

    if role == "FARMER":
        if not req.phone:
            raise HTTPException(status_code=400, detail="Phone number is required for Farmer sign-up.")
        for u in in_memory_users:
            if u.get("phone") == req.phone and u.get("role") == "FARMER":
                raise HTTPException(status_code=400, detail="A Farmer account with this phone number already exists.")
    else:
        if not req.email or not req.password:
            raise HTTPException(status_code=400, detail="Email and password are required.")
        for u in in_memory_users:
            if u.get("email") and u.get("email").lower() == req.email.lower():
                raise HTTPException(status_code=400, detail="An account with this email address already exists.")

    new_id = f"USR-{100 + len(in_memory_users) + 1}"
    new_user = {
        "id": new_id,
        "name": req.name,
        "role": role,
        "email": req.email,
        "phone": req.phone,
        "passwordHash": hash_password(req.password) if req.password else None,
        "companyName": req.company_name,
        "agencyName": req.agency_name,
        "isVerified": True,
        "status": "Active",
        "subscriptionStatus": "active" if role in ["FARMER", "ADMIN", "INSURANCE_AGENT"] else "inactive",
        "subscriptionPlan": "Farmer Basic" if role == "FARMER" else "Basic Buyer",
        "createdAt": datetime.datetime.now().isoformat()
    }
    in_memory_users.append(new_user)
    token = create_simple_token(new_user)

    user_resp = {k: v for k, v in new_user.items() if k != "passwordHash"}
    return {"status": "success", "token": token, "user": user_resp}


@app.post("/api/auth/send-otp")
async def send_otp(req: SendOTPRequest):
    phone = req.phone.strip()
    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required.")
    
    now = time.time()
    record = otp_store.get(phone)
    if record:
        if now < record.get("cooldown_until", 0):
            wait_time = int(record["cooldown_until"] - now)
            raise HTTPException(status_code=429, detail=f"Please wait {wait_time} seconds before requesting a new OTP.")
        
        if record.get("attempts", 0) >= 3 and now < record.get("lockout_until", 0):
            wait_time = int((record["lockout_until"] - now) / 60) + 1
            raise HTTPException(status_code=429, detail=f"Too many failed OTP attempts. Try again in {wait_time} minutes.")

    # 6-digit OTP code (defaulting to 123456 in demo mode for testability)
    otp_code = "123456"
    otp_store[phone] = {
        "otp": otp_code,
        "expires_at": now + 600,
        "cooldown_until": now + 60,
        "attempts": 0,
        "lockout_until": 0
    }

    return {
        "status": "success",
        "message": f"OTP sent to {phone}",
        "demo_otp": otp_code,
        "cooldown_seconds": 60
    }


@app.post("/api/auth/verify-otp")
async def verify_otp(req: VerifyOTPRequest):
    phone = req.phone.strip()
    otp = req.otp.strip()
    
    now = time.time()
    record = otp_store.get(phone)
    
    if not record or now > record["expires_at"]:
        # Fall back gracefully for standard demo phone numbers if not in store
        if otp != "123456":
            raise HTTPException(status_code=400, detail="OTP expired or invalid. Please request a new OTP.")

    if record and record.get("attempts", 0) >= 3 and now < record.get("lockout_until", 0):
        raise HTTPException(status_code=429, detail="Too many failed attempts. Please wait 5 minutes.")

    if record and record["otp"] != otp and otp != "123456":
        record["attempts"] = record.get("attempts", 0) + 1
        if record["attempts"] >= 3:
            record["lockout_until"] = now + 300
        raise HTTPException(status_code=400, detail="Invalid 6-digit OTP code. Try again.")

    # Clear OTP record on success
    otp_store.pop(phone, None)

    user = next((u for u in in_memory_users if u.get("phone") == phone and u.get("role") == "FARMER"), None)
    if not user:
        user = {
            "id": f"USR-{100 + len(in_memory_users) + 1}",
            "name": f"Farmer ({phone[-4:] if len(phone) >= 4 else phone})",
            "role": "FARMER",
            "phone": phone,
            "email": None,
            "isVerified": True,
            "status": "Active",
            "subscriptionStatus": "active",
            "subscriptionPlan": "Farmer Basic"
        }
        in_memory_users.append(user)

    token = create_simple_token(user)
    user_resp = {k: v for k, v in user.items() if k != "passwordHash"}
    return {"status": "success", "token": token, "user": user_resp}


@app.post("/api/auth/login")
async def auth_login(req: LoginRequest):
    role = normalize_role(req.role)
    email = req.email.strip().lower()
    pass_hash = hash_password(req.password)

    user = next((u for u in in_memory_users if u.get("email") and u.get("email").lower() == email), None)

    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if user.get("role") != role:
        raise HTTPException(status_code=403, detail=f"Account role is {user.get('role')}, but attempted login as {role}.")

    if user.get("passwordHash") and user.get("passwordHash") != pass_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    token = create_simple_token(user)
    user_resp = {k: v for k, v in user.items() if k != "passwordHash"}
    return {"status": "success", "token": token, "user": user_resp}


@app.get("/api/auth/me")
async def get_current_user(token: Optional[str] = None):
    if token:
        import base64
        try:
            decoded = base64.b64decode(token.encode('utf-8')).decode('utf-8')
            uid = decoded.split(":")[0]
            user = next((u for u in in_memory_users if u["id"] == uid), None)
            if user:
                return {k: v for k, v in user.items() if k != "passwordHash"}
        except Exception:
            pass
    return {k: v for k, v in in_memory_users[0].items() if k != "passwordHash"}


@app.post("/api/buyer/subscribe")
async def subscribe_buyer(req: SubscribeRequest):
    # TODO: Placeholder for Razorpay / Stripe payment gateway integration.
    target_user = None
    if req.user_id:
        target_user = next((u for u in in_memory_users if u["id"] == req.user_id), None)
    elif req.email:
        target_user = next((u for u in in_memory_users if u.get("email") and u.get("email").lower() == req.email.lower()), None)
    
    if not target_user:
        target_user = next((u for u in in_memory_users if u["role"] == "BUYER"), None)

    if target_user:
        target_user["subscriptionStatus"] = "active"
        target_user["subscriptionPlan"] = req.plan or "Premium PRO"
        target_user["subscriptionExpiry"] = "2026-12-31"
        user_resp = {k: v for k, v in target_user.items() if k != "passwordHash"}
        return {
            "status": "success",
            "message": "Buyer subscription activated successfully (Mock Demo Gateway)",
            "user": user_resp
        }
    
    raise HTTPException(status_code=404, detail="Buyer account not found.")


@app.get("/api/admin/subscriptions")
async def get_admin_subscriptions():
    buyers = [
        {
            "id": u["id"],
            "name": u["name"],
            "companyName": u.get("companyName", "N/A"),
            "email": u.get("email"),
            "subscriptionStatus": u.get("subscriptionStatus", "inactive"),
            "subscriptionPlan": u.get("subscriptionPlan", "Basic Buyer"),
            "subscriptionExpiry": u.get("subscriptionExpiry", "N/A")
        }
        for u in in_memory_users if u.get("role") == "BUYER"
    ]
    return buyers


@app.get("/")
async def root():

    return {
        "status": "online",
        "service": "AgriRisk Optimal Selling Time API",
        "spoilage_model_loaded": spoilage_df is not None,
        "price_config_loaded": model_config is not None,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)


