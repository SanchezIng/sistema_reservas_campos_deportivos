/*
  # Initial Schema for Sports Facility Reservation System

  1. New Tables
    - `users`
      - Extended user profile data
    - `facilities`
      - Sports facilities information
    - `reservations`
      - Booking records
    - `facility_schedules`
      - Regular operating hours
    - `maintenance_schedules`
      - Facility maintenance periods

  2. Security
    - Enable RLS on all tables
    - Add policies for data access control
*/

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  full_name text NOT NULL,
  phone text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Facilities table
CREATE TABLE facilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('soccer', 'basketball', 'volleyball', 'swimming')),
  surface text CHECK (surface IN ('grass', 'concrete')),
  description text,
  price_per_hour decimal NOT NULL,
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Reservations table
CREATE TABLE reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  status text NOT NULL CHECK (status IN ('pending', 'confirmed', 'cancelled')),
  total_price decimal NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Facility operating hours
CREATE TABLE facility_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time time NOT NULL,
  close_time time NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_schedule_time CHECK (close_time > open_time)
);

-- Maintenance schedules
CREATE TABLE maintenance_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id uuid REFERENCES facilities(id) NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_maintenance_time CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE facilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_schedules ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Facilities policies
CREATE POLICY "Anyone can view facilities"
  ON facilities FOR SELECT
  TO anon, authenticated
  USING (true);

-- Reservations policies
CREATE POLICY "Users can view own reservations"
  ON reservations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create reservations"
  ON reservations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reservations"
  ON reservations FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Facility schedules policies
CREATE POLICY "Anyone can view facility schedules"
  ON facility_schedules FOR SELECT
  TO anon, authenticated
  USING (true);

-- Maintenance schedules policies
CREATE POLICY "Anyone can view maintenance schedules"
  ON maintenance_schedules FOR SELECT
  TO anon, authenticated
  USING (true);

-- Functions

-- Function to check if a facility is available for a given time slot
CREATE OR REPLACE FUNCTION is_facility_available(
  facility_id uuid,
  check_start_time timestamptz,
  check_end_time timestamptz
) RETURNS boolean AS $$
BEGIN
  -- Check for existing reservations
  IF EXISTS (
    SELECT 1 FROM reservations
    WHERE facility_id = $1
    AND status = 'confirmed'
    AND (
      (start_time, end_time) OVERLAPS
      (check_start_time, check_end_time)
    )
  ) THEN
    RETURN false;
  END IF;

  -- Check for maintenance
  IF EXISTS (
    SELECT 1 FROM maintenance_schedules
    WHERE facility_id = $1
    AND (
      (start_time, end_time) OVERLAPS
      (check_start_time, check_end_time)
    )
  ) THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$ LANGUAGE plpgsql;