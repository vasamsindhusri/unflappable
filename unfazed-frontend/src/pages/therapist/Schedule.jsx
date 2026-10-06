import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errorMessage } from '../../api/axiosInstance.js';
import Navbar from '../../components/common/Navbar.jsx';
import { getTimezones, fmtDateTime } from '../../utils/time.js';

const DAYS = [
  { label: 'Monday', dow: 1 }, { label: 'Tuesday', dow: 2 }, { label: 'Wednesday', dow: 3 },
  { label: 'Thursday', dow: 4 }, { label: 'Friday', dow: 5 }, { label: 'Saturday', dow: 6 },
  { label: 'Sunday', dow: 0 },
];
const input = 'rounded-md border border-line bg-white px-2 py-1.5 text-sm';
const linkBtn = 'text-sm font-medium text-pine hover:underline';

export default function Schedule() {
  const [av, setAv] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [status, setStatus] = useState({ type: '', text: '' });
  const [busy, setBusy] = useState(false);
  const zones = getTimezones();

  const loadSessions = () => api.get('/scheduling/me/sessions').then((r) => setSessions(r.data.sessions));

  useEffect(() => {
    api.get('/scheduling/me/availability').then((r) => setAv(r.data.availability))
      .catch((err) => setStatus({ type: 'error', text: errorMessage(err) }));
    loadSessions().catch(() => {});
  }, []);

  if (!av) return (<><Navbar /><p className="p-8 text-muted">{status.text || 'Loading...'}</p></>);

  // Small helpers to edit the lists (weekly, overrides, blocked)
  const set = (patch) => setAv({ ...av, ...patch });
  const update = (key, i, patch) => set({ [key]: av[key].map((x, idx) => (idx === i ? { ...x, ...patch } : x)) });
  const remove = (key, i) => set({ [key]: av[key].filter((_, idx) => idx !== i) });
  const add = (key, item) => set({ [key]: [...av[key], item] });

  const save = async (e) => {
    e.preventDefault();
    setStatus({ type: '', text: '' });
    setBusy(true);
    try {
      const { data } = await api.put('/scheduling/me/availability', {
        timezone: av.timezone,
        sessionDuration: Number(av.sessionDuration),
        bufferMinutes: Number(av.bufferMinutes),
        weekly: av.weekly,
        overrides: av.overrides,
        blocked: av.blocked,
      });
      setAv(data.availability);
      setStatus({ type: 'ok', text: 'Availability saved. Clients can now book these times.' });
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this session? The time slot will open up again.')) return;
    try {
      await api.post(`/scheduling/me/sessions/${id}/cancel`);
      loadSessions();
    } catch (err) {
      setStatus({ type: 'error', text: errorMessage(err) });
    }
  };

  const TimeRange = ({ item, onChange, label }) => (
    <>
      <input type="time" aria-label={`${label} start`} value={item.start || ''} onChange={(e) => onChange({ start: e.target.value })} className={input} />
      <span className="text-muted">to</span>
      <input type="time" aria-label={`${label} end`} value={item.end || ''} onChange={(e) => onChange({ end: e.target.value })} className={input} />
    </>
  );

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <Link to="/dashboard" className="text-sm text-pine hover:underline">&larr; Back to dashboard</Link>
        <h1 className="mt-2 font-serif text-3xl font-medium text-pine">Availability and bookings</h1>

        <form onSubmit={save} className="mt-8 space-y-10">
          {/* Basics */}
          <section>
            <h2 className="font-serif text-xl text-pine">Session settings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium">Your timezone
                <select value={av.timezone} onChange={(e) => set({ timezone: e.target.value })} className={`${input} mt-1 w-full`}>
                  {zones.map((z) => <option key={z}>{z}</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Session length
                <select value={av.sessionDuration} onChange={(e) => set({ sessionDuration: Number(e.target.value) })} className={`${input} mt-1 w-full`}>
                  {[30, 45, 60, 90].map((d) => <option key={d} value={d}>{d} minutes</option>)}
                </select>
              </label>
              <label className="block text-sm font-medium">Break between sessions
                <input type="number" min="0" max="60" step="5" value={av.bufferMinutes}
                  onChange={(e) => set({ bufferMinutes: e.target.value })} className={`${input} mt-1 w-full`} />
              </label>
            </div>
            <p className="mt-2 text-xs text-muted">All times below are in your timezone. Clients see them converted to their own.</p>
          </section>

          {/* Weekly hours */}
          <section>
            <h2 className="font-serif text-xl text-pine">Weekly hours</h2>
            <div className="mt-3">
              {DAYS.map(({ label, dow }) => (
                <div key={dow} className="flex flex-wrap items-start gap-3 border-b border-line py-3">
                  <div className="w-28 pt-1.5 text-sm font-medium">{label}</div>
                  <div className="space-y-2">
                    {av.weekly.map((w, i) => w.dayOfWeek === dow && (
                      <div key={i} className="flex flex-wrap items-center gap-2">
                        <TimeRange item={w} label={label} onChange={(p) => update('weekly', i, p)} />
                        <button type="button" onClick={() => remove('weekly', i)} className="text-sm text-red-700 hover:underline">Remove</button>
                      </div>
                    ))}
                    {av.weekly.every((w) => w.dayOfWeek !== dow) && <p className="pt-1.5 text-sm text-muted">Unavailable</p>}
                    <button type="button" className={linkBtn} onClick={() => add('weekly', { dayOfWeek: dow, start: '10:00', end: '13:00' })}>Add hours</button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* One-time extra hours */}
          <section>
            <h2 className="font-serif text-xl text-pine">Extra hours on a specific date</h2>
            <p className="text-sm text-muted">For a one-off day, like a Saturday clinic.</p>
            <div className="mt-3 space-y-2">
              {av.overrides.map((o, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input type="date" aria-label="Date" value={o.date} onChange={(e) => update('overrides', i, { date: e.target.value })} className={input} />
                  <TimeRange item={o} label="Extra hours" onChange={(p) => update('overrides', i, p)} />
                  <button type="button" onClick={() => remove('overrides', i)} className="text-sm text-red-700 hover:underline">Remove</button>
                </div>
              ))}
            </div>
            <button type="button" className={`${linkBtn} mt-2`} onClick={() => add('overrides', { date: '', start: '10:00', end: '13:00' })}>Add extra hours</button>
          </section>

          {/* Blocked time */}
          <section>
            <h2 className="font-serif text-xl text-pine">Blocked time</h2>
            <p className="text-sm text-muted">Leave the times empty to block the whole day (holidays, leave).</p>
            <div className="mt-3 space-y-2">
              {av.blocked.map((b, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2">
                  <input type="date" aria-label="Blocked date" value={b.date} onChange={(e) => update('blocked', i, { date: e.target.value })} className={input} />
                  <TimeRange item={b} label="Blocked" onChange={(p) => update('blocked', i, p)} />
                  <button type="button" onClick={() => remove('blocked', i)} className="text-sm text-red-700 hover:underline">Remove</button>
                </div>
              ))}
            </div>
            <button type="button" className={`${linkBtn} mt-2`} onClick={() => add('blocked', { date: '', start: '', end: '' })}>Block a date</button>
          </section>

          {status.text && (
            <p role="status" className={`text-sm ${status.type === 'ok' ? 'text-pine' : 'text-red-700'}`}>{status.text}</p>
          )}
          <button disabled={busy} className="rounded-md bg-pine px-6 py-2.5 font-medium text-white hover:bg-pine-soft disabled:opacity-60">
            {busy ? 'Saving...' : 'Save availability'}
          </button>
        </form>

        {/* Upcoming bookings */}
        <section className="mt-14">
          <h2 className="font-serif text-xl text-pine">Upcoming bookings</h2>
          {sessions.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No bookings yet. Share your link and they will appear here.</p>
          ) : (
            <ul className="mt-3 divide-y divide-line rounded-md border border-line bg-white">
              {sessions.map((s) => (
                <li key={s._id} className="flex flex-wrap items-center justify-between gap-3 p-4">
                  <div>
                    <p className="font-medium">{fmtDateTime(s.start, av.timezone)}</p>
                    <p className="text-sm text-muted">{s.clientName} &middot; {s.clientEmail}</p>
                  </div>
                  <button type="button" onClick={() => cancel(s._id)} className="text-sm text-red-700 hover:underline">Cancel session</button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </>
  );
}
