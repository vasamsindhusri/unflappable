import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../api/axiosInstance.js';
import Navbar from '../../components/common/Navbar.jsx';
import FormField from '../../components/common/FormField.jsx';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await login(form);
      navigate('/dashboard');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-md px-5 py-12">
        <h1 className="font-serif text-3xl font-medium text-pine">Log in</h1>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <FormField label="Email" type="email" name="email" value={form.email} onChange={onChange} required />
          <FormField label="Password" type="password" name="password" value={form.password} onChange={onChange} required />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-md bg-pine py-2.5 font-medium text-white hover:bg-pine-soft disabled:opacity-60">
            {busy ? 'Logging in...' : 'Log in'}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted">
          New here? <Link to="/register" className="text-pine underline">Create your page</Link>
        </p>
      </main>
    </>
  );
}
