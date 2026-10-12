import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "../../App.css";

export default function Register() {
  const navigate = useNavigate();

  // Состояние полей в точном соответствии со схемой бэкенда
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    first_name: "",
    last_name: "",
    age: 18,
    role: "worker", // по умолчанию роль "worker" (исполнитель)
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Универсальный обработчик изменений полей ввода
  const handleChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? (value === "" ? "" : Number(value)) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Валидация возраста
    if (formData.age < 16) {
      setErrorMessage("Минимальный возраст для регистрации — 16 лет");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/auth/register", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          age: Number(formData.age),
          role: formData.role,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // FastAPI обычно возвращает массив ошибок в data.detail или строку
        const detailMsg = Array.isArray(data.detail)
          ? data.detail[0]?.msg
          : data.detail;
        throw new Error(detailMsg || "Ошибка при регистрации");
      }

      // Успех: так как бэкенд не вернул токен, перенаправляем на страницу входа
      setSuccessMessage("Аккаунт создан! Перенаправляем на вход...");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1500);

    } catch (err) {
      console.error("Ошибка регистрации:", err);
      setErrorMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">Создать аккаунт</h1>
        <p className="login-subtitle">Начните выходить на смены уже сегодня</p>

        {/* Сообщение об ошибке */}
        {errorMessage && (
          <div className="login-error-alert" role="alert">
            {errorMessage}
          </div>
        )}

        {/* Сообщение об успехе */}
        {successMessage && (
          <div className="register-success-alert" role="status">
            {successMessage}
          </div>
        )}

        <form className="login-form" onSubmit={handleSubmit}>
          {/* Имя и Фамилия в одну строку */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="first_name">Имя</label>
              <input
                id="first_name"
                name="first_name"
                type="text"
                required
                placeholder="Иван"
                value={formData.first_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            <div className="form-group flex-1">
              <label htmlFor="last_name">Фамилия</label>
              <input
                id="last_name"
                name="last_name"
                type="text"
                required
                placeholder="Петров"
                value={formData.last_name}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Логин (username) */}
          <div className="form-group">
            <label htmlFor="username">Логин (username)</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              placeholder="Например, ivan99"
              value={formData.username}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Пароль */}
          <div className="form-group">
            <label htmlFor="password">Пароль</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Возраст и Роль в одну строку */}
          <div className="form-row">
            <div className="form-group" style={{ width: "110px" }}>
              <label htmlFor="age">Возраст</label>
              <input
                id="age"
                name="age"
                type="number"
                min="16"
                max="99"
                required
                value={formData.age}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

          </div>

          {/* Кнопка регистрации */}
          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Регистрация..." : "Зарегистрироваться"}
          </button>
        </form>

        <div className="login-footer">
          <span>Уже есть аккаунт?</span>
          <Link to="/login" className="login-link">
            Войти
          </Link>
        </div>
      </div>
    </div>
  );
}
