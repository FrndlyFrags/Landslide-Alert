"""
-----------------------------------------------------------------------
cv_crack.py
-----------------------------------------------------------------------
WHAT THIS FILE DOES (in plain English):
When a field officer or citizen uploads a photo of a crack in the road
or hillside, this file pretends to run "Computer Vision" (an AI that
looks at images) to find the crack, measure how wide it is, and decide
how much it should increase the danger score for that location.

WHY WE MOCK THIS:
Building and training a real crack-detection AI model requires
thousands of labeled photos and a GPU. Since we don't have that
training data connected right now, this file generates a believable,
randomized result instead -- including a fake "bounding box" (the
rectangle drawn around the crack in the photo) -- so the rest of the
app (the upload form, the risk multiplier, the dashboard) can be built
and demoed end-to-end. A real engineer can later swap this out for an
actual trained model (e.g. a YOLO or similar object-detection model)
without changing how the rest of the app calls it.
-----------------------------------------------------------------------
"""

import random


def analyze_crack_photo(image_filename: str) -> dict:
    """
    WHAT: Pretends to run computer vision on an uploaded photo to find
          and measure a ground/slope crack.
    WHY:  Cracks widening over time are a strong visible warning sign
          of a coming landslide. This turns "someone snapped a photo"
          into a usable number for the risk engine.

    RETURNS: A dictionary containing:
      - whether a crack was detected
      - the bounding box (the rectangle drawn around the crack, given
        as percentages of the image width/height so the frontend can
        draw it on top of any photo size)
      - the estimated crack width in centimetres
      - a risk multiplier the main risk score should be multiplied by
    """

    # In a real system we would load the actual image file here and run
    # it through a trained model. For this mock, we simply simulate a
    # believable detection result every time a photo is analyzed.
    crack_detected = True

    # A bounding box marks WHERE the crack is in the photo, expressed as
    # percentages (0-100) of the image's width and height. This lets the
    # frontend draw the box correctly no matter what size the photo is.
    bounding_box_percent = {
        "x": round(random.uniform(15, 55), 1),
        "y": round(random.uniform(20, 60), 1),
        "width": round(random.uniform(20, 45), 1),
        "height": round(random.uniform(10, 30), 1),
    }

    # Estimate how wide the crack is in real life, in centimetres.
    estimated_crack_width_cm = round(random.uniform(1.5, 18.0), 1)

    # The wider the crack, the more we multiply the base risk score by,
    # to reflect that visible surface cracking is a serious warning sign.
    if estimated_crack_width_cm >= 10:
        risk_multiplier = 1.4
        severity_label = "severe"
    elif estimated_crack_width_cm >= 5:
        risk_multiplier = 1.2
        severity_label = "moderate"
    else:
        risk_multiplier = 1.05
        severity_label = "minor"

    return {
        "image_filename": image_filename,
        "crack_detected": crack_detected,
        "bounding_box_percent": bounding_box_percent,
        "estimated_crack_width_cm": estimated_crack_width_cm,
        "severity_label": severity_label,
        "risk_multiplier": risk_multiplier,
        "analysis_source": "Computer Vision Crack Analyzer (mock model)",
    }
