import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

export default function useAuth() {
    const navigate = useNavigate();

    const getUserIdFromToken = useCallback(() => {
        const token = localStorage.getItem("userToken");
        if (!token) return null;
        try {
            const payloadB64 = token.split(".")[1];
            if (!payloadB64) return null;
            const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
            const payload = JSON.parse(atob(padded));
            const id =
                payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
                payload.nameid ??
                payload.sub;
            const cleanId = String(id).split(":")[0];
            const parsed = parseInt(cleanId, 10);
            return Number.isFinite(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, []);

    const getUserRole = useCallback(() => {
        try {
            const token = localStorage.getItem("userToken");
            if (!token) return null;
            const payloadB64 = token.split(".")[1];
            const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
            const payload = JSON.parse(atob(padded));
            let role =
                payload.role ??
                payload.Role ??
                payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            if (role == null && Array.isArray(payload.roles)) role = payload.roles[0];
            if (role == null && Array.isArray(payload.role)) role = payload.role[0];
            return role;
        } catch {
            return null;
        }
    }, []);

    const isAdmin = useCallback(() => {
        const role = getUserRole();
        return role === "Admin" || role === "admin" || Number(role) === 0;
    }, [getUserRole]);

    const logout = useCallback(() => {
        localStorage.removeItem("userToken");
        navigate("/login");
    }, [navigate]);

    return { getUserIdFromToken, getUserRole, isAdmin, logout };
}
