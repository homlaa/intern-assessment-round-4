const request = require('supertest');
const app = require('../server');

describe('Attendee API Tests - Round 4 (PostgreSQL)', () => {
    let testAttendeeId;
    let testProfile;

    beforeAll(() => {
        testProfile = {
            email: 'test@example.com',
            phone: '123-456-7890',
            country: 'Test Country',
            city: 'Test City',
            picture: 'https://example.com/photo.jpg'
        };
    });

    describe('POST /api/attendees', () => {
        it('should save a new attendee with generated profile', async () => {
            const response = await request(app)
                .post('/api/attendees')
                .send({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthdate: '1992-03-15',
                    note: 'Test note',
                    profile: testProfile
                });

            expect(response.status).toBe(201);
            expect(response.body.message).toBe('Registration saved successfully');
            expect(response.body.data).toHaveProperty('id');
            expect(response.body.data.first_name).toBe('Jane');
            expect(response.body.data.email).toBe(testProfile.email);
            expect(response.body.data.phone).toBe(testProfile.phone);
            expect(response.body.data.country).toBe(testProfile.country);
            expect(response.body.data.city).toBe(testProfile.city);
            expect(response.body.data.profile_picture).toBe(testProfile.picture);
            
            testAttendeeId = response.body.data.id;
        });

        it('should return 400 when profile is missing', async () => {
            const response = await request(app)
                .post('/api/attendees')
                .send({
                    firstName: 'Jane',
                    lastName: 'Smith',
                    birthdate: '1992-03-15'
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing profile information');
        });

        it('should return 400 for missing required fields', async () => {
            const response = await request(app)
                .post('/api/attendees')
                .send({
                    firstName: 'Jane',
                    profile: testProfile
                });

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Missing required fields');
        });

        it('should verify profile is saved with correct personal_id', async () => {
            const response = await request(app)
                .get(`/api/attendees/${testAttendeeId}`);

            expect(response.status).toBe(200);
            expect(response.body.data.email).toBe(testProfile.email);
            expect(response.body.data.phone).toBe(testProfile.phone);
            expect(response.body.data.country).toBe(testProfile.country);
            expect(response.body.data.city).toBe(testProfile.city);
            expect(response.body.data.profile_picture).toBe(testProfile.picture);
        });
    });

    describe('PATCH /api/attendees/:id', () => {
        it('should update note for existing attendee', async () => {
            const response = await request(app)
                .patch(`/api/attendees/${testAttendeeId}`)
                .send({ note: 'Updated note' });

            expect(response.status).toBe(200);
            expect(response.body.message).toBe('Note updated successfully');
            expect(response.body.data.note).toBe('Updated note');
        });

        it('should return 404 for non-existent attendee', async () => {
            const response = await request(app)
                .patch('/api/attendees/99999')
                .send({ note: 'This should fail' });

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Attendee not found');
        });

        it('should return 400 when note is missing', async () => {
            const response = await request(app)
                .patch(`/api/attendees/${testAttendeeId}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toBe('Note field is required');
        });
    });

    describe('GET /api/attendees', () => {
        it('should return list of attendees with profiles', async () => {
            const response = await request(app)
                .get('/api/attendees');

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('data');
            expect(Array.isArray(response.body.data)).toBe(true);
            
            if (response.body.data.length > 0) {
                const attendee = response.body.data[0];
                expect(attendee).toHaveProperty('first_name');
                expect(attendee).toHaveProperty('email');
                expect(attendee).toHaveProperty('phone');
                expect(attendee).toHaveProperty('country');
                expect(attendee).toHaveProperty('city');
            }
        });
    });

    describe('GET /api/attendees/:id', () => {
        it('should return attendee with profile details', async () => {
            const response = await request(app)
                .get(`/api/attendees/${testAttendeeId}`);

            expect(response.status).toBe(200);
            expect(response.body.data.id).toBe(testAttendeeId);
            expect(response.body.data).toHaveProperty('first_name');
            expect(response.body.data).toHaveProperty('email');
            expect(response.body.data).toHaveProperty('phone');
            expect(response.body.data).toHaveProperty('country');
            expect(response.body.data).toHaveProperty('city');
        });

        it('should return 404 for non-existent attendee', async () => {
            const response = await request(app)
                .get('/api/attendees/99999');

            expect(response.status).toBe(404);
            expect(response.body.error).toBe('Attendee not found');
        });
    });

    describe('Database JOIN Query Verification', () => {
        it('should return JOIN query result with all fields', async () => {
            const response = await request(app)
                .get(`/api/attendees/${testAttendeeId}`);

            expect(response.status).toBe(200);
            const data = response.body.data;
            
            // Verify JOIN includes all required fields
            expect(data).toHaveProperty('id');
            expect(data).toHaveProperty('first_name');
            expect(data).toHaveProperty('last_name');
            expect(data).toHaveProperty('birthdate');
            expect(data).toHaveProperty('note');
            expect(data).toHaveProperty('email');
            expect(data).toHaveProperty('phone');
            expect(data).toHaveProperty('country');
            expect(data).toHaveProperty('city');
            expect(data).toHaveProperty('profile_picture');
        });
    });

    // Clean up after tests
    afterAll(async () => {
        if (testAttendeeId) {
            await request(app).delete(`/api/attendees/${testAttendeeId}`);
        }
    });
});