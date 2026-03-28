import "dotenv/config";
import cors from "cors";
import express from "express";

const app = express();
const port = Number(process.env.PORT || 3001);
const USER_AGENT = "FlyLine/1.0 (local development)";
const REQUEST_TIMEOUT_MS = 4500;
const geocodeCache = new Map();

app.use(cors());
app.use(express.json());

const airportLookup = {
  ATL: "Hartsfield-Jackson Atlanta International Airport, Atlanta, GA",
  DFW: "Dallas Fort Worth International Airport, Dallas, TX",
  JFK: "John F. Kennedy International Airport, New York, NY",
  LAX: "Los Angeles International Airport, Los Angeles, CA",
  MIA: "Miami International Airport, Miami, FL",
  ORD: "O'Hare International Airport, Chicago, IL",
};

const fallbackLocations = [
  {
    aliases: ["jfk", "jfk airport", "john f kennedy international airport", "john f. kennedy international airport"],
    label: "John F. Kennedy International Airport, New York, NY",
    latitude: 40.6413,
    longitude: -73.7781,
    kind: "airport",
  },
  {
    aliases: ["lga", "laguardia", "laguardia airport"],
    label: "LaGuardia Airport, Queens, NY",
    latitude: 40.7769,
    longitude: -73.874,
    kind: "airport",
  },
  {
    aliases: ["ewr", "newark airport", "newark liberty international airport"],
    label: "Newark Liberty International Airport, Newark, NJ",
    latitude: 40.6895,
    longitude: -74.1745,
    kind: "airport",
  },
  {
    aliases: ["atl", "atl airport", "hartsfield jackson atlanta international airport"],
    label: "Hartsfield-Jackson Atlanta International Airport, Atlanta, GA",
    latitude: 33.6407,
    longitude: -84.4277,
    kind: "airport",
  },
  {
    aliases: ["lax", "lax airport", "los angeles international airport"],
    label: "Los Angeles International Airport, Los Angeles, CA",
    latitude: 33.9425,
    longitude: -118.4081,
    kind: "airport",
  },
  {
    aliases: ["ord", "ord airport", "ohare", "o hare international airport"],
    label: "O'Hare International Airport, Chicago, IL",
    latitude: 41.9742,
    longitude: -87.9073,
    kind: "airport",
  },
  {
    aliases: ["dfw", "dfw airport", "dallas fort worth international airport"],
    label: "Dallas Fort Worth International Airport, Dallas, TX",
    latitude: 32.8998,
    longitude: -97.0403,
    kind: "airport",
  },
  {
    aliases: ["mia", "mia airport", "miami international airport"],
    label: "Miami International Airport, Miami, FL",
    latitude: 25.7959,
    longitude: -80.287,
    kind: "airport",
  },
  {
    aliases: ["times square", "times square manhattan", "times square nyc"],
    label: "Times Square, Manhattan, New York, NY",
    latitude: 40.758,
    longitude: -73.9855,
    kind: "place",
  },
  {
    aliases: [
      "55 park place northeast atlanta ga",
      "55 park place northeast atlanta georgia",
      "55 park place ne atlanta ga",
      "55 park place atlanta ga",
      "55 park place 55 park place northeast five points atlanta fulton county georgia 30303 united states",
      "55 park place 55 park place northeast atlanta fulton county georgia 30303 united states",
      "55 park place 55 park place northeast five points atlanta georgia 30303 united states",
    ],
    label: "55 Park Place Northeast, Atlanta, GA 30303, United States",
    latitude: 33.7554,
    longitude: -84.3875,
    kind: "place",
  },
  {
    aliases: ["queens", "queens ny", "queens new york"],
    label: "Queens, New York, NY",
    latitude: 40.7282,
    longitude: -73.7949,
    kind: "place",
  },
  {
    aliases: ["brooklyn", "brooklyn ny", "brooklyn new york"],
    label: "Brooklyn, New York, NY",
    latitude: 40.6782,
    longitude: -73.9442,
    kind: "place",
  },
  {
    aliases: ["manhattan", "manhattan ny", "manhattan new york"],
    label: "Manhattan, New York, NY",
    latitude: 40.7831,
    longitude: -73.9712,
    kind: "place",
  },
  {
    aliases: ["bronx", "bronx ny", "bronx new york"],
    label: "Bronx, New York, NY",
    latitude: 40.8448,
    longitude: -73.8648,
    kind: "place",
  },
  {
    aliases: ["staten island", "staten island ny"],
    label: "Staten Island, New York, NY",
    latitude: 40.5795,
    longitude: -74.1502,
    kind: "place",
  },
];

