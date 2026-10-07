const Days = ({days, value, onChange}) => {
  return (
    <div className="days-grid">
    {days.map((day) => {
      const isSelected = day.dateStr === value;
      return (
        <div
          key={day.dateStr}
          className={`day-card ${isSelected ? "selected" : ""} ${day.isWeekend ? "weekend" : ""}`}
          onClick={() => onChange(day.dateStr)}
        >
          <span className="day-name">{day.weekName}</span>
          <span className="day-num">{day.dayNum}</span>
        </div>
      );
    })}
    </div>
  )
}

export default Days
