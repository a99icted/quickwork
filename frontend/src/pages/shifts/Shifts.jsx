import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import Field from "./Field";
import Button from "./Button";
import Location from "./Location";
import NavBar from "../NavBar";
import Month from "./Month";
import Days from "./Days";
import Lenght from "./ShiftLenght";
import ShiftCard from "./ShiftCard";

// Проверка: истёк ли JWT токен по времени (exp)
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

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function generateDays() {
  const weekDays = ["ВС", "ПН", "ВТ", "СР", "ЧТ", "ПТ", "СБ"];
  const days = [];
  const now = new Date();

  for (let i = 0; i < 5; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);

    const dayOfWeek = d.getDay();
    days.push({
      dateStr: getLocalDateString(d),
      weekName: weekDays[dayOfWeek],
      dayNum: d.getDate(),
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
    });
  }
  return days;
}

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

function Shifts() {
  const navigate = useNavigate(); // Инициализация роутера

  const [shifts, setShifts] = useState([]);
  const [city, setCity] = useState("Белград");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [activeTab, setActiveTab] = useState("vacancies");
  const [calendarDays] = useState(generateDays());

  // Полный сброс авторизации и немедленный редирект на /login
  const handleLogout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login", { replace: true });
  }, [navigate]);

  // Валидация сессии перед ЛЮБЫМ защищенным действием:
  // возвращает токен, либо очищает хранилище и перекидывает на /login
  const ensureAuth = useCallback(() => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      handleLogout();
      return null;
    }
    return token;
  }, [handleLogout]);

  // Загрузка ленты смен
  useEffect(() => {
    const params = new URLSearchParams({
      city,
      work_date: selectedDate,
      page: "1",
    });

    fetch(`http://localhost:8000/work/?${params.toString()}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Не удалось получить список смен");
        }
        return response.json();
      })
      .then((data) => {
        setShifts(Array.isArray(data) ? data : data.results || []);
      })
      .catch((error) => {
        console.error("Ошибка при получении смен:", error);
      });
  }, [city, selectedDate]);

  // 1. Отклик на смену
  const handleApply = async (workId) => {
    const token = ensureAuth();
    if (!token) return; // Если токен протух — ensureAuth уже отправил на /login

    try {
      const response = await fetch(`http://localhost:8000/uwe/add_work?work_id=${workId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Если бэк вернул 401 — моментально выкидываем на логин
      if (response.status === 401) {
        handleLogout();
        return;
      }

      if (response.status === 409) {
        alert("Вы уже откликнулись на эту смену!");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Не удалось откликнуться");
      }

      alert("Вы успешно откликнулись на смену!");
    } catch (error) {
      console.error("Ошибка отклика:", error);
      alert(error.message);
    }
  };

  // 2. Взаимодействие с таббаром (переход в профиль/мои смены требует авторизации)
  const handleTabChange = (newTab) => {
    if (newTab !== "vacancies") {
      const token = ensureAuth();
      if (!token) return;
    }
    setActiveTab(newTab);
  };

  // 3. Взаимодействие с уведомлениями
  const handleNotificationsClick = () => {
    const token = ensureAuth();
    if (!token) return;
    // Логика открытия уведомлений
  };

  return (
    <div className="app">
      {/* 1. Хедер (Заголовок + Выбор города + Уведомления) */}
      <header className="app-header">
        <div className="header-info">
          <h1 className="page-title">Смены рядом</h1>
          <Location
            value={city}
            onChange={(newCity) => setCity(newCity)}
          />
        </div>

        <button
          className="bell-btn"
          type="button"
          aria-label="Уведомления"
          onClick={handleNotificationsClick}
        >
          <BellIcon />
          <span className="dot" />
        </button>
      </header>

      {/* 2. Sub-header (Поиск и Фильтр) */}
      <section className="search-section">
        <Field />
        <Button />
      </section>

      {/* 3. Up-body (Календарь дат) */}
      <section className="calendar-section">
        <Month value={selectedDate} />
        <Days
          days={calendarDays}
          value={selectedDate}
          onChange={setSelectedDate}
        />
      </section>

      {/* 4. Body (Лента вакансий) */}
      <main className="shifts-feed">
        <Lenght shifts={shifts} />

        <div className="cards-list">
          {shifts.map((shift, index) => (
            <ShiftCard
              key={shift.id || index}
              shift={shift}
              isFeatured={index === 0}
              isAuthenticated={true}
              onApply={handleApply}
            />
          ))}
        </div>
      </main>

      {/* 5. Нижний навбар (Bottom Tabbar) */}
      <NavBar
        value={activeTab}
        onChange={handleTabChange}
      />
    </div>
  );
}

export default Shifts;