function createError(message, status = 500) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function normalizeQuery(query) {
  return query.toLowerCase().replace(/[^\w\s]/g, " ").replace(/\s+/g, " ").trim();
}

function buildCacheKey(query, limit, airportOnly = false) {
  return `${normalizeQuery(query)}::${limit}::${airportOnly ? "airport" : "any"}`;
}

function buildSearchQueries(query, airportOnly = false) {
  const normalizedQuery = airportLookup[query.toUpperCase()] || query;
  const candidates = [
    normalizedQuery,
    `${normalizedQuery}, New York, NY`,
    `${normalizedQuery}, United States`,
  ];

  if (airportOnly) {
    candidates.unshift(`${normalizedQuery} airport, United States`);
    candidates.unshift(`${normalizedQuery} international airport, United States`);
  }

  return [...new Set(candidates.map((item) => item.trim()).filter(Boolean))];
}

function queryLooksLikeStreetAddress(query) {
  return /\d/.test(query) && /\b(st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive|pl|place|ln|lane|ct|court|way|pkwy|parkway)\b/i.test(query);
}

function queryLooksLikeAirport(query) {
  return /\b(airport|international|terminal|iata|airfield|aerodrome)\b/i.test(query) || !!airportLookup[query.toUpperCase()];
}

function parseUsAddress(query) {
  const parts = query.split(",").map((part) => part.trim()).filter(Boolean);

  if (parts.length < 2) {
    return null;
  }

  const street = parts[0];
  const city = parts[1] || "";
  const stateZipPart = parts[2] || "";
  const stateMatch = stateZipPart.match(/\b([A-Z]{2})\b/i);
  const postalMatch = stateZipPart.match(/\b\d{5}(?:-\d{4})?\b/);

  if (!street || !city) {
    return null;
  }

  return {
    street,
    city,
    state: stateMatch ? stateMatch[1].toUpperCase() : "",
    postalcode: postalMatch ? postalMatch[0] : "",
    country: "United States",
  };
}

