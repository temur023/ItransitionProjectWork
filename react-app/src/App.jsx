import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from './LoginPage'
import RegisterPage from './RegisterPage';
import UserPage from './UserPage';
import Dashboard from './Dashboard';
import InventoryPage from './InventoryPage';
function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
            <Route path="/register" element={<RegisterPage />}></Route>
            <Route path="/login" element={<LoginPage />}></Route>
            <Route path="/user-page" element={<UserPage/>}></Route>
            <Route path="/dashboard" element={<Dashboard/>}></Route>
            <Route path="/inventory/:inventoryId" element={<InventoryPage/>}></Route>
            <Route path="/" element={<Navigate to={"/login"} />}></Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
