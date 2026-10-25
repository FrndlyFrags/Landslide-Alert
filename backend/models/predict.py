"""
-----------------------------------------------------------------------
predict.py
-----------------------------------------------------------------------
WHAT THIS FILE DOES (in plain English):
This is the "brain" of the platform. It takes raw numbers from the
weather API, the soil sensors, and the satellite feed, and turns them
into ONE simple, easy-to-understand number: a Landslide Failure
Probability Score from 0% (totally safe) to 100% (failure is imminent).

HOW THE SCORE IS CALCULATED (explained simply):
We use a "weighted scoring" approach. Think of it like a report card
where each factor (rainfall, soil wetness, slope steepness, ground
creep, satellite displacement) contributes some points to a final
score out of 100. Steeper slopes, wetter soil, heavier rain, and faster
ground movement all push the score UP (more dangerous).

NOTE FOR ENGINEERS: This is a simplified, explainable "rule-based" model
that mimics what a real machine-learning model (e.g. a trained Random
Forest or Gradient Boosting classifier) would output. It is intentionally
transparent so non-experts can see WHY a location is flagged as risky.
A real ML model trained on historical landslide records could later
replace the `calculate_landslide_risk()` function below without changing
how the rest of the app calls it.
-----------------------------------------------------------------------
"""


def _clamp_percent(value: float) -> float:
    """
    WHAT: Keeps a number between 0 and 100.
    WHY:  Probabilities/percentages should never go below 0% or above
          100%, even if the maths above briefly overshoots.
    """
    return max(0.0, min(100.0, value))


def calculate_landslide_risk(
    rainfall_last_24h_mm: float,
    soil_saturation_percent: float,
    slope_angle_degrees: float,
    land_creep_rate_mm_per_day: float,
    ground_displacement_mm_per_month: float,
) -> dict:
    """
    WHAT: The main risk calculation. Takes in 5 real-world measurements
          and returns a full risk report.
    WHY:  This is the single function every other part of the backend
          calls whenever it needs to know "how dangerous is this spot
          right now?"

    HOW EACH FACTOR IS WEIGHTED (out of 100 total points):
      - Rainfall in the last 24 hours   -> up to 30 points
      - How saturated (wet) the soil is -> up to 25 points
      - How steep the slope is          -> up to 20 points
      - How fast the ground is creeping -> up to 15 points
      - Satellite-measured ground shift -> up to 10 points
    """

    # ---- 1. Rainfall contribution (max 30 points) ----------------------
    # Heavier rain in the last 24 hours = more danger.
    # We treat 200mm+ of rain in a day as "maximum danger" for this factor.
    rainfall_points = min(30.0, (rainfall_last_24h_mm / 200.0) * 30.0)

    # ---- 2. Soil saturation contribution (max 25 points) ----------------
    # Soil that is close to 100% saturated is heavy and unstable.
    soil_points = (soil_saturation_percent / 100.0) * 25.0

    # ---- 3. Slope angle contribution (max 20 points) ---------------------
    # Slopes steeper than 45 degrees are treated as maximum danger for
    # this factor, since very steep slopes fail more easily under load.
    slope_points = min(20.0, (slope_angle_degrees / 45.0) * 20.0)

    # ---- 4. Land creep rate contribution (max 15 points) ------------------
    # Creep is how many millimetres per day the ground is slowly sliding.
    # 10mm/day or more is treated as maximum danger for this factor.
    creep_points = min(15.0, (land_creep_rate_mm_per_day / 10.0) * 15.0)

    # ---- 5. Satellite displacement contribution (max 10 points) -----------
    # Ground that has shifted 40mm+ in a month (measured by radar) is
    # treated as maximum danger for this factor.
    displacement_points = min(
        10.0, (ground_displacement_mm_per_month / 40.0) * 10.0
    )

    # ---- Add all factors together to get the final score ------------------
    total_score = (
        rainfall_points
        + soil_points
        + slope_points
        + creep_points
        + displacement_points
    )
    total_score = _clamp_percent(total_score)

    # ---- Turn the number into a simple, human-readable risk category -----
    risk_level = _score_to_risk_level(total_score)

    return {
        "failure_probability_percent": round(total_score, 1),
        "risk_level": risk_level,
        "score_breakdown": {
            "rainfall_points": round(rainfall_points, 1),
            "soil_saturation_points": round(soil_points, 1),
            "slope_angle_points": round(slope_points, 1),
            "land_creep_points": round(creep_points, 1),
            "satellite_displacement_points": round(displacement_points, 1),
        },
    }


