"""
-----------------------------------------------------------------------
telemetry.py
-----------------------------------------------------------------------
WHAT THIS FILE DOES (in plain English):
This file pretends to be the "data collectors" for our platform.

In a real system, this file would call:
  - The India Meteorological Department (IMD) weather API for rainfall data
  - Physical IoT sensors buried in the soil across NER hillsides that
    measure moisture, tilt and vibration
  - Satellite radar (Sentinel-1) that measures how much the ground has
    physically shifted (displacement)

Because we don't have real hardware or paid API keys connected right
now, this file generates realistic, randomized MOCK (fake but believable)
data instead, so the rest of the app can be built and tested normally.
Later, a real engineer can swap the mock functions below for real API
calls without changing anything else in the project.
-----------------------------------------------------------------------
"""

import random
from datetime import datetime, timedelta


# -----------------------------------------------------------------------
# STATIC REFERENCE DATA
# -----------------------------------------------------------------------
# These are real, fixed locations across the North Eastern Region (NER)
# that are historically known to be landslide-prone. We use these as the
# "monitoring sites" throughout the whole platform (map pins, lists, etc).
# -----------------------------------------------------------------------

NER_MONITORING_SITES = [
    {
        "site_id": "NER-001",
        "name": "Sonapur, East Khasi Hills",
        "state": "Meghalaya",
        "corridor": "Shillong Plateau",
        "latitude": 25.5138,
        "longitude": 91.9899,
        "elevation_m": 1420,
    },
    {
        "site_id": "NER-002",
        "name": "Mawkyrwat Road Section",
        "state": "Meghalaya",
        "corridor": "Shillong Plateau",
        "latitude": 25.3167,
        "longitude": 91.3167,
        "elevation_m": 1180,
    },
    {
        "site_id": "NER-003",
        "name": "NH-10 near Rangpo",
        "state": "Sikkim",
        "corridor": "NH-10 Sikkim",
        "latitude": 27.1749,
        "longitude": 88.5326,
        "elevation_m": 950,
    },
    {
        "site_id": "NER-004",
        "name": "NH-10 near Kalimpong Bypass",
        "state": "Sikkim",
        "corridor": "NH-10 Sikkim",
        "latitude": 27.0710,
        "longitude": 88.4700,
        "elevation_m": 1250,
    },
    {
        "site_id": "NER-005",
        "name": "Lumding Hill Section",
        "state": "Assam",
        "corridor": "Silchar-Lumding Route",
        "latitude": 25.7461,
        "longitude": 93.1706,
        "elevation_m": 680,
    },
    {
        "site_id": "NER-006",
        "name": "Silchar-Haflong Rail Corridor",
        "state": "Assam",
        "corridor": "Silchar-Lumding Route",
        "latitude": 24.8333,
        "longitude": 92.9833,
        "elevation_m": 540,
    },
    {
        "site_id": "NER-007",
        "name": "Noney District Bridge Zone",
        "state": "Manipur",
        "corridor": "Imphal-Jiribam Route",
        "latitude": 24.7833,
        "longitude": 93.7500,
        "elevation_m": 1050,
    },
    {
        "site_id": "NER-008",
        "name": "Kohima-Dimapur Road",
        "state": "Nagaland",
        "corridor": "NH-29 Nagaland",
        "latitude": 25.7500,
        "longitude": 94.0500,
        "elevation_m": 1320,
    },
    {
        "site_id": "NER-009",
        "name": "Aizawl Outer Ring Road",
        "state": "Mizoram",
        "corridor": "Aizawl Hill Corridor",
        "latitude": 23.7271,
        "longitude": 92.7176,
        "elevation_m": 1150,
    },
    {
        "site_id": "NER-010",
        "name": "Atharamura Range",
        "state": "Tripura",
        "corridor": "Agartala-Ambassa Route",
        "latitude": 23.8833,
        "longitude": 91.6167,
        "elevation_m": 420,
    },
    {
        "site_id": "NER-011",
        "name": "Bomdila-Tawang Highway",
        "state": "Arunachal Pradesh",
        "corridor": "Tawang Approach Road",
        "latitude": 27.2645,
        "longitude": 92.4159,
        "elevation_m": 2200,
    },
    {
        "site_id": "NER-012",
        "name": "Along-Pasighat Stretch",
        "state": "Arunachal Pradesh",
        "corridor": "Siang Valley Road",
        "latitude": 28.1500,
        "longitude": 95.3333,
        "elevation_m": 310,
    },
]


