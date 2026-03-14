import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import api from "./useApi";

export default function UserSearch({ accessUsers, setAccessUsers }) {
    const { t } = useTranslation();
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const searchTimerRef = useRef(null);

    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) { setUserSuggestions([]); return; }
        try {
            const response = await api.get(`/api/User/get-all`, {
                params: { SearchTerm: searchTerm, PageSize: 5, PageNumber: 1 }
            });
            setUserSuggestions(response.data.data || []);
        } catch { setUserSuggestions([]); }
    };

    const addAccessUser = () => {
        setAccessUsers([...accessUsers, { emailOrUsername: "", userId: null, isExisting: false }]);
    };

    const updateAccessUser = (index, key, value) => {
        const updated = [...accessUsers];
        updated[index][key] = value;
        setAccessUsers(updated);
        if (key === "emailOrUsername") {
            setActiveSuggestionIndex(index);
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
            searchTimerRef.current = setTimeout(() => searchUsers(value), 300);
        }
    };

    const selectSuggestion = (index, user) => {
        const updated = [...accessUsers];
        updated[index] = { emailOrUsername: user.email || user.userName, userId: user.id, isExisting: updated[index].isExisting || false };
        setAccessUsers(updated);
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const removeAccessUser = async (index) => {
        const user = accessUsers[index];
        if (user.isExisting && user.onRemove) {
            const success = await user.onRemove();
            if (!success) return;
        }
        setAccessUsers(accessUsers.filter((_, i) => i !== index));
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    return (
        <div>
            {accessUsers.length === 0 && (
                <p className="text-muted small">{t('inventory_noUsersYet')}</p>
            )}
            {accessUsers.map((user, index) => (
                <div key={index} className="border rounded p-3 mb-2 position-relative">
                    <button type="button"
                        className="btn-close position-absolute top-0 end-0 m-2"
                        onClick={() => removeAccessUser(index)} />
                    {user.isExisting && (
                        <span className="badge bg-secondary mb-2">
                            {t('inventory_existing')}
                        </span>
                    )}
                    <div style={{ position: "relative" }}>
                        <div className="input-group">
                            <input type="text" className="form-control"
                                placeholder={t('inventory_searchUserPlaceholder')}
                                value={user.emailOrUsername}
                                disabled={user.isExisting}
                                onChange={(e) => updateAccessUser(index, "emailOrUsername", e.target.value)}
                                onBlur={() => setTimeout(() => {
                                    if (activeSuggestionIndex === index) {
                                        setUserSuggestions([]);
                                        setActiveSuggestionIndex(-1);
                                    }
                                }, 200)}
                            />
                            {user.userId && !user.isExisting && (
                                <span className="input-group-text text-success">✓</span>
                            )}
                        </div>
                        {activeSuggestionIndex === index && userSuggestions.length > 0 && (
                            <ul className="list-group position-absolute w-100"
                                style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }}>
                                {userSuggestions.map((s) => (
                                    <li key={s.id}
                                        className="list-group-item list-group-item-action"
                                        style={{ cursor: "pointer" }}
                                        onMouseDown={() => selectSuggestion(index, s)}>
                                        <strong>{s.userName}</strong>
                                        <small className="text-muted ms-2">{s.email}</small>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            ))}
            <button className="btn btn-outline-secondary btn-sm mt-1" onClick={addAccessUser}>
                {t('inventory_addUser')}
            </button>
        </div>
    );
}
