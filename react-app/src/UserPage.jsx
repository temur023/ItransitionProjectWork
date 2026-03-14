import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import TagInput from "./TagInput";
import { useTranslation } from "react-i18next";
import AvatarUpload from "./AvatarUpload";
import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
    SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import SortableItem from "./SortableItem";
import api from "./useApi";
import useAuth from "./useAuth";
import useProfile from "./useProfile";
import Navbar from "./Navbar";
import Pagination from "./Pagination";
import UserSearch from "./UserSearch";
import { getCategoryLabels } from "./constants";

function UserPage() {
    const [inventories, setInventories] = useState([]);
    const [formData, setFormData] = useState({
        title: "", description: "", category: 1,
        Version: 1, CreatedById: 0, isPublic: true, creatorName: ""
    });
    const { t, i18n } = useTranslation();
    const langMap = { 1: 'en', 2: 'ru' };
    const categoryLabels = getCategoryLabels(t);

    const [checkedInvs, setCheckedInvs] = useState([]);
    const [customIdElements, setCustomIdElements] = useState([]);
    const [newInventoryId, setNewInventoryId] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTags, setSelectedTags] = useState([]);
    const [activeTab, setActiveTab] = useState("own");
    const [inventorySearch, setInventorySearch] = useState("");
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });
    const savedLang = localStorage.getItem('userLanguage') || 'ru';
    const initLangId = savedLang === 'en' ? 1 : 2;
    const [profileForm, setProfileForm] = useState({ fullName: "", language: initLangId, theme: 1, password: "" });
    const [profileSaving, setProfileSaving] = useState(false);
    const [accessUsers, setAccessUsers] = useState([]);
    const navigate = useNavigate();
    const totalPages = Math.ceil(total / filter.pageSize);

    const { getUserIdFromToken, logout } = useAuth();
    const { profileData, setProfileData, fetchProfile, theme, toggleTheme, setPreferredTheme } = useProfile();

    // DnD sensors
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // DnD handlers
    function handleIdElementDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setCustomIdElements((items) => {
            const oldIndex = items.findIndex(el => el.id === active.id);
            const newIndex = items.findIndex(el => el.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }

    function handleFieldDragEnd(event) {
        const { active, over } = event;
        if (!over || active.id === over.id) return;
        setFields((items) => {
            const oldIndex = items.findIndex(f => f.id === active.id);
            const newIndex = items.findIndex(f => f.id === over.id);
            return arrayMove(items, oldIndex, newIndex);
        });
    }

    // Close create tab and reset
    const closeCreateTab = () => {
        setActiveTab("own");
        setNewInventoryId(null);
        setFormData({ title: "", description: "", category: 1, isPublic: true });
        setFields([]);
        setAccessUsers([]);
        setSelectedTags([]);
        setCustomIdElements([]);
    };

    // Sync profile form when profileData loads
    useEffect(() => {
        if (profileData) {
            const themeVal = profileData.theme ?? profileData.Theme ?? 1;
            const langVal = profileData.language ?? profileData.Language ?? 1;
            const langStr = langVal === 1 ? 'en' : 'ru';

            setProfileForm({
                fullName: profileData.fullName || "",
                userName: profileData.userName || "",
                language: langVal,
                theme: themeVal,
                password: ""
            });
            setPreferredTheme(themeVal);
            i18n.changeLanguage(langStr);
            localStorage.setItem('userLanguage', langStr);
        }
    }, [profileData]);

    const updateProfile = async () => {
        try {
            setProfileSaving(true);
            const userId = getUserIdFromToken();
            if (!userId) throw new Error("Cannot determine current user id from token.");
            if (profileForm.userName !== profileData.userName) {
                try {
                    await api.put(
                        `/api/User/update-username/${userId}?username=${encodeURIComponent(profileForm.userName)}`,
                        {}
                    );
                } catch (usernameError) {
                    if (usernameError.response?.status === 400) {
                        setMessage({ text: t("register_userExists") || "Username already exists", type: "danger" });
                        return;
                    }
                    throw usernameError;
                }
            }
            const payload = {
                fullName: profileForm.fullName,
                passwordHash: profileForm.password,
                language: Number(profileForm.language),
                theme: Number(profileForm.theme),
            };
            const response = await api.put(`/api/User/update/${userId}`, payload);
            setMessage({ text: response.data.message || "Profile updated", type: "success" });
            setProfileForm(f => ({ ...f, password: "" }));
            setPreferredTheme(Number(profileForm.theme));
            await fetchProfile();
        } catch (error) {
            if (error.response?.status === 401) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: error.response?.data?.message || "Failed to update profile", type: "danger" });
            }
        } finally { setProfileSaving(false); }
    };

    // Inventories
    const fetchInventories = useCallback(async () => {
        try {
            const endpoint = activeTab === "own" ? "get-own" : "get-with-access";
            const response = await api.get(`/api/UserPage/${endpoint}`, {
                params: { PageNumber: filter.pageNumber, PageSize: filter.pageSize }
            });
            setInventories(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Action failed", type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setInventories([]);
        }
    }, [filter, activeTab]);

    const deleteSelected = async () => {
        try {
            setLoading(true);
            const response = await api.delete(`/api/UserPage/delete-own`, {
                data: checkedInvs
            });
            setMessage({ text: response.data.message || "Inventories deleted", type: "success" });
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

    // Checkbox helpers
    function handleCheckingInvs(id) {
        setCheckedInvs(c => c.includes(id) ? c.filter(i => i !== id) : [...c, id]);
    }
    function handleCheckingAllInvs() {
        if (checkedInvs.length === inventories.length && inventories.length > 0) setCheckedInvs([]);
        else setCheckedInvs(inventories.map(u => u.id));
    }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    // Custom ID elements
    const addIdElement = () => {
        setCustomIdElements([...customIdElements, {
            id: String(Date.now()) + Math.random().toString(36).slice(2),
            type: 1, value: "", format: ""
        }]);
    };
    const updateIdElement = (id, key, val) => {
        setCustomIdElements(prev => prev.map(el => el.id === id ? { ...el, [key]: val } : el));
    };
    const removeIdElement = (id) => {
        setCustomIdElements(prev => prev.filter(el => el.id !== id));
    };
    const generatePreview = () => {
        return customIdElements.map(el => {
            const type = parseInt(el.type);
            switch (type) {
                case 1: return el.value || "TEXT";
                case 2: return "A1B2C";
                case 3: return "F3E2D1A0";
                case 4: return "123456";
                case 5: return "123456789";
                case 6: return "a1b2c3d4";
                case 7: return new Date().toISOString().slice(0, 10).replace(/-/g, "");
                case 8: return el.format ? "1".padStart(parseInt(el.format.replace(/\D/g, "")) || 1, "0") : "1";
                default: return "?";
            }
        }).join("");
    };

    // Fields
    const addField = () => {
        setFields([...fields, {
            id: String(Date.now()) + Math.random().toString(36).slice(2),
            title: "", description: "", type: 1,
            showInTable: false, order: fields.length + 1,
            maxSingleLineLength: null, maxMultiLineLength: null,
            minNumberLength: null, maxNumberLength: null,
        }]);
    };

    const updateField = (id, key, value) => {
        setFields(prev => prev.map(f => {
            if (f.id !== id) return f;
            const updated = { ...f, [key]: value };
            if (key === "type") {
                updated.maxSingleLineLength = null;
                updated.maxMultiLineLength = null;
                updated.minNumberLength = null;
                updated.maxNumberLength = null;
            }
            return updated;
        }));
    };

    const removeField = (id) => {
        setFields(prev => prev.filter(f => f.id !== id));
    };

    // Create inventory
    const createInventory = async () => {
        try {
            const payload = {
                Title: formData.title,
                Description: formData.description,
                Category: parseInt(formData.category),
                IsPublic: formData.isPublic,
                Tags: selectedTags,
                Version: 1,
                CreatedById: 0,
                CustomIdFormatJson: JSON.stringify(
                    customIdElements.map(el => ({
                        Type: parseInt(el.type),
                        Value: el.value || null,
                        Format: el.format || null
                    }))
                ),
            };
            const response = await api.post(`/api/Inventory/create`, payload);
            setNewInventoryId(response.data.data?.id ?? response.data.id);
            setMessage({ text: "Inventory created! Now add fields.", type: "success" });
        } catch (error) {
            setMessage({ text: error.response?.data?.message || error.message || "Failed to create inventory", type: "danger" });
        }
    };

    // Save fields
    const saveAllFields = async (inventoryId) => {
        try {
            await Promise.all(fields.map(field =>
                api.post(`/api/InventoryField/create`, {
                    InvId: inventoryId,
                    Title: field.title,
                    Description: field.description,
                    MaxSingleLineLength: field.maxSingleLineLength,
                    MaxMultiLineLength: field.maxMultiLineLength,
                    MinNumberLength: field.minNumberLength,
                    MaxNumberLength: field.maxNumberLength,
                    Type: parseInt(field.type),
                    ShowInTable: field.showInTable,
                    Order: field.order
                })
            ));
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to save fields";
            setMessage({ text: msg, type: "danger" });
            throw error;
        }
    };

    // Save access users
    const saveAllAccessUsers = async () => {
        try {
            for (const user of accessUsers) {
                await api.post(`/api/InventoryUserAccess/create`, {
                    InventoryId: newInventoryId,
                    UserId: user.userId,
                    EmailOrUsername: user.emailOrUsername
                });
            }
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to save access users";
            setMessage({ text: msg, type: "danger" });
            throw error;
        }
    };

    // Effects
    useEffect(() => {
        const delay = setTimeout(() => fetchInventories(), 500);
        return () => clearTimeout(delay);
    }, [fetchInventories]);

    useEffect(() => { setCheckedInvs([]); }, [inventories]);

    useEffect(() => {
        if (!message.text) return;
        const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
        return () => clearTimeout(timer);
    }, [message]);

    useEffect(() => {
        setProfileForm(prev => ({ ...prev, theme: theme === "dark" ? 2 : 1 }));
    }, [theme]);

    return (
        <>
            <Navbar profileData={profileData} theme={theme} toggleTheme={toggleTheme} logout={logout} />

            <div className="container-fluid d-flex">
                {/* Sidebar */}
                <div className="col-md-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4">
                    <ul className="nav nav-underline nav-fill flex-column mt-4">
                        {[
                            { key: "own", label: t('user_myInventories') },
                            { key: "access", label: t('user_sharedWithMe') },
                            { key: "profile", label: t('user_myProfile') },
                        ].map(({ key, label }) => (
                            <li key={key} className="nav-item">
                                <button type="button"
                                    className={`nav-link fw-bolder ${activeTab === key ? "active" : ""}`}
                                    onClick={() => setActiveTab(key)}>
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main content */}
                <div className="col-md-9 mt-4 shadow-lg rounded-4 p-4">
                    {message.text && (
                        <div className={`alert alert-${message.type} alert-dismissible mb-3`}>
                            {message.text}
                            <button type="button" className="btn-close"
                                onClick={() => setMessage({ text: "", type: "" })} />
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <>
                            <h4 className="mb-4">{t('user_myProfile')}</h4>
                            {profileData && (
                                <div className="row g-3" style={{ maxWidth: 600 }}>
                                    <div className="col-12 d-flex justify-content-center">
                                        <AvatarUpload
                                            uploadUrl={`${api.defaults.baseURL}/api/Upload/profile-image/${getUserIdFromToken()}`}
                                            currentImage={profileData?.profileImage}
                                            onUpload={(url) => setProfileData(p => ({ ...p, profileImage: url }))}
                                        />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('username')}</label>
                                        <input className="form-control" value={profileForm.userName ?? ""}
                                            onChange={(e) => setProfileForm(f => ({ ...f, userName: e.target.value }))} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('email')}</label>
                                        <input className="form-control" value={profileData.email || ""} disabled />
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('fullName')}</label>
                                        <input className="form-control" value={profileForm.fullName}
                                            onChange={(e) => setProfileForm(f => ({ ...f, fullName: e.target.value }))} />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('language')}</label>
                                        <select className="form-select" value={profileForm.language}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setProfileForm(f => ({ ...f, language: v }));
                                                const lang = langMap[v] || 'en';
                                                i18n.changeLanguage(lang);
                                                localStorage.setItem('userLanguage', lang);
                                            }}>
                                            <option value={1}>English</option>
                                            <option value={2}>Русский</option>
                                        </select>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label">{t('theme')}</label>
                                        <select className="form-select" value={profileForm.theme}
                                            onChange={(e) => {
                                                const v = Number(e.target.value);
                                                setProfileForm(f => ({ ...f, theme: v }));
                                                setPreferredTheme(v);
                                            }}>
                                            <option value={1}>{t('light')}</option>
                                            <option value={2}>{t('dark')}</option>
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <label className="form-label">{t('newPassword')}</label>
                                        <input type="password" className="form-control" value={profileForm.password}
                                            onChange={(e) => setProfileForm(f => ({ ...f, password: e.target.value }))} />
                                    </div>
                                    <div className="col-12 mt-3">
                                        <button className="btn btn-primary" onClick={updateProfile} disabled={profileSaving}>
                                            {profileSaving ? t('saving_dots') : t('saveChanges')}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {/* Own / Access Inventories Tab */}
                    {(activeTab === "own" || activeTab === "access") && (
                        <>
                            <div className="d-flex justify-content-between align-items-center mb-3 gap-2 flex-wrap">
                                <div style={{ maxWidth: "250px", width: "100%" }}>
                                    <input type="search" className="form-control"
                                        placeholder={activeTab === "own"
                                            ? t('user_searchMyInventories')
                                            : t('user_searchSharedInventories')}
                                        value={inventorySearch}
                                        onChange={(e) => setInventorySearch(e.target.value)} />
                                </div>
                                <div className="d-flex gap-2">
                                    <button className="btn btn-danger" onClick={deleteSelected}
                                        disabled={loading || checkedInvs.length === 0} title="Delete selected">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
                                            fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                        </svg>
                                    </button>
                                    <button className="btn btn-success" onClick={() => {
                                        setFormData({ title: "", description: "", category: 1, isPublic: true });
                                        setNewInventoryId(null);
                                        setFields([]);
                                        setAccessUsers([]);
                                        setSelectedTags([]);
                                        setCustomIdElements([]);
                                        setActiveTab("create");
                                    }}>
                                        {t('user_newInventory')}
                                    </button>
                                </div>
                            </div>

                            <table className="table table-striped table-hover mb-3">
                                <thead>
                                    <tr>
                                        <th>
                                            <input type="checkbox" className="form-check-input"
                                                onChange={handleCheckingAllInvs}
                                                checked={inventories.length > 0 && checkedInvs.length === inventories.length} />
                                        </th>
                                        <th>{t('title')}</th>
                                        <th>{t('category')}</th>
                                        <th>{t('creator')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventories
                                        .filter(inv => inv !== null)
                                        .filter(inv => {
                                            const q = inventorySearch.trim().toLowerCase();
                                            if (!q) return true;
                                            return (
                                                inv.title?.toLowerCase().includes(q) ||
                                                String(inv.category ?? "").toLowerCase().includes(q) ||
                                                inv.creatorName?.toLowerCase().includes(q)
                                            );
                                        })
                                        .map((inv) => (
                                            <tr key={inv.id}>
                                                <td>
                                                    <input type="checkbox" className="form-check-input"
                                                        checked={checkedInvs.includes(inv.id)}
                                                        onChange={() => handleCheckingInvs(inv.id)} />
                                                </td>
                                                <td onClick={() => navigate(`/inventory/${inv.id}`)}
                                                    style={{ cursor: "pointer" }}>{inv.title}</td>
                                                <td onClick={() => navigate(`/inventory/${inv.id}`)}
                                                    style={{ cursor: "pointer" }}>
                                                    {categoryLabels[inv.category] || inv.category}
                                                </td>
                                                <td onClick={() => navigate(`/inventory/${inv.id}`)}
                                                    style={{ cursor: "pointer" }}>{inv.creatorName}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </>
                    )}

                    {/* Create Inventory Tab */}
                    {activeTab === "create" && (
                        <div>
                            <div className="d-flex justify-content-between align-items-center mb-4">
                                <h4 className="mb-0">{t('user_createNewInventory')}</h4>
                                <button type="button" className="btn-close" aria-label="Close"
                                    onClick={closeCreateTab} />
                            </div>

                            <fieldset disabled={!!newInventoryId}>
                                <div className="mb-3">
                                    <label className="form-label">{t('title')}</label>
                                    <input type="text" className="form-control" name="title"
                                        value={formData.title} onChange={handleChange} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('description')}</label>
                                    <textarea className="form-control" name="description"
                                        value={formData.description} onChange={handleChange} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('category')}</label>
                                    <select className="form-select" name="category"
                                        value={formData.category} onChange={handleChange}>
                                        <option value={1}>{t('equipment')}</option>
                                        <option value={2}>{t('furniture')}</option>
                                        <option value={3}>{t('book')}</option>
                                        <option value={4}>{t('technology')}</option>
                                        <option value={5}>{t('other')}</option>
                                    </select>
                                </div>
                                <div className="mb-3 form-check">
                                    <input type="checkbox" className="form-check-input" name="isPublic"
                                        checked={formData.isPublic}
                                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })} />
                                    <label className="form-check-label">{t('public')}</label>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">{t('tags')}</label>
                                    <TagInput value={selectedTags} onChange={setSelectedTags}
                                        apiUrl={api.defaults.baseURL} placeholder={t('inventory_tagsPlaceholder')} />
                                </div>

                                {/* Custom ID Format Builder */}
                                <div className="mb-3">
                                    <label className="form-label fw-bold">{t('user_customIdFormat')}</label>
                                    <p className="text-muted small mb-2">{t('user_customIdDescription')}</p>

                                    <DndContext sensors={sensors} collisionDetection={closestCenter}
                                        onDragEnd={handleIdElementDragEnd}>
                                        <SortableContext items={customIdElements.map(el => el.id)}
                                            strategy={verticalListSortingStrategy}>
                                            {customIdElements.map((el) => (
                                                <SortableItem key={el.id} id={el.id}
                                                    onRemove={() => removeIdElement(el.id)}>
                                                    <div className="row g-2 align-items-end ps-2">
                                                        <div className="col">
                                                            <label className="form-label small">{t('user_type')}</label>
                                                            <select className="form-select form-select-sm" value={el.type}
                                                                onChange={(e) => updateIdElement(el.id, "type", e.target.value)}>
                                                                <option value={1}>{t('user_fixedText')}</option>
                                                                <option value={2}>{t('user_random20Bit')}</option>
                                                                <option value={3}>{t('user_random32Bit')}</option>
                                                                <option value={4}>{t('user_random6Digit')}</option>
                                                                <option value={5}>{t('user_random9Digit')}</option>
                                                                <option value={6}>{t('user_guid')}</option>
                                                                <option value={7}>{t('user_dateTime')}</option>
                                                                <option value={8}>{t('user_sequence')}</option>
                                                            </select>
                                                        </div>
                                                        {parseInt(el.type) === 1 && (
                                                            <div className="col">
                                                                <label className="form-label small">{t('user_value')}</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder="e.g. INV-" value={el.value}
                                                                    onChange={(e) => updateIdElement(el.id, "value", e.target.value)} />
                                                            </div>
                                                        )}
                                                        {(parseInt(el.type) === 7 || parseInt(el.type) === 8) && (
                                                            <div className="col">
                                                                <label className="form-label small">{t('user_format')}</label>
                                                                <input type="text" className="form-control form-control-sm"
                                                                    placeholder={parseInt(el.type) === 7 ? "e.g. yyyyMMdd" : "e.g. D5"}
                                                                    value={el.format}
                                                                    onChange={(e) => updateIdElement(el.id, "format", e.target.value)} />
                                                            </div>
                                                        )}
                                                    </div>
                                                </SortableItem>
                                            ))}
                                        </SortableContext>
                                    </DndContext>

                                    <button type="button" className="btn btn-outline-secondary btn-sm mt-1"
                                        onClick={addIdElement}>
                                        {t('user_addElement')}
                                    </button>

                                    {customIdElements.length > 0 && (
                                        <div className="mt-2 p-2 bg-light rounded">
                                            <small className="text-muted">{t('user_preview')}: </small>
                                            <code>{generatePreview()}</code>
                                        </div>
                                    )}
                                </div>
                            </fieldset>

                            {/* Fields section */}
                            {newInventoryId && (
                                <div className="mt-2">
                                    <hr />
                                    <h6 className="mb-3">{t('inventory_fields')}</h6>
                                    {fields.length === 0 && (
                                        <p className="text-muted small">{t('user_noFieldsYet')}</p>
                                    )}
                                    <DndContext sensors={sensors} collisionDetection={closestCenter}
                                        onDragEnd={handleFieldDragEnd}>
                                        <SortableContext items={fields.map(f => f.id)}
                                            strategy={verticalListSortingStrategy}>
                                            {fields.map((field) => (
                                                <SortableItem key={field.id} id={field.id}
                                                    onRemove={() => removeField(field.id)}>
                                                    <div className="ps-2">
                                                        <div className="mb-2">
                                                            <label className="form-label">{t('title')}</label>
                                                            <input type="text" className="form-control" value={field.title}
                                                                onChange={(e) => updateField(field.id, "title", e.target.value)} />
                                                        </div>
                                                        <div className="mb-2">
                                                            <label className="form-label">{t('description')}</label>
                                                            <input type="text" className="form-control" value={field.description}
                                                                onChange={(e) => updateField(field.id, "description", e.target.value)} />
                                                        </div>
                                                        <div className="mb-2">
                                                            <label className="form-label">{t('inventory_fieldType')}</label>
                                                            <select className="form-select" value={field.type}
                                                                onChange={(e) => updateField(field.id, "type", e.target.value)}>
                                                                <option value={1}>{t('inventory_singleLinedText')}</option>
                                                                <option value={2}>{t('inventory_multiLinedText')}</option>
                                                                <option value={3}>{t('inventory_number')}</option>
                                                                <option value={4}>{t('inventory_boolean')}</option>
                                                                <option value={5}>{t('inventory_link')}</option>
                                                            </select>
                                                        </div>
                                                        {parseInt(field.type) === 1 && (
                                                            <div className="mb-2">
                                                                <label className="form-label">{t('inventory_maxSingleLineLength')}</label>
                                                                <input type="number" className="form-control"
                                                                    value={field.maxSingleLineLength || ""}
                                                                    onChange={(e) => updateField(field.id, "maxSingleLineLength",
                                                                        e.target.value ? parseInt(e.target.value) : null)} />
                                                            </div>
                                                        )}
                                                        {parseInt(field.type) === 2 && (
                                                            <div className="mb-2">
                                                                <label className="form-label">{t('inventory_maxMultiLineLength')}</label>
                                                                <input type="number" className="form-control"
                                                                    value={field.maxMultiLineLength || ""}
                                                                    onChange={(e) => updateField(field.id, "maxMultiLineLength",
                                                                        e.target.value ? parseInt(e.target.value) : null)} />
                                                            </div>
                                                        )}
                                                        {parseInt(field.type) === 3 && (
                                                            <div className="row mb-2">
                                                                <div className="col">
                                                                    <label className="form-label">{t('inventory_minNumber')}</label>
                                                                    <input type="number" className="form-control"
                                                                        value={field.minNumberLength || ""}
                                                                        onChange={(e) => updateField(field.id, "minNumberLength",
                                                                            e.target.value ? parseInt(e.target.value) : null)} />
                                                                </div>
                                                                <div className="col">
                                                                    <label className="form-label">{t('inventory_maxNumber')}</label>
                                                                    <input type="number" className="form-control"
                                                                        value={field.maxNumberLength || ""}
                                                                        onChange={(e) => updateField(field.id, "maxNumberLength",
                                                                            e.target.value ? parseInt(e.target.value) : null)} />
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div className="form-check">
                                                            <input type="checkbox" className="form-check-input"
                                                                checked={field.showInTable}
                                                                onChange={(e) => updateField(field.id, "showInTable", e.target.checked)} />
                                                            <label className="form-check-label">{t('inventory_showInTable')}</label>
                                                        </div>
                                                    </div>
                                                </SortableItem>
                                            ))}
                                        </SortableContext>
                                    </DndContext>
                                </div>
                            )}

                            {/* Access users section */}
                            {newInventoryId && !formData.isPublic && (
                                <div className="mt-2">
                                    <hr />
                                    <h6 className="mb-3">{t('user_usersWithWriteAccess')}</h6>
                                    <UserSearch accessUsers={accessUsers} setAccessUsers={setAccessUsers} />
                                </div>
                            )}

                            {/* Bottom actions */}
                            <div className="d-flex justify-content-end mt-4">
                                {!newInventoryId ? (
                                    <button className="btn btn-primary" onClick={createInventory}>
                                        {t('inventory_create')}
                                    </button>
                                ) : (
                                    <div className="d-flex gap-2">
                                        <button className="btn btn-success" onClick={addField}>
                                            {t('user_newField')}
                                        </button>
                                        <button className="btn btn-primary" onClick={async () => {
                                            try {
                                                await saveAllFields(newInventoryId);
                                                await saveAllAccessUsers();
                                                await fetchInventories();
                                                closeCreateTab();
                                            } catch { }
                                        }}>
                                            {t('user_done')}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Pagination */}
            {(activeTab === "own" || activeTab === "access") && (
                <Pagination currentPage={filter.pageNumber} totalPages={totalPages}
                    onPageChange={(page) => setFilter(p => ({ ...p, pageNumber: page }))} />
            )}
        </>
    );
}

export default UserPage;