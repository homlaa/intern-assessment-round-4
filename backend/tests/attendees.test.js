const { saveGeneratedProfile } = require('../services/attendeesService');

describe('saveGeneratedProfile', () => {
  it('saves the generated profile with the correct fields, linked to personal_id', async () => {
    const personalId = 42;
    const profileInput = {
      email: 'jane.doe@example.com',
      phone: '555-0100',
      country: 'Rwanda',
      city: 'Kigali',
      pictureUrl: 'https://randomuser.me/api/portraits/women/1.jpg',
    };

    // Mock the DB: verify the query gets the right params, and
    // return a row shaped like Postgres would.
    const mockDb = {
      query: jest.fn().mockResolvedValue({
        rows: [
          {
            id: 1,
            personal_id: personalId,
            email: profileInput.email,
            phone: profileInput.phone,
            country: profileInput.country,
            city: profileInput.city,
            picture_url: profileInput.pictureUrl,
          },
        ],
      }),
    };

    const saved = await saveGeneratedProfile(mockDb, personalId, profileInput);

    // The DB was called with the right values, in the right order.
    expect(mockDb.query).toHaveBeenCalledTimes(1);
    const [, params] = mockDb.query.mock.calls[0];
    expect(params).toEqual([
      personalId,
      profileInput.email,
      profileInput.phone,
      profileInput.country,
      profileInput.city,
      profileInput.pictureUrl,
    ]);

    // The returned row has the correct personal_id and profile fields.
    expect(saved).toEqual(
      expect.objectContaining({
        personal_id: personalId,
        email: profileInput.email,
        phone: profileInput.phone,
        country: profileInput.country,
        city: profileInput.city,
        picture_url: profileInput.pictureUrl,
      })
    );
  });
});