def _random_in_range(low: float, high: float) -> float:
    """
    WHAT: A tiny helper that picks a random decimal number between two
          values and rounds it to 2 decimal places.
    WHY:  We use this constantly below to fake realistic sensor readings
          (e.g. rainfall between 0mm and 220mm) instead of writing the
          same random.uniform(...) + round(...) code over and over.
    """
    return round(random.uniform(low, high), 2)


def get_live_weather_snapshot(site_id: str) -> dict:
    """
    WHAT: Pretends to fetch the current weather from the IMD (India
          Meteorological Department) for one monitoring site.
    WHY:  Rainfall is one of the biggest triggers of landslides in NER,
          so every risk calculation needs fresh rainfall numbers.

    In production, replace the code below with a real HTTP request to
    the IMD API using the site's latitude/longitude.
    """
    return {
        "site_id": site_id,
        "source": "IMD Weather API (mock)",
        "rainfall_last_24h_mm": _random_in_range(5, 220),
        "rainfall_next_6h_forecast_mm": _random_in_range(0, 90),
        "temperature_celsius": _random_in_range(14, 29),
        "humidity_percent": _random_in_range(55, 98),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


def get_soil_sensor_reading(site_id: str) -> dict:
    """
    WHAT: Pretends to fetch a reading from an IoT soil sensor buried at
          a monitoring site.
    WHY:  Wet, saturated soil is heavier and slides more easily. A
          sensor's job is to tell us how "full of water" the ground is,
          and how fast it is physically creeping downhill.

    In production, replace this with an MQTT subscription or a database
    query against the real sensor network (142 active nodes).
    """
    return {
        "site_id": site_id,
        "source": "IoT Soil Sensor Network (mock)",
        "soil_saturation_percent": _random_in_range(20, 99),
        "soil_moisture_trend": random.choice(["rising", "stable", "falling"]),
        "land_creep_rate_mm_per_day": _random_in_range(0.1, 12.0),
        "slope_angle_degrees": _random_in_range(18, 55),
        "vibration_index": _random_in_range(0.0, 5.0),
        "battery_percent": random.randint(40, 100),
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }


def get_satellite_displacement(site_id: str) -> dict:
    """
    WHAT: Pretends to fetch ground-shift data from the Sentinel-1 radar
          satellite feed for a monitoring site.
    WHY:  Satellites can detect the ground physically moving by just a
          few millimetres, which is often the earliest warning sign of
          a landslide, long before it's visible to the human eye.
    """
    return {
        "site_id": site_id,
        "source": "Sentinel-1 Radar Feed (mock)",
        "ground_displacement_mm_per_month": _random_in_range(0.0, 45.0),
        "last_satellite_pass": (
            datetime.utcnow() - timedelta(hours=random.randint(1, 48))
        ).isoformat()
        + "Z",
    }


def get_active_sensor_node_count() -> int:
    """
    WHAT: Returns how many IoT sensor nodes are currently reporting data.
    WHY:  Shown as a "live" badge in the dashboard header so field teams
          know the monitoring network is healthy.
    """
    return 142


def get_all_monitoring_sites() -> list:
    """
    WHAT: Returns the full static list of NER monitoring sites.
    WHY:  Used by the API and the frontend map to know WHERE to draw
          pins and WHICH locations to run risk calculations for.
    """
    return NER_MONITORING_SITES
