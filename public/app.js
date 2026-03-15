const authStoreKey = "basis_auth";

const loginForm = document.querySelector("#login-form");
const guestView = document.querySelector("#guest-view");
const userView = document.querySelector("#user-view");
const statusNode = document.querySelector("#status");
const userNameNode = document.querySelector("#user-name");
const logoutButton = document.querySelector("#logout-button");

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

function setStatus(message) {
  statusNode.textContent = message;
}

function showGuest() {
  guestView.classList.remove("hidden");
  userView.classList.add("hidden");
  userNameNode.textContent = "";
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

function applySavedSession() {
  const authData = readAuth();

  if (!authData?.token || !authData?.record) {
    showGuest();
    return;
  }

  showUser(authData);
  setStatus("Сессия восстановлена локально.");
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

applySavedSession();
