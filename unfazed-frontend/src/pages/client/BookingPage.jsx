import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errorMessage } from '../../api/axiosInstance.js';
import Navbar from '../../components/common/Navbar.jsx';
import FormField from '../../components/common/FormField.jsx';
import { browserTimezone, getTimezones, dateKey, fmtTime, fmtDateTime, dayParts } from '../../utils/time.js';

export default function BookingPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null); // { therapist, timezone, sessionDuration, slots }
  const [state, setState] = useState('loading'); // loading | ready | notfound
  const [tz, setTz] = useState(browserTimezone()); // the CLIENT's timezone
  const [pickedDay, setPickedDay] = useState(null);
  const [pickedSlot, setPickedSlot] = useState(null);
  const [form, setForm] = useState({ name: '', email: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [booked, setBooked] = useState(null);

  const load = () =>
    api.get(`/scheduling/${slug}/slots`, { params: { days: 30 } })
      .then((res) => { setData(res.data); setState('ready'); })
      .catch(() => setState('notfound'));

  useEffect(() => { load(); }, [slug]);

  // Group the open slots by the day they fall on in the client's timezone
  const byDay = useMemo(() => {
    const groups = {};
    (data?.slots || []).forEach((iso) => {
      const key = dateKey(iso, tz);
      if (!groups[key]) groups[key] = [];
      groups[key].push(iso);
    });
    return groups;
  }, [data, tz]);
  const dayKeys = Object.keys(byDay).sort();
  const activeDay = pickedDay && byDay[pickedDay] ? pickedDay : dayKeys[0];

  const confirmBooking = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await api.post(`/scheduling/${slug}/book`, {
        start: pickedSlot, clientName: form.name, clientEmail: form.email, clientTimezone: tz,
      });
      setBooked(res.data.session);
      load(); // the booked slot disappears from the list
    } catch (err) {
      setError(errorMessage(err));
      if (err.response?.status === 409) { setPickedSlot(null); load(); } // someone else got it first
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') return (<><Navbar /><p className="p-8 text-muted">Loading...</p></>);
  if (state === 'notfound') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-xl px-5 py-20">
          <h1 className="font-serif text-3xl text-pine">We couldn't find this page</h1>
          <Link to="/" className="mt-6 inline-block text-pine underline">Go to home</Link>
        </main>
      </>
    );
  }

  const name = data.therapist.name;

  if (booked) {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-xl px-5 py-16">
          <div className="rounded-md border border-line bg-mist p-8">
            <h1 className="font-serif text-3xl text-pine">You're booked</h1>
            <p className="mt-4 text-lg">{fmtDateTime(booked.start, tz)}</p>
            <p className="text-muted">{data.sessionDuration} minute session with {name}</p>
            <p className="mt-1 text-sm text-muted">Times shown in {tz}</p>
          </div>
          <Link to={`/${slug}`} className="mt-6 inline-block text-pine underline">Back to {name}'s profile</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link to={`/${slug}`} className="text-sm text-pine hover:underline">&larr; {name}</Link>
        <h1 className="mt-2 font-serif text-3xl font-medium text-pine">Book a session with {name}</h1>
        <p className="mt-1 text-muted">{data.sessionDuration} minute sessions</p>

        <label className="mt-6 block text-sm font-medium">Show times in my timezone
          <select value={tz} onChange={(e) => setTz(e.target.value)} className="mt-1 block w-full max-w-sm rounded-md border border-line bg-white px-3 py-2">
            {getTimezones().map((z) => <option key={z}>{z}</option>)}
          </select>
        </label>

        {dayKeys.length === 0 ? (
          <p className="mt-10 rounded-md border border-line bg-mist p-6 text-muted">
            No open times right now. Please check back soon, or contact {name} directly.
          </p>
        ) : (
          <>
            <h2 className="mt-8 font-serif text-xl text-pine">Pick a day</h2>
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
              {dayKeys.map((key) => {
                const p = dayParts(key);
                const active = key === activeDay;
                return (
                  <button key={key} type="button" aria-pressed={active}
                    onClick={() => { setPickedDay(key); setPickedSlot(null); }}
                    className={`rounded-md border px-2 py-3 text-center ${active ? 'border-pine bg-pine text-white' : 'border-line bg-white hover:border-pine'}`}>
                    <span className="block text-xs uppercase tracking-wide opacity-80">{p.weekday}</span>
                    <span className="block text-xl font-medium">{p.day}</span>
                    <span className="block text-xs opacity-80">{p.month}</span>
                  </button>
                );
              })}
            </div>

            <h2 className="mt-8 font-serif text-xl text-pine">Pick a time</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {(byDay[activeDay] || []).map((iso) => (
                <button key={iso} type="button" aria-pressed={iso === pickedSlot} onClick={() => setPickedSlot(iso)}
                  className={`rounded-md border px-4 py-2 text-sm ${iso === pickedSlot ? 'border-pine bg-pine text-white' : 'border-line bg-white hover:border-pine'}`}>
                  {fmtTime(iso, tz)}
                </button>
              ))}
            </div>
          </>
        )}

        {pickedSlot && (
          <form onSubmit={confirmBooking} className="mt-8 max-w-md space-y-4 rounded-md border border-line bg-white p-5">
            <p className="font-medium">{fmtDateTime(pickedSlot, tz)}</p>
            <FormField label="Your name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            <FormField label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button disabled={busy} className="w-full rounded-md bg-pine py-2.5 font-medium text-white hover:bg-pine-soft disabled:opacity-60">
              {busy ? 'Booking...' : 'Confirm booking'}
            </button>
          </form>
        )}
        {!pickedSlot && error && <p role="alert" className="mt-6 text-sm text-red-700">{error}</p>}
      </main>
    </>
  );
}
