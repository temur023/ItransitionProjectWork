import React, {useState} from "react";
import axios from 'axios';
import { Link, useNavigate } from "react-router-dom";
function RegisterPage(){
    const [formData, setFormData] = useState({
            userName: "",
            fullName:"",
            email: "",
            passwordHash: "",
            isBlocked: false,
            role:1,
            language:1,
            theme:1
        });
    const api_url = "http://localhost:5137";
    const navigate = useNavigate();
    function handleChange(e) {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    }
    const handleRegistration = async () => {
    try {
      const response = await axios.post(`${api_url}/api/User/create`, formData);
      const token = response.data.message || response.data.Message;
      localStorage.setItem("userToken", token);
      console.log("Success", response.data);
    } catch (error) {
      console.error("Failed", error);
    }
  };

    return(
     <div className="container-fluid d-flex flex-column justify-content-center align-items-center vh-100">
        <div className="d-flex flex-column justify-content-center align-items-center border bordeer-success rounded-4 p-5 shadow-lg ">
            <form>
              <div className="d-flex gap-3">
                  <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={formData.fullName} name="fullName" onChange={handleChange} className="form-control"/>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" value={formData.userName} name="userName" onChange={handleChange} className="form-control"/>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group col-md-12">
                  <label>Email</label>
                  <input type="email" value={formData.email} name="email" onChange={handleChange} className="form-control"/>
                </div>
                <div className="form-group col-md-12">
                  <label>Password</label>
                  <input type="password" value={formData.passwordHash} name="passwordHash" onChange={handleChange} className="form-control mb-3"/>
                </div>
              </div>
              <button type="button" onClick={handleRegistration} className="btn btn-primary w-100 mb-3">Sign up</button>
              <p className="mt-3">Already have an account? <Link to="/login">Sign in</Link></p>
            </form>
        </div>
        
    </div>
    );
}
export default RegisterPage;