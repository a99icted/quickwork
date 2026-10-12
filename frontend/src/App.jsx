import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Shifts from "./pages/shifts/Shifts";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register"; // 1. Импорт компонента регистрации
import ProtectedRoute from "./ProtectedRoute";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Защищенная главная лента со сменами */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Shifts />
            </ProtectedRoute>
          }
        />

        {/* Публичные страницы входа и регистрации */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Все остальные маршруты перенаправляют на главную */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
