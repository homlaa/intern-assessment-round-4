-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS generated_profile CASCADE;
DROP TABLE IF EXISTS personal_information CASCADE;

-- Create personal_information table
CREATE TABLE IF NOT EXISTS personal_information (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    birthdate DATE NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_personal_information_updated_at
BEFORE UPDATE ON personal_information
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create generated_profile table
CREATE TABLE IF NOT EXISTS generated_profile (
    id SERIAL PRIMARY KEY,
    personal_id INTEGER NOT NULL,
    email VARCHAR(100) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    country VARCHAR(100) NOT NULL,
    city VARCHAR(100) NOT NULL,
    profile_picture TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_personal
        FOREIGN KEY (personal_id) 
        REFERENCES personal_information(id) 
        ON DELETE CASCADE,
    CONSTRAINT unique_personal UNIQUE (personal_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_personal_name 
ON personal_information (first_name, last_name);

CREATE INDEX IF NOT EXISTS idx_profile_personal 
ON generated_profile (personal_id);

CREATE INDEX IF NOT EXISTS idx_profile_email 
ON generated_profile (email);

-- Example JOIN query that fetches registrant with their generated profile
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.birthdate,
    p.note,
    g.email,
    g.phone,
    g.country,
    g.city,
    g.profile_picture,
    p.created_at
FROM personal_information p
JOIN generated_profile g ON p.id = g.personal_id
ORDER BY p.created_at DESC;

-- Query to verify the JOIN works for a specific user
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.birthdate,
    p.note,
    g.email,
    g.phone,
    g.country,
    g.city,
    g.profile_picture,
    p.created_at
FROM personal_information p
JOIN generated_profile g ON p.id = g.personal_id
WHERE p.id = 1;