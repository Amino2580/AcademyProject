const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


async function postRequest(path, body) {
  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    const message =
      data?.metaData?.status?.message ||
      data?.detail ||
      "ارتباط با سرور با مشکل مواجه شد.";

    throw new Error(message);
  }

  return data;
}


export function requestOtp(phone) {
  return postRequest(
    "/api/auth/otp/request/",
    {
      phone,
    }
  );
}


export function verifyOtp(phone, code) {
  return postRequest(
    "/api/auth/otp/verify/",
    {
      phone,
      code,
    }
  );
}


export function saveAuth(authData) {
  localStorage.setItem(
    "accessToken",
    authData.access
  );

  localStorage.setItem(
    "refreshToken",
    authData.refresh
  );

  localStorage.setItem(
    "authUser",
    JSON.stringify(authData.user)
  );

  localStorage.removeItem("adminToken");
}


export function getAccessToken() {
  return localStorage.getItem(
    "accessToken"
  );
}


export function getRefreshToken() {
  return localStorage.getItem(
    "refreshToken"
  );
}


export function getAuthUser() {
  const storedUser =
    localStorage.getItem("authUser");

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
}

export function isAdminAuthenticated() {
  const user = getAuthUser();
  const accessToken = getAccessToken();

  return Boolean(
    accessToken &&
    user?.role === "admin"
  );
}

export function clearAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("authUser");
  localStorage.removeItem("adminToken");
}

export async function refreshAccessToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearAuth();
    return null;
  }

  try {
    const data = await postRequest(
      "/api/auth/token/refresh/",
      {
        refresh: refreshToken,
      }
    );

    localStorage.setItem(
      "accessToken",
      data.access
    );

    if (data.refresh) {
      localStorage.setItem(
        "refreshToken",
        data.refresh
      );
    }

    return data.access;
  } catch {
    clearAuth();
    return null;
  }
}


export async function logout() {
  try {
    const accessToken =
      await refreshAccessToken();

    const refreshToken =
      getRefreshToken();

    if (!accessToken || !refreshToken) {
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/auth/logout/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          refresh: refreshToken,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        "خروج از سرور انجام نشد."
      );
    }
  } catch (error) {
    console.error(
      "Logout request failed:",
      error
    );
  } finally {
    clearAuth();
  }
}