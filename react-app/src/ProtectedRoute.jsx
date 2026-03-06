import { Navigate } from "react-router-dom";

function ProtectedRoute({ children, requiredRole }) {
  const token = localStorage.getItem("userToken");
  
  if (!token) return <Navigate to="/login" replace />;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    // Role can be in different claim keys depending on JWT serialization
    let role = payload.role ?? payload.Role ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
    if (role == null && Array.isArray(payload.roles)) role = payload.roles[0];
    if (role == null && Array.isArray(payload.role)) role = payload.role[0];
    // Backend enum: Admin=0, User=1. JWT may send "Admin" string or 0/1 number.
    const isAdmin = role === "Admin" || role === "admin" || Number(role) === 0 || Number(role) === 1;
    if (requiredRole != null && (Number(requiredRole) === 0 || Number(requiredRole) === 1) && !isAdmin) {
      return <Navigate to="/dashboard" replace />;
    }
    if (requiredRole != null && Number(requiredRole) !== 0 && Number(requiredRole) !== 1 && Number(role) !== Number(requiredRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  } catch {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default ProtectedRoute;