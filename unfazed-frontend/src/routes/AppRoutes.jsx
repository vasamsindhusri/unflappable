import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Home from '../pages/client/Home.jsx';
import ProfilePage from '../pages/client/ProfilePage.jsx';
import Login from '../pages/auth/Login.jsx';
import Register from '../pages/auth/Register.jsx';
import Dashboard from '../pages/therapist/Dashboard.jsx';

// Only logged-in therapists can open this
function ProtectedRoute({ children }) {
  const { therapist, loading } = useAuth();
  if (loading) return <p className="p-8 text-muted">Loading...</p>;
  return therapist ? children : <Navigate to="/login" replace />;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      {/* Must stay LAST: any other single word is treated as a therapist's link name */}
      <Route path="/:slug" element={<ProfilePage />} />
    </Routes>
  );
}
