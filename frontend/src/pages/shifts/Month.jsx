const getMonthName = (dateString) => {
  if (!dateString) return "";

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("ru-RU", {
    month: "long"
  })
    .format(date)
    .toUpperCase();
}

const Month = ({ value}) => {
  return (
    <div className="calendar-meta">
      <span className="month-name">{getMonthName(value)}</span> {/* Получаем актуальный месяц */}
    </div>
  )
}

export default Month
