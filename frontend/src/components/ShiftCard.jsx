import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bookmark, CalendarDays, Check, Clock3, MapPin } from "lucide-react";
import { useApp } from "../state/context";
import {
  cityLabel,
  dateLabel,
  initials,
  localDate,
  money,
  selectionIds,
  timeLabel,
} from "../lib/format";
import { Button } from "./UI";

export function CompanyLogo({ work, large = false }) {
  return (
    <div className={`company-logo ${large ? "large" : ""}`} aria-hidden="true">
      {initials(work.company_name || "Компания")}
    </div>
  );
}

export default function ShiftCard({ work }) {
  const {
    saved,
    toggleSaved,
    apply,
    applications,
    company,
    user,
    notify,
    options,
  } = useApp();
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const applied = applications.some((item) => item.id === work.id);
  const owned = work.company_id === company?.id;
  const elapsed = work.work_date < localDate();
  const features = options.features.filter(item => selectionIds(work, "features").includes(item.id));
  const categories = options.categories.filter(item => selectionIds(work, "categories").includes(item.id));
  async function handleApply() {
    if (!user)
      return navigate("/login", { state: { from: `/shifts/${work.id}` } });
    setBusy(true);
    try {
      await apply(work);
    } catch (error) {
      notify(error.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className={`shift-card ${applied ? "is-applied" : ""}`}>
      <div className="card-heading">
        <div>
          <Link to={`/shifts/${work.id}`} className="card-title">
            <h3>{work.title}</h3>
          </Link>
          <p className="card-company">{work.company_name || "Компания"}</p>
        </div>
        <div className="card-pay">
          <strong>{money(work.salary)}</strong>
          <small>за смену</small>
        </div>
      </div>
      <div className="card-location">
        <MapPin size={13} />
        <span>{cityLabel(work.city)}</span>
      </div>
      <div className="shift-tags">
        <span>
          <CalendarDays size={13} />
          {work.work_date === localDate()
            ? "Сегодня"
            : dateLabel(work.work_date, { day: "numeric", month: "short" })}
        </span>
        <span>
          <Clock3 size={13} />
          {timeLabel(work.time_from)}–{timeLabel(work.time_to)}
          {work.ends_next_day ? " +1" : ""}
        </span>
      </div>
      <div className="vacancy-labels">{categories.map(item => <span key={item.id}>{item.name}</span>)}</div>
      <div className="card-bottom">
        <div className="card-bottom-meta">
          <button
            className={`save-btn ${saved.includes(work.id) ? "saved" : ""}`}
            aria-label={`${saved.includes(work.id) ? "Убрать из избранного" : "В избранное"}: ${work.title}`}
            aria-pressed={saved.includes(work.id)}
            onClick={() => toggleSaved(work.id)}
          >
            <Bookmark
              size={17}
              fill={saved.includes(work.id) ? "currentColor" : "none"}
            />
          </button>
          <div className="card-features">{features.map(item => <span key={item.id} className="feature-label">{item.name}</span>)}</div>
        </div>
        {owned ? (
          <Link
            className="btn btn-secondary btn-sm"
            to={`/company/shifts/${work.id}/edit`}
          >
            Управлять
          </Link>
        ) : (
          <Button
            variant={applied ? "soft" : "dark"}
            className="btn-sm"
            onClick={handleApply}
            busy={busy}
            disabled={applied || elapsed}
          >
            {applied ? (
              <>
                <Check size={14} />
                Отправлен
              </>
            ) : elapsed ? (
              "Завершена"
            ) : (
              "Откликнуться"
            )}
          </Button>
        )}
      </div>
    </article>
  );
}
