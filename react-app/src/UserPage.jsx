import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { useNavigate, Link } from "react-router-dom";

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
                <div className="modal-dialog modal-dialog-centered" role="document" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title">{title}</h5>
                            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" />
                        </div>
                        <div className="modal-body">{children}</div>
                        {footer && <div className="modal-footer">{footer}</div>}
                    </div>
                </div>
            </div>
        </>
    );
}

function UserPage() {
    const [inventories, setInventories] = useState([]);
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        category: 1,
        Version: 1,
        CreatedById: 0,
        isPublic: true,
        creatorName: ""
    });
    const categoryLabels = {
        1: "Equipment",
        2: "Furniture",
        3: "Book",
        4: "Technology",
        5: "Other",
    };
    const [checkedInvs, setCheckedInvs] = useState([]);
    const [customIdElements, setCustomIdElements] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newInventoryId, setNewInventoryId] = useState(null);
    const [fields, setFields] = useState([]);
    const [loading, setLoading] = useState(false);
    // const [tags, setTags] = useState([]);
    const [activeTab, setActiveTab] = useState("own");
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [total, setTotal] = useState(0);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [accessUsers, setAccessUsers] = useState([]);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const searchTimerRef = React.useRef(null);
    const api_url = "http://localhost:5137";
    const totalPages = Math.ceil(total / filter.pageSize);
    const navigate = useNavigate();
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setNewInventoryId(null);
        setFields([]);
        setCustomIdElements([]);
        setAccessUsers([]);
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
        setFormData({ title: "", description: "", category: 1, isPublic: true });
    };

    const idElementTypes = {
        1: "FixedText",
        2: "Random20Bit",
        3: "Random32Bit",
        4: "Random6Digit",
        5: "Random9Digit",
        6: "Guid",
        7: "DateTime",
        8: "Sequence"
    };

    const deleteSelected = async () => {
    const token = localStorage.getItem("userToken");
    if (!token) return navigate("/login");

    try {
        setLoading(true);
        const response = await axios.delete(`${api_url}/api/UserPage/delete-own`, {
            headers: { Authorization: `Bearer ${token}` },
            data: checkedInvs
        });


        setMessage({ text: response.data.message || "Inventories deleted", type: "success" });
        setCheckedInvs([]);
        await fetchInventories()
    } catch (error) {
        console.error("Delete failed:", error); 
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem("userToken");
            navigate("/login");
        } else {
            setMessage({ text: "Failed to delete inventories", type: "error" });
        }
    } finally {
        setLoading(false);
    }
};
    function handleCheckingInvs(id){
        setCheckedInvs(c=>c.includes(id)?c.filter((invId)=>invId!==id):[...c, id]);
    }

    function handleCheckingAllInvs(){
        if(checkedInvs.length===inventories.length&&inventories.length>0){
            setCheckedInvs([]);
        }
        else{
           const allIds = inventories.map(u => u.id);
            setCheckedInvs(allIds);
        }
    }

    const addIdElement = () => {
        setCustomIdElements([...customIdElements, { type: 1, value: "", format: "" }]);
    };

    const updateIdElement = (index, key, val) => {
        const updated = [...customIdElements];
        updated[index] = { ...updated[index], [key]: val };
        setCustomIdElements(updated);
    };

    const removeIdElement = (index) => {
        setCustomIdElements(customIdElements.filter((_, i) => i !== index));
    };

    const generatePreview = () => {
        return customIdElements.map(el => {
            const t = parseInt(el.type);
            switch (t) {
                case 1: return el.value || "TEXT";
                case 2: return "A1B2C";
                case 3: return "F3E2D1A0";
                case 4: return "123456";
                case 5: return "123456789";
                case 6: return "a1b2c3d4";
                case 7: return new Date().toISOString().slice(0, 10).replace(/-/g, "");
                case 8: return (el.format ? "1".padStart(parseInt(el.format.replace(/\D/g, "")) || 1, "0") : "1");
                default: return "?";
            }
        }).join("");
    };

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

    const searchUsers = async (searchTerm) => {
        if (!searchTerm || searchTerm.length < 2) {
            setUserSuggestions([]);
            return;
        }
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/User/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { SearchTerm: searchTerm, PageSize: 5, PageNumber: 1 }
            });
            setUserSuggestions(response.data.data || []);
        } catch {
            setUserSuggestions([]);
        }
    };

    const createInventory = async () => {
        try {
            const token = localStorage.getItem("userToken");
            const payload = {
                Title: formData.title,
                Description: formData.description,
                Category: parseInt(formData.category),
                IsPublic: formData.isPublic,
                Version: 1,
                CreatedById: 0,
                ImageUrl: null,
                CustomIdFormatJson: JSON.stringify(
                    customIdElements.map(el => ({
                        Type: parseInt(el.type),
                        Value: el.value || null,
                        Format: el.format || null
                    }))
                ),
            };
            console.log("Payload:", payload);
            console.log("Token:", token);
            const response = await axios.post(`${api_url}/api/Inventory/create`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Response:", response.data);
            const created = response.data.data;
            setNewInventoryId(created.id);
            setMessage({ text: "Inventory created! You can now add fields.", type: "success" });
        } catch (error) {
            console.log("Full error:", error);
            console.log("Response data:", error.response?.data);
            console.log("Status:", error.response?.status);
            const msg = error.response?.data?.message || error.message || "Failed to create inventory";
            setMessage({ text: msg, type: "danger" });
        }
    };
    const addField = () => {
        setFields([...fields, {
            title: "",
            description: "",
            type: 1,
            showInTable: false,
            order: fields.length + 1
        }]);
    };

    const updateField = (index, key, value) => {
        const updated = [...fields];
        updated[index][key] = value;
        setFields(updated);
    };

    const removeField = (index) => {
        setFields(fields.filter((_, i) => i !== index));
    };

    const saveAllFields = async () => {
        try {
            const token = localStorage.getItem("userToken");
            for (const field of fields) {
                await axios.post(`${api_url}/api/InventoryField/create`, {
                    InventoryId: newInventoryId,
                    Title: field.title,
                    Description: field.description,
                    Type: parseInt(field.type),
                    ShowInTable: field.showInTable,
                    Order: field.order
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setMessage({ text: "Inventory and fields saved successfully!", type: "success" });
            handleCloseModal();
        } catch (error) {
            console.log("Error:", error.response?.data);
            const msg = error.response?.data?.message || "Failed to save fields";
            setMessage({ text: msg, type: "danger" });
        }
    };
    const addAccessUsers = () => {
        setAccessUsers([...accessUsers, { emailOrUsername: "", userId: null }]);
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
        updated[index] = {
            emailOrUsername: user.email || user.userName,
            userId: user.id
        };
        setAccessUsers(updated);
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const removeAccessUser = (index) => {
        setAccessUsers(accessUsers.filter((_, i) => i !== index));
        setUserSuggestions([]);
        setActiveSuggestionIndex(-1);
    };

    const saveAllAccessUsers = async () => {
        try {
            const token = localStorage.getItem("userToken");
            for (const user of accessUsers) {
                await axios.post(`${api_url}/api/InventoryUserAccess/create`, {
                    InventoryId: newInventoryId,
                    UserId: user.userId,
                    EmailOrUsername: user.emailOrUsername
                }, {
                    headers: { Authorization: `Bearer ${token}` }
                });
            }
            setMessage({ text: "Inventory and fields saved successfully!", type: "success" });
            handleCloseModal();
        } catch (error) {
            console.log("Error:", error.response?.data);
            const msg = error.response?.data?.message || "Failed to save fields";
            setMessage({ text: msg, type: "danger" });
        }
    };
    //     const addTag = () => {
    //         setTags([...tags, {
    //             name: "",
    //         }]);
    //     };

    //     const updateTag = (index, key, value) => {
    //         const updated = [...tags];
    //         updated[index][key] = value;
    //         setTags(updated);
    //     };

    //     const removeTag= (index) => {
    //         setTags(tags.filter((_, i) => i !== index));
    //     };

    //     const saveAllTags = async () => {
    //     try {
    //         const token = localStorage.getItem("userToken");
    //         for (const tag of tags) {
    //             await axios.post(`${api_url}/api/Tag/create`, {
    //                 Name:tag.name
    //             }, {
    //                 headers: { Authorization: `Bearer ${token}` }
    //             });
    //         }
    //         setMessage({ text: "Inventory and fields saved successfully!", type: "success" });
    //         handleCloseModal();
    //     } catch (error) {
    //         console.log("Error:", error.response?.data);
    //         const msg = error.response?.data?.message || "Failed to save fields";
    //         setMessage({ text: msg, type: "danger" });
    //     }
    // };

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

    useEffect(() => {
    setCheckedInvs([]);
}, [inventories]);
    return (
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
            <div className="container-fluid d-flex">
                {message.text && (
                    <div className={`alert alert-${message.type}`}>{message.text}</div>
                )}
                
                <div className="col-md-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4 ">
                     <ul className="nav nav-underline nav-fill flex-column mt-4">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link text-dark fw-bolder ${activeTab === "own" ? "active" : ""}`}
                                onClick={() => setActiveTab("own")}
                            >
                                My Inventories
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link text-dark fw-bolder ${activeTab === "access" ? "active" : ""}`}
                                onClick={() => setActiveTab("access")}
                            >
                                Shared With Me
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="col-md-9 mt-4 shadow-lg rounded-4 p-4">
                    <h1 className="justify-content-center ps-5">User Page</h1>
                <div className="d-flex justify-content-end mt-2 gap-2">
                    <button 
                         className="btn btn-danger"
                         onClick={deleteSelected}
                         disabled={loading || checkedInvs.length === 0}
                         title="delete selected inventories"
                    >
                         <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" clasname="bi bi-trash3-fill" viewBox="0 0 16 16">
                           <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5"/>
                         </svg>
                    </button>
                    <button className="btn btn-success" onClick={() => setIsModalOpen(true)}>
                        + New Inventory
                    </button>
                </div>
                <table className=" table table-striped table-hover mb-3">
                    <thead>
                        <tr>
                            <th>
                                <input 
                                    type="checkbox" 
                                    className="form-check-input" 
                                    onChange={handleCheckingAllInvs}
                                    checked={inventories.length > 0 && checkedInvs.length === inventories.length}
                                />
                                </th>
                            <th>Title</th>
                            <th>Category</th>
                            <th>Creator Username</th>
                        </tr>
                    </thead>
                    <tbody>
                        {inventories.filter(inv => inv !== null).map((inv) => (
                            <tr key={inv.id}>
                                 <td>
                                        <input 
                                            type="checkbox" 
                                            className="form-check-input" 
                                            checked={checkedInvs.includes(inv.id)}
                                            onChange={() => handleCheckingInvs(inv.id)}
                                        />
                                    </td> 
                                <td onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>{inv.title}</td>
                                <td onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>{categoryLabels[inv.category] || inv.category}</td>
                                <td onClick={() => navigate(`/inventory/${inv.id}`)} style={{ cursor: "pointer" }}>{inv.creatorName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>

            {/* Pagination */}
            <nav aria-label="...">
                <ul className="pagination d-flex justify-content-center mt-3">
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
                        <button
                            className="page-link"
                            onClick={() => setFilter(prev => ({ ...prev, pageNumber: prev.pageNumber + 1 }))}
                            disabled={filter.pageNumber >= totalPages}
                        >
                            Next
                        </button>
                    </li>
                </ul>
            </nav>

            {/* Create Inventory Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Create New Inventory"
                footer={
                    !newInventoryId ? (
                        <button className="btn btn-primary" onClick={createInventory}>
                            Create
                        </button>
                    ) : (
                        <div className="d-flex gap-2">
                            <button className="btn btn-success" onClick={addField}>
                                + New Field
                            </button>
                            <button className="btn btn-secondary" onClick={addAccessUsers}>
                                + Access User
                            </button>
                            <button className="btn btn-primary" onClick={async () => {
                                await saveAllFields();
                                await saveAllAccessUsers();
                            }}>
                                Done
                            </button>
                        </div>
                    )
                }
            >
                {/* Inventory Form — locked after creation */}
                <fieldset disabled={!!newInventoryId}>
                    <div className="mb-3">
                        <label className="form-label">Title</label>
                        <input
                            type="text"
                            className="form-control"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Description</label>
                        <textarea
                            className="form-control"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Category</label>
                        <select
                            className="form-select"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            <option value={1}>Equipment</option>
                            <option value={2}>Furniture</option>
                            <option value={3}>Book</option>
                            <option value={4}>Technology</option>
                            <option value={5}>Other</option>
                        </select>
                    </div>
                    <div className="mb-3 form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            name="isPublic"
                            checked={formData.isPublic}
                            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                        />
                        <label className="form-check-label">Public</label>
                    </div>

                    {/* Custom ID Format Builder */}
                    <div className="mb-3">
                        <label className="form-label fw-bold">Custom ID Format</label>
                        <p className="text-muted small mb-2">Define how item IDs will be auto-generated for this inventory.</p>
                        {customIdElements.map((el, index) => (
                            <div key={index} className="border rounded p-2 mb-2 position-relative">
                                <button
                                    type="button"
                                    className="btn-close position-absolute top-0 end-0 m-1"
                                    style={{ fontSize: "0.6rem" }}
                                    onClick={() => removeIdElement(index)}
                                />
                                <div className="row g-2 align-items-end">
                                    <div className="col">
                                        <label className="form-label small">Type</label>
                                        <select
                                            className="form-select form-select-sm"
                                            value={el.type}
                                            onChange={(e) => updateIdElement(index, "type", e.target.value)}
                                        >
                                            <option value={1}>Fixed Text</option>
                                            <option value={2}>Random 20-Bit</option>
                                            <option value={3}>Random 32-Bit</option>
                                            <option value={4}>Random 6-Digit</option>
                                            <option value={5}>Random 9-Digit</option>
                                            <option value={6}>GUID</option>
                                            <option value={7}>DateTime</option>
                                            <option value={8}>Sequence</option>
                                        </select>
                                    </div>
                                    {parseInt(el.type) === 1 && (
                                        <div className="col">
                                            <label className="form-label small">Value</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder='e.g. INV-'
                                                value={el.value}
                                                onChange={(e) => updateIdElement(index, "value", e.target.value)}
                                            />
                                        </div>
                                    )}
                                    {(parseInt(el.type) === 7 || parseInt(el.type) === 8) && (
                                        <div className="col">
                                            <label className="form-label small">Format</label>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                placeholder={parseInt(el.type) === 7 ? 'e.g. yyyyMMdd' : 'e.g. D5'}
                                                value={el.format}
                                                onChange={(e) => updateIdElement(index, "format", e.target.value)}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        <button type="button" className="btn btn-outline-secondary btn-sm" onClick={addIdElement}>
                            + Add Element
                        </button>
                        {customIdElements.length > 0 && (
                            <div className="mt-2 p-2 bg-light rounded">
                                <small className="text-muted">Preview: </small>
                                <code>{generatePreview()}</code>
                            </div>
                        )}
                    </div>
                </fieldset>

                {/* Fields Section — shown after inventory is created */}
                {newInventoryId && (
                    <div className="mt-2">
                        <hr />
                        <h6 className="mb-3">Fields</h6>
                        {fields.length === 0 && (
                            <p className="text-muted small">No fields yet. Click "+ New Field" to add one.</p>
                        )}
                        {fields.map((field, index) => (
                            <div key={index} className="border rounded p-3 mb-3 position-relative">
                                <button
                                    type="button"
                                    className="btn-close position-absolute top-0 end-0 m-2"
                                    onClick={() => removeField(index)}
                                />
                                <div className="mb-2">
                                    <label className="form-label">Title</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={field.title}
                                        onChange={(e) => updateField(index, "title", e.target.value)}
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Description</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={field.description}
                                        onChange={(e) => updateField(index, "description", e.target.value)}
                                    />
                                </div>
                                <div className="mb-2">
                                    <label className="form-label">Type</label>
                                    <select
                                        className="form-select"
                                        value={field.type}
                                        onChange={(e) => updateField(index, "type", e.target.value)}
                                    >
                                        <option value={1}>Single Lined Text</option>
                                        <option value={2}>Multi Lined Text</option>
                                        <option value={3}>Number</option>
                                        <option value={4}>Boolean</option>
                                        <option value={5}>Link</option>
                                    </select>
                                </div>
                                <div className="form-check">
                                    <input
                                        type="checkbox"
                                        className="form-check-input"
                                        checked={field.showInTable}
                                        onChange={(e) => updateField(index, "showInTable", e.target.checked)}
                                    />
                                    <label className="form-check-label">Show in Table</label>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {newInventoryId && !formData.isPublic && (
                    <div className="mt-2">
                        <hr />
                        <h6 className="mb-3">Users with write access</h6>
                        {accessUsers.length === 0 && (
                            <p className="text-muted small">No users yet. Click "+ Access Users" to add one.</p>
                        )}
                        {accessUsers.map((user, index) => (
                            <div key={index} className="border rounded p-3 mb-3 position-relative">
                                <button
                                    type="button"
                                    className="btn-close position-absolute top-0 end-0 m-2"
                                    onClick={() => removeAccessUser(index)}
                                />
                                <div className="mb-2" style={{ position: "relative" }}>
                                    <label className="form-label">User</label>
                                    <div className="input-group">
                                        <input
                                            type="text"
                                            className="form-control"
                                            placeholder="Search by username or email..."
                                            value={user.emailOrUsername}
                                            onChange={(e) => updateAccessUsers(index, "emailOrUsername", e.target.value)}
                                            onBlur={() => setTimeout(() => {
                                                if (activeSuggestionIndex === index) {
                                                    setUserSuggestions([]);
                                                    setActiveSuggestionIndex(-1);
                                                }
                                            }, 200)}
                                        />
                                        {user.userId && (
                                            <span className="input-group-text text-success">✓</span>
                                        )}
                                    </div>
                                    {activeSuggestionIndex === index && userSuggestions.length > 0 && (
                                        <ul className="list-group" style={{
                                            position: "absolute",
                                            zIndex: 1050,
                                            width: "100%",
                                            maxHeight: "200px",
                                            overflowY: "auto",
                                            boxShadow: "0 4px 8px rgba(0,0,0,0.15)"
                                        }}>
                                            {userSuggestions.map((s) => (
                                                <li
                                                    key={s.id}
                                                    className="list-group-item list-group-item-action"
                                                    style={{ cursor: "pointer" }}
                                                    onMouseDown={() => selectSuggestion(index, s)}
                                                >
                                                    <strong>{s.userName}</strong>
                                                    <small className="text-muted ms-2">{s.email}</small>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </Modal>
        </>
    );
}

export default UserPage;