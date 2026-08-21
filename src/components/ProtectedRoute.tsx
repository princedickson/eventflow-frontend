import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * Wraps any route that requires login. If there's no token, redirect to
 * /login instead of rendering the page — the frontend's mirror of the
 * backend's anyRequest().authenticated() rule, just for UX (the backend
 * still enforces the real security; this just avoids showing a broken
 * page before the API call fails).
 */
export default function ProtectedRoute() {
  const { token } = useAuth();
  return token ? <Outlet /> : <Navigate to="/login" replace />;
}
