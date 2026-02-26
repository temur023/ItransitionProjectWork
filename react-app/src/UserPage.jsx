import React, {useState,useEffect,useCallback} from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
function UserPage(){
    const [inventories, setInventories] = useState([]);
    const [inventory, setInventory] = useState();
    const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: 1,
    isPublic: true,
});
    const [activeTab, setActiveTab] = useState("own"); // "own" or "access"
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });
    const api_url = "http://localhost:5137";
    const totalPages = Math.ceil(total / filter.pageSize);
    const navigate = useNavigate();

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const createInventory = async () =>{
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.post(`${api_url}/api/Inventory/create`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventories([...inventories, response.data.data]);
            setMessage({ text: "Inventory created successfully", type: "success" });
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to create inventory";
            setMessage({ text: msg, type: "danger" });
        }
    }

    const fetchInventories = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const endpoint = activeTab === "own" ? "get-own" : "get-with-access";
            const response = await axios.get(`${api_url}/api/UserPage/${endpoint}`, {
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
    }, [filter, activeTab]);

    useEffect(() => {
        const delay = setTimeout(() => fetchInventories(), 500);
        return () => clearTimeout(delay);
    }, [fetchInventories]);

    return (
        <>
        <div className="container-fluid w-75 mt-4 shadow-lg rounded-4">
            {message.text && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
            )}
            {/* Create New Inventory using modals*/}
            {/* Tabs */}
            <ul className="nav nav-tabs mb-3 mt-5">
                <li className="nav-item mt-3 ">
                    <button 
                        className={`nav-link ${activeTab === "own" ? "active" : ""}`}
                        onClick={() => setActiveTab("own")}>
                        My Inventories
                    </button>
                </li>
                <li className="nav-item mt-3">
                    <button 
                        className={`nav-link ${activeTab === "access" ? "active" : ""}`}
                        onClick={() => setActiveTab("access")}>
                        Shared With Me
                    </button>
                </li>
            </ul>

            <table className="table table-striped table-hover">
                <thead>
                    <tr>
                        <th>Title</th>
                        <th>Category</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    {inventories.map((inv) => (
                        <tr key={inv.id}>
                            <td>{inv.title}</td>
                            <td>{inv.category}</td>
                            <td>{new Date(inv.createdAt).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
                    <nav aria-label="...">
                      <ul className="pagination  d-flex justify-content-center">
                        <li className={`page-item ${filter.pageNumber<=1? 'disabled':''}`}>
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
                        
                        <li className={`page-item ${filter.pageNumber>=totalPages?'disabled':''}`}>
                            <button className="page-link"
                                onClick={()=>setFilter(prev=>({...prev, pageNumber: prev.pageNumber+1}))}
                                disabled={filter.pageNumber >= totalPages}
                            >
                                Next
                            </button>
                        </li>
                      </ul>
                    </nav>
        </>
    );
}
export default UserPage;