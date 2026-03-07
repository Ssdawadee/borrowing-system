import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import './App.css'; // อย่าลืม import CSS ที่เราทำไว้ตอนแรก

// นำเข้าไฟล์หน้าต่างๆ ที่เราเพิ่งสร้าง
import Login from './pages/Login';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ถ้าเข้ามาหน้าแรก (/) ให้โชว์หน้า Login */}
        <Route path="/" element={<Login />} />
        
        {/* ถ้า URL เป็น /user ให้โชว์หน้า UserPage */}
        <Route path="/user" element={<UserPage />} />
        
        {/* ถ้า URL เป็น /admin ให้โชว์หน้า AdminPage */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;