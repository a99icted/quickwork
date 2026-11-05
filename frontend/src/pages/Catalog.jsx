import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDownWideNarrow,
  ArrowRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Grid2X2,
  MapPin,
  Package,
  PartyPopper,
  Search,
  SlidersHorizontal,
  Sparkles,
  Store,
  X,
} from "lucide-react";
import { useApp } from "../state/context";
import {
  addDays,
  cityLabel,
  dateLabel,
  localDate,
  plural,
  selectionIds,
  normalizeCity,
} from "../lib/format";
import ShiftCard from "../components/ShiftCard";
import { Button, Empty, ErrorMessage, Modal } from "../components/UI";

const categoryIcons = {
  cleaning: Sparkles,
  eating: Coffee,
  super_shop: Store,
  warehouse: Package,
  events: PartyPopper,
};
const PAGE_SIZE = 12;

export default function Catalog({ favorites = false }) {
  const { works, saved, loading, error, refresh, options } = useApp();
  const [params, setParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [week, setWeek] = useState(0);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const query = params.get("q") || "";
  const city = params.get("city") || "all";
  const date = params.get("date") || "";
  const category = params.get("category") || "";
  const sort = params.get("sort") || "recommended";
  const minimum = Number(params.get("min") || 0);
  const maxHours = Number(params.get("hours") || 0);
  const feature = params.get("feature") || "";
  const today = localDate();
  const days = Array.from({ length: 7 }, (_, index) =>
    addDays(index + week * 7),
  );

  function update(key, value) {
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        if (value) next.set(key, value);
        else next.delete(key);
        return next;
      },
      { replace: true },
    );
    setVisible(PAGE_SIZE);
  }

  function clear() {
    setParams(city ? { city } : {});
    setVisible(PAGE_SIZE);
  }

  const filtered = works
    .filter((work) => {
      const duration = (() => {
        const [h1, m1] = work.time_from.split(":").map(Number);
        const [h2, m2] = work.time_to.split(":").map(Number);
        return h2 - h1 + (m2 - m1) / 60 + (work.ends_next_day ? 24 : 0);
      })();
      return (
        (!favorites || saved.includes(work.id)) &&
        work.work_date >= today &&
        (city === "all" || normalizeCity(work.city) === normalizeCity(city)) &&
        (!query ||
          `${work.title} ${work.company_name} ${work.description || ""}`
            .toLowerCase()
            .includes(query.toLowerCase())) &&
        (!category || selectionIds(work, "categories").includes(Number(category))) &&
        (!date || work.work_date === date) &&
        (!minimum || work.salary >= minimum) &&
        (!maxHours || duration <= maxHours) &&
        (!feature || selectionIds(work, "features").includes(Number(feature)))
      );
    })
    .sort((a, b) =>
      sort === "salary"
        ? (b.salary || 0) - (a.salary || 0)
        : sort === "hourly"
          ? hourly(b) - hourly(a)
          : `${a.work_date}${a.time_from}`.localeCompare(
              `${b.work_date}${b.time_from}`,
            ),
    );

  function hourly(work) {
    const start =
      Number(work.time_from.slice(0, 2)) +
      Number(work.time_from.slice(3, 5)) / 60;
    const end =
      Number(work.time_to.slice(0, 2)) + Number(work.time_to.slice(3, 5)) / 60;
    return (
      (work.salary || 0) /
      Math.max(0.5, end - start + (work.ends_next_day ? 24 : 0))
    );
  }

  const hasFilters =
    query || category || date || minimum || maxHours || feature;
  const additionalCount = [minimum, maxHours, feature, category].filter(
    Boolean,
  ).length;

  return (
    <>
      <div className="page-heading catalog-heading">
        <div>
          <h1>{favorites ? "Избранное" : "Смены рядом"}</h1>
          <label className="location-select">
            <MapPin size={14} />
            <select
              aria-label="Город поиска"
              value={city}
              onChange={(event) => update("city", event.target.value)}
            >
              <option value="all">Все города</option>
              {options.cities.map(
                (item) => (
                  <option value={item} key={item}>
                    {cityLabel(item)}
                  </option>
                ),
              )}
            </select>
            <ChevronRight size={12} className="rotate-down" />
          </label>
        </div>
      </div>
      <section id="shift-feed" className="catalog-section">
        <div className="search-toolbar">
          <label className="catalog-search">
            <Search size={20} />
            <input
              aria-label="Поиск смен"
              placeholder="Должность или компания"
              value={query}
              onChange={(event) => update("q", event.target.value)}
            />
            {query && (
              <button
                aria-label="Очистить поиск"
                onClick={() => update("q", "")}
              >
                <X size={17} />
              </button>
            )}
          </label>
          <button
            className={`filters-btn ${additionalCount ? "active" : ""}`}
            aria-label="Фильтры"
            onClick={() => setFiltersOpen(true)}
          >
            <SlidersHorizontal size={17} />
            <span>Фильтры</span>
            {additionalCount > 0 && <b>{additionalCount}</b>}
          </button>
        </div>
        <div className="category-tabs" aria-label="Категории">
          <button
            className={!category ? "active" : ""}
            onClick={() => update("category", "")}
          >
            <Grid2X2 size={16} />
            Все смены
          </button>
          {options.categories.map((item) => {
            const Icon = categoryIcons[item.slug] || Package;
            return (
              <button
                key={item.id}
                className={category === String(item.id) ? "active" : ""}
                onClick={() => update("category", String(item.id))}
              >
                <Icon size={16} />
                {item.name}
              </button>
            );
          })}
        </div>
        <div className="calendar-heading">
          <span>{dateLabel(days[0], { month: "long" })}</span>
          <button
            onClick={() => {
              setWeek(0);
              update("date", today);
            }}
          >
            Сегодня
          </button>
        </div>
        <div className="date-filter">
          <button
            className={`any-date ${!date ? "active" : ""}`}
            onClick={() => update("date", "")}
          >
            <CalendarDays size={19} />
            <span>
              Любая
              <br />
              дата
            </span>
          </button>
          <button
            className="date-arrow"
            aria-label="Предыдущая неделя"
            disabled={week === 0}
            onClick={() => setWeek(Math.max(0, week - 1))}
          >
            <ChevronLeft size={17} />
          </button>
          <div className="date-days">
            {days.map((value) => (
              <button
                className={`date-day ${date === value ? "active" : ""} ${[0, 6].includes(new Date(`${value}T12:00:00`).getDay()) ? "weekend" : ""}`}
                key={value}
                onClick={() => update("date", value)}
              >
                <span>{dateLabel(value, { weekday: "short" })}</span>
                <strong>{dateLabel(value, { day: "numeric" })}</strong>
              </button>
            ))}
          </div>
          <button
            className="date-arrow"
            aria-label="Следующая неделя"
            onClick={() => setWeek(week + 1)}
          >
            <ChevronRight size={17} />
          </button>
        </div>
        <div className="feed-heading">
          <h2>
            {filtered.length}{" "}
            {plural(filtered.length, ["смена", "смены", "смен"])}
            {date === today
              ? " на сегодня"
              : date
                ? " на выбранный день"
                : favorites
                  ? " в избранном"
                  : ` ${plural(filtered.length, ["доступна", "доступны", "доступны"])}`}
          </h2>
          <label className="sort-control">
            <ArrowDownWideNarrow size={15} />
            <select
              aria-label="Сортировка смен"
              value={sort}
              onChange={(event) => update("sort", event.target.value)}
            >
              <option value="recommended">Сначала ближайшие</option>
              <option value="salary">По оплате за смену</option>
              <option value="hourly">По оплате за час</option>
            </select>
          </label>
        </div>
        {hasFilters && (
          <div className="active-filters">
            {query && (
              <span>
                «{query}»
                <button
                  aria-label="Убрать поисковый запрос"
                  onClick={() => update("q", "")}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            {date && (
              <span>
                {dateLabel(date)}
                <button
                  aria-label="Убрать дату"
                  onClick={() => update("date", "")}
                >
                  <X size={12} />
                </button>
              </span>
            )}
            <button onClick={clear}>
              Сбросить фильтры
              <X size={13} />
            </button>
          </div>
        )}
        {loading ? (
          <div className="shift-grid">
            {Array.from({ length: 6 }, (_, i) => (
              <div className="skeleton-card" key={i}>
                <div />
                <div />
                <div />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="connection-error">
            <ErrorMessage message={error} />
            <Button variant="secondary" onClick={() => refresh()}>
              Попробовать снова
            </Button>
          </div>
        ) : filtered.length ? (
          <>
            <div className="shift-grid">
              {filtered.slice(0, visible).map((work) => (
                <ShiftCard key={work.id} work={work} />
              ))}
            </div>
            {visible < filtered.length && (
              <div className="load-more">
                <Button
                  variant="secondary"
                  onClick={() => setVisible(visible + PAGE_SIZE)}
                >
                  Показать ещё смены
                  <ChevronDownIcon />
                </Button>
                <span>
                  Показано {Math.min(visible, filtered.length)} из{" "}
                  {filtered.length}
                </span>
              </div>
            )}
          </>
        ) : (
          <Empty
            title={
              favorites && !saved.length
                ? "Сохраняйте то, что нравится"
                : "Таких смен пока нет"
            }
            text={
              favorites && !saved.length
                ? "Нажмите на закладку в карточке смены — она появится здесь."
                : "Попробуйте другой день, город или сбросьте фильтры."
            }
          >
            {hasFilters ? (
              <Button variant="secondary" onClick={clear}>
                Сбросить фильтры
              </Button>
            ) : favorites ? (
              <Link className="btn btn-primary" to="/">
                Найти смену
                <ArrowRight size={16} />
              </Link>
            ) : null}
          </Empty>
        )}
      </section>
      {!favorites && (
        <div className="bottom-callout">
          <span className="callout-icon">
            <BuildingIcon />
          </span>
          <div>
            <h3>Хорошая команда начинается с одной смены</h3>
            <p>Разместите вакансию и найдите людей для своего бизнеса.</p>
          </div>
          <Link to="/company" className="text-link">
            Я ищу сотрудников
            <ArrowRight size={17} />
          </Link>
        </div>
      )}
      {filtersOpen && (
        <Modal title="Настроить поиск" onClose={() => setFiltersOpen(false)}>
          <form
            className="form-stack"
            onSubmit={(event) => {
              event.preventDefault();
              const values = Object.fromEntries(
                new FormData(event.currentTarget),
              );
              setParams((previous) => {
                const next = new URLSearchParams(previous);
                ["min", "hours", "feature", "date", "category"].forEach(
                  (key) =>
                    values[key] ? next.set(key, values[key]) : next.delete(key),
                );
                return next;
              });
              setVisible(PAGE_SIZE);
              setFiltersOpen(false);
            }}
          >
            <label>
              Категория
              <select name="category" defaultValue={category}>
                <option value="">Все категории</option>
                {options.categories.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Дата смены
              <input name="date" type="date" min={today} defaultValue={date} />
            </label>
            <label>
              Оплата за смену, от (RSD)
              <input
                name="min"
                type="number"
                min="0"
                max="1000000"
                placeholder="Например, 4 000"
                defaultValue={minimum || ""}
              />
            </label>
            <label>
              Длительность смены
              <select name="hours" defaultValue={maxHours || ""}>
                <option value="">Любая</option>
                <option value="4">До 4 часов</option>
                <option value="6">До 6 часов</option>
                <option value="8">До 8 часов</option>
                <option value="12">До 12 часов</option>
              </select>
            </label>
            <label>
              Условия
              <select name="feature" defaultValue={feature}>
                <option value="">Любые условия</option>
                {options.features.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="form-actions">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  clear();
                  setFiltersOpen(false);
                }}
              >
                Сбросить
              </Button>
              <Button type="submit">
                Показать смены
                <ArrowRight size={17} />
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

function ChevronDownIcon() {
  return <ChevronRight size={16} className="rotate-down" />;
}
function BuildingIcon() {
  return <Store size={22} strokeWidth={1.5} />;
}
