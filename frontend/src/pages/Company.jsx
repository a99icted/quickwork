import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  Plus,
  UsersRound,
  Wallet,
  Zap,
} from "lucide-react";
import { useApp } from "../state/context";
import {
  dateLabel,
  initials,
  localDate,
  money,
  timeLabel,
} from "../lib/format";
import { Button, Empty, ErrorMessage, PageHeading } from "../components/UI";

export function CompanyProfile({ creating = false }) {
  const { company, saveCompany, setMode, user } = useApp();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await saveCompany({
        name: values.name.trim(),
        description: values.description.trim(),
      });
      if (creating) {
        setMode("company");
        navigate("/company");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow={
          creating
            ? "НОВОЕ ПРОСТРАНСТВО ДЛЯ ВАШЕГО БИЗНЕСА"
            : "ЛИЦО ВАШЕГО БИЗНЕСА"
        }
        title={creating ? "Давайте создадим компанию" : "Профиль компании"}
        text={
          creating
            ? "Она будет привязана к вашему аккаунту. Переключаться можно в любой момент."
            : "Расскажите о компании, чтобы люди лучше понимали, где будут работать."
        }
      />
      <div className="profile-layout">
        <aside>
          <section className="panel profile-summary">
            <div className="company-avatar">
              <Building2 size={37} strokeWidth={1.5} />
            </div>
            <h2>{company?.name || "Ваша компания"}</h2>
            <p>
              {creating
                ? "Первый шаг к отличной команде"
                : "Кабинет работодателя"}
            </p>
            <span className="profile-type">
              <Building2 size={13} />
              Аккаунт компании
            </span>
            <div className="company-owner">
              <span className="muted small">Владелец аккаунта</span>
              <strong>
                {user.first_name} {user.last_name}
              </strong>
              <small>@{user.username}</small>
            </div>
          </section>
          <div className="profile-tip">
            <Zap size={23} />
            <h3>Один вход — два режима</h3>
            <p>
              Личный профиль и компания живут в одном аккаунте. Переключатель
              находится в меню аккаунта вверху.
            </p>
          </div>
        </aside>
        <section className="panel company-edit-panel">
          <div className="section-title">
            <span className="section-icon">
              <Building2 size={21} />
            </span>
            <div>
              <h2>Основная информация</h2>
              <p>Эти данные будут доступны соискателям.</p>
            </div>
          </div>
          <form className="form-stack" onSubmit={submit}>
            <ErrorMessage message={error} />
            <label>
              Название компании
              <input
                name="name"
                required
                maxLength={100}
                pattern=".*\S.*"
                placeholder="Например, Кофейня «Ритм»"
                defaultValue={company?.name || ""}
              />
              <small>Укажите название, по которому вас узнают.</small>
            </label>
            <label>
              О компании
              <textarea
                name="description"
                required
                maxLength={500}
                rows={6}
                placeholder="Чем вы занимаетесь? Как устроена работа в вашей команде?"
                defaultValue={company?.description || ""}
              />
              <small>
                До 500 символов. Немного о бизнесе, команде и атмосфере.
              </small>
            </label>
            {creating && (
              <div className="info-box">
                <ShieldIcon />
                <p>
                  Компания создаётся внутри аккаунта @{user.username}. Отдельный
                  пароль или новая регистрация не нужны.
                </p>
              </div>
            )}
            <div className="form-actions">
              <Link
                to={creating ? "/profile" : "/company"}
                className="btn btn-secondary"
              >
                {creating ? "Пока не сейчас" : "К обзору"}
              </Link>
              <Button type="submit" busy={busy}>
                {creating ? "Создать компанию" : "Сохранить изменения"}
                {creating ? <ArrowRight size={17} /> : <Check size={17} />}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </>
  );
}

function ShieldIcon() {
  return <Check size={21} />;
}

