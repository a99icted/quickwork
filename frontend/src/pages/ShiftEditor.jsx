import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  FileText,
  Lightbulb,
  MapPin,
  Wallet,
} from "lucide-react";
import { useApp } from "../state/context";
import { cityLabel, localDate, selectionIds, normalizeCity } from "../lib/format";
import { Button, Empty, ErrorMessage, PageHeading } from "../components/UI";

import MultiSelect from "../components/MultiSelect";

export default function ShiftEditor() {
  const { id } = useParams();
  const { ownWorks = [], options, saveWork, company } = useApp();
  const work = ownWorks.find((item) => item.id === Number(id));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [night, setNight] = useState(work?.ends_next_day || false);
  const navigate = useNavigate();
  const cities = options.cities;
  const [categories, setCategories] = useState(() => selectionIds(work, "categories"));
  const [features, setFeatures] = useState(() => selectionIds(work, "features"));
  const initialCity = cities.find(city => normalizeCity(city) === normalizeCity(work?.city)) || "";
  const missingOptions = !cities.length || !options.categories.length || !options.features.length;
  async function submit(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setError("");
    if (!categories.length || !features.length) {
      setError("Выберите хотя бы одну категорию и одну особенность работы.");
      return;
    }
    if (!night && values.time_to <= values.time_from) {
      setError(
        "Время окончания должно быть позже начала. Если смена ночная, отметьте переход на следующий день.",
      );
      return;
    }
    setBusy(true);
    try {
      await saveWork(
        {
          title: values.title.trim(),
          description: values.description.trim(),
          work_date: values.work_date,
          time_from: values.time_from,
          time_to: values.time_to,
          city: values.city.trim(),
          salary: Number(values.salary),
          category_ids: categories,
          feature_ids: features,
          ends_next_day: night,
        },
        work?.id,
      );
      navigate("/company/shifts");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  if (id && !work)
    return (
      <Empty
        title="Смена не найдена"
        text="Она удалена или принадлежит другой компании."
      >
        <Link className="btn btn-primary" to="/company/shifts">
          К моим сменам
        </Link>
      </Empty>
    );
  return (
    <>
      <Link className="back-link" to="/company/shifts">
        <ArrowLeft size={17} />К моим сменам
      </Link>
      <PageHeading
        eyebrow={company.name}
        title={work ? "Редактировать смену" : "Создать новую смену"}
        text="Понятные условия помогут быстрее найти подходящего человека."
      />
      <div className="editor-layout">
        <form className="form-stack" onSubmit={submit}>
          <ErrorMessage message={error} />
          <section className="panel editor-section">
            <div className="section-title">
              <span className="section-icon">
                <FileText size={20} />
              </span>
              <div>
                <h2>О работе</h2>
                <p>Что нужно будет делать на смене?</p>
              </div>
            </div>
            <label>
              Название смены
              <input
                name="title"
                required
                maxLength={100}
                pattern=".*\S.*"
                placeholder="Например, Бариста на дневную смену"
                defaultValue={work?.title || ""}
              />
            </label>
            <MultiSelect label="Категории" items={options.categories} values={categories} onChange={setCategories} hint="Выберите одну или несколько категорий, которым соответствует смена." />
            <label>
              Задачи и условия
              <textarea
                name="description"
                required
                maxLength={500}
                rows={5}
                placeholder="Расскажите о задачах, перерывах, форме одежды и том, что вы предоставляете."
                defaultValue={work?.description || ""}
              />
              <small>
                До 500 символов. Точный адрес и контакт согласуйте с кандидатом.
              </small>
            </label>
          </section>
          <section className="panel editor-section">
            <div className="section-title">
              <span className="section-icon lavender">
                <CalendarDays size={20} />
              </span>
              <div>
                <h2>Когда и где</h2>
                <p>Укажите дату и продолжительность смены.</p>
              </div>
            </div>
            <div className="form-row">
              <label>
                Дата
                <input
                  type="date"
                  name="work_date"
                  required
                  min={
                    work?.work_date < localDate() ? work.work_date : localDate()
                  }
                  defaultValue={work?.work_date || localDate()}
                />
              </label>
              <label>
                Город
                <div className="input-with-icon">
                  <MapPin size={17} />
                  <select name="city" required defaultValue={initialCity}>
                    <option value="" disabled>Выберите город</option>
                    {cities.map(item => <option key={item} value={item}>{cityLabel(item)}</option>)}
                  </select>
                </div>
              </label>
            </div>
            <div className="form-row">
              <label>
                Начало смены
                <input
                  type="time"
                  name="time_from"
                  required
                  defaultValue={work?.time_from?.slice(0, 5) || "09:00"}
                />
              </label>
              <label>
                Конец смены
                <input
                  type="time"
                  name="time_to"
                  required
                  defaultValue={work?.time_to?.slice(0, 5) || "17:00"}
                />
              </label>
            </div>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={night}
                onChange={(event) => setNight(event.target.checked)}
              />
              <span>Смена заканчивается на следующий день</span>
            </label>
          </section>
          <section className="panel editor-section">
            <div className="section-title">
              <span className="section-icon peach">
                <Wallet size={20} />
              </span>
              <div>
                <h2>Оплата и требования</h2>
                <p>Оплата указывается за всю смену, в сербских динарах.</p>
              </div>
            </div>
            <div className="form-row">
              <label>
                Оплата за смену, RSD
                <input
                  type="number"
                  name="salary"
                  required
                  min={0}
                  step={1}
                  max={10000000}
                  placeholder="4 500"
                  defaultValue={work?.salary ?? ""}
                />
              </label>
            </div>
            <MultiSelect label="Особенности работы" items={options.features} values={features} onChange={setFeatures} hint="Выберите хотя бы одну особенность: требования, питание или другие условия работы." />
            {missingOptions && <ErrorMessage message="Перед публикацией администратор должен добавить города, категории и особенности работы в справочники." />}
          </section>
          <div className="editor-actions">
            <Link to="/company/shifts" className="btn btn-secondary">
              Отмена
            </Link>
            <Button
              type="submit"
              busy={busy}
              disabled={missingOptions}
            >
              {work ? "Сохранить изменения" : "Опубликовать смену"}
              {work ? <Check size={17} /> : <ArrowRight size={17} />}
            </Button>
          </div>
        </form>
        <aside className="editor-tips">
          <div className="tip-card">
            <Lightbulb size={27} />
            <h3>Хорошее описание — половина дела</h3>
            <p>
              Расскажите, как пройдёт рабочий день. Чёткие ожидания помогают
              найти человека, которому подойдёт ваша смена.
            </p>
            <ul>
              <li>Конкретные задачи</li>
              <li>Перерывы и питание</li>
              <li>Требования к опыту</li>
              <li>Одежда и оборудование</li>
            </ul>
          </div>
          <div className="editor-note">
            <Check size={18} />
            <p>После публикации смена сразу появится в каталоге.</p>
          </div>
        </aside>
      </div>
    </>
  );
}
