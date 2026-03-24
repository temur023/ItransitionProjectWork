import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import api from "./useApi";

export default function Navbar({ profileData, theme, toggleTheme, logout }) {
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
    const [ticketForm, setTicketForm] = useState({ summary: "", priority: "Average" });
    const [ticketSaving, setTicketSaving] = useState(false);

    const submitTicket = async () => {
    try {
        setTicketSaving(true);
        await api.post('/api/SupportTicket/create', {
            Summary: ticketForm.summary,
            Priority: ticketForm.priority,
            ReportedBy: profileData?.userName || profileData?.email,
            InventoryTitle: null,
            Link: window.location.href,
        });
        setIsTicketModalOpen(false);
        setTicketForm({ summary: "", priority: "Average" });
        alert("Support ticket submitted successfully!");
    } catch (error) {
        alert("Failed to submit ticket");
    } finally {
        setTicketSaving(false);
    }
};

    return (
        <div className="m-1 mt-2 d-flex justify-content-center align-items-center shadow-lg rounded-4 p-2 pe-5 ps-5">
            <ul className="nav nav-pills w-100 gap-2 align-items-center">
                <li className="nav-item">
                    <button type="button" className="nav-link active"
                        onClick={() => navigate("/dashboard")}>{t('dashboard')}</button>
                </li>
                <li className="nav-item">
                    <button type="button" className="nav-link active"
                        onClick={() => navigate("/statistics")}>{t('statistics')}</button>
                </li>
                <li className="ms-auto nav-item">
                    <button type="button" className="nav-link p-0" onClick={() => navigate("/user-page")}>
                        {profileData?.profileImage
                            ? <img src={profileData.profileImage} alt="avatar"
                                style={{ width: 35, height: 35, borderRadius: "50%", objectFit: "cover" }} />
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
                    <button type="button" className="nav-link" onClick={toggleTheme} title="Toggle theme">
                        {theme === "light" ? "🌙" : "☀️"}
                    </button>
                </li>
                <li>
                    <button
                        className="btn btn-outline-warning btn-sm ms-2"
                        onClick={() => setIsTicketModalOpen(true)}
                        title="Create Support Ticket">
                        Help
                    </button>
                </li>
                <li>
                    <button onClick={logout} className="btn btn-outline-danger btn-sm fw-bold px-3">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="red"
                            className="bi bi-box-arrow-right me-1" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0z" />
                            <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708z" />
                        </svg>
                    </button>
                </li>
            </ul>
                {isTicketModalOpen && (
                    <>
                        <div className="modal-backdrop fade show" 
                            onClick={() => setIsTicketModalOpen(false)} />
                        <div className="modal fade show d-block" tabIndex="-1">
                            <div className="modal-dialog modal-dialog-centered"
                                onClick={e => e.stopPropagation()}>
                                <div className="modal-content">
                                    <div className="modal-header">
                                        <h5 className="modal-title">Create Support Ticket</h5>
                                        <button type="button" className="btn-close"
                                            onClick={() => setIsTicketModalOpen(false)} />
                                    </div>
                                    <div className="modal-body">
                                        <div className="mb-3">
                                            <label className="form-label">Summary</label>
                                            <textarea className="form-control" rows={3}
                                                value={ticketForm.summary}
                                                onChange={e => setTicketForm(f => ({
                                                    ...f, summary: e.target.value
                                                }))} />
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Priority</label>
                                            <select className="form-select"
                                                value={ticketForm.priority}
                                                onChange={e => setTicketForm(f => ({
                                                    ...f, priority: e.target.value
                                                }))}>
                                                <option value="High">High</option>
                                                <option value="Average">Average</option>
                                                <option value="Low">Low</option>
                                            </select>
                                        </div>
                                        <div className="mb-3">
                                            <label className="form-label">Page</label>
                                            <input className="form-control"
                                                value={window.location.href} disabled />
                                        </div>
                                    </div>
                                    <div className="modal-footer">
                                        <button className="btn btn-secondary"
                                            onClick={() => setIsTicketModalOpen(false)}>
                                            Cancel
                                        </button>
                                        <button className="btn btn-primary"
                                            onClick={submitTicket} disabled={ticketSaving}>
                                            {ticketSaving ? "Submitting..." : "Submit Ticket"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
        </div>
    );
}