export default function CompanyDashboard() {
  const { company, ownWorks = [], candidates } = useApp();
  const upcoming = ownWorks
    .filter((work) => work.work_date >= localDate())
    .sort((a, b) => a.work_date.localeCompare(b.work_date));
  const pending = candidates.filter((item) => item.status === "pending");
  const approved = candidates.filter((item) => item.status === "approved");
  return (
    <>
      <PageHeading
        eyebrow="ВАША КОМАНДА НАЧИНАЕТСЯ ЗДЕСЬ"
        title={company.name}
        text="Ваши смены, сотрудники и отклики."
      >
        <Link className="btn btn-primary" to="/company/shifts/new">
          <Plus size={18} />
          Создать смену
        </Link>
      </PageHeading>
      <div className="stats-grid four">
        <div className="stat-card">
          <span>Предстоящие смены</span>
          <strong>
            {upcoming.length}
            <CalendarDays size={24} />
          </strong>
          <small>Опубликованы и ждут сотрудников</small>
        </div>
        <div className="stat-card">
          <span>Новые отклики</span>
          <strong>
            {pending.length}
            <UsersRound size={24} />
          </strong>
          <small>Нуждаются в вашем внимании</small>
        </div>
        <div className="stat-card lime">
          <span>Приглашено людей</span>
          <strong>
            {approved.length}
            <Check size={24} />
          </strong>
          <small>Вы подтвердили их участие</small>
        </div>
        <div className="stat-card">
          <span>Бюджет смен</span>
          <strong className="stat-money">
            {money(
              upcoming.reduce((total, item) => total + (item.salary || 0), 0),
            )}
            <Wallet size={22} />
          </strong>
          <small>Указанная оплата предстоящих смен</small>
        </div>
      </div>
      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <h2>Ближайшие смены</h2>
            <Link className="text-link" to="/company/shifts">
              Все смены
              <ArrowRight size={15} />
            </Link>
          </div>
          {upcoming.length ? (
            upcoming.slice(0, 4).map((work) => (
              <Link
                className="dashboard-shift"
                to={`/company/shifts/${work.id}/edit`}
                key={work.id}
              >
                <span className="mini-date">
                  <strong>
                    {dateLabel(work.work_date, { day: "numeric" })}
                  </strong>
                  <small>
                    {dateLabel(work.work_date, { month: "short" }).replace(
                      ".",
                      "",
                    )}
                  </small>
                </span>
                <span>
                  <h3>{work.title}</h3>
                  <small>
                    {timeLabel(work.time_from)}–{timeLabel(work.time_to)} ·{" "}
                    {money(work.salary)}
                  </small>
                </span>
                <ArrowUpRight size={19} />
              </Link>
            ))
          ) : (
            <Empty
              icon={CalendarDays}
              title="Создайте первую смену"
              text="Расскажите о работе — соискатели смогут откликнуться."
            >
              <Link to="/company/shifts/new" className="btn btn-primary">
                <Plus size={16} />
                Новая смена
              </Link>
            </Empty>
          )}
        </section>
        <section className="panel">
          <div className="panel-heading">
            <h2>
              Новые отклики
              <span className="inline-count">{pending.length}</span>
            </h2>
            <Link className="text-link" to="/company/candidates">
              Все
              <ArrowRight size={15} />
            </Link>
          </div>
          {pending.length ? (
            pending.slice(0, 4).map((item) => (
              <Link
                className="dashboard-candidate"
                to={`/company/candidates?work=${item.work.id}`}
                key={`${item.user.id}-${item.work.id}`}
              >
                <span className="avatar">
                  {initials(`${item.user.first_name} ${item.user.last_name}`)}
                </span>
                <span>
                  <h3>
                    {item.user.first_name} {item.user.last_name}
                  </h3>
                  <small>{item.work.title}</small>
                </span>
                <ArrowRight size={17} />
              </Link>
            ))
          ) : (
            <Empty
              icon={BriefcaseBusiness}
              title="Все отклики разобраны"
              text="Новые кандидаты появятся здесь."
            />
          )}
        </section>
      </div>
    </>
  );
}
