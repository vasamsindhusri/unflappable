import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import api, { errorMessage } from '../../api/axiosInstance.js';
import Navbar from '../../components/common/Navbar.jsx';
import FormField from '../../components/common/FormField.jsx';

const toList = (text) => text.split(',').map((s) => s.trim()).filter(Boolean);

export default function Dashboard() {
  const { therapist, setTherapist } = useAuth();
  const [form, setForm] = useState({
    name: therapist.name,
    slug: therapist.slug,
    bio: therapist.bio || '',
    specializations: therapist.specializations.join(', '),
    languages: therapist.languages.join(', '),
  });
  const [services, setServices] = useState(therapist.services || []);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const updateService = (i, field, value) =>
    setServices(services.map((s, idx) => (idx === i ? { ...s, [field]: value } : s)));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setBusy(true);
    try {
      const { data } = await api.put('/therapists/me', {
        name: form.name,
        slug: form.slug,
        bio: form.bio,
        specializations: toList(form.specializations),
        languages: toList(form.languages),
        services,
      });
      setTherapist(data.therapist);
      setForm((f) => ({ ...f, slug: data.therapist.slug }));
      setStatus({ type: 'ok', text: 'Profile saved' });
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const publicUrl = `${window.location.origin}/${therapist.slug}`;

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-2xl px-5 py-10">
        <h1 className="font-serif text-3xl font-medium text-pine">Your profile</h1>

        <div className="mt-5 rounded-md border border-line bg-mist p-4 text-sm">
          <p className="text-muted">Your public link</p>
          <Link to={`/${therapist.slug}`} className="break-all font-medium text-pine underline">{publicUrl}</Link>
        </div>

        <form onSubmit={onSubmit} className="mt-8 space-y-5">
          <FormField label="Name" name="name" value={form.name} onChange={onChange} required />
          <FormField label="Link name" name="slug" value={form.slug} onChange={onChange} hint="Letters, numbers and dashes. This becomes the end of your link." />
          <label className="block">
            <span className="mb-1 block text-sm font-medium">About you</span>
            <textarea name="bio" value={form.bio} onChange={onChange} rows={4} maxLength={1000}
              className="w-full rounded-md border border-line bg-white px-3 py-2" />
          </label>
          <FormField label="Specializations" name="specializations" value={form.specializations} onChange={onChange} hint="Separate with commas, e.g. Anxiety, Depression" />
          <FormField label="Languages" name="languages" value={form.languages} onChange={onChange} hint="Separate with commas, e.g. English, Hindi" />

          <fieldset>
            <legend className="mb-2 text-sm font-medium">Services</legend>
            <div className="space-y-3">
              {services.map((s, i) => (
                <div key={s._id || i} className="space-y-2 rounded-md border border-line bg-white p-3">
                  <input aria-label="Service title" placeholder="Service title" value={s.title}
                    onChange={(e) => updateService(i, 'title', e.target.value)}
                    className="w-full rounded-md border border-line px-3 py-2" />
                  <input aria-label="Service description" placeholder="Short description" value={s.description}
                    onChange={(e) => updateService(i, 'description', e.target.value)}
                    className="w-full rounded-md border border-line px-3 py-2" />
                  <button type="button" onClick={() => setServices(services.filter((_, idx) => idx !== i))}
                    className="text-sm text-red-700 hover:underline">Remove service</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setServices([...services, { title: '', description: '' }])}
              className="mt-3 text-sm font-medium text-pine hover:underline">Add a service</button>
          </fieldset>

          {status.text && (
            <p role="status" className={`text-sm ${status.type === 'ok' ? 'text-pine' : 'text-red-700'}`}>{status.text}</p>
          )}
          <button disabled={busy} className="rounded-md bg-pine px-6 py-2.5 font-medium text-white hover:bg-pine-soft disabled:opacity-60">
            {busy ? 'Saving...' : 'Save profile'}
          </button>
        </form>
      </main>
    </>
  );
}
