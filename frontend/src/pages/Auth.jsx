import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  EyeOff,
} from "lucide-react";
import { useApp } from "../state/context";
import { Button, ErrorMessage } from "../components/UI";

export default function Auth({ register = false }) {
  const { authenticate } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true);
    setError("");
    try {
      await authenticate(
        {
          username: values.username.trim(),
          password: values.password,
          ...(register
            ? {
                first_name: values.first_name.trim(),
                last_name: values.last_name.trim(),
                age: Number(values.age),
              }
            : {}),
        },
        register,
      );
      navigate(location.state?.from || "/", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <Link to="/" className="brand">
        <span className="brand-symbol">
          <BriefcaseBusiness size={20} />
        </span>
        QuickWork<span className="brand-dot">.</span>
      </Link>
      <main className="auth-panel panel">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />К вакансиям
        </Link>
        <div className="auth-intro">
          <h1>{register ? "Создать аккаунт" : "Вход в аккаунт"}</h1>
          <p>
            {register
              ? "Для поиска смен и вашей компании."
              : "Ваши смены, отклики и профиль — в одном месте."}
          </p>
        </div>
        <ErrorMessage message={error} />
        <form className="form-stack" onSubmit={submit}>
          {register && (
            <div className="form-row">
              <label>
                Имя
                <input
                  name="first_name"
                  placeholder="Алексей"
                  autoComplete="given-name"
                  maxLength={25}
                  pattern=".*\S.*"
                  required
                />
              </label>
              <label>
                Фамилия
                <input
                  name="last_name"
                  placeholder="Морозов"
                  autoComplete="family-name"
                  maxLength={25}
                  pattern=".*\S.*"
                  required
                />
              </label>
            </div>
          )}
          <label>
            Логин
            <input
              name="username"
              autoComplete="username"
              placeholder="Введите логин"
              minLength={3}
              maxLength={25}
              required
            />
          </label>
          <label>
            Пароль
            <div className="password-input">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                autoComplete={register ? "new-password" : "current-password"}
                placeholder={
                  register ? "Не менее 8 символов" : "Введите пароль"
                }
                minLength={8}
                maxLength={128}
                required
              />
              <button
                type="button"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>
          {register && (
            <label>
              Возраст
              <input
                name="age"
                type="number"
                min={16}
                max={100}
                placeholder="От 16 лет"
                required
              />
            </label>
          )}
          <Button type="submit" busy={busy}>
            {register ? "Зарегистрироваться" : "Войти"}
            <ArrowRight size={17} />
          </Button>
        </form>
        <p className="auth-toggle">
          {register ? "Уже есть аккаунт?" : "Нет аккаунта?"}{" "}
          <Link
            to={register ? "/login" : "/register"}
            state={location.state}
            onClick={() => setError("")}
          >
            {register ? "Войти" : "Зарегистрироваться"}
          </Link>
        </p>
      </main>
      <p className="auth-bottom">Один аккаунт для подработки и бизнеса.</p>
    </div>
  );
}
