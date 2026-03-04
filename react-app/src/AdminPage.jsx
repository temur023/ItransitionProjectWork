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
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editForm, setEditForm] = useState({
        id: "",
        fullName: "",
        userName: "",
        email: "",
        password: "",
        role: 2,
        isBlocked: false,
        language: 1,
        theme: 1
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
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
    }, [api_url, filter, navigate]);

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
                checkedUsers,{
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
                checkedUsers,{
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
                checkedUsers,{
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
                checkedUsers,{
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
            role: user.role ?? 2,
            isBlocked: !!user.isBlocked,
            language: user.language ?? 1,
            theme: user.theme ?? 1
        });
        setIsEditModalOpen(true);
    }

    function closeEditModal() {
        setIsEditModalOpen(false);
        setSelectedUser(null);
        setEditForm({
            id: "",
            fullName: "",
            userName: "",
            email: "",
            password: "",
            role: 2,
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
            const payload = {
                fullName: editForm.fullName,
                passwordHash: editForm.password, // empty => backend keeps existing
                isBlocked: !!editForm.isBlocked,
                role: Number(editForm.role),
                language: Number(editForm.language),
                theme: Number(editForm.theme),
            };

            const response = await axios.put(
                `${api_url}/api/User/update/${selectedUser.id}`,
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setMessage({ text: response.data.message || "User updated", type: "success" });
            closeEditModal();
            await fetchUsers();
        } catch (error) {
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
                {message.text && (
                    <div className={`alert alert-${message.type} mb-3`} role="alert">
                        {message.text}
                    </div>
                )}
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
                    <button
                        className="btn btn-secondary"
                        onClick={blockSelected}
                        disabled={loading || checkedUsers.length === 0}
                        title="Block selected users"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ban" viewBox="0 0 16 16">
                          <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>
                        </svg>
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={unblockSelected}
                        disabled={loading || checkedUsers.length === 0}
                        title="Unblock selected users"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-ban" viewBox="0 0 16 16">
                          <path d="M15 8a6.97 6.97 0 0 0-1.71-4.584l-9.874 9.875A7 7 0 0 0 15 8M2.71 12.584l9.874-9.875a7 7 0 0 0-9.874 9.874ZM16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0"/>
                        </svg>
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={adminSelected}
                        disabled={loading || checkedUsers.length === 0}
                        title="Admin selected users"
                    
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 20h20"/>
                          <path d="M5 20V10l7-7 7 7v10"/>
                          <path d="M12 12v6"/>
                          <path d="M9 15h6"/>
                        </svg>
                    </button>
                    <button
                        className="btn btn-outline-secondary"
                        onClick={unadminSelected}
                        disabled={loading || checkedUsers.length === 0}
                        title="Unadmin selected users"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M2 20h20"/>
                          <path d="M5 20V10l7-7 7 7v10"/>
                          <path d="M9 15h6"/>
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
                            <th>Role</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                     {users.map((user) => (
                         <tr
                             key={user.id}
                             style={{ cursor: "pointer" }}
                             onClick={() => openEditModal(user)}
                             title="Click to update user"
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
                            <td>{user.role==1?'Admin':'User'}</td>
                            <td>{user.isBlocked ? 'Blocked' : 'Active'}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                {/* Pagination */}
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
            </div>
             
            {isEditModalOpen && (
                <>
                    <div className="modal fade show" style={{ display: "block" }} tabIndex="-1" role="dialog" aria-modal="true">
                        <div className="modal-dialog modal-lg" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Update user</h5>
                                    <button type="button" className="btn-close" aria-label="Close" onClick={closeEditModal} />
                                </div>
                                <div className="modal-body">
                                    <div className="row g-3">
                                        <div className="col-md-3">
                                            <label className="form-label">Id</label>
                                            <input className="form-control" value={editForm.id} disabled />
                                        </div>
                                        <div className="col-md-9">
                                            <label className="form-label">Full name</label>
                                            <input
                                                className="form-control"
                                                value={editForm.fullName}
                                                onChange={(e) => setEditForm(f => ({ ...f, fullName: e.target.value }))}
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Username</label>
                                            <input
                                                className="form-control"
                                                value={editForm.userName}
                                                disabled
                                                title="Username cannot be changed"
                                            />
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Email</label>
                                            <input
                                                type="email"
                                                className="form-control"
                                                value={editForm.email}
                                                disabled
                                                title="Email cannot be changed"
                                            />
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Role</label>
                                            <select
                                                className="form-select"
                                                value={editForm.role}
                                                onChange={(e) => setEditForm(f => ({ ...f, role: Number(e.target.value) }))}
                                            >
                                                <option value={1}>Admin</option>
                                                <option value={2}>User</option>
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
                                                    Blocked
                                                </label>
                                            </div>
                                        </div>

                                        <div className="col-md-6">
                                            <label className="form-label">Language</label>
                                            <select
                                                className="form-select"
                                                value={editForm.language}
                                                onChange={(e) => setEditForm(f => ({ ...f, language: Number(e.target.value) }))}
                                            >
                                                <option value={1}>English</option>
                                                <option value={2}>Russian</option>
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <label className="form-label">Theme</label>
                                            <select
                                                className="form-select"
                                                value={editForm.theme}
                                                onChange={(e) => setEditForm(f => ({ ...f, theme: Number(e.target.value) }))}
                                            >
                                                <option value={1}>Light</option>
                                                <option value={2}>Dark</option>
                                            </select>
                                        </div>

                                        <div className="col-12">
                                            <label className="form-label">Password (leave blank to keep current)</label>
                                            <input
                                                type="password"
                                                className="form-control"
                                                value={editForm.password}
                                                onChange={(e) => setEditForm(f => ({ ...f, password: e.target.value }))}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-outline-secondary" onClick={closeEditModal} disabled={saving}>
                                        Cancel
                                    </button>
                                    <button type="button" className="btn btn-primary" onClick={updateUser} disabled={saving}>
                                        {saving ? "Saving..." : "Save changes"}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="modal-backdrop fade show" onClick={closeEditModal} />
                </>
            )}

        </div>
    </>);
}
export default AdminPage;