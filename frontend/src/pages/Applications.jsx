import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  ChevronRight,
  Clock3,
} from "lucide-react";
import { useApp } from "../state/context";
import {
  cityLabel,
  dateLabel,
  localDate,
  money,
  statusLabels,
  timeLabel,
} from "../lib/format";
import { Empty, ErrorMessage, PageHeading } from "../components/UI";

export default function Applications() {
  const { applications, error } = useApp();
  const [tab, setTab] = useState("active");
  const [status, setStatus] = useState("");
  const [descending, setDescending] = useState(false);
  const active = applications.filter(
    (item) => item.work_date >= localDate() && item.status !== "rejected",
  );
  const archived = applications.filter(
    (item) => item.work_date < localDate() || item.status === "rejected",
  );
  const list = (tab === "active" ? active : archived)
    .filter((item) => !status || item.status === status)
    .sort((a, b) =>
      descending
        ? b.work_date.localeCompare(a.work_date)
        : a.work_date.localeCompare(b.work_date),
    );
  return (
    <>
      <PageHeading title="Мои отклики" text="Следите за ответами работодателей">
        <Link to="/" className="btn btn-secondary desktop-only">
          Найти смену
          <ArrowRight size={16} />
        </Link>
      </PageHeading>
      <div className="segmented-control">
        <button
          className={tab === "active" ? "active" : ""}
          onClick={() => setTab("active")}
        >
          Активные · {active.length}
        </button>
        <button
          className={tab === "archive" ? "active" : ""}
          onClick={() => setTab("archive")}
        >
          Завершённые · {archived.length}
        </button>
      </div>
      <div className="feed-heading">
        <h2>{tab === "active" ? "Текущие отклики" : "История откликов"}</h2>
        <div className="application-controls">
          <select
            aria-label="Статус отклика"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="">Все статусы</option>
            <option value="pending">На рассмотрении</option>
            <option value="approved">Приглашения</option>
            <option value="rejected">Отклонены</option>
          </select>
          <button
            className="text-link"
            onClick={() => setDescending(!descending)}
          >
            По дате{descending ? " ↓" : " ↑"}
          </button>
        </div>
      </div>
      <ErrorMessage message={error} />
      {list.length ? (
        <div className="applications-list">
          {list.map((work) => (
            <article
              className={`application-card panel ${work.status}`}
              key={work.id}
            >
              <div className="card-heading">
                <div>
                  <Link to={`/shifts/${work.id}`} className="card-title">
                    <h3>{work.title}</h3>
                  </Link>
                  <p className="card-company">
                    {work.company_name} · {cityLabel(work.city)}
                  </p>
                </div>
                <div className="card-pay">
                  <strong>{money(work.salary)}</strong>
                  <small>за смену</small>
                </div>
              </div>
              <div className="shift-tags">
                <span>
                  <CalendarDays size={13} />
                  {dateLabel(work.work_date)}
                </span>
                <span>
                  <Clock3 size={13} />
                  {timeLabel(work.time_from)}–{timeLabel(work.time_to)}
                  {work.ends_next_day ? " +1" : ""}
                </span>
              </div>
              <Link
                className="application-status-row"
                to={`/shifts/${work.id}`}
              >
                <i className={`status-dot ${work.status}`} />
                <span>
                  <strong>{statusLabels[work.status]}</strong>
                  <small>
                    {work.status === "approved"
                      ? "Компания пригласила вас на смену"
                      : work.status === "rejected"
                        ? "Можно откликнуться на другие смены"
                        : "Работодатель рассматривает отклик"}
                  </small>
                </span>
                <ChevronRight size={18} />
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          icon={BriefcaseBusiness}
          title="Здесь пока нет откликов"
          text={
            status
              ? "Выберите другой статус или вкладку."
              : tab === "active"
                ? "Найдите подходящую смену и отправьте отклик."
                : "Завершённые и отклонённые отклики появятся здесь."
          }
        >
          <Link to="/" className="btn btn-primary">
            Найти смену
            <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
    </>
  );
}
