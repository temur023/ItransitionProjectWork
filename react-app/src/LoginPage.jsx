import React, { useState } from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import FacebookLogin from "@greatsumini/react-facebook-login";

const GOOGLE_CLIENT_ID = "883533109052-5i1slf978hamq2ircs74s6fvpj6tdktu.apps.googleusercontent.com";
const FACEBOOK_APP_ID = "932426212812578";
const api_url = "https://itransitionprojectwork-production.up.railway.app";

function LoginPage() {
    const [loginInput, setLoginInput] = useState("");
    const [formData, setFormData] = useState({ userName: "", email: "", passwordHash: "" });
    const navigate = useNavigate();
    const { t, i18n } = useTranslation();

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
            const payload = { loginInput, passwordHash: formData.passwordHash };
            const response = await axios.post(`${api_url}/api/Auth/login`, payload);
            const token = response.data.token;
            localStorage.setItem("userToken", token);
            const lang = response.data.language === 2 ? "ru" : "en";
            localStorage.setItem("userLanguage", lang);
            i18n.changeLanguage(lang);
            navigate("/dashboard");
        } catch (error) {
            alert(error.response?.data?.message || "Login failed");
        }
    };

    const handleOAuthSuccess = (token) => {
        localStorage.setItem("userToken", token);
        navigate("/dashboard");
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        try {
            const res = await axios.post(`${api_url}/api/ExternalAuth/login`, {
                provider: "Google",
                token: credentialResponse.credential
            });
            handleOAuthSuccess(res.data.token);
        } catch (error) {
            alert(error.response?.data?.message || "Google login failed");
        }
    };

    const handleFacebookResponse = async (response) => {
        if (!response.accessToken) return;
        try {
            const res = await axios.post(`${api_url}/api/ExternalAuth/login`, {
                provider: "Facebook",
                token: response.accessToken
            });
            handleOAuthSuccess(res.data.token);
        } catch (error) {
            alert(error.response?.data?.message || "Facebook login failed");
        }
    };

    const isEmail = loginInput.includes("@");

    return (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
                <div className="d-flex flex-column justify-content-center align-items-center border rounded-4 p-5 w-25 shadow-lg">
                    <h3 className="mb-4 mt-4">{t("login_title")}</h3>

                    {/* Normal login form */}
                    <div className="w-100">
                        <div className="form-group mb-2">
                            <label>{t("login_emailOrUsername")}</label>
                            <input
                                name="loginInput"
                                type={isEmail ? "email" : "text"}
                                value={loginInput}
                                onChange={handleLoginInputChange}
                                placeholder={t("login_emailOrUsername")}
                                className="form-control"
                            />
                        </div>
                        <div className="form-group mb-3">
                            <label>{t("login_password")}</label>
                            <input
                                type="password"
                                name="passwordHash"
                                onChange={handleChange}
                                value={formData.passwordHash}
                                placeholder={t("login_password")}
                                className="form-control"
                            />
                        </div>
                        <button type="button" onClick={handleLogin} className="btn btn-primary w-100 mb-2">
                            {t("login_signIn")}
                        </button>
                        <p>{t("login_noAccount")} <Link to="/register">{t("login_signUpLink")}</Link></p>
                    </div>

                    {/* Divider */}
                    <div className="d-flex align-items-center gap-2 w-100 my-2">
                        <hr className="flex-grow-1 m-0" />
                        <span className="text-muted small">or</span>
                        <hr className="flex-grow-1 m-0" />
                    </div>

                    {/* Google */}
                    <div className="w-50 mb-2">
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={() => alert("Google login failed")}
                            width="100"
                        />
                    </div>

                    {/* Facebook */}
                    <FacebookLogin
                        appId={FACEBOOK_APP_ID}
                        onSuccess={(response) => handleFacebookResponse(response)}
                        onFail={(error) => console.log("Facebook fail:", error)} // ✅ log instead of alert to see actual error
                        scope="public_profile"
                        render={({ onClick }) => (
                            <button className="btn btn-primary w-100" onClick={onClick}>
                                Continue with Facebook
                            </button>
                        )}
                    />
                </div>
            </div>
        </GoogleOAuthProvider>
    );
}

export default LoginPage;