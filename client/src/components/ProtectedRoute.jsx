import { useEffect } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMe } from '../features/auth/authSlice';

/**
 * ProtectedRoute wrapper
 * - Redirects to /login if not authenticated
 * - Optionally restricts access to specific roles
 *
 * Usage:
 *   <Route element={<ProtectedRoute />}> ... </Route>
 *   <Route element={<ProtectedRoute allowedRoles={['admin']} />}> ... </Route>
 */
function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, isInitialized, isLoading, user, accessToken } = useSelector(
    (state) => state.auth
  );
  const dispatch = useDispatch();
  const location = useLocation();

  useEffect(() => {
    // If we have a token but haven't initialized, fetch the user
    if (accessToken && !isInitialized && !isLoading) {
      dispatch(getMe());
    }
  }, [accessToken, isInitialized, isLoading, dispatch]);

  // Show loading state while checking auth
  if (!isInitialized && accessToken) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-surface-500 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role check
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
