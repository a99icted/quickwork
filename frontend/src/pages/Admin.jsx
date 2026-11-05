import { useEffect, useState } from "react";
import { Building2, Layers, MapPin, Pencil, Plus, RefreshCw, Settings2, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { api } from "../lib/api";
import { useApp } from "../state/context";
import { Button, Empty, ErrorMessage, Modal, PageHeading } from "../components/UI";

const catalogs = {
  cities: { title: "Города", single: "город", icon: MapPin, description: "Города, доступные при публикации и поиске смен.", limit: 100 },
  categories: { title: "Категории", single: "категорию", icon: Layers, description: "В одной вакансии можно выбрать несколько категорий.", limit: 250 },
  features: { title: "Особенности работы", single: "особенность", icon: Settings2, description: "Требования и условия: питание, документы, опыт и другие особенности.", limit: 250 },
};

export default function Admin() {
  const { notify, refreshOptions } = useApp();
  const [data, setData] = useState(null);
  const [tab, setTab] = useState("cities");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const current = catalogs[tab];
  const Icon = current.icon;
  async function load(signal) {
    try { const response = await api("/admin/catalogs", { signal }); if (!signal?.aborted) setData(response); }
    catch (err) { if (err.name !== "AbortError") setError(err.message); }
    finally { if (!signal?.aborted) setLoading(false); }
  }
  useEffect(() => {
    const controller = new AbortController();
    api("/admin/catalogs", { signal: controller.signal })
      .then(response => { if (!controller.signal.aborted) setData(response); })
      .catch(err => { if (err.name !== "AbortError") setError(err.message); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, []);
  function reloadCatalog() { setLoading(true); setError(""); return load(); }
  async function syncCatalogs() {
    try { await Promise.all([reloadCatalog(), refreshOptions()]); }
    catch (err) { notify(err.message, "error"); }
  }
  function openDialog(type, item = null) { setFormError(""); setDialog({ type, item, kind: tab }); }
  async function save(event) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));
    setBusy(true); setFormError("");
    try {
      await api(`/admin/${dialog.kind}${dialog.item ? `/${dialog.item.id}` : ""}`, { method: dialog.item ? "PATCH" : "POST", body: { name: values.name.trim(), ...(values.slug?.trim() ? { slug: values.slug.trim() } : {}) } });
      setDialog(null); notify(dialog.item ? "Изменения сохранены" : "Запись добавлена");
      await syncCatalogs();
    } catch (err) { setFormError(err.message); } finally { setBusy(false); }
  }
  async function remove() {
    setBusy(true); setFormError("");
    try { await api(`/admin/${dialog.kind}/${dialog.item.id}`, { method: "DELETE" }); setDialog(null); notify("Запись удалена"); await syncCatalogs(); }
    catch (err) { setFormError(err.message); } finally { setBusy(false); }
  }
  const list = (data?.[tab] || []).filter(item => `${item.name} ${item.slug || ""}`.toLowerCase().includes(query.toLowerCase()));
  return <>
    <div className="admin-page-heading"><PageHeading title="Администрирование" text="Справочники и настройки сервиса"><Button variant="secondary" onClick={syncCatalogs} disabled={loading}><RefreshCw size={16} />Обновить</Button></PageHeading></div>
    <div className="admin-access-note"><ShieldCheck size={19} /><span>Доступ только администраторам. Изменения справочников доступны всем пользователям.</span></div>
    {data && <div className="stats-grid three admin-stats">{[["Пользователи", data.stats.users, UsersRound], ["Компании", data.stats.companies, Building2], ["Вакансии", data.stats.works, Layers]].map(([label, value, StatIcon]) => <div key={label} className="stat-card"><span>{label}</span><strong>{value}<StatIcon size={22} /></strong></div>)}</div>}
    <div className="line-tabs admin-tabs">{Object.entries(catalogs).map(([key, item]) => <button key={key} className={key === tab ? "active" : ""} onClick={() => { setTab(key); setQuery(""); }}>{item.title}<span>{data?.[key]?.length ?? "—"}</span></button>)}</div>
    <section className="panel admin-panel">
      <div className="admin-panel-heading"><div><h2><Icon size={20} />{current.title}</h2><p>{current.description}</p></div><Button onClick={() => openDialog("edit")}><Plus size={17} />Добавить {current.single}</Button></div>
      <input className="compact-search admin-search" aria-label="Поиск по справочнику" placeholder="Поиск по названию…" value={query} onChange={event => setQuery(event.target.value)} />
      <ErrorMessage message={error} />
      {loading ? <div className="page-loader"><span className="loader" /><p>Загружаем справочники…</p></div> : list.length ? <div className="catalog-entries">{list.map(item => <article className="catalog-entry" key={item.id}><span className="settings-icon"><Icon size={19} /></span><div className="catalog-entry-name"><h3>{item.name}</h3><small>{item.slug ? `${item.slug} · ` : ""}Вакансий: {item.usage_count}</small></div><button className="icon-btn" aria-label={`Редактировать: ${item.name}`} onClick={() => openDialog("edit", item)}><Pencil size={16} /></button><button className="icon-btn danger-icon" aria-label={`Удалить: ${item.name}`} disabled={item.usage_count > 0} title={item.usage_count > 0 ? "Используется в вакансиях" : "Удалить запись"} onClick={() => openDialog("delete", item)}><Trash2 size={16} /></button></article>)}</div> : !error && <Empty icon={Icon} title="Записей пока нет" text={query ? "Измените поисковый запрос." : "Добавьте первую запись в справочник."} />}
      <p className="admin-footnote">Используемые записи можно переименовать. Удаление доступно, когда запись не привязана ни к одной вакансии.</p>
    </section>
    {dialog && <Modal title={dialog.type === "delete" ? "Удалить запись?" : dialog.item ? "Редактировать запись" : `Добавить ${catalogs[dialog.kind].single}`} onClose={() => { if (!busy) setDialog(null); }}>
      {dialog.type === "delete" ? <><p className="modal-description">«{dialog.item.name}» будет удалено из справочника. Это действие нельзя отменить.</p><ErrorMessage message={formError} /><div className="form-actions"><Button variant="secondary" disabled={busy} onClick={() => setDialog(null)}>Отмена</Button><Button variant="danger" busy={busy} onClick={remove}>Удалить</Button></div></> : <form className="form-stack" onSubmit={save}><ErrorMessage message={formError} /><label>Название<input name="name" required autoFocus maxLength={catalogs[dialog.kind].limit} pattern=".*\S.*" defaultValue={dialog.item?.name || ""} /></label>{dialog.kind === "categories" && <label>Код категории<input name="slug" maxLength={250} pattern="[a-z0-9][a-z0-9_-]*" placeholder="Например, warehouse" defaultValue={dialog.item?.slug || ""} /><small>Латинские буквы, цифры, дефис. Если оставить пустым, код создастся автоматически.</small></label>}{dialog.kind === "cities" && dialog.item && <p className="muted small">Название города обновится и в связанных вакансиях.</p>}<div className="form-actions"><Button type="button" variant="secondary" disabled={busy} onClick={() => setDialog(null)}>Отмена</Button><Button type="submit" busy={busy}>{dialog.item ? "Сохранить" : "Добавить"}</Button></div></form>}
    </Modal>}
  </>;
}
