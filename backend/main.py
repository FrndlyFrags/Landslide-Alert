"""
-----------------------------------------------------------------------
main.py
-----------------------------------------------------------------------
WHAT THIS FILE DOES (in plain English):
This is the "front door" of our backend server. It starts up a web
server (using FastAPI) and defines every URL ("route") that the React
dashboard is allowed to call, such as:

  GET  /api/sites                     -> list every monitored location
  GET  /api/sites/{site_id}/risk3o      -> full risk report for one site
  GET  /api/regional-risk             -> one combined score for all of NER
  POST /api/crack-analysis            -> analyze an uploaded crack photo
  POST /api/trigger-warning           -> simulate sending a public alert
  POST /api/copilot/ask               -> ask the AI Disaster Copilot a question
  GET  /api/reroute/{blocked_site_id} -> get an alternate relief route

HOW TO RUN THIS SERVER:
  1. Install the requirements:   pip install -r requirements.txt
  2. Start the server:           uvicorn main:app --reload
  3. Open your browser to:       http://127.0.0.1:8000/docs
     (FastAPI auto-generates an interactive page to test every route)
-----------------------------------------------------------------------
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models.predict import (
    calculate_short_and_long_term_risk,
    calculate_regional_global_risk_score,
)
from models.cv_crack import analyze_crack_photo
from services.telemetry import (
    NER_MONITORING_SITES,
    get_all_monitoring_sites,
    get_live_weather_snapshot,
    get_soil_sensor_reading,
    get_satellite_displacement,
    get_active_sensor_node_count,
)


# -----------------------------------------------------------------------
# APP SETUP
# -----------------------------------------------------------------------
app = FastAPI(
    title="AI-Based Early Warning and Landslide Risk Monitoring Platform (NER)",
    description="Backend API serving live risk scores, telemetry, and alerts "
    "for landslide-prone corridors across India's North Eastern Region.",
    version="1.0.0",
)

# CORS lets our React frontend (running on a different port, e.g. 5173)
# make requests to this backend (running on port 8000) without the
# browser blocking them for security reasons.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace "*" with your real frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------------------------------------------
# SIMPLE ROAD NETWORK MAP (used for the emergency rerouting demo)
# -----------------------------------------------------------------------
# WHAT: A basic list of which sites connect to which, and an alternate
#       route if a given site's road is blocked.
# WHY:  When a primary highway is blocked by a landslide, the platform
#       needs to instantly suggest an alternate path for relief trucks.
ALTERNATE_ROUTES = {
    "NER-003": "Detour via Melli - Jorethang bypass road (adds ~45 min)",
    "NER-004": "Detour via Algarah - Lava alternate hill road (adds ~70 min)",
    "NER-005": "Detour via Diphu - Haflong link road (adds ~90 min)",
    "NER-006": "Detour via Jatinga - Harangajao forest road (adds ~110 min)",
    "NER-007": "Detour via Tamenglong bypass track (adds ~60 min)",
    "NER-008": "Detour via Zubza - Chumukedima link road (adds ~40 min)",
    "NER-009": "Detour via Kolasib - Vairengte alternate road (adds ~55 min)",
    "NER-010": "Detour via Teliamura - Khowai link road (adds ~35 min)",
    "NER-011": "Detour via Dirang - Bomdila old cart road (adds ~120 min)",
    "NER-012": "Detour via Ledum - Pasighat farm road (adds ~50 min)",
}


# -----------------------------------------------------------------------
# REQUEST/RESPONSE SHAPES (Pydantic models)
# -----------------------------------------------------------------------
# WHAT: These classes describe exactly what data a request must contain.
# WHY:  FastAPI uses them to automatically validate incoming requests and
#       reject anything malformed, so our functions never receive junk data.

class WarningBlastRequest(BaseModel):
    site_id: str
    message_english: str
    languages: list[str]  # e.g. ["English", "Assamese", "Khasi"]


class CopilotQuestionRequest(BaseModel):
    question: str


# -----------------------------------------------------------------------
# BASIC TRANSLATION DICTIONARY (mock multilingual support)
# -----------------------------------------------------------------------
# WHAT: A tiny phrasebook used to "translate" alert messages.
# WHY:  Real translation would call a translation API/service. This mock
#       demonstrates the multilingual broadcast feature end-to-end without
#       needing an external translation account.
MOCK_ALERT_PHRASES = {
    "English": "LANDSLIDE WARNING: Please move to higher ground immediately.",
    "Assamese": "ভূমিষ্খলন সতৰ্কবাণী: অনুগ্ৰহ কৰি তৎক্ষণাৎ ওখ ঠাইলৈ যাওক।",
    "Manipuri": "ꯆꯤꯡ ꯆꯤꯏꯅꯕ ꯁꯤꯡꯅꯐꯝ: ꯌꯦꯡꯍꯦꯟꯅꯕꯥ ꯌꯦꯏꯐꯝꯗ ꯆꯠꯄꯤꯐꯝ ꯆꯠꯅꯕꯤꯀꯦ꯫",
    "Khasi": "JINGKHUM SHISHA: Wan sha jaka thang naduh mynta.",
    "Garo": "SONGSAL RANGKUGIPA KHABAR: Da·o bimung salni jagrong bak.a.",
    "Mizo": "TLANG PUTHLET VANNEIH THUPUAN: Hmun sang zawnah paltansuh.",
    "Bengali": "ভূমিধস সতর্কতা: অনুগ্রহ করে অবিলম্বে উঁচু স্থানে চলে যান।",
    "Nagamese": "LANDSLIDE KHABOR: Joldi upor jagate jai.",
}


# -----------------------------------------------------------------------
# ROUTE: Health check
# -----------------------------------------------------------------------
@app.get("/")
def read_root():
    """WHAT: A simple route to confirm the server is alive."""
    return {"status": "online", "service": "NER Landslide Monitoring API"}


# -----------------------------------------------------------------------
# ROUTE: List every monitored site
# -----------------------------------------------------------------------
@app.get("/api/sites")
def list_all_sites():
    """
    WHAT: Returns every monitoring location across NER (name, state,
          corridor, coordinates).
    WHY:  The frontend map needs this list to know where to draw pins.
    """
    return {"sites": get_all_monitoring_sites(), "total_sites": len(NER_MONITORING_SITES)}


# -----------------------------------------------------------------------
# ROUTE: Full risk report for one site
# -----------------------------------------------------------------------
@app.get("/api/sites/{site_id}/risk")
def get_site_risk(site_id: str):
    """
    WHAT: Pulls the latest weather, soil, and satellite readings for one
          site, feeds them into the AI risk engine, and returns a full
          risk report including a 6-hour and 24-hour forecast.
    WHY:  This is the main route the "Spatial Inspector" panel calls
          when a user clicks a pin on the 3D map.
    """
    matching_site = next(
        (site for site in NER_MONITORING_SITES if site["site_id"] == site_id), None
    )
    if matching_site is None:
        raise HTTPException(status_code=404, detail=f"Site '{site_id}' not found")

    weather = get_live_weather_snapshot(site_id)
    soil = get_soil_sensor_reading(site_id)
    satellite = get_satellite_displacement(site_id)

    risk_forecast = calculate_short_and_long_term_risk(
        rainfall_last_24h_mm=weather["rainfall_last_24h_mm"],
        rainfall_next_6h_forecast_mm=weather["rainfall_next_6h_forecast_mm"],
        soil_saturation_percent=soil["soil_saturation_percent"],
        slope_angle_degrees=soil["slope_angle_degrees"],
        land_creep_rate_mm_per_day=soil["land_creep_rate_mm_per_day"],
        ground_displacement_mm_per_month=satellite["ground_displacement_mm_per_month"],
    )

    return {
        "site": matching_site,
        "weather": weather,
        "soil": soil,
        "satellite": satellite,
        "risk_forecast": risk_forecast,
    }


# -----------------------------------------------------------------------
# ROUTE: Combined regional risk score (for the header badge)
# -----------------------------------------------------------------------
@app.get("/api/regional-risk")
def get_regional_risk():
    """
    WHAT: Calculates the risk for every site, then combines them into
          one "Regional Global Risk Score" for the whole NER region.
    WHY:  Powers the always-visible header badge that gives officials a
          one-glance sense of how dangerous today is across all of NER.
    """
    all_scores = []
    site_summaries = []

    for site in NER_MONITORING_SITES:
        weather = get_live_weather_snapshot(site["site_id"])
        soil = get_soil_sensor_reading(site["site_id"])
        satellite = get_satellite_displacement(site["site_id"])

        risk_forecast = calculate_short_and_long_term_risk(
            rainfall_last_24h_mm=weather["rainfall_last_24h_mm"],
            rainfall_next_6h_forecast_mm=weather["rainfall_next_6h_forecast_mm"],
            soil_saturation_percent=soil["soil_saturation_percent"],
            slope_angle_degrees=soil["slope_angle_degrees"],
            land_creep_rate_mm_per_day=soil["land_creep_rate_mm_per_day"],
            ground_displacement_mm_per_month=satellite["ground_displacement_mm_per_month"],
        )

        score_24h = risk_forecast["twenty_four_hour_forecast"]["failure_probability_percent"]
        all_scores.append(score_24h)
        site_summaries.append(
            {
                "site_id": site["site_id"],
                "name": site["name"],
                "state": site["state"],
                "failure_probability_percent": score_24h,
                "risk_level": risk_forecast["twenty_four_hour_forecast"]["risk_level"],
            }
        )

    regional_score = calculate_regional_global_risk_score(all_scores)

    # Sort the site list so the most dangerous locations appear first,
    # which is exactly what the "High-Risk Regional List" panel needs.
    site_summaries.sort(key=lambda item: item["failure_probability_percent"], reverse=True)

    return {
        "regional_score": regional_score,
        "active_sensor_nodes": get_active_sensor_node_count(),
        "high_risk_site_list": site_summaries,
    }


# -----------------------------------------------------------------------
# ROUTE: Analyze an uploaded crack photo
# -----------------------------------------------------------------------
@app.post("/api/crack-analysis")
async def analyze_uploaded_crack_photo(photo: UploadFile = File(...)):
    """
    WHAT: Accepts a photo uploaded by a citizen or field officer and
          runs it through the (mock) computer vision crack analyzer.
    WHY:  Powers the "Field Intelligence Panel" photo upload feature,
          returning a bounding box, crack width, and risk multiplier.
    """
    analysis_result = analyze_crack_photo(photo.filename)
    return analysis_result


# -----------------------------------------------------------------------
# ROUTE: Trigger a regional warning blast
# -----------------------------------------------------------------------
@app.post("/api/trigger-warning")
def trigger_regional_warning(request: WarningBlastRequest):
    """
    WHAT: Simulates sending an SMS/WhatsApp warning blast, pre-translated
          into every requested language, for a specific site.
    WHY:  Powers the "Trigger Regional Warning Blast" button in the
          header and the multilingual broadcast card at the bottom of
          the dashboard.
    """
    matching_site = next(
        (site for site in NER_MONITORING_SITES if site["site_id"] == request.site_id),
        None,
    )
    if matching_site is None:
        raise HTTPException(status_code=404, detail=f"Site '{request.site_id}' not found")

    translated_messages = {}
    for language in request.languages:
        # Fall back to the English phrase if we don't have that language
        # in our mock phrasebook yet.
        translated_messages[language] = MOCK_ALERT_PHRASES.get(
            language, MOCK_ALERT_PHRASES["English"]
        )

    return {
        "status": "sent",
        "site": matching_site["name"],
        "channels": ["SMS", "WhatsApp"],
        "translated_messages": translated_messages,
        "recipients_estimated": 1200,
    }


# -----------------------------------------------------------------------
# ROUTE: Emergency road rerouting for relief trucks
# -----------------------------------------------------------------------
@app.get("/api/reroute/{blocked_site_id}")
def get_alternate_route(blocked_site_id: str):
    """
    WHAT: Given a site whose road is blocked, returns a suggested
          alternate route for relief trucks.
    WHY:  Powers the "Dynamic Emergency Road Rerouting Logic" feature in
          the left analytics panel.
    """
    alternate_route = ALTERNATE_ROUTES.get(blocked_site_id)
    if alternate_route is None:
        raise HTTPException(
            status_code=404, detail=f"No alternate route configured for '{blocked_site_id}'"
        )
    return {"blocked_site_id": blocked_site_id, "suggested_alternate_route": alternate_route}


# -----------------------------------------------------------------------
# ROUTE: AI Disaster Copilot chat
# -----------------------------------------------------------------------
@app.post("/api/copilot/ask")
def ask_disaster_copilot(request: CopilotQuestionRequest):
    """
    WHAT: A very simple mock "AI Copilot" that looks for keywords in the
          user's question (like a state name) and responds with the
          current highest-risk site(s) in that area.
    WHY:  Powers the natural-language chat bar in the Emergency &
          Copilot Center, e.g. "Which villages in East Khasi Hills need
          evacuation in 6 hours?"

    In production, replace this keyword-matching logic with a real call
    to a language model (such as the Claude API) that has access to the
    live risk data as context.
    """
    question_lower = request.question.lower()

    # Try to find a state name mentioned in the question.
    matched_state = None
    for site in NER_MONITORING_SITES:
        if site["state"].lower() in question_lower:
            matched_state = site["state"]
            break

    # Gather risk data for every site (reusing the same calculation as
    # the regional risk route) so the copilot can reason about it.
    candidate_sites = []
    for site in NER_MONITORING_SITES:
        if matched_state and site["state"] != matched_state:
            continue
        weather = get_live_weather_snapshot(site["site_id"])
        soil = get_soil_sensor_reading(site["site_id"])
        satellite = get_satellite_displacement(site["site_id"])
        risk_forecast = calculate_short_and_long_term_risk(
            rainfall_last_24h_mm=weather["rainfall_last_24h_mm"],
            rainfall_next_6h_forecast_mm=weather["rainfall_next_6h_forecast_mm"],
            soil_saturation_percent=soil["soil_saturation_percent"],
            slope_angle_degrees=soil["slope_angle_degrees"],
            land_creep_rate_mm_per_day=soil["land_creep_rate_mm_per_day"],
            ground_displacement_mm_per_month=satellite["ground_displacement_mm_per_month"],
        )
        candidate_sites.append(
            {
                "name": site["name"],
                "state": site["state"],
                "six_hour_risk_percent": risk_forecast["six_hour_forecast"][
                    "failure_probability_percent"
                ],
                "risk_level": risk_forecast["six_hour_forecast"]["risk_level"],
            }
        )

    candidate_sites.sort(key=lambda item: item["six_hour_risk_percent"], reverse=True)
    top_sites = candidate_sites[:3]

    if not top_sites:
        answer_text = (
            "I couldn't find any monitored locations matching that question. "
            "Try asking about a specific NER state, like Meghalaya or Sikkim."
        )
    else:
        location_phrase = matched_state if matched_state else "the North Eastern Region"
        site_lines = ", ".join(
            f"{site['name']} ({site['six_hour_risk_percent']}% risk)" for site in top_sites
        )
        answer_text = (
            f"Based on current sensor and rainfall data for {location_phrase}, "
            f"the highest 6-hour failure risk locations are: {site_lines}."
        )

    return {"question": request.question, "answer": answer_text, "supporting_sites": top_sites}
