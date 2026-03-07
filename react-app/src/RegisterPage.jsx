import React, { useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import useTheme from "./useTheme";
import { useTranslation } from "react-i18next";
function RegisterPage() {
  const [formData, setFormData] = useState({
    userName: "",
    fullName: "",
    email: "",
    passwordHash: "",
    isBlocked: false,
    role: 1,
    language: 1,
    theme: 1
  });
  const { setPreferredTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const langMap = { 1: 'en', 2: 'ru' };
  const api_url = "http://localhost:5137";
  const navigate = useNavigate();
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "theme") {
      const v = Number(value);
      setFormData({ ...formData, theme: v });
      setPreferredTheme(v);
      return;
    }
    if (name === "language") {
      const v = Number(value);
      setFormData({ ...formData, language: v });
      i18n.changeLanguage(langMap[v] || 'en');
      return;
    }
    setFormData({ ...formData, [name]: value });
  }
  const handleRegistration = async () => {
    try {
      const response = await axios.post(`${api_url}/api/User/create`, formData);
      const token = response.data.message || response.data.Message;
      localStorage.setItem("userToken", token);
      setPreferredTheme(formData.theme);
      console.log("Success", response.data);
      navigate("/login");
    } catch (error) {
      console.error("Failed", error);
    }
  };

  return (
    <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
      <div className="d-flex flex-column justify-content-center align-items-center border bordeer-success rounded-4 p-5 shadow-lg ">
        <form>
          <div className="d-flex gap-3">
            <div className="form-group">
              <label>{t("register_fullName")}</label>
              <input type="text" value={formData.fullName} name="fullName" onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group">
              <label>{t("register_username")}</label>
              <input type="text" value={formData.userName} name="userName" onChange={handleChange} className="form-control" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group col-md-12">
              <label>{t("register_email")}</label>
              <input type="email" value={formData.email} name="email" onChange={handleChange} className="form-control" />
            </div>
            <div className="form-group col-md-12">
              <label>{t("register_password")}</label>
              <input type="password" value={formData.passwordHash} name="passwordHash" onChange={handleChange} className="form-control mb-3" />
            </div>
            <div className="form-group col-md-12 mb-3">
              <label>{t("register_theme")}</label>
              <select className="form-select" name="theme" value={formData.theme} onChange={handleChange}>
                <option value={1}>{t("light")}</option>
                <option value={2}>{t("dark")}</option>
              </select>
            </div>
            <div className="form-group col-md-12 mb-3">
              <label>{t("language")}</label>
              <select className="form-select" name="language" value={formData.language} onChange={handleChange}>
                <option value={1}>English</option>
                <option value={2}>Русский</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={handleRegistration} className="btn btn-primary w-100 mb-3">{t("register_signUp")}</button>
          <p className="mt-3">{t("register_haveAccount")} <Link to="/login">{t("register_signInLink")}</Link></p>
        </form>
      </div>

    </div>
  );
}
export default RegisterPage;