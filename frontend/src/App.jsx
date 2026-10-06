import { useEffect, useState } from "react";
import "./App.css";
import Field from "./components/Field";
import Button from "./components/Button";
import Location from "./components/Location";
import NavBar from "./components/NavBar";

// Вспомогательная функция: дата в формате YYYY-MM-DD для отправки на бэкенд
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Обрезка секунд у времени ("10:00:00" -> "10:00")
function formatTime(time) {
  if (!time) return "—";
  return time.slice(0, 5);
}

// Получаем актуальный месяц
const getMonthName = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long"
  })
    .format(date)
    .toUpperCase();
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
const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

const BellIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);


function App() {
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
        <div className="calendar-meta">
          <span className="month-name">{getMonthName(selectedDate)}</span> {/* Получаем актуальный месяц */}
        </div>

        <div className="days-grid">
          {calendarDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            return (
              <div
                key={day.dateStr}
                className={`day-card ${isSelected ? "selected" : ""} ${day.isWeekend ? "weekend" : ""}`}
                onClick={() => setSelectedDate(day.dateStr)}
              >
                <span className="day-name">{day.weekName}</span>
                <span className="day-num">{day.dayNum}</span>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Body (Лента вакансий) */}
      <main className="shifts-feed">
        <div className="feed-meta">
          <span className="feed-count">
            {shifts.length > 0 ? `${shifts.length} смен найдено` : "Нет смен на эту дату"}
          </span>
          <button className="sort-btn" type="button">Сначала рядом ⌵</button>
        </div>

        <div className="cards-list">
          {shifts.map((shift, index) => (
            <article
              key={shift.id || index}
              className={`shift-card ${index === 0 ? "featured" : ""}`}
            >
              {/* Оранжевая полоска слева у первой карточки */}
              {index === 0 && <div className="featured-stripe" />}

              <div className="card-info">
                <h2 className="shift-role">{shift.title || shift.job_title || "Работник торгового зала"}</h2>
                <span className="company-tag">{shift.company || shift.company_name || "Торговая сеть"}</span>

                <div className="geo-row">
                  <LocationIcon />
                  <span>{shift.address || shift.location || "Центр города · 1,5 км"}</span>
                </div>

                <div className="tags-row">
                  <div className="time-pill">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span>
                      {formatTime(shift.start_time || "10:00")}–{formatTime(shift.end_time || "18:00")}
                    </span>
                  </div>
                  <span className="experience-badge">{shift.tag || "Без опыта"}</span>
                </div>
              </div>

              <div className="card-action">
                <div className="pay-block">
                  <span className="pay-amount">{shift.pay_amount || shift.price || "4 000"} RSD</span>
                  <span className="pay-period">{shift.pay_type || "за смену"}</span>
                </div>

                <button
                  type="button"
                  className={`apply-btn ${index === 0 ? "primary" : ""}`}
                >
                  Откликнуться
                </button>
              </div>
            </article>
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
