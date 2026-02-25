import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore, { roleHome } from '../../store/useAuthStore';

/**
 * Wraps a route to require authentication.
 * If allowedRoles is provided, also checks role access.
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, token } = useAuthStore();
    const location = useLocation();

    if (!token && !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        // Redirect to correct dashboard based on actual role
        return <Navigate to={roleHome(user.role)} replace />;
    }

    return children;
};

export default ProtectedRoute;
