import React, { useState, useEffect, useCallback, useRef } from "react";
import axios from 'axios';
import { useNavigate, useParams } from "react-router-dom";
import TagInput from "./TagInput";
import useTheme from "./useTheme";
import { useTranslation } from "react-i18next";

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
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const [items, setItems] = useState([]);
    const [checkedItems, setCheckedItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [filter, setFilter] = useState({ pageNumber: 1, pageSize: 10 });
    const [message, setMessage] = useState({ text: "", type: "" });
    const { inventoryId } = useParams();

    // Two separate field states: all fields (for About tab) and only showInTable fields (for table columns)
    const [inventoryFields, setInventoryFields] = useState([]); // showInTable only
    const [allFields, setAllFields] = useState([]);             // all fields
    const [inventoryData, setInventoryData] = useState(null);   // inventory details

    const [selectedItem, setSelectedItem] = useState(null);
    const [isItemModalOpen, setIsItemModalOpen] = useState(false);
    const api_url = "http://localhost:5137";
    const navigate = useNavigate();

    // Comments
    const [comments, setComments] = useState([]);
    const [commentsLoading, setCommentsLoading] = useState(false);
    const [commentText, setCommentText] = useState("");
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [activeTab, setActiveTab] = useState("items");

    // Likes
    const [likeCounts, setLikeCounts] = useState({});
    const [likedByMe, setLikedByMe] = useState({});
    const [likeBusy, setLikeBusy] = useState({});

    // Search — sent to backend, not filtered client-side
    const [itemSearch, setItemSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Create Item Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", description: "" });

    // Edit Inventory Modal
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editFormData, setEditFormData] = useState({ title: "", description: "", category: 1, isPublic: true, tags: [] });

    // Edit Item Modal
    const [isEditItemModalOpen, setIsEditItemModalOpen] = useState(false);
    const [editItemData, setEditItemData] = useState({ name: "", description: "", fieldValues: [] });

    // Fields (for edit modal)
    const [fields, setFields] = useState([]);

    // Access Users
    const [accessUsers, setAccessUsers] = useState([]);
    const [userSuggestions, setUserSuggestions] = useState([]);
    const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1);
    const searchTimerRef = useRef(null);

    const categoryLabels = { 1: t('equipment'), 2: t('furniture'), 3: t('book'), 4: t('technology'), 5: t('other') };
    const totalPages = Math.ceil(total / filter.pageSize);

    // ─── Helpers ──────────────────────────────────────────────────────────────────
    const getUserIdFromToken = useCallback(() => {
        const token = localStorage.getItem("userToken");
        if (!token) return null;
        try {
            const payloadB64 = token.split(".")[1];
            if (!payloadB64) return null;
            const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
            const payload = JSON.parse(atob(padded));
            const id =
                payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"] ??
                payload.nameid ??
                payload.sub;
            const parsed = parseInt(id, 10);
            return Number.isFinite(parsed) ? parsed : null;
        } catch {
            return null;
        }
    }, []);

    const isAdmin = useCallback(() => {
        const token = localStorage.getItem("userToken");
        if (!token) return false;
        try {
            const payloadB64 = token.split(".")[1];
            const base64 = payloadB64.replace(/-/g, "+").replace(/_/g, "/");
            const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, "=");
            const payload = JSON.parse(atob(padded));
            let role = payload.role ?? payload.Role ?? payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
            if (role == null && Array.isArray(payload.roles)) role = payload.roles[0];
            if (role == null && Array.isArray(payload.role)) role = payload.role[0];
            return role === "Admin" || role === "admin" || Number(role) === 0 || Number(role) === 1;
        } catch {
            return false;
        }
    }, []);

    // ─── Likes ────────────────────────────────────────────────────────────────────
    const fetchLikeMetaForItem = useCallback(async (itemId) => {
        try {
            const countRes = await axios.get(`${api_url}/api/ItemLike/get-all`, {
                params: { ItemId: itemId, PageNumber: 1, PageSize: 1 }
            });
            const count = countRes.data.totalRecords ?? 0;
            setLikeCounts(prev => ({ ...prev, [itemId]: count }));
        } catch {
            setLikeCounts(prev => ({ ...prev, [itemId]: 0 }));
        }

        const me = getUserIdFromToken();
        if (!me) {
            setLikedByMe(prev => ({ ...prev, [itemId]: false }));
            return;
        }

        try {
            await axios.get(`${api_url}/api/ItemLike/get/${itemId}/${me}`);
            setLikedByMe(prev => ({ ...prev, [itemId]: true }));
        } catch (e) {
            if (e.response?.status === 404) {
                setLikedByMe(prev => ({ ...prev, [itemId]: false }));
            }
        }
    }, [getUserIdFromToken]);

    const refreshLikesForVisibleItems = useCallback(async () => {
        if (!items || items.length === 0) return;
        await Promise.all(items.map(i => fetchLikeMetaForItem(i.id)));
    }, [items, fetchLikeMetaForItem]);

    // ─── Search Users ─────────────────────────────────────────────────────────────
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

    // ─── Fetch Fields ─────────────────────────────────────────────────────────────
    const fetchFields = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/InventoryField/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: { InvId: inventoryId }
            });
            const data = response.data.data || [];
            setAllFields(data);
            setInventoryFields(data.filter(f => f.showInTable));
        } catch {
            setAllFields([]);
            setInventoryFields([]);
        }
    }, [inventoryId]);

    const fetchInventory = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/Inventory/get/${inventoryId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setInventoryData(response.data.data || null);
        } catch {
            setInventoryData(null);
        }
    }, [inventoryId]);

    useEffect(() => { fetchFields(); }, [fetchFields]);
    useEffect(() => { fetchInventory(); }, [fetchInventory]);

    // ─── Debounce search input ────────────────────────────────────────────────────
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(itemSearch), 400);
        return () => clearTimeout(timer);
    }, [itemSearch]);

    // Reset to page 1 when search changes
    useEffect(() => {
        setFilter(prev => ({ ...prev, pageNumber: 1 }));
    }, [debouncedSearch]);

    // ─── Fetch Items ──────────────────────────────────────────────────────────────
    const fetchItems = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/Item/get-all`, {
                headers: { Authorization: `Bearer ${token}` },
                params: {
                    PageNumber: filter.pageNumber,
                    PageSize: filter.pageSize,
                    invId: inventoryId,
                    SearchTerm: debouncedSearch || undefined
                }
            });
            setItems(response.data.data || []);
            setTotal(response.data.totalRecords || 0);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setItems([]);
        }
    }, [filter, inventoryId, debouncedSearch]);

    useEffect(() => {
        const delay = setTimeout(() => fetchItems(), 300);
        return () => clearTimeout(delay);
    }, [fetchItems]);

    useEffect(() => { setCheckedItems([]); }, [items]);
    useEffect(() => { refreshLikesForVisibleItems(); }, [refreshLikesForVisibleItems]);

    // ─── Comments ─────────────────────────────────────────────────────────────────
    const fetchComments = useCallback(async () => {
        try {
            setCommentsLoading(true);
            const response = await axios.get(`${api_url}/api/InventoryComment/get-all`, {
                params: { InventoryId: parseInt(inventoryId), PageNumber: 1, PageSize: 50 }
            });
            const list = response.data.data || [];
            list.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setComments(list);
        } catch {
            setComments([]);
        } finally {
            setCommentsLoading(false);
        }
    }, [inventoryId]);

    useEffect(() => { fetchComments(); }, [fetchComments]);

    const createComment = async () => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        const userId = getUserIdFromToken();
        if (!userId) { setMessage({ text: "Could not determine current user.", type: "danger" }); return; }
        const content = commentText.trim();
        if (!content) { setMessage({ text: "Comment cannot be empty.", type: "danger" }); return; }
        try {
            setCommentSubmitting(true);
            await axios.post(`${api_url}/api/InventoryComment/create`, {
                InvId: parseInt(inventoryId),
                UserId: userId,
                Content: content
            }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
            setCommentText("");
            await fetchComments();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to create comment", type: "danger" });
        } finally {
            setCommentSubmitting(false);
        }
    };

    const deleteComment = async (commentId) => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        try {
            await axios.delete(`${api_url}/api/InventoryComment/delete/${commentId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            await fetchComments();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to delete comment", type: "danger" });
        }
    };

    // ─── Likes Toggle ─────────────────────────────────────────────────────────────
    const toggleLike = async (itemId) => {
        const token = localStorage.getItem("userToken");
        if (!token) return navigate("/login");
        const me = getUserIdFromToken();
        if (!me) { setMessage({ text: "Could not determine current user.", type: "danger" }); return; }

        try {
            setLikeBusy(prev => ({ ...prev, [itemId]: true }));
            const isLiked = !!likedByMe[itemId];
            if (isLiked) {
                await axios.delete(`${api_url}/api/ItemLike/delete/${itemId}/${me}`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setLikedByMe(prev => ({ ...prev, [itemId]: false }));
                setLikeCounts(prev => ({ ...prev, [itemId]: Math.max(0, (prev[itemId] ?? 0) - 1) }));
            } else {
                await axios.post(`${api_url}/api/ItemLike/create`, {
                    ItemId: itemId, UserId: me
                }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
                setLikedByMe(prev => ({ ...prev, [itemId]: true }));
                setLikeCounts(prev => ({ ...prev, [itemId]: (prev[itemId] ?? 0) + 1 }));
            }
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to update like", type: "danger" });
            await fetchLikeMetaForItem(itemId);
        } finally {
            setLikeBusy(prev => ({ ...prev, [itemId]: false }));
        }
    };

    const ThumbsUpIcon = ({ filled = false }) => (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" className="me-1" aria-hidden="true">
            <path fill="currentColor" d={filled
                ? "M6.956 1.745C7.021.81 7.908.087 8.864.325l.261.066c.463.116.874.456 1.012.965.22.816.533 2.511.062 4.51a9.84 9.84 0 0 1 .443-.051c.713-.065 1.669-.072 2.516.21.518.173.994.681 1.2 1.273.184.532.16 1.162-.234 1.733.058.119.103.242.138.363.077.27.113.567.113.856 0 .289-.036.586-.113.856-.039.135-.09.273-.16.404.169.387.107.819-.003 1.148a3.163 3.163 0 0 1-.488.901c.054.152.076.312.076.465 0 .305-.089.625-.253.912C13.1 15.522 12.437 16 11.5 16v-1c.563 0 .901-.272 1.066-.56a.865.865 0 0 0 .121-.416c0-.12-.035-.165-.04-.17l-.354-.354.353-.354c.202-.201.407-.511.505-.804.104-.312.043-.441-.005-.488l-.353-.354.353-.354c.043-.042.105-.14.154-.315.048-.167.075-.37.075-.581 0-.211-.027-.414-.075-.581-.05-.174-.111-.273-.154-.315L12.793 9l.353-.354c.353-.352.373-.713.267-1.02-.122-.35-.396-.593-.571-.652-.653-.217-1.447-.224-2.11-.164a8.907 8.907 0 0 0-1.094.171l-.014.003-.003.001a.5.5 0 0 1-.595-.643 8.34 8.34 0 0 0 .145-4.726c-.03-.111-.128-.215-.288-.255l-.262-.065c-.306-.077-.642.156-.667.518-.075 1.082-.239 2.15-.482 2.85-.174.502-.603 1.268-1.238 1.977-.637.712-1.519 1.41-2.614 1.708-.394.108-.62.396-.62.65v4.002c0 .26.22.515.553.55 1.293.137 1.936.53 2.491.868l.04.025c.27.164.495.296.776.393.277.095.63.163 1.14.163h3.5v1H8c-.605 0-1.07-.081-1.466-.218a4.82 4.82 0 0 1-.97-.484l-.048-.03c-.504-.307-.999-.609-2.068-.722C2.682 14.464 2 13.846 2 13V9c0-.85.685-1.432 1.357-1.615.849-.232 1.574-.787 2.132-1.41.56-.627.914-1.28 1.039-1.639.199-.575.356-1.539.428-2.59z"
                : "M8.864.046C7.908-.193 7.02.53 6.956 1.466c-.072 1.051-.23 2.016-.428 2.59-.125.36-.479 1.013-1.04 1.639-.557.623-1.282 1.178-2.131 1.41C2.685 7.288 2 7.87 2 8.72v4.001c0 .845.682 1.464 1.448 1.545 1.07.114 1.564.415 2.068.723l.048.03c.272.165.578.348.97.484.397.136.861.217 1.466.217h3.5c.937 0 1.599-.477 1.934-1.064a1.86 1.86 0 0 0 .254-.912c0-.152-.023-.312-.077-.464.201-.263.38-.578.488-.901.11-.33.172-.762.004-1.149.069-.13.12-.269.159-.403.077-.27.113-.568.113-.857 0-.288-.036-.585-.113-.856a2 2 0 0 0-.138-.362 1.9 1.9 0 0 0 .234-1.734c-.206-.592-.682-1.1-1.2-1.272-.847-.282-1.803-.276-2.516-.211a10 10 0 0 0-.443.05 9.4 9.4 0 0 0-.062-4.509A1.38 1.38 0 0 0 9.125.111zM11.5 14.721H8c-.51 0-.863-.069-1.14-.164-.281-.097-.506-.228-.776-.393l-.04-.024c-.555-.339-1.198-.731-2.49-.868-.333-.036-.554-.29-.554-.55V8.72c0-.254.226-.543.62-.65 1.095-.3 1.977-.996 2.614-1.708.635-.71 1.064-1.475 1.238-1.978.243-.7.407-1.768.482-2.85.025-.362.36-.594.667-.518l.262.066c.16.04.258.143.288.255a8.34 8.34 0 0 1-.145 4.725.5.5 0 0 0 .595.644l.003-.001.014-.003.058-.014a9 9 0 0 1 1.036-.157c.663-.06 1.457-.054 2.11.164.175.058.45.3.57.65.107.308.087.67-.266 1.022l-.353.353.353.354c.043.043.105.141.154.315.048.167.075.37.075.581 0 .212-.027.414-.075.582-.05.174-.111.272-.154.315l-.353.353.353.354c.047.047.109.177.005.488a2.2 2.2 0 0 1-.505.805l-.353.353.353.354c.006.005.041.05.041.17a.9.9 0 0 1-.121.416c-.165.288-.503.56-1.066.56z"
            } />
        </svg>
    );

    // ─── Create Item ──────────────────────────────────────────────────────────────
    const createItem = async () => {
        try {
            const token = localStorage.getItem("userToken");
            if (!token) return navigate("/login");
            const response = await axios.post(`${api_url}/api/Item/create`, {
                InvId: parseInt(inventoryId),
                Name: formData.name,
                Description: formData.description,
            }, { headers: { Authorization: `Bearer ${token}` } });
            setMessage({ text: response.data.message || "Item created!", type: "success" });
            setIsModalOpen(false);
            setFormData({ name: "", description: "" });
            await fetchItems();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to create item", type: "danger" });
            if (error.response?.status === 401) navigate("/login");
        }
    };

    // ─── Delete Selected ──────────────────────────────────────────────────────────
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

    // ─── Edit Item ────────────────────────────────────────────────────────────────
    const openEditItemModal = () => {
        setEditItemData({
            name: selectedItem.name,
            description: selectedItem.description,
            fieldValues: allFields.map(f => ({
                fieldId: f.id,
                fieldTitle: f.title,
                fieldType: f.type,
                value: selectedItem.fieldValues?.find(v => v.fieldId === f.id)?.value || ""
            }))
        });
        setIsItemModalOpen(false);
        setIsEditItemModalOpen(true);
    };

    // FIX: batch field values instead of loop
    const updateItem = async () => {
        try {
            const token = localStorage.getItem("userToken");
            await axios.put(`${api_url}/api/Item/update/${selectedItem.id}`, {
                Name: editItemData.name,
                Description: editItemData.description,
            }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });

            const nonEmptyValues = editItemData.fieldValues.filter(fv => fv.value !== "");
            if (nonEmptyValues.length > 0) {
                await axios.post(`${api_url}/api/ItemFieldValue/set-bulk`, {
                    ItemId: selectedItem.id,
                    FieldValues: nonEmptyValues.map(fv => ({ FieldId: fv.fieldId, Value: fv.value }))
                }, { headers: { Authorization: `Bearer ${token}` } });
            }

            setMessage({ text: "Item updated!", type: "success" });
            setIsEditItemModalOpen(false);
            setSelectedItem(null);
            await fetchItems();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to update item", type: "danger" });
        }
    };

    // ─── Edit Inventory ───────────────────────────────────────────────────────────
    const openEditModal = async () => {
        const token = localStorage.getItem("userToken");
        try {
            const [invRes, fieldsRes, accessRes] = await Promise.all([
                axios.get(`${api_url}/api/Inventory/get/${inventoryId}`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${api_url}/api/InventoryField/get-all`, { headers: { Authorization: `Bearer ${token}` }, params: { InvId: inventoryId } }),
                axios.get(`${api_url}/api/InventoryUserAccess/get-all`, { headers: { Authorization: `Bearer ${token}` }, params: { InvId: inventoryId } })
            ]);
            const inv = invRes.data.data;
            setEditFormData({ title: inv.title, description: inv.description, category: inv.category, isPublic: inv.isPublic, tags: inv.tags || [] });
            setFields((fieldsRes.data.data || []).map(f => ({
                id: f.id, title: f.title, description: f.description,
                type: f.type, showInTable: f.showInTable, order: f.order, isExisting: true
            })));
            setAccessUsers((accessRes.data.data || []).map(a => ({
                userId: a.userId, emailOrUsername: a.emailOrUsername, isExisting: true
            })));
            setIsEditModalOpen(true);
        } catch {
            setMessage({ text: "Failed to load inventory data", type: "danger" });
        }
    };

    // FIX: batch new fields and access users instead of loops
    const updateInventory = async () => {
        try {
            const token = localStorage.getItem("userToken");

            await axios.put(`${api_url}/api/Inventory/update/${inventoryId}`, {
                Title: editFormData.title,
                Description: editFormData.description,
                Category: parseInt(editFormData.category),
                IsPublic: editFormData.isPublic,
                Tags: editFormData.tags || []
            }, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });

            const newFields = fields.filter(f => !f.isExisting);
            if (newFields.length > 0) {
                await Promise.all(newFields.map(f =>
                    axios.post(`${api_url}/api/InventoryField/create`, {
                        InvId: parseInt(inventoryId),
                        Title: f.title,
                        Description: f.description,
                        Type: parseInt(f.type),
                        ShowInTable: f.showInTable,
                        Order: f.order
                    }, { headers: { Authorization: `Bearer ${token}` } })
                ));
            }

            const newUsers = accessUsers.filter(u => !u.isExisting);
            if (newUsers.length > 0) {
                await Promise.all(newUsers.map(u =>
                    axios.post(`${api_url}/api/InventoryUserAccess/create`, {
                        InvId: parseInt(inventoryId),
                        UserId: u.userId,
                        EmailOrUsername: u.emailOrUsername
                    }, { headers: { Authorization: `Bearer ${token}` } })
                ));
            }

            setMessage({ text: "Inventory updated!", type: "success" });
            setIsEditModalOpen(false);
            await fetchFields();
            await fetchItems();
        } catch (error) {
            setMessage({ text: error.response?.data?.message || "Failed to update", type: "danger" });
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
                await axios.delete(`${api_url}/api/InventoryUserAccess/delete/${inventoryId}/${user.userId}`, {
                    headers: { Authorization: `Bearer ${token}` }
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

    // ─── Auto-dismiss messages ────────────────────────────────────────────────────
    useEffect(() => {
        if (!message.text) return;
        const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
        return () => clearTimeout(timer);
    }, [message.text]);

    const me = getUserIdFromToken();
    const admin = isAdmin();

    return (
        <>
            <div className="m-1 mt-2 d-flex justify-content-center align-items-center shadow-lg rounded-4 p-2 pe-5 ps-5">
                <ul className="nav nav-pills w-100 gap-2 align-items-center">
                    <li className="nav-item">
                        <button type="button" className="nav-link active" onClick={() => navigate("/dashboard")}>{t('dashboard')}</button>
                    </li>
                    <li className="nav-item">
                        <button type="button" className="nav-link active" onClick={() => navigate("/statistics")}>{t('statistics')}</button>
                    </li>
                    <li className="ms-auto nav-item">
                        <button type="button" className="nav-link" onClick={() => navigate("/user-page")}>AA</button>
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
                </ul>
            </div>

            <div className="container-fluid d-flex justify-content-start gap-3 w-100 p-0">
                {/* Sidebar */}
                <div className="col-sm-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4">
                    <ul className="nav nav-underline nav-fill flex-column mt-4">
                        {[["items", t('inventory_items')], ["discussion", t('inventory_discussion')], ["about", t('inventory_about_tab')]].map(([tab, label]) => (
                            <li className="nav-item" key={tab}>
                                <button
                                    type="button"
                                    className={`nav-link fw-bolder ${activeTab === tab ? "active" : ""}`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Main content */}
                <div className="mt-4 shadow-lg rounded-4 p-4 mb-2 col-sm-9">
                    {message.text && (
                        <div className={`alert alert-${message.type} alert-dismissible`}>
                            {message.text}
                            <button type="button" className="btn-close" onClick={() => setMessage({ text: "", type: "" })} />
                        </div>
                    )}

                    <div className="d-flex justify-content-center align-items-center">
                        <h1>{`${t('inventory_title')} ${inventoryId}`}</h1>
                    </div>

                    <div className="pt-3">
                        {/* ── Items Tab ── */}
                        {activeTab === "items" && (
                            <>
                                <div className="d-flex justify-content-end mt-2 gap-2 mb-4">
                                    <div className="d-flex align-items-center" style={{ maxWidth: "250px", width: "100%" }}>
                                        <input
                                            type="search"
                                            className="form-control"
                                            placeholder={t('inventory_searchItems')}
                                            value={itemSearch}
                                            onChange={(e) => setItemSearch(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        className="btn btn-danger"
                                        onClick={deleteSelected}
                                        disabled={loading || checkedItems.length === 0}
                                        title={t('inventory_deleteSelected')}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                                            <path d="M11 1.5v1h3.5a.5.5 0 0 1 0 1h-.538l-.853 10.66A2 2 0 0 1 11.115 16h-6.23a2 2 0 0 1-1.994-1.84L2.038 3.5H1.5a.5.5 0 0 1 0-1H5v-1A1.5 1.5 0 0 1 6.5 0h3A1.5 1.5 0 0 1 11 1.5m-5 0v1h4v-1a.5.5 0 0 0-.5-.5h-3a.5.5 0 0 0-.5.5M4.5 5.029l.5 8.5a.5.5 0 1 0 .998-.06l-.5-8.5a.5.5 0 1 0-.998.06m6.53-.528a.5.5 0 0 0-.528.47l-.5 8.5a.5.5 0 0 0 .998.058l.5-8.5a.5.5 0 0 0-.47-.528M8 4.5a.5.5 0 0 0-.5.5v8.5a.5.5 0 0 0 1 0V5a.5.5 0 0 0-.5-.5" />
                                        </svg>
                                    </button>
                                    <button className="btn btn-primary" onClick={openEditModal}>{t('inventory_editInventory')}</button>
                                    <button className="btn btn-success" onClick={() => setIsModalOpen(true)}>{t('inventory_newItem')}</button>
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
                                            <th>{t('inventory_customId')}</th>
                                            <th>{t('name')}</th>
                                            {inventoryFields.map(f => <th key={f.id}>{f.title}</th>)}
                                            <th style={{ width: 120 }}>{t('inventory_likes')}</th>
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
                                                <td onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        className={`btn btn-sm ${likedByMe[item.id] ? "btn-danger" : "btn-outline-danger"}`}
                                                        onClick={() => toggleLike(item.id)}
                                                        disabled={!!likeBusy[item.id]}
                                                        title={likedByMe[item.id] ? t('inventory_unlike') : t('inventory_like')}
                                                    >
                                                        <ThumbsUpIcon filled={!!likedByMe[item.id]} /> {likeCounts[item.id] ?? 0}
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </>
                        )}

                        {/* ── Discussion Tab ── */}
                        {activeTab === "discussion" && (
                            <div className="card h-100">
                                <div className="card-header d-flex justify-content-between align-items-center">
                                    <div>{t('inventory_discussion')}</div>
                                    <button className="btn btn-sm btn-outline-secondary" onClick={fetchComments} disabled={commentsLoading}>
                                        {t('inventory_refresh')}
                                    </button>
                                </div>
                                <div className="card-body">
                                    <div className="mb-3" style={{ maxHeight: 600, overflowY: "auto" }}>
                                        {commentsLoading ? (
                                            <div className="text-muted">{t('inventory_loadingComments')}</div>
                                        ) : comments.length === 0 ? (
                                            <div className="text-muted">{t('inventory_noComments')}</div>
                                        ) : (
                                            comments.map(c => {
                                                const isAuthor = c.userId === me;
                                                const canDelete = isAuthor || admin;
                                                const author = isAuthor ? t('inventory_you') : `${t('inventory_userNum')} #${c.userId}`;
                                                return (
                                                    <div key={c.id} className="border rounded p-2 mb-2">
                                                        <div className="d-flex justify-content-between">
                                                            <small className="text-muted">{author}</small>
                                                            <small className="text-muted">{new Date(c.createdAt).toLocaleString()}</small>
                                                        </div>
                                                        <div style={{ whiteSpace: "pre-wrap" }}>{c.content}</div>
                                                        {/* FIX: only show delete to author or admin */}
                                                        {canDelete && (
                                                            <div className="mt-2 d-flex justify-content-end">
                                                                <button className="btn btn-sm btn-outline-danger" onClick={() => deleteComment(c.id)}>
                                                                    {t('inventory_delete')}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })
                                        )}
                                    </div>
                                    <div className="input-group">
                                        <input
                                            className="form-control"
                                            placeholder={t('inventory_writeComment')}
                                            value={commentText}
                                            onChange={(e) => setCommentText(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); createComment(); } }}
                                            disabled={commentSubmitting}
                                        />
                                        <button className="btn btn-primary" onClick={createComment} disabled={commentSubmitting || !commentText.trim()}>
                                            {t('inventory_send')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── About Tab ── */}
                        {activeTab === "about" && (
                            <div className="d-flex flex-column p-3 shadow-lg m-4 rounded-3">
                                <h5>{inventoryData?.title || `Inventory ${inventoryId}`}</h5>
                                <div className="mb-3">
                                    <label className="fw-bold">{t('description')}</label>
                                    <p className="text-muted">{inventoryData?.description || t('inventory_noDescription')}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="fw-bold">{t('category')}</label>
                                    <p className="text-muted">{categoryLabels[inventoryData?.category] || inventoryData?.category}</p>
                                </div>
                                <div className="mb-3">
                                    <label className="fw-bold">{t('inventory_visibility')}</label>
                                    <p className="text-muted">{inventoryData?.isPublic ? t('public') : t('private')}</p>
                                </div>
                                <hr />
                                <h6>{t('inventory_fields')}</h6>
                                {allFields.length === 0 ? (
                                    <p className="text-muted">{t('inventory_noFields')}</p>
                                ) : (
                                    <div className="d-flex flex-column gap-3 mt-2">
                                        {allFields.map(field => (
                                            <div key={field.id} className="border rounded p-2">
                                                <span className="badge bg-secondary me-2">{field.title}</span>
                                                {field.showInTable && <span className="badge bg-info text-dark me-2">{t('inventory_shownInTable')}</span>}
                                                <p className="text-muted small mb-0 mt-1">{field.description || t('inventory_noDescription')}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Pagination */}
            {activeTab === "items" && totalPages > 1 && (
                <nav>
                    <ul className="pagination d-flex justify-content-center">
                        <li className={`page-item ${filter.pageNumber <= 1 ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: p.pageNumber - 1 }))} disabled={filter.pageNumber <= 1}>{t('previous')}</button>
                        </li>
                        {[...Array(totalPages)].map((_, index) => {
                            const pageNum = index + 1;
                            return (
                                <li key={pageNum} className={`page-item ${filter.pageNumber === pageNum ? "active" : ""}`}>
                                    <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: pageNum }))}>{pageNum}</button>
                                </li>
                            );
                        })}
                        <li className={`page-item ${filter.pageNumber >= totalPages ? "disabled" : ""}`}>
                            <button className="page-link" onClick={() => setFilter(p => ({ ...p, pageNumber: p.pageNumber + 1 }))} disabled={filter.pageNumber >= totalPages}>{t('next')}</button>
                        </li>
                    </ul>
                </nav>
            )}

            {/* Create Item Modal */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setFormData({ name: "", description: "" }); }} title={t('inventory_createNewItem')}
                footer={<button className="btn btn-primary" onClick={createItem}>{t('inventory_create')}</button>}
            >
                <div className="mb-3">
                    <label className="form-label">{t('name')}</label>
                    <input type="text" className="form-control" value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('description')}</label>
                    <textarea className="form-control" value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                </div>
            </Modal>

            {/* Edit Inventory Modal */}
            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t('inventory_editInv')}
                footer={
                    <div className="d-flex gap-2">
                        <button className="btn btn-outline-secondary" onClick={addField}>{t('inventory_addField')}</button>
                        <button className="btn btn-outline-secondary" onClick={addAccessUsers}>{t('inventory_addUser')}</button>
                        <button className="btn btn-primary" onClick={updateInventory}>{t('save')}</button>
                    </div>
                }
            >
                <div className="mb-3">
                    <label className="form-label">{t('title')}</label>
                    <input type="text" className="form-control" value={editFormData.title}
                        onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('description')}</label>
                    <textarea className="form-control" value={editFormData.description}
                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} />
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('category')}</label>
                    <select className="form-select" value={editFormData.category}
                        onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}>
                        {Object.entries(categoryLabels).map(([val, label]) => (
                            <option key={val} value={val}>{label}</option>
                        ))}
                    </select>
                </div>
                <div className="mb-3 form-check">
                    <input type="checkbox" className="form-check-input" checked={editFormData.isPublic}
                        onChange={(e) => setEditFormData({ ...editFormData, isPublic: e.target.checked })} />
                    <label className="form-check-label">{t('public')}</label>
                </div>
                <div className="mb-3">
                    <label className="form-label">{t('tags')}</label>
                    <TagInput
                        value={editFormData.tags || []}
                        onChange={(tags) => setEditFormData({ ...editFormData, tags })}
                        apiUrl={api_url}
                        placeholder={t('inventory_tagsPlaceholder')}
                    />
                </div>
                <hr />
                <h6 className="mb-3">{t('inventory_fields')}</h6>
                {fields.length === 0 && <p className="text-muted small">{t('inventory_noFieldsYet')}</p>}
                {fields.map((field, index) => (
                    <div key={index} className="border rounded p-3 mb-2 position-relative">
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-2" onClick={() => removeField(index)} />
                        {field.isExisting && <span className="badge bg-secondary mb-2">{t('inventory_existing')}</span>}
                        <div className="mb-2">
                            <label className="form-label small">{t('title')}</label>
                            <input type="text" className="form-control form-control-sm" value={field.title}
                                onChange={(e) => updateField(index, "title", e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">{t('description')}</label>
                            <input type="text" className="form-control form-control-sm" value={field.description}
                                onChange={(e) => updateField(index, "description", e.target.value)} />
                        </div>
                        <div className="mb-2">
                            <label className="form-label small">{t('inventory_fieldType')}</label>
                            <select className="form-select form-select-sm" value={field.type}
                                onChange={(e) => updateField(index, "type", e.target.value)} disabled={field.isExisting}>
                                <option value={1}>{t('inventory_singleLinedText')}</option>
                                <option value={2}>{t('inventory_multiLinedText')}</option>
                                <option value={3}>{t('inventory_number')}</option>
                                <option value={4}>{t('inventory_boolean')}</option>
                                <option value={5}>{t('inventory_link')}</option>
                            </select>
                        </div>
                        <div className="form-check">
                            <input type="checkbox" className="form-check-input" checked={field.showInTable}
                                onChange={(e) => updateField(index, "showInTable", e.target.checked)} />
                            <label className="form-check-label small">{t('inventory_showInTable')}</label>
                        </div>
                    </div>
                ))}
                <hr />
                <h6 className="mb-3">{t('inventory_usersWithAccess')}</h6>
                {accessUsers.length === 0 && <p className="text-muted small">{t('inventory_noUsersYet')}</p>}
                {accessUsers.map((user, index) => (
                    <div key={index} className="border rounded p-3 mb-2 position-relative">
                        <button type="button" className="btn-close position-absolute top-0 end-0 m-2" onClick={() => removeAccessUser(index)} />
                        {user.isExisting && <span className="badge bg-secondary mb-2">{t('inventory_existing')}</span>}
                        <div style={{ position: "relative" }}>
                            <div className="input-group">
                                <input type="text" className="form-control"
                                    placeholder={t('inventory_searchUserPlaceholder')}
                                    value={user.emailOrUsername}
                                    disabled={user.isExisting}
                                    onChange={(e) => updateAccessUsers(index, "emailOrUsername", e.target.value)}
                                    onBlur={() => setTimeout(() => {
                                        if (activeSuggestionIndex === index) { setUserSuggestions([]); setActiveSuggestionIndex(-1); }
                                    }, 200)}
                                />
                                {user.userId && !user.isExisting && <span className="input-group-text text-success">✓</span>}
                            </div>
                            {activeSuggestionIndex === index && userSuggestions.length > 0 && (
                                <ul className="list-group position-absolute w-100" style={{ zIndex: 1050, maxHeight: "200px", overflowY: "auto", boxShadow: "0 4px 8px rgba(0,0,0,0.15)" }}>
                                    {userSuggestions.map((s) => (
                                        <li key={s.id} className="list-group-item list-group-item-action" style={{ cursor: "pointer" }}
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

            {/* View Item Modal */}
            <Modal
                isOpen={isItemModalOpen}
                onClose={() => { setIsItemModalOpen(false); setSelectedItem(null); }}
                title={selectedItem?.name || t('inventory_itemDetails')}
                footer={
                    <div className="d-flex gap-2 justify-content-center align-items-center">
                        {selectedItem && (
                            <button
                                type="button"
                                className={`btn ${likedByMe[selectedItem.id] ? "btn-danger" : "btn-outline-danger"}`}
                                onClick={() => toggleLike(selectedItem.id)}
                                disabled={!!likeBusy[selectedItem.id]}
                                title={likedByMe[selectedItem.id] ? t('inventory_unlike') : t('inventory_like')}
                            >
                                <ThumbsUpIcon filled={!!likedByMe[selectedItem.id]} /> {likeCounts[selectedItem.id] ?? 0}
                            </button>
                        )}
                        <button className="btn btn-primary" onClick={openEditItemModal}>{t('inventory_edit')}</button>
                        <button className="btn btn-secondary" onClick={() => { setIsItemModalOpen(false); setSelectedItem(null); }}>{t('inventory_close')}</button>
                    </div>
                }
            >
                {selectedItem && (
                    <div>
                        <div className="mb-3">
                            <label className="fw-bold">{t('description')}</label>
                            <p className="text-muted">{selectedItem.description || "-"}</p>
                        </div>
                        {allFields.length > 0 && (
                            <>
                                <hr />
                                <h6>{t('inventory_fields')}</h6>
                                {allFields.map(f => (
                                    <div className="mb-3" key={f.id}>
                                        <label className="fw-bold">{f.title}</label>
                                        <p className="text-muted">
                                            {selectedItem.fieldValues?.find(v => v.fieldId === f.id)?.value || "-"}
                                        </p>
                                    </div>
                                ))}
                                <hr />
                            </>
                        )}
                        <div className="mb-3">
                            <label className="fw-bold">{t('inventory_createdAt')}</label>
                            <p className="text-muted">{new Date(selectedItem.createdAt).toLocaleString()}</p>
                        </div>
                        <div className="mb-3">
                            <label className="fw-bold">{t('inventory_updatedAt')}</label>
                            <p className="text-muted">{new Date(selectedItem.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                )}
            </Modal>

            {/* Edit Item Modal */}
            <Modal
                isOpen={isEditItemModalOpen}
                onClose={() => { setIsEditItemModalOpen(false); setSelectedItem(null); }}
                title={`Edit: ${selectedItem?.name || ""}`}
                footer={
                    <div className="d-flex gap-2">
                        <button className="btn btn-primary" onClick={updateItem}>{t('save')}</button>
                        <button className="btn btn-secondary" onClick={() => { setIsEditItemModalOpen(false); setSelectedItem(null); }}>{t('cancel')}</button>
                    </div>
                }
            >
                {selectedItem && (
                    <div>
                        <div className="mb-3">
                            <label className="form-label">{t('name')}</label>
                            <input type="text" className="form-control" value={editItemData.name}
                                onChange={(e) => setEditItemData({ ...editItemData, name: e.target.value })} />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">{t('description')}</label>
                            <textarea className="form-control" value={editItemData.description}
                                onChange={(e) => setEditItemData({ ...editItemData, description: e.target.value })} />
                        </div>
                        {editItemData.fieldValues.length > 0 && (
                            <>
                                <hr />
                                <h6>{t('inventory_fieldValues')}</h6>
                                {editItemData.fieldValues.map((fv, index) => (
                                    <div key={fv.fieldId} className="mb-3">
                                        <label className="form-label">{fv.fieldTitle}</label>
                                        {fv.fieldType === 2 ? (
                                            <textarea className="form-control" value={fv.value}
                                                onChange={(e) => {
                                                    const updated = [...editItemData.fieldValues];
                                                    updated[index].value = e.target.value;
                                                    setEditItemData({ ...editItemData, fieldValues: updated });
                                                }} />
                                        ) : fv.fieldType === 4 ? (
                                            <div className="form-check">
                                                <input type="checkbox" className="form-check-input"
                                                    checked={fv.value === "true"}
                                                    onChange={(e) => {
                                                        const updated = [...editItemData.fieldValues];
                                                        updated[index].value = e.target.checked ? "true" : "false";
                                                        setEditItemData({ ...editItemData, fieldValues: updated });
                                                    }} />
                                            </div>
                                        ) : fv.fieldType === 5 ? (
                                            <input type="url" className="form-control" value={fv.value}
                                                onChange={(e) => {
                                                    const updated = [...editItemData.fieldValues];
                                                    updated[index].value = e.target.value;
                                                    setEditItemData({ ...editItemData, fieldValues: updated });
                                                }} />
                                        ) : (
                                            <input type={fv.fieldType === 3 ? "number" : "text"} className="form-control" value={fv.value}
                                                onChange={(e) => {
                                                    const updated = [...editItemData.fieldValues];
                                                    updated[index].value = e.target.value;
                                                    setEditItemData({ ...editItemData, fieldValues: updated });
                                                }} />
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