def _score_to_risk_level(score: float) -> str:
    """
    WHAT: Converts a 0-100 number into one of three plain-English labels.
    WHY:  Field officers and villagers need a quick label ("Critical"),
          not a raw percentage, to make fast decisions.
    """
    if score >= 70:
        return "critical"
    if score >= 40:
        return "moderate"
    return "safe"


def calculate_short_and_long_term_risk(
    rainfall_last_24h_mm: float,
    rainfall_next_6h_forecast_mm: float,
    soil_saturation_percent: float,
    slope_angle_degrees: float,
    land_creep_rate_mm_per_day: float,
    ground_displacement_mm_per_month: float,
) -> dict:
    """
    WHAT: Produces TWO risk scores: one for the next 6 hours, and one
          for the next 24 hours.
    WHY:  A 6-hour score helps with immediate evacuation decisions,
          while a 24-hour score helps plan road closures and relief
          logistics further ahead.

    HOW: The 6-hour score leans more heavily on the rainfall FORECAST
         (what's about to fall), while the 24-hour score leans more on
         rainfall that has ALREADY fallen (which has already soaked
         into the soil).
    """
    # 6-hour outlook: blend already-fallen rain with the short forecast,
    # since rain that is about to fall matters most for the next few hours.
    six_hour_rainfall_estimate = (rainfall_last_24h_mm * 0.4) + (
        rainfall_next_6h_forecast_mm * 1.2
    )

    six_hour_risk = calculate_landslide_risk(
        rainfall_last_24h_mm=six_hour_rainfall_estimate,
        soil_saturation_percent=soil_saturation_percent,
        slope_angle_degrees=slope_angle_degrees,
        land_creep_rate_mm_per_day=land_creep_rate_mm_per_day,
        ground_displacement_mm_per_month=ground_displacement_mm_per_month,
    )

    # 24-hour outlook: uses the full day's rainfall as-is, since that
    # water has already had time to soak into the slope.
    twenty_four_hour_risk = calculate_landslide_risk(
        rainfall_last_24h_mm=rainfall_last_24h_mm,
        soil_saturation_percent=soil_saturation_percent,
        slope_angle_degrees=slope_angle_degrees,
        land_creep_rate_mm_per_day=land_creep_rate_mm_per_day,
        ground_displacement_mm_per_month=ground_displacement_mm_per_month,
    )

    return {
        "six_hour_forecast": six_hour_risk,
        "twenty_four_hour_forecast": twenty_four_hour_risk,
    }


def calculate_regional_global_risk_score(all_site_scores: list) -> dict:
    """
    WHAT: Combines the risk scores of every monitored site in NER into
          ONE overall "Regional Global Risk Score" for the header badge.
    WHY:  Officials at a control-room level want a single glance-able
          number that answers "how bad is today across the WHOLE
          region?", not 12 separate numbers.

    HOW: We take the average of all site scores, but give extra weight
         to the single highest-risk site, because one critical site
         failing can be a regional emergency even if everywhere else
         is calm.
    """
    if not all_site_scores:
        return {"regional_score_percent": 0.0, "risk_level": "safe"}

    average_score = sum(all_site_scores) / len(all_site_scores)
    highest_score = max(all_site_scores)

    # Weighted blend: 60% average conditions, 40% worst-case site.
    regional_score = _clamp_percent((average_score * 0.6) + (highest_score * 0.4))

    return {
        "regional_score_percent": round(regional_score, 1),
        "risk_level": _score_to_risk_level(regional_score),
    }
