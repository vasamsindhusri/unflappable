import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function Navbar() {
  const { therapist, logout } = useAuth();
  return (
    <header className="border-b border-line bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-5 py-4">
        <Link to="/" className="font-serif text-2xl font-semibold text-pine">Unfazed</Link>
        <div className="flex items-center gap-4 text-sm">
          {therapist ? (
            <>
              <Link to="/dashboard" className="text-ink hover:text-pine">Dashboard</Link>
              <button onClick={logout} className="text-muted hover:text-ink">Log out</button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-ink hover:text-pine">Log in</Link>
              <Link to="/register" className="rounded-md bg-pine px-4 py-2 font-medium text-white hover:bg-pine-soft">
                Create your page
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
