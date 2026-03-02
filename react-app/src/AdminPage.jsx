import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";

function AdminPage(){
    const [users, setUsers] = useState([]);
    const api_url = "http://localhost:5137";
    const navigate = useNavigate();
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [checkedUsers, setCheckedUsers] = useState([]);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [selectedUser, setSelectedUser] = useState(null);
    const [activeTab, setActiveTab] = useState("users");
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const totalPages = Math.ceil(total / filter.pageSize);

    const fetchUsers = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/User/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { PageNumber: filter.pageNumber, PageSize: filter.pageSize }
            });
            setUsers(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setUsers([]);
        }
    }, [filter]);

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

    //Check Items
    function handleCheckingUsers(id) {
        setCheckedUsers(c => c.includes(id) ? c.filter(i => i !== id) : [...c, id]);
    }
    function handleCheckingAllUsers() {
        if (checkedUsers.length === users.length && users.length > 0) setCheckedUsers([]);
        else setCheckedUsers(users.map(i => i.id));
    }
    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    return(
    <>
    <div className="m-1 mt-2 d-flex justify-content-center align-items-center shadow-lg rounded-4 p-2 pe-5 ps-5">
               <ul className="nav nav-pills w-100 align-items-center">
                  <li className="nav-item">
                    <button
                      type="button"
                      className="nav-link active"
                      onClick={() => navigate("/dashboard")}
                    >
                      Dashboard
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
        <div className="container-fluid d-flex justify-content-center">
            <div className="col-md-9 p-3 m-3 shadow-lg rounded-4">
                <div className="d-flex justify-content-end mt-2 gap-2 mb-4">
                    <button
                        className="btn btn-danger"
                        onClick={deleteSelected}
                        disabled={loading || checkedUsers.length === 0}
                        title="Delete selected users"
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
                                    onChange={handleCheckingAllUsers}
                                    checked={users.length > 0 && checkedUsers.length === users.length}
                                />
                            </th>
                            <th>Id</th>
                            <th>Full Name</th>
                            <th>Username</th>
                            <th>Email</th>
                        </tr>
                    </thead>
                    <tbody>
                     {users.map((user) => (
                         <tr key={user.id} style={{ cursor: "pointer" }}>
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
                        </tr>
                    ))}
                    </tbody>
                </table>
                {/* Pagination */}
            {activeTab === "users" && (
                <nav>
                    <ul className="pagination d-flex justify-content-center">
                        <li className={`page-item ${filter.pageNumber <= 1 ? 'disabled' : ''}`}>
                            <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: p.pageNumber - 1 }))} disabled={filter.pageNumber <= 1}>Previous</button>
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
                            <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: p.pageNumber + 1 }))} disabled={filter.pageNumber >= totalPages}>Next</button>
                        </li>
                    </ul>
                </nav>
            )}
            </div>
             

        </div>
    </>);
}
export default AdminPage;