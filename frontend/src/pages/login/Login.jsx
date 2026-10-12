import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../App.css";

export default function Login() {
  const navigate = useNavigate();

  // Состояния для полей формы
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Состояния загрузки и ошибок
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/login", {
        method: "POST",
        headers: {
          "Accept": "*/*",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Если логин/пароль не подошли (FastAPI возвращает { "detail": "..." })
        throw new Error(data.detail || "Неверный логин или пароль");
      }

      // Сохраняем access_token в localStorage
      localStorage.setItem("token", data.access_token);

      // Перенаправляем на страницу со сменами
      navigate("/", { replace: true });
    } catch (err) {
      console.error("Ошибка входа:", err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Вход в аккаунт</h1>
        <p className="login-subtitle">Найдите смену на вечер прямо сейчас</p>

        {errorMessage && (
          <div className="login-error-alert" role="alert">
            {errorMessage}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Логин / Имя пользователя</label>
            <input
              id="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Ivan@Zalupa.porn"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Вход..." : "Войти"}
          </button>
        </form>

        <div className="login-footer">
          <span>Нет аккаунта? </span>
          <Link to="/register" className="login-link">
            Зарегистрироваться
          </Link>
        </div>
      </div>
    </div>
  );
}
