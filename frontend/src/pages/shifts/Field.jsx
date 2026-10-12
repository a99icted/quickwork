const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const Field = () => {
  return (<div className="search-field">
    <SearchIcon />
    <input type="text" placeholder="Должность или компания" />
  </div>);
}

export default Field
