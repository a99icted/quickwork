const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

function formatTime(time) {
  if (!time) return "—";
  return time.slice(0, 5);
}


const ShiftCard = ({ shift, isFeatured, isAuthenticated, onApply, onOpen }) => {
  return (
    <article
      className={`shift-card ${isFeatured ? "featured" : ""}`}
      onClick={(e) => {
        if (e.target.closest(".apply-btn")) return;
        onOpen?.(shift.id);
      }}
    >
      {isFeatured && <div className="featured-stripe" />}

      <div className="card-info">
        <h2 className="shift-role">{shift.title || "Работник торгового зала"}</h2>
        <span className="company-tag">{shift.company_name || "Торговая сеть"}</span>

        <div className="geo-row">
          <LocationIcon />
          <span>{shift.address || shift.location || "Центр города · 1,5 км"}</span>
        </div>

        <div className="tags-row">
          <div className="time-pill">
            <span>
              {formatTime(shift.time_from || shift.start_time || "10:00")}–
              {formatTime(shift.time_to || shift.end_time || "18:00")}
            </span>
          </div>
          <span className="experience-badge">{shift.tag || "Без опыта"}</span>
        </div>
      </div>

      <div className="card-action">
        <div className="pay-block">
          <span className="pay-amount">
            {shift.salary ? `${shift.salary} RSD` : "Не уточнена"}
          </span>
          <span className="pay-period">{shift.pay_type || "за смену"}</span>
        </div>

        {isAuthenticated && (
          <button
            type="button"
            className={`apply-btn ${isFeatured ? "primary" : ""}`}
            onClick={() => onApply(shift.id)}
          >
            Откликнуться
          </button>
        )}
      </div>
    </article>
  );
};

export default ShiftCard;
