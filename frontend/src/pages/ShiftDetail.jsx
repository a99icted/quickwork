import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  CalendarDays,
  Check,
  Clock3,
  FileCheck2,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { api } from "../lib/api";
import {
  cityLabel,
  dateLabel,
  hours,
  localDate,
  money,
  selectionIds,
  timeLabel,
} from "../lib/format";
import { useApp } from "../state/context";
import { CompanyLogo } from "../components/ShiftCard";
import { Button, Empty, ErrorMessage } from "../components/UI";

export default function ShiftDetail() {
  const { id, vacancy_id } = useParams();
  const workId = Number(id || vacancy_id);
  const {
    works,
    saved,
    toggleSaved,
    options,
    apply,
    applications,
    user,
    company,
    notify,
  } = useApp();
  const [fetched, setFetched] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [fetching, setFetching] = useState(true);
  const work = fetched || works.find((item) => item.id === workId);
  const navigate = useNavigate();
  const applied = applications.some((item) => item.id === workId);

  useEffect(() => {
    const controller = new AbortController();
    api(`/work/${workId}`, { signal: controller.signal })
      .then(setFetched)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setFetching(false);
      });
    return () => controller.abort();
  }, [workId]);

  async function submit() {
    if (!user) {
      navigate("/login", { state: { from: `/shifts/${workId}` } });
      return;
    }
    setBusy(true);
    try {
      await apply(work);
    } catch (err) {
      notify(err.message, "error");
    } finally {
      setBusy(false);
    }
  }

  if (fetching && !work)
    return (
      <div className="detail-skeleton skeleton-card">
        <div />
        <div />
        <div />
      </div>
    );
  if (!work)
    return (
      <>
        <ErrorMessage message={error} />
        <Empty
          title="Смена не найдена"
          text="Возможно, компания уже удалила вакансию."
        >
          <Link to="/" className="btn btn-primary">
            К поиску смен
          </Link>
        </Empty>
      </>
    );
  const own = company?.id === work.company_id;
  const elapsed = work.work_date < localDate();
  const features = options.features.filter(item => selectionIds(work, "features").includes(item.id));
  const categories = options.categories.filter(item => selectionIds(work, "categories").includes(item.id));

  return (
    <>
      <Link to="/" className="back-link">
        <ArrowLeft size={17} />К поиску смен
      </Link>
      <ErrorMessage message={error} />
      <div className="detail-layout">
        <div>
          <section className="panel detail-main">
            <div className="detail-company">
              <CompanyLogo work={work} large />
              <div>
                <span className="eyebrow">
                  {categories.map(item => item.name).join(" · ") || "РАЗОВАЯ СМЕНА"}
                </span>
                <h3>{work.company_name || work.company}</h3>
              </div>
              <button
                className={`save-btn ${saved.includes(work.id) ? "saved" : ""}`}
                aria-label="Сохранить смену"
                aria-pressed={saved.includes(work.id)}
                onClick={() => toggleSaved(work.id)}
              >
                <Bookmark
                  size={22}
                  fill={saved.includes(work.id) ? "currentColor" : "none"}
                />
              </button>
            </div>
            <h1>{work.title}</h1>
            <p className="detail-location">
              <MapPin size={17} />
              {cityLabel(work.city)}
              {work.address && `, ${work.address}`}
            </p>
            <div className="detail-facts">
              <div>
                <CalendarDays size={21} />
                <span>
                  Дата смены<strong>{dateLabel(work.work_date)}</strong>
                </span>
              </div>
              <div>
                <Clock3 size={21} />
                <span>
                  Рабочее время
                  <strong>
                    {timeLabel(work.time_from)}–{timeLabel(work.time_to)}
                    {work.ends_next_day ? " (+1 день)" : ""}
                  </strong>
                </span>
              </div>
              <div>
                <Wallet size={21} />
                <span>
                  Длительность<strong>{hours(work)} часов</strong>
                </span>
              </div>
            </div>
            <h2>Что предстоит делать</h2>
            <p className="description-text">
              {work.description ||
                "Работодатель пока не добавил подробное описание. Уточните задачи перед началом смены."}
            </p>
            <h2>Что нужно знать</h2>
            <div className="requirements-list">
              {features.map(feature => (
                <p key={feature.id}>
                  <FileCheck2 size={19} />
                  {feature.name}
                </p>
              ))}
              <p>
                <CalendarDays size={19} />
                Разовая работа на выбранный день
              </p>
              <p>
                <ShieldCheck size={19} />
                Согласуйте условия и оплату с работодателем
              </p>
            </div>
          </section>
          <div className="info-box detail-info">
            <ShieldCheck size={23} />
            <p>
              До выхода на смену уточните у компании точный адрес, контакт
              ответственного и способ оплаты.
            </p>
          </div>
        </div>
        <aside>
          <div className="panel apply-panel">
            <span className="eyebrow">ОПЛАТА ЗА СМЕНУ</span>
            <h2>{money(work.salary)}</h2>
            {work.salary && (
              <p>
                ~ {money(Math.round(work.salary / Math.max(1, hours(work))))} в
                час
              </p>
            )}
            <div className="apply-panel-separator" />
            <div className="apply-summary">
              <CalendarDays size={17} />
              {dateLabel(work.work_date)}
              <span>{hours(work)} ч</span>
            </div>
            {own ? (
              <Link
                to={`/company/shifts/${work.id}/edit`}
                className="btn btn-primary"
              >
                Редактировать смену
                <ArrowRight size={16} />
              </Link>
            ) : (
              <Button
                onClick={submit}
                busy={busy}
                disabled={applied || elapsed}
              >
                {applied ? (
                  <>
                    <Check size={18} />
                    Отклик отправлен
                  </>
                ) : elapsed ? (
                  "Смена завершена"
                ) : (
                  "Откликнуться"
                )}
                {!applied && !elapsed && <ArrowRight size={17} />}
              </Button>
            )}
            <small>
              {applied
                ? "Статус заявки — в разделе «Мои отклики»."
                : "Без резюме и долгих собеседований"}
            </small>
            {applied && (
              <Link className="text-link" to="/applications">
                Перейти к откликам
                <ArrowRight size={15} />
              </Link>
            )}
          </div>
          <div className="detail-company-note">
            <ShieldCheck size={26} />
            <h3>Ваше время ценно</h3>
            <p>Если планы изменились, предупредите компанию заранее.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
