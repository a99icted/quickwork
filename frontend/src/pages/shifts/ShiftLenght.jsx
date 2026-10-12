const Lenght = ({shifts}) => {
  return (
    <div className="feed-meta">
      <span className="feed-count">
        {shifts.length > 0 ? `${shifts.length} смен найдено` : "Нет смен на эту дату"}
      </span>
      <button className="sort-btn" type="button">Сначала рядом ⌵</button>
    </div>
  )
}

export default Lenght