function dedupeLocations(results) {
  const seen = new Set();

  return results.filter((result) => {
    const key = `${result.label}|${result.latitude.toFixed(4)}|${result.longitude.toFixed(4)}`;

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

async function requestJson(url, headers = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if (!response.ok) {
      throw createError(`Lookup failed with status ${response.status}`, 502);
    }

    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

function findFallbackMatches(query, limit = 5, airportOnly = false) {
  const normalized = normalizeQuery(query);

  if (!normalized) {
    return [];
  }

  return fallbackLocations
    .filter((location) => !airportOnly || location.kind === "airport")
    .filter((location) =>
      location.aliases.some((alias) => alias.includes(normalized) || normalized.includes(alias)),
    )
    .slice(0, limit)
    .map((location) => ({
      label: location.label,
      latitude: location.latitude,
      longitude: location.longitude,
    }));
}

async function searchLocations(query, limit = 5, airportOnly = false) {
  const cacheKey = buildCacheKey(query, limit, airportOnly);

  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey);
  }

  const fallbackMatches = findFallbackMatches(query, limit, airportOnly);
  if (fallbackMatches.length) {
    geocodeCache.set(cacheKey, fallbackMatches);
    return fallbackMatches;
  }

  const collectedResults = [];

  if (!airportOnly && queryLooksLikeStreetAddress(query)) {
    const structuredAddress = parseUsAddress(query);

    if (structuredAddress) {
      const structuredParams = new URLSearchParams({
        format: "jsonv2",
        addressdetails: "1",
        limit: String(limit),
        countrycodes: "us",
      });

      Object.entries(structuredAddress).forEach(([key, value]) => {
        if (value) {
          structuredParams.set(key, value);
        }
      });

      try {
        const structuredResults = await requestJson(
          `https://nominatim.openstreetmap.org/search?${structuredParams}`,
          {
            "User-Agent": USER_AGENT,
            Accept: "application/json",
          },
        );

        collectedResults.push(
          ...structuredResults.map((result) => ({
            label: result.display_name,
            latitude: Number(result.lat),
            longitude: Number(result.lon),
            kind: "place",
          })),
        );
      } catch {
        // Fall through to generic search providers.
      }
    }
  }

  for (const candidate of buildSearchQueries(query, airportOnly)) {
    const nominatimParams = new URLSearchParams({
      q: candidate,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(limit),
      countrycodes: "us",
    });

    try {
      const nominatimResults = await requestJson(
        `https://nominatim.openstreetmap.org/search?${nominatimParams}`,
        {
          "User-Agent": USER_AGENT,
          Accept: "application/json",
        },
      );

      collectedResults.push(
        ...nominatimResults.map((result) => ({
          label: result.display_name,
          latitude: Number(result.lat),
          longitude: Number(result.lon),
          kind:
            String(result.type || "").includes("aerodrome") ||
            String(result.display_name || "").toLowerCase().includes("airport")
              ? "airport"
              : "place",
        })),
      );
    } catch {
      // Continue to the alternate provider.
    }

    if (collectedResults.length >= limit) {
      break;
    }

    const photonParams = new URLSearchParams({
      q: candidate,
      limit: String(limit),
    });

    try {
      const photonResults = await requestJson(`https://photon.komoot.io/api/?${photonParams}`, {
        "User-Agent": USER_AGENT,
        Accept: "application/json",
      });

      collectedResults.push(
        ...(photonResults.features || []).map((feature) => {
          const [longitude, latitude] = feature.geometry.coordinates;
          const nameParts = [
            feature.properties.name,
            feature.properties.city,
            feature.properties.state,
            feature.properties.country,
          ].filter(Boolean);

          return {
            label: nameParts.join(", "),
            latitude: Number(latitude),
            longitude: Number(longitude),
            kind: String(feature.properties.osm_value || "").includes("aerodrome") ? "airport" : "place",
          };
        }),
      );
    } catch {
      // Try the next candidate.
    }

    if (collectedResults.length >= limit) {
      break;
    }
  }

  let filteredResults = airportOnly
    ? collectedResults.filter(
        (result) => result.kind === "airport" || result.label.toLowerCase().includes("airport"),
      )
    : collectedResults;

  if (!airportOnly && !queryLooksLikeAirport(query)) {
    const nonAirportResults = filteredResults.filter(
      (result) => !result.label.toLowerCase().includes("airport"),
    );

    if (nonAirportResults.length) {
      filteredResults = nonAirportResults;
    }
  }

  if (!airportOnly && queryLooksLikeStreetAddress(query)) {
    const addressLikeResults = filteredResults.filter((result) => /\d/.test(result.label));

    if (addressLikeResults.length) {
      filteredResults = addressLikeResults;
    }
  }

  const dedupedResults = dedupeLocations(filteredResults)
    .map(({ label, latitude, longitude }) => ({
      label,
      latitude,
      longitude,
    }))
    .slice(0, limit);

  if (!dedupedResults.length) {
    throw createError(`Failed to geocode "${query}"`, 404);
  }

  geocodeCache.set(cacheKey, dedupedResults);
  return dedupedResults;
}

async function geocodeLocation(query, airportOnly = false) {
  const fallbackMatch = findFallbackMatches(query, 1, airportOnly)[0];

  if (fallbackMatch) {
    return {
      query,
      label: fallbackMatch.label,
      latitude: fallbackMatch.latitude,
      longitude: fallbackMatch.longitude,
    };
  }

  for (const candidate of buildSearchQueries(query, airportOnly)) {
    const results = await searchLocations(candidate, 1, airportOnly);
    const result = results[0];

    if (result) {
      return {
        query,
        label: result.label,
        latitude: result.latitude,
        longitude: result.longitude,
      };
    }
  }

  throw createError(`Failed to geocode "${query}"`, 404);
}

function haversineDistanceMeters(start, end) {
  const earthRadiusMeters = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const deltaLatitude = toRadians(end.latitude - start.latitude);
  const deltaLongitude = toRadians(end.longitude - start.longitude);
  const startLatitudeRadians = toRadians(start.latitude);
  const endLatitudeRadians = toRadians(end.latitude);

  const a =
    Math.sin(deltaLatitude / 2) * Math.sin(deltaLatitude / 2) +
    Math.cos(startLatitudeRadians) *
      Math.cos(endLatitudeRadians) *
      Math.sin(deltaLongitude / 2) *
      Math.sin(deltaLongitude / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMeters * c;
}

async function snapToNearestRoad(point) {
  const params = new URLSearchParams({
    number: "1",
  });

  try {
    const payload = await requestJson(
      `https://router.project-osrm.org/nearest/v1/driving/${point.longitude},${point.latitude}?${params}`,
      {
        Accept: "application/json",
      },
    );

    const waypoint = payload.waypoints?.[0];

    if (!waypoint?.location) {
      return point;
    }

    return {
      ...point,
      longitude: Number(waypoint.location[0]),
      latitude: Number(waypoint.location[1]),
    };
  } catch {
    return point;
  }
}

function buildFallbackRoute(origin, destination) {
  const straightLineDistance = haversineDistanceMeters(origin, destination);
  const bufferedDistance = straightLineDistance * 1.2;
  const averageMetersPerSecond = 17.88;

  return {
    distanceMeters: bufferedDistance,
    durationSeconds: bufferedDistance / averageMetersPerSecond,
    geometry: {
      type: "LineString",
      coordinates: [
        [origin.longitude, origin.latitude],
        [destination.longitude, destination.latitude],
      ],
    },
    steps: [
      {
        name: "Approximate route",
        instruction: "Head toward the airport",
        distanceMeters: bufferedDistance,
        durationSeconds: bufferedDistance / averageMetersPerSecond,
      },
    ],
  };
}

async function fetchDrivingRoute(origin, destination) {
  const snappedOrigin = await snapToNearestRoad(origin);
  const snappedDestination = await snapToNearestRoad(destination);
  const coords = `${snappedOrigin.longitude},${snappedOrigin.latitude};${snappedDestination.longitude},${snappedDestination.latitude}`;
  const params = new URLSearchParams({
    overview: "full",
    geometries: "geojson",
    steps: "true",
  });

  let payload;

  try {
    payload = await requestJson(`https://router.project-osrm.org/route/v1/driving/${coords}?${params}`, {
      Accept: "application/json",
    });
  } catch {
    return buildFallbackRoute(snappedOrigin, snappedDestination);
  }

  const route = payload.routes?.[0];

  if (!route) {
    return buildFallbackRoute(snappedOrigin, snappedDestination);
  }

  const distanceMeters = Number(route.distance);
  const durationSeconds = Number(route.duration);
  const geometry = route.geometry;

  if (!Number.isFinite(distanceMeters) || !Number.isFinite(durationSeconds) || !geometry?.coordinates?.length) {
    return buildFallbackRoute(snappedOrigin, snappedDestination);
  }

  return {
    distanceMeters,
    durationSeconds,
    geometry,
    steps:
      route.legs?.flatMap((leg) =>
        leg.steps.map((step) => ({
          name: step.name,
          instruction: step.maneuver?.instruction || step.name,
          distanceMeters: step.distance,
          durationSeconds: step.duration,
        })),
      ) || [],
  };
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.get("/api/maps/search", async (req, res) => {
  try {
    const query = String(req.query.q || "").trim();
    const airportOnly = String(req.query.kind || "").trim() === "airport";

    if (query.length < 2) {
      res.json({ results: [] });
      return;
    }

    const results = await searchLocations(query, 6, airportOnly);
    res.json({ results });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Unexpected map service error",
    });
  }
});

app.get("/api/maps/route", async (req, res) => {
  try {
    const originQuery = String(req.query.origin || "").trim();
    const destinationQuery = String(req.query.destination || "").trim();

    if (!originQuery || !destinationQuery) {
      throw createError('Both "origin" and "destination" query params are required', 400);
    }

    const [origin, destination] = await Promise.all([
      geocodeLocation(originQuery, false),
      geocodeLocation(destinationQuery, true),
    ]);

    const route = await fetchDrivingRoute(origin, destination);

    res.json({
      origin,
      destination,
      route,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      error: error.message || "Unexpected map service error",
    });
  }
});

app.listen(port, () => {
  console.log(`FlyLine backend listening on http://localhost:${port}`);
});
