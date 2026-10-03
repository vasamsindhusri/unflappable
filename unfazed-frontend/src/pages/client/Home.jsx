import { Link } from 'react-router-dom';
import Navbar from '../../components/common/Navbar.jsx';

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-5xl px-5 py-20">
        <h1 className="max-w-2xl font-serif text-5xl font-medium leading-tight text-pine">
          Your practice, on one link you can share.
        </h1>
        <p className="mt-5 max-w-xl text-lg text-muted">
          Unfazed gives every therapist in India a page of their own. Clients find you, book a
          session and pay, all from <span className="text-ink">unfazed.in/your-name</span>.
        </p>
        <Link
          to="/register"
          className="mt-8 inline-block rounded-md bg-pine px-6 py-3 font-medium text-white hover:bg-pine-soft"
        >
          Create your page
        </Link>
      </main>
    </>
  );
}
