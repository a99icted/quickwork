import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bell,
  Bookmark,
  Building2,
  Check,
  ChevronRight,
  ClipboardCheck,
  LogOut,
  Pencil,
  Plus,
  UserRound,
} from "lucide-react";
import { useApp } from "../state/context";
import { initials, plural } from "../lib/format";
import { Button, ErrorMessage, Modal, PageHeading } from "../components/UI";

export default function Profile() {
  const { user, company, applications, saved, saveProfile, setMode, logout } =
    useApp();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const approved = applications.filter(
    (item) => item.status === "approved",
  ).length;
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      await saveProfile({
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        age: Number(values.age),
      });
      setEditing(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  function openEditor() {
    setError("");
    setEditing(true);
  }
  return (
    <>
      <PageHeading title="Профиль" text="Ваши данные и настройки" />
      <div className="personal-profile-layout">
        <div className="profile-overview">
          <section className="panel profile-identity">
            <span className="profile-avatar">
              {initials(`${user.first_name} ${user.last_name}`)}
            </span>
            <div>
              <h2>
                {user.first_name} {user.last_name}
              </h2>
              <p>@{user.username}</p>
              <span className="profile-type">Личный аккаунт</span>
            </div>
            <button
              className="edit-profile-button"
              aria-label="Редактировать профиль"
              onClick={openEditor}
            >
              <Pencil size={17} />
            </button>
          </section>
          <section className="panel profile-metrics">
            <Link to="/applications">
              <strong>{applications.length}</strong>
              <span>
                {plural(applications.length, ["отклик", "отклика", "откликов"])}
              </span>
            </Link>
            <Link to="/applications">
              <strong>{approved}</strong>
              <span>
                {plural(approved, [
                  "приглашение",
                  "приглашения",
                  "приглашений",
                ])}
              </span>
            </Link>
            <Link to="/saved">
              <strong>{saved.length}</strong>
              <span>в избранном</span>
            </Link>
          </section>
          <div className="profile-account-note">
            <UserRound size={22} />
            <div>
              <strong>Один аккаунт — больше возможностей</strong>
              <p>
                Работайте на сменах или находите сотрудников для своей компании.
              </p>
            </div>
          </div>
        </div>
        <div className="profile-sections">
          <section>
            <h2 className="group-title">Личные данные</h2>
            <div className="panel settings-list">
              <button onClick={openEditor}>
                <span className="settings-icon">
                  <UserRound size={20} />
                </span>
                <span>
                  <strong>Основная информация</strong>
                  <small>Имя, фамилия, возраст</small>
                </span>
                <ChevronRight size={18} />
              </button>
              <Link to="/applications">
                <span className="settings-icon">
                  <ClipboardCheck size={20} />
                </span>
                <span>
                  <strong>Мои отклики</strong>
                  <small>Статусы и приглашения на смены</small>
                </span>
                <ChevronRight size={18} />
              </Link>
              <Link to="/saved">
                <span className="settings-icon">
                  <Bookmark size={20} />
                </span>
                <span>
                  <strong>Избранное</strong>
                  <small>Сохранённые вакансии</small>
                </span>
                <ChevronRight size={18} />
              </Link>
            </div>
          </section>
          <section>
            <h2 className="group-title">Для бизнеса</h2>
            <div className="panel settings-list">
              <Link
                to={company ? "/company" : "/company/create"}
                onClick={() => company && setMode("company")}
              >
                <span className="settings-icon mint">
                  <Building2 size={20} />
                </span>
                <span>
                  <strong>{company?.name || "Создать компанию"}</strong>
                  <small>
                    {company
                      ? "Перейти в кабинет компании"
                      : "Внутри вашего личного аккаунта"}
                  </small>
                </span>
                {company ? <ChevronRight size={18} /> : <Plus size={18} />}
              </Link>
            </div>
          </section>
          <section>
            <h2 className="group-title">Настройки</h2>
            <div className="panel settings-list">
              <Link to="/applications">
                <span className="settings-icon">
                  <Bell size={20} />
                </span>
                <span>
                  <strong>Ответы работодателей</strong>
                  <small>Приглашения и статусы откликов</small>
                </span>
                <ChevronRight size={18} />
              </Link>
              <button
                className="danger-text"
                onClick={() => {
                  logout();
                  navigate("/login");
                }}
              >
                <span className="settings-icon coral">
                  <LogOut size={20} />
                </span>
                <span>
                  <strong>Выйти из аккаунта</strong>
                </span>
                <ChevronRight size={18} />
              </button>
            </div>
          </section>
        </div>
      </div>
      {editing && (
        <Modal title="Личные данные" onClose={() => setEditing(false)}>
          <form className="form-stack" onSubmit={submit}>
            <ErrorMessage message={error} />
            <div className="form-row">
              <label>
                Имя
                <input
                  name="first_name"
                  autoComplete="given-name"
                  defaultValue={user.first_name}
                  maxLength={25}
                  pattern=".*\S.*"
                  required
                />
              </label>
              <label>
                Фамилия
                <input
                  name="last_name"
                  autoComplete="family-name"
                  defaultValue={user.last_name}
                  maxLength={25}
                  pattern=".*\S.*"
                  required
                />
              </label>
            </div>
            <label>
              Логин
              <input value={user.username} readOnly />
              <small>Логин используется для входа и не изменяется.</small>
            </label>
            <label>
              Возраст
              <input
                name="age"
                type="number"
                min={16}
                max={100}
                defaultValue={user.age}
                required
              />
            </label>
            <Button type="submit" busy={busy}>
              Сохранить изменения
              <Check size={17} />
            </Button>
          </form>
        </Modal>
      )}
    </>
  );
}
