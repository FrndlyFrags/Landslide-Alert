// -----------------------------------------------------------------------
// safetyData.js
// -----------------------------------------------------------------------
// WHAT THIS FILE DOES (in plain English):
// Holds two things every "what do we do now" feature needs:
//   1. SAFE_ZONES - primary AND secondary nearby safe destinations for
//      each site, used when calculating multiple real driving escape routes.
//      Each entry is an array; index 0 is primary, index 1 is secondary.
//   2. LANDSLIDE_SAFETY_STRATEGY - standard disaster preparedness guidance
//      (NDMA / USGS / Red Cross style) for before, during, and after.
//
// NOTE FOR ENGINEERS: Replace SAFE_ZONES with officially designated relief
// camps / evacuation centers from the local DDMA in production. These demo
// coordinates are well-known town centers / hospitals for each site.
// -----------------------------------------------------------------------

export const SAFE_ZONES = {
  "NER-001": [
    { name: "Shillong Civil Hospital Relief Point", lat: 25.5744, lng: 91.8789 },
    { name: "Nongpoh Town Center", lat: 25.9109, lng: 91.8671 },
  ],
  "NER-002": [
    { name: "Nongstoin Town Center", lat: 25.5167, lng: 91.2667 },
    { name: "Mairang Relief Camp", lat: 25.5574, lng: 91.6540 },
  ],
  "NER-003": [
    { name: "Singtam Relief Camp", lat: 27.2333, lng: 88.4833 },
    { name: "Rangpo Town Center", lat: 27.1736, lng: 88.5323 },
  ],
  "NER-004": [
    { name: "Kalimpong Town Center", lat: 27.0587, lng: 88.4726 },
    { name: "Teesta Bazaar Relief Point", lat: 27.0210, lng: 88.4504 },
  ],
  "NER-005": [
    { name: "Lumding Town Center", lat: 25.7500, lng: 93.1700 },
    { name: "Hojai Relief Camp", lat: 26.0051, lng: 92.8554 },
  ],
  "NER-006": [
    { name: "Haflong Town Center", lat: 25.1667, lng: 93.0167 },
    { name: "Silchar Medical College Relief", lat: 24.8081, lng: 92.7873 },
  ],
  "NER-007": [
    { name: "Tamenglong Relief Camp", lat: 24.9833, lng: 93.5000 },
    { name: "Jiribam Town Center", lat: 24.8000, lng: 93.1167 },
  ],
  "NER-008": [
    { name: "Dimapur Town Center", lat: 25.9091, lng: 93.7267 },
    { name: "Chumoukedima Relief Point", lat: 25.8800, lng: 93.7100 },
  ],
  "NER-009": [
    { name: "Aizawl Civil Hospital Relief Point", lat: 23.7307, lng: 92.7173 },
    { name: "Kolasib Town Center", lat: 24.2228, lng: 92.6797 },
  ],
  "NER-010": [
    { name: "Teliamura Town Center", lat: 23.8500, lng: 91.6000 },
    { name: "Agartala Medical College", lat: 23.8352, lng: 91.2798 },
  ],
  "NER-011": [
    { name: "Dirang Relief Camp", lat: 27.3567, lng: 92.2333 },
    { name: "Bomdila Town Center", lat: 27.2645, lng: 92.4159 },
  ],
  "NER-012": [
    { name: "Pasighat Town Center", lat: 28.0667, lng: 95.3167 },
    { name: "Along Relief Camp", lat: 28.1656, lng: 94.7951 },
  ],
};

// Primary safe zone for a site (for backward compatibility with single-route logic).
export function getPrimaryZone(siteId) {
  return SAFE_ZONES[siteId]?.[0] ?? null;
}

// Standard disaster-preparedness guidance for landslides,
// grouped into Before / During / After phases (NDMA / Red Cross style).
export const LANDSLIDE_SAFETY_STRATEGY = [
  {
    phase: "Before",
    points: [
      "Watch for warning signs: new cracks in walls or the ground, doors/windows that suddenly stick, tilting trees or utility poles, and new springs or damp ground.",
      "Know your area's evacuation routes and identify at least two ways out in case one is blocked.",
      "Keep a grab-bag ready with torch, ID documents, water, and any essential medicines.",
    ],
  },
  {
    phase: "During",
    points: [
      "Move quickly away from the path of the slide, toward higher ground and to the side, not straight downhill.",
      "Avoid river valleys, low-lying ground, and stream channels — debris and mud often follow these paths.",
      "If escape isn't possible, curl into a tight ball and protect your head.",
    ],
  },
  {
    phase: "After",
    points: [
      "Stay away from the slide area — further slope failure is common in the following hours.",
      "Report any damaged roads, rail lines, or utility poles to authorities immediately.",
      "Do not re-enter damaged buildings until a structural engineer or official has confirmed they're safe.",
    ],
  },
];
