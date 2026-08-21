test("saves generated profile correct", async () => {
  const mockDb = { query: jest.fn() };
  const profile = { email: "test@mail.com", phone: "123", country: "Rwanda", city: "Kigali", picture: "pic.png" };
  const personalId = 1;

  mockDb.query.mockResolvedValueOnce({ rows: [{ personal_id: personalId }] });

  await saveAttendee(mockDb, { firstName: "A", lastName: "B", birthdate: "2000-01-01", note: "Note", profile });

  expect(mockDb.query).toHaveBeenCalledWith(
    expect.stringContaining("INSERT INTO generated_profile"),
    [personalId, profile.email, profile.phone, profile.country, profile.city, profile.picture]
  );
});
