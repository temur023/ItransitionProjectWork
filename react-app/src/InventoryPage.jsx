import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { useNavigate, useParams } from "react-router-dom";

function Modal({ isOpen, onClose, title, children, footer }) {
    useEffect(() => {
        const handleKey = (e) => e.key === "Escape" && onClose();
        if (isOpen) {
            document.addEventListener("keydown", handleKey);
            document.body.classList.add("modal-open");
        }
        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.classList.remove("modal-open");
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <>
            <div className="modal-backdrop fade show" onClick={onClose} />
            <div className="modal fade show d-block" tabIndex="-1" role="dialog">
                <div className="modal-dialog modal-dialog-centered modal-lg" role="document" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
                        </div>
                        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>{children}</div>
                        {footer && <div className="modal-footer">{footer}</div>}
                    </div>
                </div>
            </div>
        </>
    );
}

function InventoryPage() {
    const [items, setItems] = useState([]);
    const [checkedItems, setCheckedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [message, setMessage] = useState({ text: "", type: "" });
    const { inventoryId } = useParams();
    const [inventoryFields, setInventoryFields] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const api_url = "http://localhost:5137";
    const navigate = useNavigate();

    // Create Item Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "" });

    // Edit Inventory and item Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ title: "", description: "", category: 1, isPublic: true });

    const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
    const [editItemData, setEditItemData] = useState({ name: "", description: "", fieldValues: [] });
    // Fields (shared between edit modal)
    const [fields, setFields] = useState([]);

    // Access Users (shared between edit modal)
    const [accessUsers, setAccessUsers] = useState([]);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const searchTimerRef = React.useRef(null);

    const categoryLabels = { 1: "Equipment", 2: "Furniture", 3: "Book", 4: "Technology", 5: "Other" };
    const totalPages = Math.ceil(total / filter.pageSize);

    // ─── Search Users ───────────────────────────────────────────────────────────
    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) { setUserSuggestions([]); return; }
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/User/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { SearchTerm: searchTerm, PageSize: 5, PageNumber: 1 }
            });
            setUserSuggestions(response.data.data || []);
        } catch { setUserSuggestions([]); }
    };

    const fetchFields = useCallback(async () => {
    try {
        const token = localStorage.getItem("userToken");
        const response = await axios.get(`${api_url}/api/InventoryField/get-all`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { InvId: inventoryId }
        });
        // Only show fields marked as showInTable
        setInventoryFields((response.data.data || []).filter(f => f.showInTable));
    } catch { setInventoryFields([]); }
}, [inventoryId]);

useEffect(() => { fetchFields(); }, [fetchFields]);

    // ─── Fetch Items ─────────────────────────────────────────────────────────────
    const fetchItems = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/Item/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { PageNumber: filter.pageNumber, PageSize: filter.pageSize, invId: inventoryId }
            });
            setItems(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setItems([]);
        }
    }, [filter, inventoryId]);

    useEffect(() => {
        const delay = setTimeout(() => fetchItems(), 500);
        return () => clearTimeout(delay);
    }, [fetchItems]);

    useEffect(() => { setCheckedItems([]); }, [items]);

    // ─── Create Item ─────────────────────────────────────────────────────────────
    const createItem = async () => {
        try {
            const token = localStorage.getItem("userToken");
            if (!token) return navigate("/login");
            const response = await axios.post(`${api_url}/api/Item/create`, {
                InventoryId: parseInt(inventoryId),
                Name: formData.name,
                Description: formData.description,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMessage({ text: response.data.message || "Item created!", type: "success" });
            setIsModalOpen(false);
            setFormData({ name: "", description: "" });
            await fetchItems();
        } catch (error) {
            const msg = error.response?.data?.message || error.message || "Failed to create item";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
        }
    };

    // ─── Delete Selected Items ────────────────────────────────────────────────────
    const deleteSelected = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            setLoading(true);
            const response = await axios.delete(`${api_url}/api/Item/delete-selected`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { invId: parseInt(inventoryId) },
                data: checkedItems
            });
            setMessage({ text: response.data.message || "Items deleted", type: "success" });
            setCheckedItems([]);
            await fetchItems();
        } catch (error) {
            if (error.response?.status === 401 || error.response?.status === 403) {
                localStorage.removeItem("userToken");
                navigate("/login");
            } else {
                setMessage({ text: "Failed to delete items", type: "danger" });
            }
        } finally { setLoading(false); }
    };

    // ─── Check Items ──────────────────────────────────────────────────────────────
    function handleCheckingItems(id) {
        setCheckedItems(c => c.includes(id) ? c.filter(i => i !== id) : [...c, id]);
    }
    function handleCheckingAllItems() {
        if (checkedItems.length === items.length && items.length > 0) setCheckedItems([]);
        else setCheckedItems(items.map(i => i.id));
    }
    const openEditItemModal = () => {
    setEditItemData({
        name: selectedItem.name,
        description: selectedItem.description,
        fieldValues: inventoryFields.map(f => ({
            fieldId: f.id,
            fieldTitle: f.title,
            fieldType: f.type,
            value: selectedItem.fieldValues?.find(v => v.fieldId === f.id)?.value || ""
        }))
    });
    setIsItemModalOpen(false);
    setIsEditItemModalOpen(true);
};

