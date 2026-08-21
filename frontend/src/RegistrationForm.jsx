import { useState } from 'react';
import {
  saveAttendee,
  saveGeneratedProfile,
  fetchRandomProfile,
  fetchInvalidProfile,
} from './api';

const EMPTY_FORM = { firstName: '', lastName: '', birthdate: '', note: '' };

function Field({ label, error, children }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="mt-1">{children}</div>
      {error && <p role="alert" className="mt-1 text-sm text-rose-600">{error}</p>}
    </label>
  );
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm ' +
  'focus:border-teal-600 focus:outline-none focus:ring-2 focus:ring-teal-600/30';

export default function RegistrationForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [personalId, setPersonalId] = useState(null);

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(null);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function validate() {
    const next = {};
    if (!form.firstName.trim()) next.firstName = 'First name is required';
    if (!form.lastName.trim()) next.lastName = 'Last name is required';
    if (!form.birthdate) next.birthdate = 'Birthdate is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaveError(null);
    if (!validate()) return;

    setSaving(true);
    try {
      const saved = await saveAttendee(form);
      setPersonalId(saved.id);
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleClear() {
    setForm(EMPTY_FORM);
    setErrors({});
    setSaveError(null);
    setPersonalId(null);
    setProfile(null);
    setProfileError(null);
  }

  async function handleGenerateProfile() {
    setProfileLoading(true);
    setProfileError(null);

    try {
      const generated = await fetchRandomProfile();
      setProfile(generated);

      if (personalId) {
        try {
          await saveGeneratedProfile(personalId, generated);
        } catch (persistErr) {
          console.error('Could not persist generated profile:', persistErr);
        }
      }
    } catch (err) {
      console.error('Profile generation failed:', err);
    }

    try {
      await fetchInvalidProfile();
    } catch (err) {
      setProfileError(err.status ?? 'unknown');
    }

    setProfileLoading(false);
  }

  return (
    <div className="min-h-screen bg-slate-50 font-satoshi px-4 py-10">
      <div className="mx-auto grid max-w-3xl gap-6 md:grid-cols-2">
        <form
          onSubmit={handleSave}
          noValidate
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">Register attendee</h2>
          <p className="mt-1 text-sm text-slate-500">All fields except note are required.</p>

          <div className="mt-5 space-y-4">
            <Field label="First Name" error={errors.firstName}>
              <input
                name="firstName"
                value={form.firstName}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Last Name" error={errors.lastName}>
              <input
                name="lastName"
                value={form.lastName}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Birthdate" error={errors.birthdate}>
              <input
                type="date"
                name="birthdate"
                value={form.birthdate}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>

            <Field label="Note">
              <input
                name="note"
                value={form.note}
                onChange={handleChange}
                className={inputClass}
              />
            </Field>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-teal-800 disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={handleGenerateProfile}
              disabled={!personalId || profileLoading}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 disabled:opacity-40"
            >
              {profileLoading ? 'Generating…' : 'Generate Profile'}
            </button>
          </div>

          {saveError && <p role="alert" className="mt-3 text-sm text-rose-600">{saveError}</p>}
          {personalId && (
            <p className="mt-3 text-sm text-teal-700">Saved as attendee #{personalId}.</p>
          )}
          {!personalId && (
            <p className="mt-3 text-sm text-slate-400">Save the registrant before generating a profile.</p>
          )}
          {profileError !== null && (
            <p role="alert" className="mt-3 text-sm text-rose-600">
              Profile lookup failed (HTTP {profileError})
            </p>
          )}
        </form>

        {profile && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900">Generated profile</h3>
            <div className="mt-4 flex items-center gap-4">
              <img
                src={profile.pictureUrl}
                alt="Generated profile"
                className="h-20 w-20 rounded-full object-cover ring-1 ring-slate-200"
              />
              <dl className="text-sm text-slate-700 space-y-1">
                <div><dt className="inline font-medium text-slate-500">Email: </dt><dd className="inline">{profile.email}</dd></div>
                <div><dt className="inline font-medium text-slate-500">Phone: </dt><dd className="inline">{profile.phone}</dd></div>
                <div><dt className="inline font-medium text-slate-500">Country: </dt><dd className="inline">{profile.country}</dd></div>
                <div><dt className="inline font-medium text-slate-500">City: </dt><dd className="inline">{profile.city}</dd></div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
