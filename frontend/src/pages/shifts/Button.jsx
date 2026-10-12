const FilterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="4" y1="6" x2="20" y2="6" />
    <line x1="10" y1="12" x2="20" y2="12" />
    <line x1="6" y1="18" x2="20" y2="18" />
    <circle cx="7" cy="6" r="2" fill="currentColor" />
    <circle cx="17" cy="12" r="2" fill="currentColor" />
    <circle cx="8" cy="18" r="2" fill="currentColor" />
  </svg>
);

const Button = () => {
  return (<button className="filter-btn" type="button" aria-label="Фильтры">
    <FilterIcon />
    <span className="dot" />
  </button>)
}

export default Button
