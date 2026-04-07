import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function PrivateRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] bg-[#F4F6FA]">
        <div className="w-10 h-10 border-4 border-at-green/20 border-t-at-green rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated)
    return <Navigate to="/login" replace />;

  /* Évite rendu layout avec user null (token invalide / réponse API incomplète). */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0) {
    const r = (user?.role?.name ?? user?.role ?? '').toLowerCase();
    const ok = roles.some(role => r.includes(role.toLowerCase()));
    if (!ok) return <Navigate to="/403" replace />;
  }

  return children;
}
