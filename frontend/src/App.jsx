import { useEffect, useState } from "react";
import "./App.css";
import Field from "./components/Field";
import Button from "./components/Button";
import Location from "./components/Location";
import NavBar from "./components/NavBar";
import Month from "./components/Calendar/Month";
import Days from "./components/Calendar/Days";
import Lenght from "./components/Shifts/ShiftLenght";
import ShiftCard from "./components/Shifts/ShiftCard";

// Вспомогательная функция: дата в формате YYYY-MM-DD для отправки на бэкенд
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Генерация 5 дней от сегодня
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
      isWeekend: dayOfWeek === 0 || dayOfWeek === 6, // 0 - воскресенье, 6 - суббота
    });
  }
  return days;
}

// Компактные SVG-иконки, чтобы не подключать тяжелые сторонние библиотеки

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem("token")));
  const [shifts, setShifts] = useState([]);
  const [city, setCity] = useState("Белград");
  const [selectedDate, setSelectedDate] = useState(getLocalDateString());
  const [activeTab, setActiveTab] = useState("vacancies");
  const [calendarDays] = useState(generateDays());

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
        // Поддерживаем как чистый массив [ ... ], так и пагинацию { results: [ ... ] }
        setShifts(Array.isArray(data) ? data : data.results || []);
      })
      .catch((error) => {
        console.error("Ошибка при получении смен:", error);
      });
  }, [city, selectedDate]);

  // Функция для отправки отклика на смену
  const handleApply = async (workId) => {
    const token = localStorage.getItem("token");

    try {
      const response = await fetch(`http://localhost:8000/uwe/add_work?work_id=${workId}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        // Если токен протух или невалиден
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        alert("Сессия устарела. Войдите снова.");
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

        <button className="bell-btn" type="button" aria-label="Уведомления">
          <BellIcon />
          <span className="dot" />
        </button>
      </header>

      {/* 2. Sub-header (Поиск и Фильтр) */}
      <section className="search-section">
          <Field/>
          <Button/>
      </section>

      {/* 3. Up-body (Календарь дат) */}
      <section className="calendar-section">
        <Month
          value={selectedDate}
        />

        <Days
          days={calendarDays}
          value={selectedDate}
          onChange={setSelectedDate}
        />
      </section>

      {/* 4. Body (Лента вакансий) */}
      <main className="shifts-feed">
        <Lenght
          shifts={shifts}
        />

        <div className="cards-list">
          {shifts.map((shift, index) => (
            <ShiftCard
              key={shift.id || index}
              shift={shift}
              isFeatured={index === 0}
              isAuthenticated={isAuthenticated}
              onApply={handleApply}
            />

          ))}
        </div>
      </main>

      {/* 5. Нижний навбар (Bottom Tabbar) */}
      <NavBar
        value={activeTab}
        onChange={setActiveTab}
      />

    </div>
  );
}

export default App;
