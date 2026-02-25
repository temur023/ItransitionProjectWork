import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage';
function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
            <Route path="/register" element={<RegisterPage />}></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/" element={<Navigate to={"/login"} />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
