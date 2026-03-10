import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";
import useTheme from "./useTheme"
import { useTranslation } from "react-i18next";
function AdminPage() {
    const { theme, toggleTheme } = useTheme();
    const [users, setUsers] = useState([]);

    const { t, i18n } = useTranslation();
    const langMap = { 1: 'en', 2: 'ru' };
    const api_url = "https://itransitionprojectwork-production.up.railway.app";
    const navigate = useNavigate();
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [checkedUsers, setCheckedUsers] = useState([]);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState("admin-page  ");
    const [profileData, setProfileData] = useState(null);
    const getUserIdFromToken = useCallback(() => {
        const token = localStorage.getItem("userToken");
        if (!token) return null;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            const id = payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"]
                ?? payload.nameid ?? payload.sub;
            return parseInt(id, 10) || null;
        } catch { return null; }
    }, []);

    const fetchProfile = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const userId = getUserIdFromToken();
            if (!token || !userId) return;
            const response = await axios.get(`${api_url}/api/User/get/${userId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setProfileData(response.data.data);
        } catch { }
    }, [getUserIdFromToken]);

    useEffect(() => { fetchProfile(); }, [fetchProfile]);

    // Auto-update theme in DB if user toggles it using the navbar
    useEffect(() => {
        const autoSaveTheme = async () => {
            const token = localStorage.getItem("userToken");
            const userId = getUserIdFromToken();
            if (!token || !userId || !profileData) return;

            // Only save if it actually differs from what's in the DB to avoid infinite loops
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
                    await axios.put(`${api_url}/api/User/update/${userId}`, payload, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    setProfileData(prev => ({ ...prev, theme: newThemeVal }));
                } catch (e) { console.error("Auto-saving theme failed", e); }
            }
        };
        autoSaveTheme();
    }, [theme, profileData, getUserIdFromToken, api_url]);
    const logout = async () => {
        localStorage.removeItem("userToken");
        navigate("/login")
    }
    const [editForm, setEditForm] = useState({
        id: "",
        fullName: "",
        userName: "",
        email: "",
        password: "",
        role: 1,
        isBlocked: false,
        language: 1,
        theme: 1
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [total, setTotal] = useState(0);
    const totalPages = Math.ceil(total / filter.pageSize);
    const [activeAdminTab, setActiveAdminTab] = useState("users");
    const [userSearch, setUserSearch] = useState("");

    // Inventory state
    const [inventories, setInventories] = useState([]);
    const [invFilter, setInvFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [invTotal, setInvTotal] = useState(0);
    const invTotalPages = Math.ceil(invTotal / invFilter.pageSize);
    const [checkedInvs, setCheckedInvs] = useState([]);
    const [invSearch, setInvSearch] = useState("");
    const categoryLabels = {
        1: t('equipment'),
        2: t('furniture'),
        3: t('book'),
        4: t('technology'),
        5: t('other')
    };

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/User/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    PageNumber: filter.pageNumber,
                    PageSize: filter.pageSize,
                    SearchTerm: userSearch || undefined
                }
            });
            setUsers(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setUsers([]);
        }
    }, [api_url, filter, navigate, userSearch]);

    const deleteSelected = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            const response = await axios.delete(`${api_url}/api/User/delete-selected`, {
                headers: { Authorization: `Bearer ${token}` },
                data: checkedUsers
            });
            setMessage({ text: response.data.message || "Users deleted", type: "success" });
            setCheckedUsers([]);
            await fetchUsers();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to delete users", type: "danger" });
            }
        } finally { setLoading(false); }
    };

    const blockSelected = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            const response = await axios.put(`${api_url}/api/User/block`,
                checkedUsers, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ text: response.data.message || "Users blocked", type: "success" });
            setCheckedUsers([]);
            await fetchUsers();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to block users", type: "danger" });
            }
        } finally { setLoading(false); }
    };
    const unblockSelected = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            const response = await axios.put(`${api_url}/api/User/unblock`,
                checkedUsers, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ text: response.data.message || "Users unblocked", type: "success" });
            setCheckedUsers([]);
            await fetchUsers();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to unblock users", type: "danger" });
            }
        } finally { setLoading(false); }
    };
    const adminSelected = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            const response = await axios.put(`${api_url}/api/User/making-admin`,
                checkedUsers, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ text: response.data.message || "Users made admin", type: "success" });
            setCheckedUsers([]);
            await fetchUsers();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to admin users", type: "danger" });
            }
        } finally { setLoading(false); }
    };
    const unadminSelected = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            const response = await axios.put(`${api_url}/api/User/removing-admin`,
                checkedUsers, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage({ text: response.data.message || "Users unadmined", type: "success" });
            setCheckedUsers([]);
            await fetchUsers();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to unadmin users", type: "danger" });
            }
        } finally { setLoading(false); }
    };
    //Check Users
    function handleCheckingUsers(id) {
        setCheckedUsers(c => c.includes(id) ? c.filter(i => i !== id) : [...c, id]);
    }
    function handleCheckingAllUsers() {
        if (checkedUsers.length === users.length && users.length > 0) setCheckedUsers([]);
        else setCheckedUsers(users.map(i => i.id));
    }

    function openEditModal(user) {
        setSelectedUser(user);
        setEditForm({
            id: user.id ?? "",
            fullName: user.fullName ?? "",
            userName: user.userName ?? "",
            email: user.email ?? "",
            password: "",
            role: user.role ?? 1,
            isBlocked: !!user.isBlocked,
            language: user.language ?? 1,
            theme: user.theme ?? 1
        });
        setActiveAdminTab("edit_user");
    }

    function closeEditModal() {
        setActiveAdminTab("users");
        setSelectedUser(null);
        setEditForm({
            id: "",
            fullName: "",
            userName: "",
            email: "",
            password: "",
            role: 1,
            isBlocked: false,
            language: 1,
            theme: 1
        });
    }

    async function updateUser() {
        if (!selectedUser) return;
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");

        try {
            setSaving(true);

            // Handle username update if changed
            if (editForm.userName !== selectedUser.userName) {
                try {
                    await axios.put(`${api_url}/api/User/update-username/${selectedUser.id}?username=${encodeURIComponent(editForm.userName)}`, {}, {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                } catch (usernameError) {
                    if (usernameError.response?.status === 400 || usernameError.response?.status === 409) {
                        setMessage({ text: t("register_userExists") || "Username already exists", type: "danger" });
                        return; // Stop update if username fails
                    }
                    throw usernameError; // re-throw other errors
                }
            }

            const payload = {
                Id: selectedUser.id,
                FullName: editForm.fullName,
                PasswordHash: editForm.password || "",
                IsBlocked: !!editForm.isBlocked,
                Role: Number(editForm.role),
                Language: Number(editForm.language),
                Theme: Number(editForm.theme),
            };
            console.log("Update payload:", JSON.stringify(payload));

            const response = await axios.put(
                `${api_url}/api/User/update/${selectedUser.id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage({ text: response.data.message || "User updated", type: "success" });
            closeEditModal();
            await fetchUsers();
        } catch (error) {
            console.log("Update error:", error.response?.status, error.response?.data);
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                const msg = error.response?.data?.message || "Failed to update user";
                setMessage({ text: msg, type: "danger" });
            }
        } finally {
            setSaving(false);
        }
    }

    // Inventory functions
    const fetchInventories = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/Inventory/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    PageNumber: invFilter.pageNumber,
                    PageSize: invFilter.pageSize,
                    // backend may ignore this; kept for future FTS support
                    SearchTerm: invSearch || undefined
                }
            });
            setInventories(response.data.data || []);
            setInvTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to fetch inventories";
            setMessage({ text: msg, type: "danger" });
            setInventories([]);
        }
    }, [api_url, invFilter]);

    const deleteSelectedInvs = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            for (const id of checkedInvs) {
                await axios.delete(`${api_url}/api/Inventory/delete/${id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setMessage({ text: "Inventories deleted", type: "success" });
            setCheckedInvs([]);
            await fetchInventories();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to delete inventories", type: "danger" });
            }
        } finally { setLoading(false); }
    };

    function handleCheckingInvs(id) {
        setCheckedInvs(c => c.includes(id) ? c.filter(i => i !== id) : [...c, id]);
    }
    function handleCheckingAllInvs() {
        if (checkedInvs.length === inventories.length && inventories.length > 0) setCheckedInvs([]);
        else setCheckedInvs(inventories.map(i => i.id));
    }

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { fetchInventories(); }, [fetchInventories]);

    useEffect(() => {
        if (message.text) {
            const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    return (
        <>
            <div className="m-1 mt-2 d-flex justify-content-center align-items-center shadow-lg rounded-4 p-2 pe-5 ps-5">
                <ul className="nav nav-pills w-100 gap-2 align-items-center">
                    <li className="nav-item">
                        <button
                            type="button"
                            className="nav-link active"
                            onClick={() => navigate("/dashboard")}
                        >
                            {t('dashboard')}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            type="button"
                            className="nav-link active"
                            onClick={() => navigate("/statistics")}
                        >
                            {t('statistics')}
                        </button>
                    </li>

                    <li className="ms-auto nav-item">
                        <button
                            type="button"
                            className="nav-link p-0"
                            onClick={() => navigate("/user-page")}
                        >
                            {profileData?.profileImage
                                ? <img
                                    src={profileData.profileImage}
                                    alt="avatar"
                                    style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover" }}
                                />
                                : <div style={{
                                    width: 35, height: 35, borderRadius: "50%",
                                    background: "#0d6efd", color: "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 14, fontWeight: "bold"
                                }}>
                                    {profileData?.fullName?.[0]?.toUpperCase() || "U"}
                                </div>
                            }
                        </button>
                    </li>
                    <li className="nav-item">
                        <button
                            type="button"
                            className="nav-link"
                            onClick={toggleTheme}
                            title="Toggle theme"
                        >
                            {theme === "light" ? "🌙" : "☀️"}
                        </button>
                    </li>
                    <li>
                        <button
                            onClick={logout}
                            className="btn btn-outline-danger btn-sm fw-bold px-3"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red" className="bi bi-box-arrow-right me-1" viewBox="0 0 16 16">
                                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
                                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
                            </svg>
                        </button>
                    </li>
                </ul>
            </div>
            <div className="container-fluid d-flex">
                <div className="col-md-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4 ">
                    <div className="d-flex flex-column gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-outline-secondary"
                            onClick={() => navigate("/dashboard")}
                        >
                            {t('allInventories')}
                        </button>
                        <button
                            type="button"
                            className={`btn ${activeAdminTab === "users" ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setActiveAdminTab("users")}
                        >
                            {t('user_control')}
                        </button>
                        <button
                            type="button"
                            className={`btn ${activeAdminTab === "inventories" ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => setActiveAdminTab("inventories")}
                        >
                            {t('inventory_control')}
                        </button>
                    </div>
                </div>
                <div className="col-md-9 p-4 mt-4 shadow-lg rounded-4">
                    {message.text && (
                        <div className={`alert alert-${message.type} mb-3`} role="alert">
                            {message.text}
                        </div>
                    )}
                    {activeAdminTab === "users" && (<>
                        <div className="d-flex justify-content-between align-items-center pb-2">
                            <h4 className="mb-0">{t("users")}</h4>
                            <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder={t('search_users')}
                                    value={userSearch}
                                    onChange={(e) => setUserSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end gap-2 mb-3">
                            <button
                                className="btn btn-danger"
                                onClick={deleteSelected}
                                disabled={loading || checkedUsers.length === 0}
                                title={t('delete_users')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                </svg>
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={blockSelected}
                                disabled={loading || checkedUsers.length === 0}
                                title={t('block_selected')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ban" viewBox="0 0 16 16">
                                    <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0" />
                                </svg>
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={unblockSelected}
                                disabled={loading || checkedUsers.length === 0}
                                title={t('unblock_selected')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ban" viewBox="0 0 16 16">
                                    <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0" />
                                </svg>
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={adminSelected}
                                disabled={loading || checkedUsers.length === 0}
                                title={t('admin_selected')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 20h20" />
                                    <path d="M5 20V10l7-7 7 7v10" />
                                    <path d="M12 12v6" />
                                    <path d="M9 15h6" />
                                </svg>
                            </button>
                            <button
                                className="btn btn-outline-secondary"
                                onClick={unadminSelected}
                                disabled={loading || checkedUsers.length === 0}
                                title={t('unadmin_selected')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M2 20h20" />
                                    <path d="M5 20V10l7-7 7 7v10" />
                                    <path d="M9 15h6" />
                                </svg>
                            </button>
                        </div>
                        <table className="table table-striped justify-content-center">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" className="form-check-input"
                                            onChange={handleCheckingAllUsers}
                                            checked={users.length > 0 && checkedUsers.length === users.length}
                                        />
                                    </th>
                                    <th>Id</th>
                                    <th>{t('register_fullName')}</th>
                                    <th>{t('register_username')}</th>
                                    <th>Email</th>
                                    <th>{t('role')}</th>
                                    <th>{t("status")}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr
                                        key={user.id}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => openEditModal(user)}
                                        title={t('click_to_update')}
                                    >
                                        <td onClick={(e) => e.stopPropagation()}>
                                            <input type="checkbox" className="form-check-input"
                                                checked={checkedUsers.includes(user.id)}
                                                onChange={() => handleCheckingUsers(user.id)}
                                            />
                                        </td>
                                        <td>{user.id}</td>
                                        <td>{user.fullName}</td>
                                        <td>{user.userName}</td>
                                        <td>{user.email}</td>
                                        <td>{user.role == 0 ? t('admin') : t('user')}</td>
                                        <td>{user.isBlocked ? t('blocked') : t('active')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        <nav>
                            <ul className="pagination d-flex justify-content-center">
                                <li className={`page-item ${filter.pageNumber <= 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: p.pageNumber - 1 }))} disabled={filter.pageNumber <= 1}>{t('previous')}</button>
                                </li>
                                {[...Array(totalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    return (
                                        <li key={pageNum} className={`page-item ${filter.pageNumber === pageNum ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: pageNum }))}>{pageNum}</button>
                                        </li>
                                    );
                                })}
                                <li className={`page-item ${filter.pageNumber >= totalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: p.pageNumber + 1 }))} disabled={filter.pageNumber >= totalPages}>{t('next')}</button>
                                </li>
                            </ul>
                        </nav>
                    </>)}

                    {activeAdminTab === "inventories" && (<>
                        <div className="d-flex justify-content-between align-items-center pb-2">
                            <h4 className="mb-0">{t('dashboard_availableInventories')}</h4>
                            <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                                <input
                                    type="search"
                                    className="form-control"
                                    placeholder={t('dashboard_searchInventories')}
                                    value={invSearch}
                                    onChange={(e) => setInvSearch(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="d-flex justify-content-end mt-2 gap-2 mb-4">
                            <button
                                className="btn btn-danger"
                                onClick={deleteSelectedInvs}
                                disabled={loading || checkedInvs.length === 0}
                                title={t('user_deleteSelectedInventories')}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                    <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                </svg>
                            </button>
                        </div>
                        <table className="table table-striped justify-content-center">
                            <thead>
                                <tr>
                                    <th>
                                        <input type="checkbox" className="form-check-input"
                                            onChange={handleCheckingAllInvs}
                                            checked={inventories.length > 0 && checkedInvs.length === inventories.length}
                                        />
                                    </th>
                                    <th>Id</th>
                                    <th>{t('title')}</th>
                                    <th>{t('category')}</th>
                                    <th>{t('creator')}</th>
                                    <th>{t('public')}</th>
                                </tr>
                            </thead>
                            <tbody>
                                {inventories
                                    .filter(inv => {
                                        const q = invSearch.trim().toLowerCase();
                                        if (!q) return true;
                                        return inv.title?.toLowerCase().includes(q) ||
                                            inv.creatorName?.toLowerCase().includes(q) ||
                                            (categoryLabels[inv.category] || "").toLowerCase().includes(q);
                                    })
                                    .map((inv) => (
                                        <tr key={inv.id} style={{ cursor: "pointer" }}
                                            onClick={() => navigate(`/inventory/${inv.id}`)}
                                        >
                                            <td onClick={(e) => e.stopPropagation()}>
                                                <input type="checkbox" className="form-check-input"
                                                    checked={checkedInvs.includes(inv.id)}
                                                    onChange={() => handleCheckingInvs(inv.id)}
                                                />
                                            </td>
                                            <td>{inv.id}</td>
                                            <td>{inv.title}</td>
                                            <td>{categoryLabels[inv.category] || inv.category}</td>
                                            <td>{inv.creatorName}</td>
                                            <td>{inv.isPublic ? t('yes') : t('no')}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        <nav>
                            <ul className="pagination d-flex justify-content-center">
                                <li className={`page-item ${invFilter.pageNumber <= 1 ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setInvFilter(p => ({ ...p, pageNumber: p.pageNumber - 1 }))} disabled={invFilter.pageNumber <= 1}>{t('previous')}</button>
                                </li>
                                {[...Array(invTotalPages)].map((_, index) => {
                                    const pageNum = index + 1;
                                    return (
                                        <li key={pageNum} className={`page-item ${invFilter.pageNumber === pageNum ? 'active' : ''}`}>
                                            <button className="page-link" onClick={() => setInvFilter(p => ({ ...p, pageNumber: pageNum }))}>{pageNum}</button>
                                        </li>
                                    );
                                })}
                                <li className={`page-item ${invFilter.pageNumber >= invTotalPages ? 'disabled' : ''}`}>
                                    <button className="page-link" onClick={() => setInvFilter(p => ({ ...p, pageNumber: p.pageNumber + 1 }))} disabled={invFilter.pageNumber >= invTotalPages}>{t('next')}</button>
                                </li>
                            </ul>
                        </nav>
                    </>)}

                    {/* Edit User Tab */}
                    {activeAdminTab === "edit_user" && (
                        <div className="card shadow mt-4 mb-4">
                            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                                <h5 className="mb-0">{t('update_user')}</h5>
                                <button type="button" className="btn-close btn-close-white" aria-label="Close" onClick={closeEditModal} />
                            </div>
                            <div className="card-body">
                                <div className="row g-3">
                                    <div className="col-md-3">
                                        <label className="form-label">Id</label>
                                        <input className="form-control" value={editForm.id} disabled />
                                    </div>
                                    <div className="col-md-9">
                                        <label className="form-label">{t('register_fullName')}</label>
                                        <input
                                            className="form-control"
                                            value={editForm.fullName}
                                            onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">{t('register_username')}</label>
                                        <input
                                            className="form-control"
                                            value={editForm.userName}
                                            onChange={(e) => setEditForm(f => ({ ...f, userName: e.target.value }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">Email</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            value={editForm.email}
                                            disabled
                                            title={t('email_cannot_change')}
                                        />
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">{t('role')}</label>
                                        <select
                                            className="form-select"
                                            value={editForm.role}
                                            onChange={(e) => setEditForm(f => ({ ...f, role: Number(e.target.value) }))}
                                        >
                                            <option value={0}>Admin</option>
                                            <option value={1}>User</option>
                                        </select>
                                    </div>

                                    <div className="col-md-6 d-flex align-items-end">
                                        <div className="form-check">
                                            <input
                                                className="form-check-input"
                                                type="checkbox"
                                                id="isBlocked"
                                                checked={!!editForm.isBlocked}
                                                onChange={(e) => setEditForm(f => ({ ...f, isBlocked: e.target.checked }))}
                                            />
                                            <label className="form-check-label" htmlFor="isBlocked">
                                                {t('blocked')}
                                            </label>
                                        </div>
                                    </div>

                                    <div className="col-md-6">
                                        <label className="form-label">{t('language')}</label>
                                        <select
                                            className="form-select"
                                            value={editForm.language}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setEditForm(f => ({ ...f, language: v }));
                                                const lang = langMap[v] || 'en';
                                                i18n.changeLanguage(lang);
                                                localStorage.setItem('userLanguage', lang);
                                            }}
                                        >
                                            <option value={1}>English</option>
                                            <option value={2}>Русский</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('theme')}</label>
                                        <select
                                            className="form-select"
                                            value={editForm.theme}
                                            onChange={(e) => setEditForm(f => ({ ...f, theme: Number(e.target.value) }))}
                                        >
                                            <option value={1}>{t('light')}</option>
                                            <option value={2}>{t('dark')}</option>
                                        </select>
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label">{t('register_password')} ({t('leave_blank')})</label>
                                        <input
                                            type="password"
                                            className="form-control"
                                            value={editForm.password}
                                            onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="card-footer d-flex justify-content-end gap-2">
                                <button type="button" className="btn btn-outline-secondary" onClick={closeEditModal} disabled={saving}>
                                    {t('cancel')}
                                </button>
                                <button type="button" className="btn btn-primary" onClick={updateUser} disabled={saving}>
                                    {saving ? t("saving") : t("save")}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </>);
}
export default AdminPage;