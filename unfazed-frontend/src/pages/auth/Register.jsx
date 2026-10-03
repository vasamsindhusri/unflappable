import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { errorMessage } from '../../api/axiosInstance.js';
import Navbar from '../../components/common/Navbar.jsx';
import FormField from '../../components/common/FormField.jsx';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      await register(form);
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
        <h1 className="font-serif text-3xl font-medium text-pine">Create your page</h1>
        <p className="mt-2 text-muted">It takes a minute. You can edit everything later.</p>
        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <FormField label="Full name" name="name" value={form.name} onChange={onChange} placeholder="Dr. Anita Sharma" required />
          <FormField label="Email" type="email" name="email" value={form.email} onChange={onChange} required />
          <FormField label="Password" type="password" name="password" value={form.password} onChange={onChange} hint="At least 6 characters" required />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button disabled={busy} className="w-full rounded-md bg-pine py-2.5 font-medium text-white hover:bg-pine-soft disabled:opacity-60">
            {busy ? 'Creating...' : 'Create account'}
          </button>
        </form>
        <p className="mt-6 text-sm text-muted">
          Already have an account? <Link to="/login" className="text-pine underline">Log in</Link>
        </p>
      </main>
    </>
  );
}
