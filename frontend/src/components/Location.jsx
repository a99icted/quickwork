const LocationIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <path d="M12 21s-6-5.33-6-10a6 6 0 0 1 12 0c0 4.67-6 10-6 10z" />
    <circle cx="12" cy="11" r="2" />
  </svg>
);

const Location = ({ value, onChange }) => {
  return (
    <div className="city-picker">
      <LocationIcon />
      <select
        className="city-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="Белград">Белград · до 5 км</option>
        <option value="Novi-sad">Нови-Сад · до 5 км</option>
        <option value="Ниш">Ниш · до 5 км</option>
      </select>
    </div>
  );
};

export default Location;