const updateItem = async () => {
    try {
        const token = localStorage.getItem("userToken");
        await axios.put(`${api_url}/api/Item/update/${selectedItem.id}`, {
            Name: editItemData.name,
            Description: editItemData.description,
        }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });

        // Save field values
        for (const fv of editItemData.fieldValues) {
            if (fv.value !== "") {
                await axios.post(`${api_url}/api/ItemFieldValue/set`, {
                    ItemId: selectedItem.id,
                    FieldId: fv.fieldId,
                    Value: fv.value
                }, { headers: { Authorization: `Bearer ${token}` } });
            }
        }

        setMessage({ text: "Item updated!", type: "success" });
        setIsEditItemModalOpen(false);
        setSelectedItem(null);
        await fetchItems();
    } catch (error) {
        const msg = error.response?.data?.message || "Failed to update item";
        setMessage({ text: msg, type: "danger" });
    }
};

    // ─── Open Edit Modal ──────────────────────────────────────────────────────────
    const openEditModal = async () => {
        const token = localStorage.getItem("userToken");
        try {
            const [invRes, fieldsRes, accessRes] = await Promise.all([
                axios.get(`${api_url}/api/Inventory/get/${inventoryId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${api_url}/api/InventoryField/get-all`, { headers: { Authorization: `Bearer ${token}` }, params: { InventoryId: inventoryId } }),
                axios.get(`${api_url}/api/InventoryUserAccess/get-all`, { headers: { Authorization: `Bearer ${token}` }, params: { InventoryId: inventoryId } })
            ]);
            const inv = invRes.data.data;
            setEditFormData({ title: inv.title, description: inv.description, category: inv.category, isPublic: inv.isPublic });
            setFields((fieldsRes.data.data || []).map(f => ({
                id: f.id, title: f.title, description: f.description,
                type: f.type, showInTable: f.showInTable, order: f.order, isExisting: true
            })));
            setAccessUsers((accessRes.data.data || []).map(a => ({
                userId: a.userId, emailOrUsername: a.userName || a.email, isExisting: true
            })));
            setIsEditModalOpen(true);
        } catch (error) {
            setMessage({ text: "Failed to load inventory data", type: "danger" });
        }
    };

    // ─── Update Inventory ─────────────────────────────────────────────────────────
    const updateInventory = async () => {
        try {
            const token = localStorage.getItem("userToken");

            await axios.put(`${api_url}/api/Inventory/update/${inventoryId}`, {
                Title: editFormData.title,
                Description: editFormData.description,
                Category: parseInt(editFormData.category),
                IsPublic: editFormData.isPublic
            }, { 
                headers: { 
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                } 
            });

            // Save new fields only
            for (const field of fields.filter(f => !f.isExisting)) {
                await axios.post(`${api_url}/api/InventoryField/create`, {
                    InventoryId: parseInt(inventoryId),
                    Title: field.title,
                    Description: field.description,
                    Type: parseInt(field.type),
                    ShowInTable: field.showInTable,
                    Order: field.order
                }, { headers: { Authorization: `Bearer ${token}` } });
            }

            // Save new access users only
            for (const user of accessUsers.filter(u => !u.isExisting)) {
                await axios.post(`${api_url}/api/InventoryUserAccess/create`, {
                    InventoryId: parseInt(inventoryId),
                    UserId: user.userId,
                    EmailOrUsername: user.emailOrUsername
                }, { headers: { Authorization: `Bearer ${token}` } });
            }

            setMessage({ text: "Inventory updated!", type: "success" });
            setIsEditModalOpen(false);
        } catch (error) {
            const msg = error.response?.data?.message || "Failed to update";
            setMessage({ text: msg, type: "danger" });
        }
    };

    // ─── Fields CRUD ──────────────────────────────────────────────────────────────
    const addField = () => {
        setFields([...fields, { title: "", description: "", type: 1, showInTable: false, order: fields.length + 1 }]);
    };

    const updateField = (index, key, value) => {
        const updated = [...fields];
        updated[index][key] = value;
        setFields(updated);
    };

    const removeField = async (index) => {
        const field = fields[index];
        if (field.isExisting) {
            try {
                const token = localStorage.getItem("userToken");
                await axios.delete(`${api_url}/api/InventoryField/delete/${field.id}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            } catch {
                setMessage({ text: "Failed to delete field", type: "danger" });
                return;
            }
        }
        setFields(fields.filter((_, i) => i !== index));
    };

    // ─── Access Users CRUD ────────────────────────────────────────────────────────
    const addAccessUsers = () => {
        setAccessUsers([...accessUsers, { emailOrUsername: "", userId: null, isExisting: false }]);
    };

    const updateAccessUsers = (index, key, value) => {
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
        updated[index] = { emailOrUsername: user.email || user.userName, userId: user.id, isExisting: false };
        setAccessUsers(updated);
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const removeAccessUser = async (index) => {
        const user = accessUsers[index];
        if (user.isExisting) {
            try {
                const token = localStorage.getItem("userToken");
                await axios.delete(`${api_url}/api/InventoryUserAccess/delete`, {
                    headers: { Authorization: `Bearer ${token}` },
                    params: { inventoryId: parseInt(inventoryId), userId: user.userId }
                });
            } catch {
                setMessage({ text: "Failed to remove user access", type: "danger" });
                return;
            }
        }
        setAccessUsers(accessUsers.filter((_, i) => i !== index));
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    // ─── Render ───────────────────────────────────────────────────────────────────
    return (
        <>
            <div className="container-fluid w-75 mt-4 shadow-lg rounded-4 p-4 mb-2">
                {message.text && (
                    <div className={`alert alert-${message.type}`}>{message.text}</div>
                )}
                <div className="d-flex justify-content-center align-items-center">
                    <h1>{`Inventory ${inventoryId}`}</h1>
                </div>

                <div className="d-flex justify-content-end mt-2 gap-2 mb-4">
                    <button
                        className="btn btn-danger"
                        onClick={deleteSelected}
                        disabled={loading || checkedItems.length === 0}
                        title="Delete selected items"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                        </svg>
                    </button>
                    <button className="btn btn-primary" onClick={openEditModal}>Edit Inventory</button>
                    <button className="btn btn-success" onClick={() => setIsModalOpen(true)}>+ New Item</button>
                </div>

                <table className="table table-striped table-hover">
                    <thead>
                        <tr>
                            <th>
                                <input type="checkbox" className="form-check-input"
                                    onChange={handleCheckingAllItems}
                                    checked={items.length > 0 && checkedItems.length === items.length}
                                />
                            </th>
                            <th>Custom Id</th>
                            <th>Name</th>
                            {inventoryFields.map(f => (
                              <th key={f.id}>{f.title}</th>
                          ))}
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item) => (
                          <tr key={item.id} style={{ cursor: "pointer" }}>
                              <td onClick={(e) => e.stopPropagation()}>
                                  <input type="checkbox" className="form-check-input"
                                      checked={checkedItems.includes(item.id)}
                                      onChange={() => handleCheckingItems(item.id)}
                                  />
                              </td>
                              <td onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); }}>{item.customId}</td>
                              <td onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); }}>{item.name}</td>
                              {inventoryFields.map(f => (
                                  <td key={f.id} onClick={() => { setSelectedItem(item); setIsItemModalOpen(true); }}>
                                      {item.fieldValues?.find(v => v.fieldId === f.id)?.value || "-"}
                                  </td>
                              ))}
                          </tr>
                      ))}
                    </tbody>
                </table>
            </div>

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

            {/* Create Item Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData({ name: "", description: "" }); }} title="Create New Item"
                footer={<button className="btn btn-primary" onClick={createItem}>Create</button>}
            >
                <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input type="text" className="form-control" name="name" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" name="description" value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
            </Modal>

            {/* Edit Inventory Modal */}
            <Modal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                title="Edit Inventory"
                footer={
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary" onClick={addField}>+ Add Field</button>
                        <button className="btn btn-outline-secondary" onClick={addAccessUsers}>+ Add User</button>
                        <button className="btn btn-primary" onClick={updateInventory}>Save</button>
                    </div>
                }
            >
                {/* Basic Info */}
                <div className="mb-3">
                    <label className="form-label">Title</label>
                    <input type="text" className="form-control" value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Description</label>
                    <textarea className="form-control" value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">Category</label>
                    <select className="form-select" value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}>
                        <option value={1}>Equipment</option>
                        <option value={2}>Furniture</option>
                        <option value={3}>Book</option>
                        <option value={4}>Technology</option>
                        <option value={5}>Other</option>
                    </select>
                </div>
                <div className="mb-3 form-check">
                    <input type="checkbox" className="form-check-input" checked={editFormData.isPublic}
                        onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })} />
                    <label className="form-check-label">Public</label>
                </div>

                {/* Fields Section */}
                <hr />
                <h6 className="mb-3">Fields</h6>
                {fields.length === 0 && <p className="text-muted small">No fields yet. Click "+ Add Field" to add one.</p>}
                {fields.map((field, index) => (
                    <div key={index} className="border rounded p-3 mb-2 position-relative">
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-2"
                            onClick={() => removeField(index)} />
                        {field.isExisting && (
                            <span className="badge bg-secondary mb-2">Existing</span>
                        )}
                        <div className="mb-2">
                            <label className="form-label small">Title</label>
                            <input type="text" className="form-control form-control-sm" value={field.title}
                                onChange={(e) => updateField(index, "title", e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">Description</label>
                            <input type="text" className="form-control form-control-sm" value={field.description}
                                onChange={(e) => updateField(index, "description", e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">Type</label>
                            <select className="form-select form-select-sm" value={field.type}
                                onChange={(e) => updateField(index, "type", e.target.value)}
                                disabled={field.isExisting}
                            >
                                <option value={1}>Single Lined Text</option>
                                <option value={2}>Multi Lined Text</option>
                                <option value={3}>Number</option>
                                <option value={4}>Boolean</option>
                                <option value={5}>Link</option>
                            </select>
                        </div>
                        <div className="form-check">
                            <input type="checkbox" className="form-check-input" checked={field.showInTable}
                                onChange={(e) => updateField(index, "showInTable", e.target.checked)} />
                            <label className="form-check-label small">Show in Table</label>
                        </div>
                    </div>
                ))}

                {/* Access Users Section */}
                <hr />
                <h6 className="mb-3">Users with Access</h6>
                {accessUsers.length === 0 && <p className="text-muted small">No users yet. Click "+ Add User" to add one.</p>}
                {accessUsers.map((user, index) => (
                    <div key={index} className="border rounded p-3 mb-2 position-relative">
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-2"
                            onClick={() => removeAccessUser(index)} />
                        {user.isExisting && (
                            <span className="badge bg-secondary mb-2">Existing</span>
                        )}
                        <div style={{ position: "relative" }}>
                            <div className="input-group">
                                <input type="text" className="form-control"
                                    placeholder="Search by username or email..."
                                    value={user.emailOrUsername}
                                    disabled={user.isExisting}
                                    onChange={(e) => updateAccessUsers(index, "emailOrUsername", e.target.value)}
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
                                <ul className="list-group position-absolute w-100" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }}>
                                    {userSuggestions.map((s) => (
                                        <li key={s.id} className="list-group-item list-group-item-action"
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
            </Modal>
            <Modal
                isOpen={isItemModalOpen}
                onClose={() => { setIsItemModalOpen(false); setSelectedItem(null); }}
                title={selectedItem?.name || "Item Details"}
                
                footer={
                    <div className="d-flex gap-2 justify-content-center align-items-center">
                      <button className="btn btn-primary" onClick={openEditItemModal}>
                          Edit
                      </button>
                      <button className="btn btn-secondary" onClick={() => { setIsItemModalOpen(false); setSelectedItem(null); }}>
                          Close
                      </button>
                    </div>
                    
                }
            >
                {selectedItem && (
                    <div>
                        <div className="mb-3">
                            <label className="fw-bold">Description</label>
                            <p className="text-muted">{selectedItem.description || "-"}</p>
                        </div>
                        <div className="mb-3">
                            <label className="fw-bold">Created At</label>
                            <p className="text-muted">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="mb-3">
                            <label className="fw-bold">Updated At</label>
                            <p className="text-muted">{new Date(selectedItem.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </Modal>
            <Modal
    isOpen={isEditItemModalOpen}
    onClose={() => { setIsEditItemModalOpen(false); setSelectedItem(null); }}
    title={`Edit: ${selectedItem?.name || ""}`}
    footer={
        <div className="d-flex gap-2">
            <button className="btn btn-primary" onClick={updateItem}>Save</button>
            <button className="btn btn-secondary" onClick={() => { setIsEditItemModalOpen(false); setSelectedItem(null); }}>Cancel</button>
        </div>
    }
>
    {selectedItem && (
        <div>
            <div className="mb-3">
                <label className="form-label">Name</label>
                <input type="text" className="form-control"
                    value={editItemData.name}
                    onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })}
                />
            </div>
            <div className="mb-3">
                <label className="form-label">Description</label>
                <textarea className="form-control"
                    value={editItemData.description}
                    onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })}
                />
            </div>

            {/* Dynamic field values */}
            {editItemData.fieldValues.length > 0 && (
                <>
                    <hr />
                    <h6>Field Values</h6>
                    {editItemData.fieldValues.map((fv, index) => (
                        <div key={fv.fieldId} className="mb-3">
                            <label className="form-label">{fv.fieldTitle}</label>
                            {fv.fieldType === 2 ? (
                                // Multi-line text
                                <textarea className="form-control"
                                    value={fv.value}
                                    onChange={(e) => {
                                        const updated = [...editItemData.fieldValues];
                                        updated[index].value = e.target.value;
                                        setEditItemData({ ...editItemData, fieldValues: updated });
                                    }}
                                />
                            ) : fv.fieldType === 4 ? (
                                // Boolean
                                <div className="form-check">
                                    <input type="checkbox" className="form-check-input"
                                        checked={fv.value === "true"}
                                        onChange={(e) => {
                                            const updated = [...editItemData.fieldValues];
                                            updated[index].value = e.target.checked ? "true" : "false";
                                            setEditItemData({ ...editItemData, fieldValues: updated });
                                        }}
                                    />
                                </div>
                            ) : fv.fieldType === 5 ? (
                                // Link
                                <input type="url" className="form-control"
                                    value={fv.value}
                                    onChange={(e) => {
                                        const updated = [...editItemData.fieldValues];
                                        updated[index].value = e.target.value;
                                        setEditItemData({ ...editItemData, fieldValues: updated });
                                    }}
                                />
                            ) : (
                                // Single line text or number
                                <input
                                    type={fv.fieldType === 3 ? "number" : "text"}
                                    className="form-control"
                                    value={fv.value}
                                    onChange={(e) => {
                                        const updated = [...editItemData.fieldValues];
                                        updated[index].value = e.target.value;
                                        setEditItemData({ ...editItemData, fieldValues: updated });
                                    }}
                                />
                            )}
                        </div>
                    ))}
                </>
            )}
        </div>
    )}
</Modal>
        </>
    );
}

export default InventoryPage;