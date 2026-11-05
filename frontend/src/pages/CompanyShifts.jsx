import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Clock3,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  UsersRound,
} from "lucide-react";
import { useApp } from "../state/context";
import {
  cityLabel,
  dateLabel,
  localDate,
  money,
  plural,
  timeLabel,
} from "../lib/format";
import {
  Button,
  Empty,
  ErrorMessage,
  Modal,
  PageHeading,
} from "../components/UI";

export default function CompanyShifts() {
  const { ownWorks = [], candidates, deleteWork } = useApp();
  const [tab, setTab] = useState("upcoming");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const list = ownWorks
    .filter(
      (work) =>
        (tab === "all" ||
          (tab === "upcoming"
            ? work.work_date >= localDate()
            : work.work_date < localDate())) &&
        work.title.toLowerCase().includes(query.toLowerCase()),
    )
    .sort((a, b) => a.work_date.localeCompare(b.work_date));
  async function remove() {
    setBusy(true);
    setError("");
    try {
      await deleteWork(deleting.id);
      setDeleting(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="РАБОТА ПОД ВАШИ ЗАДАЧИ"
        title="Мои смены"
        text="Публикуйте вакансии, обновляйте условия и собирайте команду."
      >
        <Link className="btn btn-primary" to="/company/shifts/new">
          <Plus size={18} />
          Создать смену
        </Link>
      </PageHeading>
      <div className="list-toolbar">
        <div className="line-tabs">
          {[
            ["upcoming", "Предстоящие"],
            ["past", "Прошедшие"],
            ["all", "Все смены"],
          ].map(([value, label]) => (
            <button
              className={tab === value ? "active" : ""}
              key={value}
              onClick={() => setTab(value)}
            >
              {label}
            </button>
          ))}
        </div>
        <input
          className="compact-search"
          aria-label="Поиск по сменам компании"
          placeholder="Найти смену…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>
      {list.length ? (
        <div className="company-shift-list">
          {list.map((work) => (
            <article className="panel company-shift-card" key={work.id}>
              <div className="company-shift-head">
                <span
                  className={`status-badge ${work.work_date >= localDate() ? "approved" : "neutral"}`}
                >
                  {work.work_date >= localDate()
                    ? "Опубликована"
                    : "Прошедшая смена"}
                </span>
                <div>
                  <Link
                    className="icon-btn"
                    aria-label={`Редактировать: ${work.title}`}
                    to={`/company/shifts/${work.id}/edit`}
                  >
                    <Pencil size={17} />
                  </Link>
                  <button
                    className="icon-btn danger-icon"
                    aria-label={`Удалить: ${work.title}`}
                    onClick={() => {
                      setDeleting(work);
                      setError("");
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
              <div className="company-shift-body">
                <div>
                  <Link to={`/shifts/${work.id}`}>
                    <h2>{work.title}</h2>
                  </Link>
                  <div className="application-meta">
                    <span>
                      <CalendarDays size={15} />
                      {dateLabel(work.work_date)}
                    </span>
                    <span>
                      <Clock3 size={15} />
                      {timeLabel(work.time_from)}–{timeLabel(work.time_to)}
                      {work.ends_next_day && " +1"}
                    </span>
                    <span>
                      <MapPin size={15} />
                      {cityLabel(work.city)}
                    </span>
                  </div>
                </div>
                <div className="company-shift-pay">
                  <strong>{money(work.salary)}</strong>
                  <small>за смену</small>
                </div>
              </div>
              <div className="company-shift-footer">
                <span>
                  <UsersRound size={16} />
                  {
                    candidates.filter((item) => item.work.id === work.id).length
                  }{" "}
                  {plural(
                    candidates.filter((item) => item.work.id === work.id)
                      .length,
                    ["отклик", "отклика", "откликов"],
                  )}
                </span>
                <Link
                  className="text-link"
                  to={`/company/candidates?work=${work.id}`}
                >
                  Посмотреть кандидатов
                  <ArrowRight size={16} />
                </Link>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={CalendarDays}
          title={
            ownWorks.length
              ? "Подходящих смен нет"
              : "Ваша первая смена ждёт публикации"
          }
          text={
            ownWorks.length
              ? "Попробуйте другую вкладку или измените запрос."
              : "Укажите задачи, дату и оплату — соискатели увидят вашу вакансию."
          }
        >
          <Link to="/company/shifts/new" className="btn btn-primary">
            <Plus size={17} />
            Создать смену
          </Link>
        </Empty>
      )}
      {deleting && (
        <Modal
          title="Удалить смену?"
          onClose={() => {
            if (!busy) setDeleting(null);
          }}
        >
          <p className="modal-description">
            Смена «{deleting.title}» и связанные с ней отклики будут удалены.
            Восстановить их не получится.
          </p>
          <ErrorMessage message={error} />
          <div className="form-actions">
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Оставить смену
            </Button>
            <Button variant="danger" busy={busy} onClick={remove}>
              Удалить смену
              <Trash2 size={16} />
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
