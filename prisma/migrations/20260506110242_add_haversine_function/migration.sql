-- Custom SQL: distance haversine en kilometres entre deux points (lat/lng en degres).
CREATE OR REPLACE FUNCTION haversine_km(lat1 FLOAT, lng1 FLOAT, lat2 FLOAT, lng2 FLOAT)
RETURNS FLOAT AS $$
  SELECT 6371 * 2 * ASIN(SQRT(
    POWER(SIN(RADIANS(lat2 - lat1) / 2), 2) +
    COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
    POWER(SIN(RADIANS(lng2 - lng1) / 2), 2)
  ));
$$ LANGUAGE SQL IMMUTABLE;
