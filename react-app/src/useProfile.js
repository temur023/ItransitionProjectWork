import { useState, useEffect, useCallback } from "react";
import api from "./useApi";
import useAuth from "./useAuth";
import useTheme from "./useTheme";

export default function useProfile() {
    const { getUserIdFromToken } = useAuth();
    const { theme, toggleTheme, setPreferredTheme } = useTheme();
    const [profileData, setProfileData] = useState(null);

    const fetchProfile = useCallback(async () => {
        try {
            const userId = getUserIdFromToken();
            if (!userId) return;
            const response = await api.get(`/api/User/get/${userId}`);
            setProfileData(response.data.data);
        } catch { }
    }, [getUserIdFromToken]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    // Auto-save theme to DB when theme changes
    useEffect(() => {
        const autoSaveTheme = async () => {
            const userId = getUserIdFromToken();
            if (!userId || !profileData) return;

            const currentDbTheme = profileData.theme ?? profileData.Theme ?? 1;
            const newThemeVal = theme === "dark" ? 2 : 1;

            if (currentDbTheme !== newThemeVal) {
                try {
                    const payload = {
                        fullName: profileData.fullName,
                        passwordHash: "",
                        language: profileData.language ?? profileData.Language ?? 1,
                        theme: newThemeVal,
                    };
                    await api.put(`/api/User/update/${userId}`, payload);
                    setProfileData(prev => ({ ...prev, theme: newThemeVal }));
                } catch (e) {
                    console.error("Auto-saving theme failed", e);
                }
            }
        };
        autoSaveTheme();
    }, [theme, profileData, getUserIdFromToken]);

    return {
        profileData,
        setProfileData,
        fetchProfile,
        theme,
        toggleTheme,
        setPreferredTheme,
    };
}
