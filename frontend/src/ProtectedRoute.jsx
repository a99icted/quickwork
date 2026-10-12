// src/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

// Функция проверки срока жизни JWT
function isTokenValid(token) {
  if (!token) return false;
  try {
    // Вторая часть JWT — это payload в Base64
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return false;

    const decodedJson = JSON.parse(atob(payloadBase64));

    // Если есть exp, проверяем с текущим временем (в секундах)
    if (decodedJson.exp) {
      const currentTime = Math.floor(Date.now() / 1000);
      return decodedJson.exp > currentTime;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // Если токена нет или срок истек
  if (!token || !isTokenValid(token)) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    return <Navigate to="/login" replace />;
  }

  return children;
}
