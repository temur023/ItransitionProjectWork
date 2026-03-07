import React, {useState} from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
function LoginPage(){
    const [loginInput, setLoginInput] = useState("");
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        userName: "",
        email: "",
        passwordHash: ""
    });

    const api_url = "http://localhost:5137";
    const { t } = useTranslation();

    function handleLoginInputChange(e) {
    const value = e.target.value;
    setLoginInput(value);

    if (value.includes("@")) {
      setFormData({ ...formData, email: value, userName: "" });
    } else {
      setFormData({ ...formData, userName: value, email: "" });
    }
  }

    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }

const handleLogin = async () => {
    try {
      const payload = {
        loginInput: loginInput,
        passwordHash: formData.passwordHash
      };
      const response = await axios.post(`${api_url}/api/Auth/login`, payload);
      const token = response.data.token;
      localStorage.setItem("userToken", token);
      const lang = response.data.language === 2 ? "ru" : "en";
      localStorage.setItem("language", lang);
      i18n.changeLanguage(lang);
      navigate("/dashboard");
    } catch (error) {
      const message = error.response?.data?.message || "Login failed";
      alert(message);
    }
};
  const isEmail = loginInput.includes("@");
  const inputPlaceholder = isEmail ? t("login_emailOrUsername") : t("login_emailOrUsername");
    return(
    <>
        <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
            <div className="d-flex flex-column justify-content-center align-items-center border bordeer-success rounded-4 p-5 w-25 shadow-lg ">
                <h3 className=" mb-4 mt-4">{t("login_title")}</h3>
                <form>
                    <div className="form-row">
                      <div className="form-group mb-2">
                         <label >{t("login_emailOrUsername")}</label>
                        <input name="loginInput" type={isEmail ? "email" : "text"} value={loginInput} onChange={handleLoginInputChange} placeholder={inputPlaceholder} className="form-control"/>
                      </div>
                      <div className="form-group mb-3">
                        <label>{t("login_password")}</label>
                        <input type="password" name="passwordHash" onChange={handleChange} value={formData.passwordHash} placeholder={t("login_password")} className="form-control"/>
                      </div>
                    </div>
                    <button type="button" onClick={handleLogin} className="btn btn-primary w-100 mb-2">{t("login_signIn")}</button>
                    <p>{t("login_noAccount")} <Link to="/register">{t("login_signUpLink")}</Link></p>
                </form>
            </div>
        </div>
    </>
);
}
export default LoginPage;