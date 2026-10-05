import { useEffect, useState } from "react";

import "./App.css";


function getLocalDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTime(time) {
  if (!time) {
    return "—";
  }

  return time.slice(0, 5);
}

function App() {
  const [shifts, setShifts] = useState([]);
  const [city, setCity] = useState("Белград");

  useEffect(() => {
    const workDate = getLocalDateString();

    const params = new URLSearchParams({
      city,
      work_date: workDate,
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
        setShifts(data);
      })
      .catch((error) => {
        console.error("Ошибка при получении смен:", error);
      });
  }, [city]); // При смене города вакансии загрузятся заново.

  return (
    <div>
      <h1>Доступные смены в Сербии</h1>

      <select
        value={city}
        onChange={(event) => setCity(event.target.value)}
      >
        <option value="Белград">Белград</option>
        <option value="Novi-sad">Нови-Сад</option>
        <option value="Ниш">Ниш</option>
      </select>

      {shifts.length === 0 ? (
        <p>На сегодня смен в этом городе пока нет.</p>
      ) : (
        <ul>
          {shifts.map((shift) => (
            <li key={shift.id}>
              <p>{shift.title}</p>
              <p>Оплата: {shift.salary ?? "не указана"}</p>
              <p>Дата: {shift.work_date}</p>
              <p>
                Время: {formatTime(shift.time_from)} — {formatTime(shift.time_to)}
              </p>

              <button className="response">
                Откликнуться
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;
