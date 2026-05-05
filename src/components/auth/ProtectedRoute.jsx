import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

const ProtectedRoute = ({ children, requireAdmin = false, guestOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuthStore();
  const location = useLocation();

  // If still loading the user, we could show a spinner
  // For now, let's just wait
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white font-outfit">
        <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  // 1. Guest Only Routes (e.g. /auth)
  if (guestOnly && isAuthenticated) {
    // If admin is logged in and tries to access /auth, send to /admin
    if (user?.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // 2. Auth Required Routes
  if (!guestOnly && !isAuthenticated) {
    // Save the attempted location to redirect back after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // 3. Admin Required Routes
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
