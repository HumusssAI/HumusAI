export const USERS_STORAGE_KEY = "humusai-users";
export const CURRENT_USER_STORAGE_KEY = "humusai-auth-user";

/*
  Reemplazá este email por el email real con el que vos te vas a registrar.
  Esa cuenta será administradora.
*/
export const ADMIN_EMAILS = [
  "sitojuanbioinfo@gmail.com",
];

export function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function normalizeUsername(username) {
  return String(username || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

export function getUserRoleByEmail(email) {
  const normalizedEmail = normalizeEmail(email);
  const isAdmin = ADMIN_EMAILS.map(normalizeEmail).includes(normalizedEmail);

  return isAdmin ? "admin" : "user";
}

export function getStoredUsers() {
  return safeParseJSON(localStorage.getItem(USERS_STORAGE_KEY), []);
}

export function saveStoredUsers(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

export function getInitials(user) {
  const fullName = user?.name?.trim();

  if (fullName) {
    const parts = fullName.split(" ").filter(Boolean);

    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }

    return parts[0].slice(0, 2).toUpperCase();
  }

  if (user?.email) {
    return user.email.slice(0, 2).toUpperCase();
  }

  return "US";
}

export function getPublicUsername(user) {
  if (!user) return "@usuario";

  if (user.username) {
    return `@${user.username}`;
  }

  return `@${getInitials(user)}`;
}

export function getPublicUser(user) {
  if (!user) return null;

  const role = user.role || getUserRoleByEmail(user.email);

  return {
    id: user.id,
    name: user.name,
    username: user.username || "",
    email: user.email,
    createdAt: user.createdAt,
    role,
  };
}

export function findStoredUserBySessionUser(sessionUser) {
  if (!sessionUser) return null;

  const users = getStoredUsers();

  return (
    users.find((user) => user.id && user.id === sessionUser.id) ||
    users.find(
      (user) =>
        normalizeEmail(user.email) === normalizeEmail(sessionUser.email)
    ) ||
    null
  );
}

export function getCurrentUser() {
  const savedSessionUser = safeParseJSON(
    localStorage.getItem(CURRENT_USER_STORAGE_KEY),
    null
  );

  if (!savedSessionUser) return null;

  const storedUser = findStoredUserBySessionUser(savedSessionUser);

  const mergedUser = {
    ...savedSessionUser,
    ...storedUser,
  };

  return getPublicUser(mergedUser);
}

export function saveCurrentUser(user) {
  const storedUser = findStoredUserBySessionUser(user);

  const mergedUser = {
    ...user,
    ...storedUser,
  };

  const publicUser = getPublicUser(mergedUser);

  localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(publicUser));
  window.dispatchEvent(new Event("humusai-auth-change"));

  return publicUser;
}

export function logoutCurrentUser() {
  localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.dispatchEvent(new Event("humusai-auth-change"));
}

export function isAdminUser(user) {
  return user?.role === "admin";
}