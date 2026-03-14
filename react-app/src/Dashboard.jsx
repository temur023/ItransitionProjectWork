import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "./useApi";
import useAuth from "./useAuth";
import useProfile from "./useProfile";
import Navbar from "./Navbar";
import Pagination from "./Pagination";
import { getCategoryLabels } from "./constants";

function Dashboard() {
    const [inventories, setInventories] = useState([]);
    const { t } = useTranslation();
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [message, setMessage] = useState({ text: "", type: "" });
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);
    const [tags, setTags] = useState([]);
    const [selectedTags, setSelectedTags] = useState([]);
    const [inventoriesByTag, setInventoriesByTag] = useState([]);
    const searchTimerRef = useRef(null);

    const navigate = useNavigate();
    const { logout, isAdmin } = useAuth();
    const { profileData, theme, toggleTheme } = useProfile();
    const categoryLabels = getCategoryLabels(t);
    const totalPages = Math.ceil(total / filter.pageSize);

    const fetchInventories = useCallback(async () => {
        try {
            const response = await api.get(`/api/Inventory/get-all`, {
                params: { PageNumber: filter.pageNumber, PageSize: filter.pageSize }
            });
            setInventories(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setInventories([]);
        }
    }, [filter]);

    useEffect(() => {
        fetchInventories();
    }, [fetchInventories]);

    const fetchTags = useCallback(async () => {
        try {
            const response = await api.get(`/api/Tag/get-all`, {
                params: { PageNumber: 1, PageSize: 200 }
            });
            setTags(response.data.data || []);
        } catch {
            setTags([]);
        }
    }, []);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    const fetchInventoriesByTags = useCallback(async (tagNames) => {
        if (!tagNames || tagNames.length === 0) {
            setInventoriesByTag([]);
            return;
        }
        try {
            const params = new URLSearchParams();
            params.append("PageNumber", "1");
            params.append("PageSize", "50");
            tagNames.forEach((t) => params.append("Tags", t));
            const response = await api.get(`/api/Inventory/get-all?${params.toString()}`);
            setInventoriesByTag(response.data.data || []);
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to load inventories by tag", type: "danger" });
            setInventoriesByTag([]);
        }
    }, []);

    useEffect(() => {
        if (selectedTags.length > 0) fetchInventoriesByTags(selectedTags);
        else setInventoriesByTag([]);
    }, [selectedTags, fetchInventoriesByTags]);

    const toggleTag = (tagName) => {
        setSelectedTags((prev) =>
            prev.includes(tagName) ? prev.filter((t) => t !== tagName) : [...prev, tagName]
        );
    };

    // Auto-search with debounce
    useEffect(() => {
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        if (searchQuery.trim()) setSelectedTags([]);

        const q = searchQuery.trim();
        if (!q) {
            setIsSearching(false);
            setSearchResults([]);
            return;
        }

        searchTimerRef.current = setTimeout(async () => {
            try {
                setIsSearching(true);
                const response = await api.get(`/api/SearchContoller/search`, {
                    params: { q }
                });
                setSearchResults(response.data.inventories || []);
            } catch (error) {
                const msg = error.response?.data?.message || error.response?.data || "Search failed";
                setMessage({ text: String(msg), type: "danger" });
                setSearchResults([]);
            }
        }, 400);

        return () => clearTimeout(searchTimerRef.current);
    }, [searchQuery]);

    useEffect(() => {
        if (!message.text) return;
        const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
        return () => clearTimeout(timer);
    }, [message]);

    return (
        <>
            <Navbar profileData={profileData} theme={theme} toggleTheme={toggleTheme} logout={logout} />
            <div className="container-fluid d-flex">
                <div className="col-md-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4 ">
                    <div className="d-flex flex-column gap-2 mt-4">
                        <button type="button"
                            className={`btn ${!isSearching && selectedTags.length === 0 ? "btn-primary" : "btn-outline-secondary"}`}
                            onClick={() => { setSearchQuery(""); setSelectedTags([]); }}>
                            {t('allInventories')}
                        </button>

                        {isAdmin() && (
                            <button type="button" className="btn btn-outline-secondary"
                                onClick={() => navigate("/admin-page")}>
                                {t('adminPage')}
                            </button>
                        )}
                    </div>
                </div>
                <div className=" col-md-9 mt-4 shadow-lg rounded-4 p-4  ">
                    {message.text && (
                        <div className={`alert alert-${message.type} mb-3`}>{message.text}</div>
                    )}
                    {isSearching ? (
                        <>
                            <div className="d-flex justify-content-between align-items-center pb-2">
                                <h4 className="mb-0">{t('dashboard_searchResults')}</h4>
                                <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                                    <input type="search" className="form-control"
                                        placeholder={t('dashboard_searchInventories')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                            </div>
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('title')}</th>
                                        <th>{t('category')}</th>
                                        <th>{t('tags')}</th>
                                        <th>{t('creator')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {searchResults.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-muted">{t('dashboard_noInventories')}.</td>
                                        </tr>
                                    ) : (
                                        searchResults.map((inv) => (
                                            <tr key={inv.id} onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>
                                                <td>{inv.title}</td>
                                                <td>{categoryLabels[inv.category] || inv.category}</td>
                                                <td>{(inv.tags && inv.tags.length) ? inv.tags.map((t) => <span key={t} className="badge bg-secondary me-1">{t}</span>) : "—"}</td>
                                                <td>{inv.creatorName}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </>
                    ) : selectedTags.length > 0 ? (
                        <>
                            {tags.length > 0 && (
                                <div className="mb-2">
                                    <span className="me-2 text-muted small">{t('tags')} (click to toggle):</span>
                                    <div className="d-flex flex-wrap gap-1">
                                        {tags.map((t) => (
                                            <button key={t.id} type="button"
                                                className={`btn btn-sm ${selectedTags.includes(t.name) ? "btn-primary" : "btn-outline-primary"}`}
                                                onClick={() => toggleTag(t.name)}>
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center pb-2 flex-wrap gap-2">
                                <h4 className="mb-0">
                                    {t('inventories_withTags')}: &quot;{selectedTags.join(", ")}&quot;
                                </h4>
                                <button type="button" className="btn btn-outline-secondary btn-sm" onClick={() => setSelectedTags([])}>
                                    {t('clear_tags')}
                                </button>
                            </div>
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('title')}</th>
                                        <th>{t('category')}</th>
                                        <th>{t('tags')}</th>
                                        <th>{t('creator')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventoriesByTag.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="text-muted">{t('dashboard_noInventoriesWithTags')}</td>
                                        </tr>
                                    ) : (
                                        inventoriesByTag.map((inv) => (
                                            <tr key={inv.id} onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>
                                                <td>{inv.title}</td>
                                                <td>{categoryLabels[inv.category] || inv.category}</td>
                                                <td>{(inv.tags && inv.tags.length) ? inv.tags.map((t) => <span key={t} className="badge bg-secondary me-1">{t}</span>) : "—"}</td>
                                                <td>{inv.creatorName}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </>
                    ) : (
                        <>
                            <div className="d-flex justify-content-between align-items-center pb-2">
                                <h4 className="mb-0">{t('dashboard_availableInventories')}</h4>
                                <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                                    <input type="search" className="form-control"
                                        placeholder={t('dashboard_searchInventories')}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                            </div>
                            {tags.length > 0 && (
                                <div className="mb-3">
                                    <span className="me-2 text-muted small">{t('tags')}:</span>
                                    <div className="d-flex flex-wrap gap-1">
                                        {tags.map((t) => (
                                            <button key={t.id} type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => setSelectedTags([t.name])}>
                                                {t.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                            <table className="table table-striped table-hover">
                                <thead>
                                    <tr>
                                        <th>{t('title')}</th>
                                        <th>{t('category')}</th>
                                        <th>{t('tags')}</th>
                                        <th>{t('creator')}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventories.map((inv) => (
                                        <tr key={inv.id} onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>
                                            <td>{inv.title}</td>
                                            <td>{categoryLabels[inv.category] || inv.category}</td>
                                            <td>{(inv.tags && inv.tags.length) ? inv.tags.map((t) => <span key={t} className="badge bg-secondary me-1">{t}</span>) : "—"}</td>
                                            <td>{inv.creatorName}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <Pagination currentPage={filter.pageNumber} totalPages={totalPages}
                                onPageChange={(page) => setFilter(prev => ({ ...prev, pageNumber: page }))} />
                        </>
                    )}
                </div>
            </div>
        </>
    );
}
export default Dashboard;