import { Navigate, Outlet } from 'react-router-dom';

interface ProtectedRouteProps {
  allowedRoles: string[];
  userRole: string | null;
}

export function ProtectedRoute({ allowedRoles, userRole }: ProtectedRouteProps) {
  const token = localStorage.getItem('adminToken');

  // Check 1: Valid JWT Token? (If No -> Kick to /auth)
  if (!token) {
    return <Navigate to="/auth" replace />;
  }

  // Check 2: Correct Role? (If No -> Kick to their respective dashboard)
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Determine where to send them based on their actual role
    if (userRole === 'admin') return <Navigate to="/admin" replace />;
    if (userRole === 'department') return <Navigate to="/department" replace />;
    if (userRole === 'user') return <Navigate to="/citizen" replace />;
    
    // Fallback if role is garbled
    return <Navigate to="/auth" replace />;
  }

  // Access Granted! Render the child routes.
  return <Outlet />;
}
