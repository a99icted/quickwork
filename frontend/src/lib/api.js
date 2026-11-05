const base = (import.meta.env.VITE_API_URL || "/api").replace(/\/$/, "");
let accessToken = null;
let refreshPending = null;
let sessionVersion = 0;
// Remove tokens stored by earlier versions of the demo.
localStorage.removeItem("token");

export function setAccessToken(token) {
  sessionVersion += 1;
  accessToken = token;
}

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Web Locks serialize cookie rotation across tabs on the same origin.
function sessionLock(action) {
  return navigator.locks
    ? navigator.locks.request("qw:session", action)
    : action();
}

async function request(path, { method = "GET", body, signal } = {}, token) {
  try {
    return await fetch(`${base}${path}`, {
      method,
      signal,
      credentials: "include",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body ? { "Content-Type": "application/json" } : {}),
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  } catch (error) {
    if (error.name === "AbortError") throw error;
    throw new ApiError(
      "Не удалось подключиться к серверу. Проверьте соединение и попробуйте ещё раз.",
      0,
    );
  }
}

export async function refreshAccessToken() {
  if (!refreshPending) {
    const version = sessionVersion;
    refreshPending = sessionLock(async () => {
      const response = await request("/auth/refresh", { method: "POST" });
      if (response.status === 401) {
        if (version === sessionVersion) accessToken = null;
        return null;
      }
      if (!response.ok) throw new ApiError("Не удалось продлить сессию. Попробуйте ещё раз.", response.status);
      const data = await response.json();
      if (version === sessionVersion) accessToken = data.access_token;
      return accessToken;
    }).finally(() => { refreshPending = null; });
  }
  return refreshPending;
}

export async function endSession() {
  // Finish any in-flight rotation before revoking its replacement cookie.
  if (refreshPending) await refreshPending;
  await sessionLock(async () => {
    await api("/auth/logout", { method: "POST" });
    setAccessToken(null);
  });
}

export async function loginSession(credentials) {
  if (refreshPending) await refreshPending;
  return sessionLock(async () => {
    const result = await api("/auth/login", { method: "POST", body: credentials });
    setAccessToken(result.access_token);
    return result;
  });
}

export async function api(path, options = {}) {
  const token = accessToken;
  let response = await request(path, options, token);
  if (response.status === 401 && token && !path.startsWith("/auth/")) {
    // A parallel request may already have refreshed our token.
    const replacement = accessToken !== token ? accessToken : await refreshAccessToken();
    if (replacement) response = await request(path, options, replacement);
    if (response.status === 401) {
      setAccessToken(null);
      window.dispatchEvent(new Event("qw:unauthorized"));
    }
  }
  const data = response.status === 204 ? null : await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message = Array.isArray(detail)
      ? detail.map((item) => `${item.loc?.at(-1)}: ${item.msg}`).join(". ")
      : detail;
    throw new ApiError(
      message || (response.status >= 500
        ? "Сервер временно недоступен. Попробуйте позже."
        : "Не удалось выполнить действие."),
      response.status,
    );
  }
  return data;
}

export async function allPages(path, signal) {
  const items = [];
  for (let page = 1; ; page++) {
    const batch = await api(
      `${path}${path.includes("?") ? "&" : "?"}per_page=100&page=${page}`,
      { signal },
    );
    items.push(...batch);
    if (batch.length < 100) return items;
  }
}

export async function loadSession(signal) {
  const [works, options] = await Promise.all([
    allPages("/work/", signal),
    api("/work/options", { signal }),
  ]);
  if (!accessToken) await refreshAccessToken();
  if (!accessToken)
    return { works, options, user: null, company: null, applications: [], candidates: [], ownWorks: [] };
  const [user, company, applications] = await Promise.all([
    api("/user/me", { signal }),
    api("/company/me", { signal }),
    api("/uwe/getworks", { signal }),
  ]);
  const [candidates, ownWorks] = company
    ? await Promise.all([
        api("/uwe/get_response", { signal }),
        allPages("/work/mine", signal),
      ])
    : [[], []];
  return { works, options, user, company, applications, candidates, ownWorks };
}
