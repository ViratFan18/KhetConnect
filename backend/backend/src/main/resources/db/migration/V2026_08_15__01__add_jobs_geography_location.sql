-- PostgreSQL/PostGIS migration: add geography-backed location column and GiST index
CREATE EXTENSION IF NOT EXISTS postgis;

ALTER TABLE jobs
    ADD COLUMN IF NOT EXISTS location geography(Point, 4326);

UPDATE jobs
SET location = ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
WHERE latitude IS NOT NULL
  AND longitude IS NOT NULL
  AND location IS NULL;

CREATE INDEX IF NOT EXISTS idx_jobs_location_geography
    ON jobs USING GIST (location);

-- Optional: keep the legacy lat/lng columns for app and H2 fallback compatibility.
-- The application still returns distance from the same latitude/longitude fields.
