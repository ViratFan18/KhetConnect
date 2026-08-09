-- KhetConnect Database Schema (PostgreSQL + PostGIS)
-- Run this in Neon.tech SQL editor for production

CREATE EXTENSION IF NOT EXISTS postgis;

-- For H2 dev mode, tables are auto-created by JPA

CREATE TYPE user_role AS ENUM ('FARMER', 'LABOURER', 'ADMIN');
CREATE TYPE job_status AS ENUM ('OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE application_status AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  phone VARCHAR(15) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL,
  language_pref VARCHAR(5) DEFAULT 'te',
  fcm_token TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  rating_avg DECIMAL(3,2) DEFAULT 0.00,
  rating_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE farmer_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  village VARCHAR(100),
  land_acres DECIMAL(6,2),
  total_jobs_posted INT DEFAULT 0
);

CREATE TABLE labourer_profiles (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  skills TEXT,
  daily_wage_expected INT DEFAULT 0,
  total_jobs_done INT DEFAULT 0
);

CREATE TABLE jobs (
  id BIGSERIAL PRIMARY KEY,
  farmer_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  work_type VARCHAR(100),
  crop_type VARCHAR(100),
  wage_per_day INT NOT NULL,
  workers_needed INT DEFAULT 1,
  work_date DATE NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  village VARCHAR(100),
  status job_status DEFAULT 'OPEN',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE job_applications (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT REFERENCES jobs(id) ON DELETE CASCADE,
  labourer_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  status application_status DEFAULT 'PENDING',
  applied_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(job_id, labourer_id)
);

CREATE TABLE ratings (
  id BIGSERIAL PRIMARY KEY,
  rater_id BIGINT REFERENCES users(id),
  ratee_id BIGINT REFERENCES users(id),
  job_id BIGINT REFERENCES jobs(id),
  stars INT CHECK (stars BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(rater_id, job_id)
);

CREATE TABLE notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200),
  body TEXT,
  type VARCHAR(50),
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_farmer ON jobs(farmer_id);
CREATE INDEX idx_applications_job ON job_applications(job_id);
