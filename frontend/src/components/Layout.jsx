import { useState } from "react";
import {
  Link,
  NavLink,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  ArrowRight,
  Bell,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  CircleHelp,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Plus,
  ShieldCheck,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { useApp } from "../state/context";
import { initials, statusLabels } from "../lib/format";
import { Button, Empty, Modal, Toast } from "./UI";

const personalNav = [
  { to: "/", label: "Вакансии", icon: BriefcaseBusiness },
  { to: "/saved", label: "Избранное", icon: Bookmark },
  { to: "/applications", label: "Мои отклики", icon: ClipboardCheck },
  { to: "/profile", label: "Профиль", icon: UserRound },
];
const companyNav = [
  { to: "/company", label: "Обзор", icon: LayoutDashboard },
  { to: "/company/shifts", label: "Мои смены", icon: CalendarDays },
  { to: "/company/candidates", label: "Кандидаты", icon: UsersRound },
  { to: "/company/profile", label: "Компания", icon: Building2 },
];

export default function Layout() {
  const { user, company, setMode, logout, applications } = useApp();
  const [accountOpen, setAccountOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const business = Boolean(
    company &&
    location.pathname.startsWith("/company") &&
    location.pathname !== "/company/create",
  );
  const nav = business ? companyNav : personalNav;

  function changeAccount(next) {
    setAccountOpen(false);
    if (!user) return navigate("/login");
    if (next === "company" && !company) return navigate("/company/create");
    setMode(next);
    navigate(next === "company" ? "/company" : "/");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="header-inner">
          <Link to={business ? "/company" : "/"} className="brand">
            <span className="brand-symbol">
              <BriefcaseBusiness size={20} />
            </span>
            QuickWork<span className="brand-dot">.</span>
          </Link>
          <nav className="desktop-nav" aria-label="Основная навигация">
            {nav.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} end={to === "/" || to === "/company"}>
                <Icon size={17} />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="header-actions">
            <div className="account-switch-wrap">
              <button
                className={`account-switch ${accountOpen ? "open" : ""}`}
                aria-label="Переключить аккаунт"
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                onClick={() => setAccountOpen(!accountOpen)}
              >
                <span className="avatar small-avatar">
                  {business ? (
                    <Building2 size={19} />
                  ) : user ? (
                    initials(`${user.first_name} ${user.last_name}`)
                  ) : (
                    <UserRound size={18} />
                  )}
                </span>
                <span className="account-name">
                  <strong>
                    {business
                      ? company.name
                      : user
                        ? user.first_name
                        : "Мой аккаунт"}
                  </strong>
                  <small>{business ? "Компания" : "Личный аккаунт"}</small>
                </span>
                <ChevronDown size={14} className="account-chevron" />
              </button>
              {accountOpen && (
                <>
                  <button
                    className="dropdown-backdrop"
                    aria-label="Закрыть меню аккаунтов"
                    onClick={() => setAccountOpen(false)}
                  />
                  <div className="account-dropdown" id="account-menu">
                    <p className="menu-label">Аккаунт</p>
                    <button onClick={() => changeAccount("personal")}>
                      <UserRound size={19} />
                      <span>
                        Личный аккаунт<small>Поиск смен и ваши отклики</small>
                      </span>
                      {!business && <Check size={16} />}
                    </button>
                    <button onClick={() => changeAccount("company")}>
                      <Building2 size={19} />
                      <span>
                        {company?.name || "Создать компанию"}
                        <small>
                          {company
                            ? "Смены и сотрудники"
                            : "Внутри вашего аккаунта"}
                        </small>
                      </span>
                      {business ? (
                        <Check size={16} />
                      ) : (
                        !company && <Plus size={16} />
                      )}
                    </button>
                    <div className="menu-divider" />
                    {user?.role === "admin" && <button onClick={() => { setAccountOpen(false); navigate("/admin"); }}><ShieldCheck size={19} /><span>Администрирование<small>Города, категории, особенности</small></span><ArrowRight size={16} /></button>}
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        setDialog("help");
                      }}
                    >
                      <CircleHelp size={19} />
                      <span>Как работает сервис</span>
                      <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        navigate(user ? "/profile" : "/login");
                      }}
                    >
                      <UserRound size={19} />
                      <span>
                        {user ? "Мой профиль" : "Войти или зарегистрироваться"}
                      </span>
                      <ArrowRight size={16} />
                    </button>
                    {user && (
                      <button
                        className="danger-text"
                        onClick={() => {
                          logout();
                          setAccountOpen(false);
                          navigate("/login");
                        }}
                      >
                        <LogOut size={19} />
                        <span>Выйти из аккаунта</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
            <button
              className="icon-btn notification-btn"
              aria-label="Уведомления"
              onClick={() => setDialog("notifications")}
            >
              <Bell size={21} />
              {applications.some((item) => item.status === "approved") && <i />}
            </button>
          </div>
        </div>
      </header>
      <main className="page-content" key={location.pathname}>
        <Outlet />
      </main>
      <footer className="site-footer">
        <span>© {new Date().getFullYear()} QuickWork</span>
        <button onClick={() => setDialog("help")}>
          <CircleHelp size={15} />
          Как это работает
        </button>
        <span>Смена на день. Возможностей больше.</span>
      </footer>
      <nav className="mobile-nav" aria-label="Мобильная навигация">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink to={to} key={to} end={to === "/" || to === "/company"}>
            <span>
              <Icon size={21} />
            </span>
            <small>{label}</small>
          </NavLink>
        ))}
      </nav>
      {dialog === "help" && (
        <Modal title="Как работает QuickWork" onClose={() => setDialog(null)}>
          <div className="help-content">
            <div className="help-step">
              <span>1</span>
              <div>
                <h3>Выберите смену</h3>
                <p>Найдите подходящую работу по городу, времени и оплате.</p>
              </div>
            </div>
            <div className="help-step">
              <span>2</span>
              <div>
                <h3>Отправьте отклик</h3>
                <p>
                  Войдите в аккаунт и откликнитесь. Ответ компании появится в
                  разделе «Мои отклики».
                </p>
              </div>
            </div>
            <div className="help-step">
              <span>3</span>
              <div>
                <h3>Согласуйте детали</h3>
                <p>
                  Уточните адрес, задачи и порядок оплаты у работодателя до
                  выхода на смену.
                </p>
              </div>
            </div>
            <div className="info-box">
              <Building2 size={21} />
              <p>
                Ищете сотрудников? Создайте компанию в своём аккаунте и
                переключитесь в её кабинет через меню вверху.
              </p>
            </div>
          </div>
        </Modal>
      )}
      {dialog === "notifications" && (
        <Modal title="Уведомления" onClose={() => setDialog(null)}>
          {applications.some((item) => item.status !== "pending") ? (
            <div className="notifications-list">
              {applications
                .filter((item) => item.status !== "pending")
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setDialog(null);
                      navigate("/applications");
                    }}
                  >
                    <span className={`notification-symbol ${item.status}`}>
                      {item.status === "approved" ? (
                        <Check size={20} />
                      ) : (
                        <X size={20} />
                      )}
                    </span>
                    <span>
                      <strong>{statusLabels[item.status]}</strong>
                      <p>
                        {item.title} · {item.company_name}
                      </p>
                    </span>
                    <ArrowRight size={17} />
                  </button>
                ))}
            </div>
          ) : (
            <Empty
              icon={Bell}
              title="Пока нет уведомлений"
              text="Здесь появятся ответы компаний на ваши отклики."
            />
          )}
          <Button variant="secondary" onClick={() => setDialog(null)}>
            Понятно
          </Button>
        </Modal>
      )}
      <Toast />
    </div>
  );
}
