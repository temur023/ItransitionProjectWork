import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";

function Dashboard() {
  const [inventories, setInventories] = useState([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const api_url = "http://localhost:5137";
  const [activeTab, setActiveTab] = useState("dashboard");
  const searchTimerRef = useRef(null);

  const getUserRole = () => {
    try {
      const token = localStorage.getItem("userToken");
      if (!token) return null;
      const payload = JSON.parse(atob(token.split(".")[1]));
      const roleClaim = payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
      return roleClaim;
    } catch { return null; }
  };
  const isAdmin = getUserRole() === "Admin";

  const navigate = useNavigate();
  const categoryLabels = { 1: "Equipment", 2: "Furniture", 3: "Book", 4: "Technology", 5: "Other" };
  const totalPages = Math.ceil(total / filter.pageSize);

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

  // Auto-search with debounce
  useEffect(() => {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

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
                      Dashboard
                    </button>
                  </li>
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link active"
                      onClick={() => navigate("/statistics")}
                    >
                      Statistics
                    </button>
                  </li>
                    
                  <li className="ms-auto nav-item">
                    <button
                      type="button"
                      className="nav-link"
                      onClick={() => navigate("/user-page")}
                    >
                      AA
                    </button>
                  </li>
                </ul>
            </div>
      <div className="container-fluid d-flex">
        {message.text && (
          <div className={`alert alert-${message.type}`}>{message.text}</div>
        )}
        <div className="col-md-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4 ">
          <ul className="nav nav-underline nav-fill flex-column mt-4">
            <li className="nav-item">
              <button
                type="button"
                className={`nav-link text-dark fw-bolder ${activeTab === "dashboard" ? "admin" : ""}`}
                onClick={() => setActiveTab("dashboard")}
              >
                All Inventories
              </button>
            </li>
            {isAdmin && (
              <li className="nav-item">
                <button
                  type="button"
                  className={`nav-link text-dark fw-bolder`}
                  onClick={() => navigate("/admin-page")}
                >
                  Admin Page
                </button>
              </li>
            )}
          </ul>
        </div>
        <div className=" col-md-9 mt-4 shadow-lg rounded-4 p-4  ">
          {isSearching ? (
            <>
              <div className="d-flex justify-content-between align-items-center pb-2">
                <h4 className="mb-0">Search Results</h4>
                <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search inventories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Creator Username</th>
                  </tr>
                </thead>
                <tbody>
                  {searchResults.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-muted">No inventories found.</td>
                    </tr>
                  ) : (
                    searchResults.map((inv) => (
                      <tr key={inv.id} onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>
                        <td>{inv.title}</td>
                        <td>{categoryLabels[inv.category] || inv.category}</td>
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
                <h4 className="mb-0">Available Inventories</h4>
                <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                  <input
                    type="search"
                    className="form-control"
                    placeholder="Search inventories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <table className="table table-striped table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Category</th>
                    <th>Creator Username</th>
                  </tr>
                </thead>
                <tbody>
                  {inventories.map((inv) => (
                    <tr key={inv.id} onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>
                      <td>{inv.title}</td>
                      <td>{categoryLabels[inv.category] || inv.category}</td>
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
                      Previous
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
                      Next
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