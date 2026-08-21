const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// PostgreSQL connection pool
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'registration_db',
    port: process.env.DB_PORT || 5432,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test database connection
pool.connect((err, client, release) => {
    if (err) {
        console.error('❌ Error connecting to PostgreSQL:', err.stack);
    } else {
        console.log('✅ Connected to PostgreSQL database');
        release();
    }
});

// Initialize database tables
async function initializeDatabase() {
    const client = await pool.connect();
    try {
        // Create personal_information table
        await client.query(`
            CREATE TABLE IF NOT EXISTS personal_information (
                id SERIAL PRIMARY KEY,
                first_name VARCHAR(50) NOT NULL,
                last_name VARCHAR(50) NOT NULL,
                birthdate DATE NOT NULL,
                note TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('✅ Personal information table ready');

        // Create trigger for updated_at
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql';
        `);

        await client.query(`
            DROP TRIGGER IF EXISTS update_personal_information_updated_at ON personal_information;
            CREATE TRIGGER update_personal_information_updated_at
            BEFORE UPDATE ON personal_information
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create generated_profile table
        await client.query(`
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
            )
        `);
        console.log('✅ Generated profile table ready');

        // Create indexes for better performance
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_personal_name 
            ON personal_information (first_name, last_name);
            
            CREATE INDEX IF NOT EXISTS idx_profile_personal 
            ON generated_profile (personal_id);
            
            CREATE INDEX IF NOT EXISTS idx_profile_email 
            ON generated_profile (email);
        `);
        console.log('✅ Indexes created');

    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        throw error;
    } finally {
        client.release();
    }
}

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const result = await pool.query('SELECT NOW()');
        res.json({ 
            status: 'OK', 
            timestamp: new Date().toISOString(),
            db_time: result.rows[0].now
        });
    } catch (error) {
        res.status(500).json({ status: 'ERROR', error: error.message });
    }
});

// POST /api/attendees - Save registration with profile
app.post('/api/attendees', async (req, res) => {
    const { firstName, lastName, birthdate, note, profile } = req.body;
    
    // Validate required fields
    if (!firstName || !lastName || !birthdate) {
        return res.status(400).json({ 
            error: 'Missing required fields: firstName, lastName, birthdate' 
        });
    }
    
    if (!profile || !profile.email || !profile.phone || !profile.country || !profile.city) {
        return res.status(400).json({ 
            error: 'Missing profile information. Please generate a profile first.' 
        });
    }
    
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        // Insert personal information
        const personalResult = await client.query(
            `INSERT INTO personal_information (first_name, last_name, birthdate, note) 
             VALUES ($1, $2, $3, $4) 
             RETURNING id`,
            [firstName, lastName, birthdate, note || null]
        );
        
        const personalId = personalResult.rows[0].id;
        
        // Insert generated profile
        await client.query(
            `INSERT INTO generated_profile (personal_id, email, phone, country, city, profile_picture) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [personalId, profile.email, profile.phone, profile.country, profile.city, profile.picture]
        );
        
        await client.query('COMMIT');
        
        // Fetch the complete data with JOIN
        const result = await client.query(`
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
            WHERE p.id = $1
        `, [personalId]);
        
        res.status(201).json({ 
            message: 'Registration saved successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error saving registration:', error);
        res.status(500).json({ error: 'Failed to save registration' });
    } finally {
        client.release();
    }
});

// PATCH /api/attendees/:id - Update user's note
app.patch('/api/attendees/:id', async (req, res) => {
    const { id } = req.params;
    const { note } = req.body;
    
    if (note === undefined) {
        return res.status(400).json({ error: 'Note field is required' });
    }
    
    const client = await pool.connect();
    
    try {
        // Check if attendee exists
        const existing = await client.query(
            'SELECT id FROM personal_information WHERE id = $1',
            [id]
        );
        
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        // Update note
        await client.query(
            'UPDATE personal_information SET note = $1 WHERE id = $2',
            [note, id]
        );
        
        // Fetch updated data with JOIN
        const result = await client.query(`
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
                g.profile_picture
            FROM personal_information p
            LEFT JOIN generated_profile g ON p.id = g.personal_id
            WHERE p.id = $1
        `, [id]);
        
        res.json({ 
            message: 'Note updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating note:', error);
        res.status(500).json({ error: 'Failed to update note' });
    } finally {
        client.release();
    }
});

// GET /api/attendees - List all attendees with profiles
app.get('/api/attendees', async (req, res) => {
    try {
        const result = await pool.query(`
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
            LEFT JOIN generated_profile g ON p.id = g.personal_id
            ORDER BY p.created_at DESC
        `);
        
        res.json({ data: result.rows });
    } catch (error) {
        console.error('Error fetching attendees:', error);
        res.status(500).json({ error: 'Failed to fetch attendees' });
    }
});

// GET /api/attendees/:id - Get single attendee with profile
app.get('/api/attendees/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const result = await pool.query(`
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
            LEFT JOIN generated_profile g ON p.id = g.personal_id
            WHERE p.id = $1
        `, [id]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        res.json({ data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching attendee:', error);
        res.status(500).json({ error: 'Failed to fetch attendee' });
    }
});

// DELETE /api/attendees/:id - Delete attendee
app.delete('/api/attendees/:id', async (req, res) => {
    const { id } = req.params;
    
    try {
        const existing = await pool.query(
            'SELECT id FROM personal_information WHERE id = $1',
            [id]
        );
        
        if (existing.rows.length === 0) {
            return res.status(404).json({ error: 'Attendee not found' });
        }
        
        await pool.query('DELETE FROM personal_information WHERE id = $1', [id]);
        
        res.json({ message: 'Attendee deleted successfully' });
    } catch (error) {
        console.error('Error deleting attendee:', error);
        res.status(500).json({ error: 'Failed to delete attendee' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
async function startServer() {
    try {
        await initializeDatabase();
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`API endpoints:`);
            console.log(`   POST   /api/attendees     - Save registration with profile`);
            console.log(`   PATCH  /api/attendees/:id - Update note`);
            console.log(`   GET    /api/attendees     - List all attendees`);
            console.log(`   GET    /api/attendees/:id - Get single attendee`);
            console.log(`   DELETE /api/attendees/:id - Delete attendee`);
        });
    } catch (error) {
        console.error('Failed to start server:', error.message);
        process.exit(1);
    }
}

startServer();