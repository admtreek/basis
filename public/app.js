const authStoreKey = "basis_auth";

const loginForm = document.querySelector("#login-form");
const guestView = document.querySelector("#guest-view");
const userView = document.querySelector("#user-view");
const statusNode = document.querySelector("#status");
const userNameNode = document.querySelector("#user-name");
const logoutButton = document.querySelector("#logout-button");
const requestForm = document.querySelector("#request-form");
const refreshButton = document.querySelector("#refresh-button");
const requestsListNode = document.querySelector("#requests-list");

let refreshTimerId = null;

function readAuth() {
  const raw = localStorage.getItem(authStoreKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(authStoreKey);
    return null;
  }
}

function writeAuth(authData) {
  localStorage.setItem(authStoreKey, JSON.stringify(authData));
}

function clearAuth() {
  localStorage.removeItem(authStoreKey);
}

function getAuthHeader() {
  const authData = readAuth();

  if (!authData?.token) {
    return {};
  }

  return {
    Authorization: "Bearer " + authData.token,
  };
}

function setStatus(message) {
  statusNode.textContent = message;
}

function stopPolling() {
  if (!refreshTimerId) {
    return;
  }

  window.clearInterval(refreshTimerId);
  refreshTimerId = null;
}

function startPolling() {
  stopPolling();
  refreshTimerId = window.setInterval(() => {
    refreshRequests({ silent: true });
  }, 5000);
}

function showGuest() {
  guestView.classList.remove("hidden");
  userView.classList.add("hidden");
  userNameNode.textContent = "";
  requestsListNode.innerHTML = "";
  stopPolling();
}

function showUser(authData) {
  guestView.classList.add("hidden");
  userView.classList.remove("hidden");
  userNameNode.textContent =
    authData.record.name || authData.record.username || authData.record.email;
}

async function login(identity, password) {
  const response = await fetch("/api/collections/users/auth-with-password", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      identity,
      password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData?.message || "Не удалось выполнить вход.";
    throw new Error(message);
  }

  return response.json();
}

async function fetchRequests() {
  const response = await fetch(
    "/api/collections/requests/records?sort=-created&expand=author&perPage=100",
    {
      headers: getAuthHeader(),
    },
  );

  if (response.status === 401 || response.status === 403) {
    clearAuth();
    showGuest();
    throw new Error("Сессия истекла. Войдите заново.");
  }

  if (!response.ok) {
    throw new Error("Не удалось загрузить обращения.");
  }

  const data = await response.json();
  return data.items || [];
}

async function createRequest(message) {
  const authData = readAuth();
  const response = await fetch("/api/collections/requests/records", {
    method: "POST",
    headers: Object.assign(
      {
        "Content-Type": "application/json",
      },
      getAuthHeader(),
    ),
    body: JSON.stringify({
      author: authData.record.id,
      message,
    }),
  });

  if (response.status === 401 || response.status === 403) {
    clearAuth();
    showGuest();
    throw new Error("Сессия истекла. Войдите заново.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const messageText = errorData?.message || "Не удалось отправить обращение.";
    throw new Error(messageText);
  }

  return response.json();
}

function formatDate(dateValue) {
  return new Date(dateValue).toLocaleString("ru-RU");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRequests(items) {
  if (!items.length) {
    requestsListNode.innerHTML =
      '<div class="request-card"><p class="request-message">Обращений пока нет.</p></div>';
    return;
  }

  requestsListNode.innerHTML = items
    .map((item) => {
      const author =
        item.expand?.author?.name ||
        item.expand?.author?.username ||
        item.expand?.author?.email ||
        "Неизвестный пользователь";

      return [
        '<article class="request-card">',
        '<p class="request-meta">',
        "<span>Автор: " + escapeHtml(author) + "</span>",
        "<span>Категория: " + escapeHtml(item.category) + "</span>",
        "<span>Создано: " + escapeHtml(formatDate(item.created)) + "</span>",
        "</p>",
        '<p class="request-message">' + escapeHtml(item.message) + "</p>",
        "</article>",
      ].join("");
    })
    .join("");
}

async function refreshRequests(options) {
  const silent = Boolean(options?.silent);

  if (!silent) {
    setStatus("Загружаем обращения...");
  }

  try {
    const items = await fetchRequests();
    renderRequests(items);
    if (!silent) {
      setStatus("Обращения загружены.");
    }
  } catch (error) {
    setStatus(error.message);
  }
}

function applySavedSession() {
  const authData = readAuth();

  if (!authData?.token || !authData?.record) {
    showGuest();
    return;
  }

  showUser(authData);
  setStatus("Сессия восстановлена локально.");
  refreshRequests({});
  startPolling();
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(loginForm);
  const identity = String(formData.get("identity") || "").trim();
  const password = String(formData.get("password") || "");

  setStatus("Проверяем логин и пароль...");

  try {
    const authData = await login(identity, password);
    writeAuth(authData);
    showUser(authData);
    loginForm.reset();
    setStatus("Вход выполнен успешно.");
    await refreshRequests({});
    startPolling();
  } catch (error) {
    showGuest();
    setStatus(error.message);
  }
});

logoutButton.addEventListener("click", () => {
  clearAuth();
  showGuest();
  setStatus("Вы вышли из системы.");
});

requestForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(requestForm);
  const message = String(formData.get("message") || "").trim();

  if (!message) {
    setStatus("Введите текст обращения.");
    return;
  }

  setStatus("Сохраняем обращение...");

  try {
    await createRequest(message);
    requestForm.reset();
    await refreshRequests({});
    setStatus("Обращение сохранено.");
  } catch (error) {
    setStatus(error.message);
  }
});

refreshButton.addEventListener("click", async () => {
  await refreshRequests({});
});

applySavedSession();
