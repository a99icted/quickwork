import { useState, useEffect } from 'react';

import './App.css'

function App() {

  const [shifts, setShifts] = useState([])

  useEffect(() => {
    fetch('http://localhost:8000/work/')
      .then(response => response.json())
      .then(data => {
        setShifts(data);
      }).catch(error => {
        console.error("Ошибка при получении смен:", error);
      });
  }, []);

  return (
    <div>
      <h1>Доступные смены в Сербии</h1>
      <ul>
        {shifts.map(shift => (
          <li key={shift.id}>
            <p>{shift.title}</p>
            <p>{shift.salary}</p>
            <div className='response'>Откликнуться</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
export default App;
