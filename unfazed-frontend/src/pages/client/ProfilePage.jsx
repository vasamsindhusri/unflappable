import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axiosInstance.js';
import Navbar from '../../components/common/Navbar.jsx';

// Sets a <meta> tag in the page head (browser-side Open Graph)
function setMeta(attr, key, content) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export default function ProfilePage() {
  const { slug } = useParams();
  const [therapist, setTherapist] = useState(null);
  const [state, setState] = useState('loading'); // loading | ready | notfound

  useEffect(() => {
    setState('loading');
    api
      .get(`/therapists/${slug}`)
      .then((res) => {
        setTherapist(res.data.therapist);
        setState('ready');
      })
      .catch(() => setState('notfound'));
  }, [slug]);

  // Update the tab title and Open Graph tags when the profile loads
  useEffect(() => {
    if (!therapist) return;
    const title = `${therapist.name} | Unfazed`;
    const desc = therapist.bio?.slice(0, 160) || `Book a session with ${therapist.name}.`;
    document.title = title;
    setMeta('name', 'description', desc);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:type', 'profile');
    return () => { document.title = 'Unfazed'; };
  }, [therapist]);

  if (state === 'loading') return (<><Navbar /><p className="p-8 text-muted">Loading...</p></>);

  if (state === 'notfound') {
    return (
      <>
        <Navbar />
        <main className="mx-auto max-w-xl px-5 py-20">
          <h1 className="font-serif text-3xl text-pine">We couldn't find this page</h1>
          <p className="mt-3 text-muted">Check the link, or ask your therapist to send it again.</p>
          <Link to="/" className="mt-6 inline-block text-pine underline">Go to home</Link>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main>
        {/* Hero */}
        <section className="bg-mist">
          <div className="mx-auto max-w-3xl px-5 py-16">
            <h1 className="font-serif text-5xl font-medium leading-tight text-pine">{therapist.name}</h1>
            {therapist.languages.length > 0 && (
              <p className="mt-3 text-muted">Sessions in {therapist.languages.join(', ')}</p>
            )}
            <Link to={`/${therapist.slug}/book`}
              className="mt-7 inline-block rounded-md bg-pine px-6 py-3 font-medium text-white hover:bg-pine-soft">
              Book a session
            </Link>
          </div>
        </section>

        <div className="mx-auto max-w-3xl space-y-12 px-5 py-12">
          {/* About */}
          {therapist.bio && (
            <section>
              <h2 className="font-serif text-2xl text-pine">About</h2>
              <p className="mt-3 max-w-prose whitespace-pre-line leading-relaxed">{therapist.bio}</p>
            </section>
          )}

          {/* Specializations */}
          {therapist.specializations.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl text-pine">Specializations</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {therapist.specializations.map((s) => (
                  <li key={s} className="rounded-full bg-sky px-4 py-1.5 text-sm text-ink">{s}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Service cards */}
          {therapist.services.length > 0 && (
            <section>
              <h2 className="font-serif text-2xl text-pine">Services</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {therapist.services.map((s) => (
                  <article key={s._id} className="rounded-md border border-line bg-white p-5">
                    <h3 className="font-medium text-ink">{s.title}</h3>
                    {s.description && <p className="mt-2 text-sm text-muted">{s.description}</p>}
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
}
