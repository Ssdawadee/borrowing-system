import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './App.css'; // อย่าลืม import CSS ที่เราทำไว้ตอนแรก

// นำเข้าไฟล์หน้าต่างๆ ที่เราเพิ่งสร้าง
import Login from './pages/Login';
import UserPage from './pages/UserPage';
import AdminPage from './pages/AdminPage';

// Protected route สำหรับ User
function UserRoute({ children }) {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  if (!storedUser || !storedToken) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (user.role !== 'user') {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Protected route สำหรับ Admin
function AdminRoute({ children }) {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');

  if (!storedUser || !storedToken) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(storedUser);
    if (user.role !== 'admin') {
      return <Navigate to="/" replace />;
    }
  } catch {
    return <Navigate to="/" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ถ้าเข้ามาหน้าแรก (/) ให้โชว์หน้า Login */}
        <Route path="/" element={<Login />} />
        
        {/* ถ้า URL เป็น /user ให้โชว์หน้า UserPage */}
        <Route
          path="/user"
          element={
            <UserRoute>
              <UserPage />
            </UserRoute>
          }
        />
        
        {/* ถ้า URL เป็น /admin ให้โชว์หน้า AdminPage */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;