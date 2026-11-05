import { useCallback, useEffect, useState } from "react";
import { api, endSession, loadSession, loginSession } from "../lib/api";
import { AppContext } from "./context";

function read(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

export default function AppProvider({ children }) {
  const [live, setLive] = useState({
    user: null,
    company: null,
    works: [],
    ownWorks: [],
    applications: [],
    candidates: [],
    options: { categories: [], features: [], cities: [] },
  });
  const [mode, setMode] = useState(
    () => localStorage.getItem("qw:account") || "personal",
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [savedLive, setSavedLive] = useState(() =>
    read(`qw:saved:${localStorage.getItem("qw:user-id") || "guest"}`, []),
  );
  const notify = useCallback(
    (message, type = "success") => setToast({ message, type, id: Date.now() }),
    [],
  );

  useEffect(() => {
    // Clear the retired preview data from earlier versions.
    localStorage.removeItem("qw:demo:v1");
    localStorage.removeItem("qw:mode");
  }, []);
  useEffect(() => {
    localStorage.setItem("qw:account", mode);
  }, [mode]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  const refresh = useCallback((signal) => {
    return loadSession(signal)
      .then((account) => {
        if (signal?.aborted) return;
        if (account.user) {
          localStorage.setItem("qw:user-id", String(account.user.id));
        } else {
          localStorage.removeItem("qw:user-id");
        }
        setSavedLive(read(`qw:saved:${account.user?.id || "guest"}`, []));
        setLive(account);
        setError("");
      })
      .catch((err) => {
        if (err.name !== "AbortError") setError(err.message);
        throw err;
      })
      .finally(() => {
        if (!signal?.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    refresh(controller.signal).catch(() => {});
    return () => controller.abort();
  }, [refresh]);

  useEffect(() => {
    const expire = () => {
      localStorage.removeItem("qw:user-id");
      setSavedLive(read("qw:saved:guest", []));
      setLive((value) => ({
        ...value,
        user: null,
        company: null,
        applications: [],
        candidates: [],
        ownWorks: [],
      }));
      setMode("personal");
      notify("Сессия истекла. Войдите в аккаунт ещё раз.", "error");
    };
    window.addEventListener("qw:unauthorized", expire);
    return () => window.removeEventListener("qw:unauthorized", expire);
  }, [notify]);

  const data = live;
  const saved = savedLive;

  async function authenticate(values, register = false) {
    if (register) await api("/auth/register", { method: "POST", body: values });
    await loginSession({ username: values.username, password: values.password });
    setLoading(true);
    setMode("personal");
    await refresh();
    notify(
      register ? "Аккаунт создан. Добро пожаловать!" : "Вы вошли в аккаунт",
    );
  }

  async function logout() {
    try {
      await endSession();
    } catch (error) {
      notify(error.message, "error");
      return;
    }
    localStorage.removeItem("qw:user-id");
    setLive((value) => ({
      ...value,
      user: null,
      company: null,
      applications: [],
      candidates: [],
      ownWorks: [],
    }));
    setSavedLive(read("qw:saved:guest", []));
    setMode("personal");
    setError("");
  }

  function toggleSaved(id) {
    const next = saved.includes(id)
      ? saved.filter((item) => item !== id)
      : [...saved, id];
    setSavedLive(next);
    localStorage.setItem(
      `qw:saved:${live.user?.id || "guest"}`,
      JSON.stringify(next),
    );
  }

  async function apply(work) {
    if (!data.user)
      throw new Error("Войдите в аккаунт, чтобы откликнуться на смену.");
    if (work.company_id === data.company?.id)
      throw new Error(
        "Это смена вашей компании. Управляйте ею в кабинете компании.",
      );
    if (data.applications.some((item) => item.id === work.id)) return;
    await api(`/uwe/add_work?work_id=${work.id}`, { method: "POST" });
    setLive((value) => ({
      ...value,
      applications: [...value.applications, { ...work, status: "pending" }],
    }));
    notify("Отклик отправлен! Следите за статусом в «Моих откликах».");
  }

  async function saveProfile(values) {
    await api("/user/update", { method: "PATCH", body: values });
    setLive((value) => ({ ...value, user: { ...value.user, ...values } }));
    notify("Профиль обновлён");
  }

  async function saveCompany(values) {
    const creating = !data.company;
    const result = await api(`/company/${creating ? "create" : "update"}`, {
      method: creating ? "POST" : "PATCH",
      body: values,
    });
    const update = (value) => ({
      ...value,
      company: { id: result.company_id, ...values },
      works: value.works.map((item) =>
        item.company_id === result.company_id
          ? { ...item, company_name: values.name }
          : item,
      ),
      ownWorks: value.ownWorks?.map((item) => ({
        ...item,
        company_name: values.name,
      })),
    });
    setLive(update);
    notify(
      creating
        ? "Компания создана. Теперь можно опубликовать первую смену."
        : "Профиль компании обновлён",
    );
  }

  async function saveWork(values, id) {
    const result = await api(id ? `/work/update/${id}` : "/work/create", {
      method: id ? "PATCH" : "POST",
      body: values,
    });
    const work = {
      ...values,
      category_id: values.category_ids[0],
      features_id: values.feature_ids[0],
      id: result.vacancy_id,
      company_id: data.company.id,
      company_name: data.company.name,
    };
    const updateList = (list = []) =>
      id
        ? list.map((item) => (item.id === id ? { ...item, ...work } : item))
        : [work, ...list];
    setLive((value) => ({
      ...value,
      works: updateList(value.works),
      ownWorks: updateList(value.ownWorks),
      options: {
        ...value.options,
        cities: [
          ...new Set([...value.options.cities, values.city].filter(Boolean)),
        ],
      },
      candidates: value.candidates.map((item) =>
        item.work.id === id
          ? { ...item, work: { ...item.work, ...work } }
          : item,
      ),
    }));
    notify(id ? "Изменения сохранены" : "Смена опубликована");
    return result.vacancy_id;
  }

  async function deleteWork(id) {
    await api(`/work/delete/${id}`, { method: "DELETE" });
    const update = (value) => ({
      ...value,
      works: value.works.filter((item) => item.id !== id),
      ownWorks: value.ownWorks?.filter((item) => item.id !== id),
      candidates: value.candidates.filter((item) => item.work.id !== id),
      applications: value.applications.filter((item) => item.id !== id),
    });
    setLive(update);
    if (saved.includes(id)) toggleSaved(id);
    notify("Смена удалена");
  }

  async function updateCandidate(candidate, status) {
    await api("/uwe/status_update", {
      method: "PATCH",
      body: {
        user_id: candidate.user.id,
        work_id: candidate.work.id,
        status,
      },
    });
    const update = (value) => ({
      ...value,
      candidates: value.candidates.map((item) =>
        item.user.id === candidate.user.id && item.work.id === candidate.work.id
          ? { ...item, status }
          : item,
      ),
    });
    setLive(update);
    notify(
      status === "approved"
        ? "Кандидат приглашён на смену"
        : "Статус отклика обновлён",
    );
  }

  function reload() {
    setLoading(true);
    setError("");
    return refresh().catch(() => {});
  }

  async function refreshOptions() {
    const account = await loadSession();
    setLive(account);
  }

  return (
    <AppContext.Provider
      value={{
        ...data,
        mode: data.company ? mode : "personal",
        setMode,
        saved,
        loading,
        error,
        toast,
        setToast,
        notify,
        refresh: reload,
        refreshOptions,
        authenticate,
        logout,
        toggleSaved,
        apply,
        saveProfile,
        saveCompany,
        saveWork,
        deleteWork,
        updateCandidate,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
