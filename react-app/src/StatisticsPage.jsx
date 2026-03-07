import React, { useState, useEffect, useCallback } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import useTheme from './useTheme';
import { useTranslation } from "react-i18next";

function StatisticsPage() {
    const [inventories, setInventories] = useState([]);
    const [message, setMessage] = useState({ text: "", type: "" });
    const api_url = "http://localhost:5137";
    const { theme, toggleTheme } = useTheme();
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState("top");
    const navigate = useNavigate();
    const categoryLabels = { 1: t('equipment'), 2: t('furniture'), 3: t('book'), 4: t('technology'), 5: t('other') };

    const fetchTopInventories = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/MainPage/get-top`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInventories(response.data.data || []);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setInventories([]);
        }
    }, [navigate]);

    const fetchLatestInventories = useCallback(async () => {
        try {
            const token = localStorage.getItem("userToken");
            const response = await axios.get(`${api_url}/api/MainPage/get-latest`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setInventories(response.data.data || []);
        } catch (error) {
            const msg = error.response?.data?.message || "Action failed";
            setMessage({ text: msg, type: "danger" });
            if (error.response?.status === 401) navigate("/login");
            setInventories([]);
        }
    }, [navigate]);

    // Single useEffect that reacts to tab changes
    useEffect(() => {
        if (activeTab === "top") fetchTopInventories();
        else if (activeTab === "latest") fetchLatestInventories();
    }, [activeTab, fetchTopInventories, fetchLatestInventories]);

    useEffect(() => {
        if (!message.text) return;
        const timer = setTimeout(() => setMessage({ text: "", type: "" }), 5000);
        return () => clearTimeout(timer);
    }, [message]);

    return (
        <>
            <div className="m-1 mt-2 d-flex justify-content-center align-items-center shadow-lg rounded-4 p-2 pe-5 ps-5">
                <ul className="nav nav-pills w-100 gap-2 align-items-center">
                    <li className="nav-item">
                        <button type="button" className="nav-link active" onClick={() => navigate("/dashboard")}>
                            {t('dashboard')}
                        </button>
                    </li>
                    <li className="nav-item">
                        <button type="button" className="nav-link active" onClick={() => navigate("/statistics")}>
                            {t('statistics')}
                        </button>
                    </li>
                    <li className="ms-auto nav-item">
                        <button type="button" className="nav-link" onClick={() => navigate("/user-page")}>
                            AA
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
                </ul>
            </div>

            <div className="container-fluid d-flex">

                {/* Sidebar - like dashboard */}
                <div className="col-md-2 vh-100 m-3 mt-4 shadow-lg rounded-4 p-4">
                    <ul className="nav nav-underline nav-fill flex-column mt-4">
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link fw-bolder ${activeTab === "top" ? "active" : ""}`}
                                onClick={() => setActiveTab("top")}
                            >
                                {t('statistics_topInventories')}
                            </button>
                        </li>
                        <li className="nav-item">
                            <button
                                type="button"
                                className={`nav-link fw-bolder ${activeTab === "latest" ? "active" : ""}`}
                                onClick={() => setActiveTab("latest")}
                            >
                                {t('statistics_latestInventories')}
                            </button>
                        </li>
                    </ul>
                </div>

                <div className="col-md-9 mt-4 shadow-lg rounded-4 p-4">
                    {message.text && (
                        <div className={`alert alert-${message.type} mb-3`}>{message.text}</div>
                    )}
                    <div className="d-flex justify-content-between align-items-center mt-2 mb-3">
                        <h4 className="mb-0">
                            {activeTab === "top" ? t('statistics_topInventories') : t('statistics_latestInventories')}
                        </h4>
                    </div>

                    <table className="table table-striped table-hover">
                        <thead>
                            <tr>
                                <th>{t('title')}</th>
                                <th>{t('category')}</th>
                                <th>{t('creator')}</th>
                                <th>{t('statistics_numOfItems')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {inventories.length === 0 ? (
                                <tr>
                                    <td colSpan={activeTab === "top" ? 4 : 3} className="text-muted">
                                        {t('statistics_noInventories')}
                                    </td>
                                </tr>
                            ) : (
                                inventories.map((inv) => (
                                    <tr key={inv.id}>
                                        <td>{inv.name}</td>
                                        <td>{categoryLabels[inv.category] || inv.category}</td>
                                        <td>{inv.creator}</td>
                                        <td>{inv.numOfItems}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>);
}
export default StatisticsPage;