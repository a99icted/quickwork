const NavBar = ({value, onChange}) => {
  return (<nav className="bottom-nav">
    <button
      type="button"
      className={`tab-btn ${value === "vacancies" ? "active" : ""}`}
      onClick={() => onChange("vacancies")}
    >
      <div className="tab-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
          <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
        </svg>
      </div>
      <span>Вакансии</span>
    </button>

    <button
      type="button"
      className={`tab-btn ${value === "wallet" ? "active" : ""}`}
      onClick={() => onChange("wallet")}
    >
      <div className="tab-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      </div>
      <span>Кошелёк</span>
    </button>

    <button
      type="button"
      className={`tab-btn ${value === "responses" ? "active" : ""}`}
      onClick={() => onChange("responses")}
    >
      <div className="tab-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
        </svg>
      </div>
      <span>Мои отклики</span>
    </button>

    <button
      type="button"
      className={`tab-btn ${value === "profile" ? "active" : ""}`}
      onClick={() => onChange("profile")}
    >
      <div className="tab-pill">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <span>Профиль</span>
    </button>
  </nav>)
}

export default NavBar
