import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import useTheme from './useTheme';
import { useTranslation } from "react-i18next";

function Dashboard() {
  
  const [inventories, setInventories] = useState([]);
  const {t} = useTranslation();
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [tags, setTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [inventoriesByTag, setInventoriesByTag] = useState([]);
  const api_url = "https://itransitionprojectwork-production.up.railway.app";
  const [activeTab, setActiveTab] = useState("dashboard");
  const searchTimerRef = useRef(null);
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
  const getUserRole = () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const role = payload.role ?? payload.Role ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      if (role != null) return role;
      if (Array.isArray(payload.roles)) return payload.roles[0];
      if (Array.isArray(payload.role)) return payload.role[0];
      return null;
    } catch { return null; }
  };
  const isAdmin = () => {
    const role = getUserRole();
    return role === "Admin" || role === "admin" || Number(role) === 0 || Number(role) === 1;
  };
  
  const navigate = useNavigate();
  const logout = async ()=>{
        localStorage.removeItem("userToken");
        navigate("/login")
  }
  const categoryLabels = { 
  1: t('equipment'), 
  2: t('furniture'), 
  3: t('book'), 
  4: t('technology'), 
  5: t('other') 
};
  const totalPages = Math.ceil(total / filter.pageSize);
  const { theme, toggleTheme } = useTheme();
  const fetchInventories = useCallback(async () => {
    try {
      const token = localStorage.getItem("userToken");
      const endpoint = "/api/Inventory/get-all";
      const response = await axios.get(`${api_url}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
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
      const response = await axios.get(`${api_url}/api/Tag/get-all`, {
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
      const token = localStorage.getItem("userToken");
      // Serialize Tags as repeated query keys (Tags=1&Tags=samsung) so backend receives List<string>
      const params = new URLSearchParams();
      params.append("PageNumber", "1");
      params.append("PageSize", "50");
      tagNames.forEach((t) => params.append("Tags", t));
      const response = await axios.get(`${api_url}/api/Inventory/get-all?${params.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined }
      });
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

  // Auto-search with debounce (clear tags when searching)
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
        const response = await axios.get(`${api_url}/api/SearchContoller/search`, {
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
      <div className="m-1 mt-2 d-flex justify-content-center align-items-center shadow-lg rounded-4 p-2 pe-5 ps-5">
        <ul className="nav nav-pills w-100 gap-2 align-items-center">
          {/* <div>{t('welcomeMessage')}</div> */}
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
                <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z"/>
                <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z"/>
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
              className={`btn ${activeTab === "dashboard" ? "btn-primary" : "btn-outline-secondary"}`}
              onClick={() => setActiveTab("dashboard")}
            >
              {t('allInventories')}
            </button>
            
            {isAdmin() && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => navigate("/admin-page")}
              >
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
                  <input
                    type="search"
                    className="form-control"
                    placeholder={t('dashboard_searchInventories')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
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
                      <button
                        key={t.id}
                        type="button"
                        className={`btn btn-sm ${selectedTags.includes(t.name) ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => toggleTag(t.name)}
                      >
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
                  <input
                    type="search"
                    className="form-control"
                    placeholder={t('dashboard_searchInventories')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              {tags.length > 0 && (
                <div className="mb-3">
                  <span className="me-2 text-muted small">{t('tags')}:</span>
                  <div className="d-flex flex-wrap gap-1">
                    {tags.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => setSelectedTags([t.name])}
                      >
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
              <nav aria-label="...">
                <ul className="pagination  d-flex justify-content-center">
                  <li className={`page-item ${filter.pageNumber <= 1 ? 'disabled' : ''}`}>
                    <button
                      className="page-link"
                      onClick={() => setFilter(prev => ({ ...prev, pageNumber: prev.pageNumber - 1 }))}
                      disabled={filter.pageNumber <= 1}
                    >
                      {t('previous')}
                    </button>
                  </li>
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNum = index + 1;
                    return (
                      <li key={pageNum} className={`page-item ${filter.pageNumber === pageNum ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setFilter(prev => ({ ...prev, pageNumber: pageNum }))}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}

                  <li className={`page-item ${filter.pageNumber >= totalPages ? 'disabled' : ''}`}>
                    <button className="page-link"
                      onClick={() => setFilter(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }))}
                      disabled={filter.pageNumber >= totalPages}
                    >
                      {t('next')}
                    </button>
                  </li>
                </ul>
              </nav>
            </>
          )}
        </div>

      </div>
    </>
  );
}
export default Dashboard;