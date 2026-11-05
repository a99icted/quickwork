import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock3,
  UsersRound,
  X,
} from "lucide-react";
import { useApp } from "../state/context";
import { dateLabel, initials, money, timeLabel } from "../lib/format";
import { Button, Empty, PageHeading } from "../components/UI";

export default function Candidates() {
  const { candidates, ownWorks = [], updateCandidate, notify } = useApp();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState("all");
  const [busy, setBusy] = useState(null);
  const [query, setQuery] = useState("");
  const workId = params.get("work") || "";
  const list = candidates.filter(
    (item) =>
      (!workId || String(item.work.id) === workId) &&
      (tab === "all" || item.status === tab) &&
      `${item.user.first_name} ${item.user.last_name} ${item.work.title}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  async function update(item, status) {
    setBusy(`${item.user.id}-${item.work.id}`);
    try {
      await updateCandidate(item, status);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(null);
    }
  }
  return (
    <>
      <PageHeading
        eyebrow="ЗНАКОМЬТЕСЬ С БУДУЩЕЙ КОМАНДОЙ"
        title="Отклики кандидатов"
        text="Приглашайте подходящих людей и помогайте им планировать свой день."
      />
      <div className="candidate-filters">
        <label>
          Смена
          <select
            aria-label="Фильтр кандидатов по смене"
            value={workId}
            onChange={(event) =>
              setParams(event.target.value ? { work: event.target.value } : {})
            }
          >
            <option value="">Все смены</option>
            {ownWorks.map((work) => (
              <option key={work.id} value={work.id}>
                {work.title} · {dateLabel(work.work_date)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Поиск
          <input
            aria-label="Поиск кандидатов"
            placeholder="Имя или название смены"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
      </div>
      <div className="line-tabs candidate-tabs">
        {[
          ["all", "Все отклики"],
          ["pending", "Новые"],
          ["approved", "Приглашены"],
          ["rejected", "Отклонены"],
        ].map(([value, label]) => (
          <button
            className={tab === value ? "active" : ""}
            key={value}
            onClick={() => setTab(value)}
          >
            {label}
            <span>
              {
                candidates.filter(
                  (item) => value === "all" || item.status === value,
                ).length
              }
            </span>
          </button>
        ))}
      </div>
      {list.length ? (
        <div className="candidates-grid">
          {list.map((item) => {
            const key = `${item.user.id}-${item.work.id}`;
            return (
              <article key={key} className="panel candidate-card">
                <div className="candidate-head">
                  <span className="avatar candidate-avatar">
                    {initials(`${item.user.first_name} ${item.user.last_name}`)}
                  </span>
                  <div>
                    <h3>
                      {item.user.first_name} {item.user.last_name}
                    </h3>
                    <span className={`status-badge ${item.status}`}>
                      {
                        {
                          pending: "Новый отклик",
                          approved: "Приглашён",
                          rejected: "Отклонён",
                        }[item.status]
                      }
                    </span>
                  </div>
                </div>
                <Link
                  to={`/shifts/${item.work.id}`}
                  className="candidate-work-title"
                >
                  {item.work.title}
                  <ArrowRight size={15} />
                </Link>
                <div className="candidate-work-meta">
                  <span>
                    <CalendarDays size={15} />
                    {dateLabel(item.work.work_date)}
                  </span>
                  <span>
                    <Clock3 size={15} />
                    {timeLabel(item.work.time_from)}–
                    {timeLabel(item.work.time_to)}
                  </span>
                </div>
                <div className="candidate-pay">
                  <span>Оплата за смену</span>
                  <strong>{money(item.work.salary)}</strong>
                </div>
                <div className="candidate-actions">
                  {item.status !== "rejected" && (
                    <Button
                      variant="secondary"
                      disabled={busy !== null}
                      onClick={() => update(item, "rejected")}
                    >
                      <X size={16} />
                      Отклонить
                    </Button>
                  )}
                  {item.status !== "approved" && (
                    <Button
                      busy={busy === key}
                      disabled={busy !== null}
                      onClick={() => update(item, "approved")}
                    >
                      <Check size={16} />
                      Пригласить
                    </Button>
                  )}
                  {item.status === "approved" && (
                    <span className="invited-label">
                      <Check size={16} />
                      Вы пригласили кандидата
                    </span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <Empty
          icon={UsersRound}
          title={
            candidates.length ? "Здесь пока никого" : "Отклики скоро появятся"
          }
          text={
            candidates.length
              ? "Выберите другую смену, статус или измените поиск."
              : "Опубликуйте смену — заинтересованные соискатели смогут отправить заявку."
          }
        >
          <Link to="/company/shifts" className="btn btn-secondary">
            К моим сменам
            <ArrowRight size={16} />
          </Link>
        </Empty>
      )}
    </>
  );
}
