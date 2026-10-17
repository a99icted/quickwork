import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import "../../App.css";
import NavBar from "../NavBar";

function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

function formatTime(time) {
  if (!time) return "—";
  return String(time).slice(0, 5);
}

const LocationIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

function Shift() {
  const { vacancy_id } = useParams();
  const navigate = useNavigate();

  const [shift, setShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  const ensureAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      handleLogout();
      return null;
    }
    return token;
  }, [handleLogout]);

  useEffect(() => {
    if (!vacancy_id) {
      setError("Вакансия не найдена");
      setLoading(false);
      return;
    }

    const token = ensureAuth();
    if (!token) return;

    const controller = new AbortController();

    async function loadVacancy() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `http://127.0.0.1:8000/work/${encodeURIComponent(vacancy_id)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          }
        );

        if (response.status === 401) {
          handleLogout();
          return;
        }

        if (!response.ok) {
          throw new Error(`Не удалось загрузить вакансию: ${response.status}`);
        }

        const data = await response.json();
        console.log("ID в URL:", vacancy_id, "Ответ API:", data);

        setShift(data); // Ответ — объект одной вакансии, не data[0]
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(err.message || "Ошибка загрузки");
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    loadVacancy();

    return () => controller.abort();
  }, [vacancy_id, ensureAuth, handleLogout]);

  const handleApply = async () => {
    const token = ensureAuth();
    const workId = shift?.id ?? vacancy_id;

    if (!token || !workId || applying || applied) return;

    setApplying(true);

    try {
      const params = new URLSearchParams({ work_id: String(workId) });

      const response = await fetch(
        `http://localhost:8000/uwe/add_work?${params.toString()}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.status === 409) {
        setApplied(true);
        alert("Вы уже откликнулись на эту смену!");
        return;
      }

      if (!response.ok) {
        let message = "Не удалось откликнуться";
        try {
          const data = await response.json();
          message = data.detail || message;
        } catch {
          // Ответ сервера не в JSON — оставляем сообщение по умолчанию
        }
        throw new Error(message);
      }

      setApplied(true);
      alert("Вы успешно откликнулись на смену!");
    } catch (err) {
      console.error("Ошибка отклика:", err);
      alert(err.message || "Ошибка отклика");
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="shift-page">
        <NavBar onLogout={handleLogout} />
        <p className="shift-status">Загрузка вакансии...</p>
      </div>
    );
  }

  if (error || !shift) {
    return (
      <div className="shift-page">
        <NavBar onLogout={handleLogout} />
        <p className="shift-status error">{error || "Вакансия не найдена"}</p>
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          Назад к списку
        </button>
      </div>
    );
  }

  return (
    <div className="shift-page">
      <NavBar onLogout={handleLogout} />

      <main className="shift-detail">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ← К вакансиям
        </button>

        <header className="shift-hero">
          <div className="shift-hero-text">
            <h1 className="shift-title">{shift.title || "Работник торгового зала"}</h1>
            <span className="company-tag">{shift.company_name || "Торговая сеть"}</span>
          </div>

          <div className="pay-block">
            <span className="pay-amount">
              {shift.salary ? `${shift.salary} RSD` : "Не уточнена"}
            </span>
            <span className="pay-period">{shift.pay_type || "за смену"}</span>
          </div>
        </header>

        <section className="shift-meta">
          <div className="geo-row">
            <LocationIcon />
            <span>{shift.address || shift.location || "Центр города"}</span>
          </div>

          <div className="tags-row">
            <div className="time-pill">
              {formatTime(shift.time_from || shift.start_time)}–
              {formatTime(shift.time_to || shift.end_time)}
            </div>
            <span className="experience-badge">{shift.tag || "Без опыта"}</span>
          </div>
        </section>

        {shift.description && (
          <section className="shift-section">
            <h2>Описание</h2>
            <p>{shift.description}</p>
          </section>
        )}

        {shift.requirements && (
          <section className="shift-section">
            <h2>Требования</h2>
            <p>{shift.requirements}</p>
          </section>
        )}

        <div className="shift-cta">
          <button
            type="button"
            className={`apply-btn primary ${applied ? "done" : ""}`}
            onClick={handleApply}
            disabled={applying || applied}
          >
            {applied ? "Отклик отправлен" : applying ? "Отправка..." : "Откликнуться"}
          </button>
        </div>
      </main>
    </div>
  );
}

export default Shift;
