import {
  clearAuth,
  getAccessToken,
  refreshAccessToken,
} from "./auth";


const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://127.0.0.1:8000";


function getErrorMessage(data) {
  const apiMessage =
    data?.metaData?.status?.message ||
    data?.detail;

  if (apiMessage) {
    return apiMessage;
  }

  if (data && typeof data === "object") {
    const firstError = Object.values(data)[0];

    if (Array.isArray(firstError)) {
      return firstError[0];
    }
  }

  return "ارتباط با سرور با مشکل مواجه شد.";
}


async function sendRequest(
  path,
  options,
  accessToken
) {
  const {
    body,
    headers: customHeaders = {},
    ...requestOptions
  } = options;

  const response = await fetch(
    `${API_BASE_URL}${path}`,
    {
      ...requestOptions,
      headers: {
        "Content-Type": "application/json",
        ...customHeaders,
        Authorization: `Bearer ${accessToken}`,
      },
      body:
        body === undefined
          ? undefined
          : JSON.stringify(body),
    }
  );

  const data =
    response.status === 204
      ? null
      : await response
          .json()
          .catch(() => null);

  return {
    response,
    data,
  };
}


export async function apiRequest(
  path,
  options = {}
) {
  let accessToken = getAccessToken();

  if (!accessToken) {
    clearAuth();

    const error = new Error(
      "برای ادامه دوباره وارد حساب شوید."
    );

    error.status = 401;

    throw error;
  }

  let result = await sendRequest(
    path,
    options,
    accessToken
  );

  if (result.response.status === 401) {
    accessToken =
      await refreshAccessToken();

    if (!accessToken) {
      const error = new Error(
        "زمان ورود شما تمام شده است."
      );

      error.status = 401;

      throw error;
    }

    result = await sendRequest(
      path,
      options,
      accessToken
    );
  }

  if (!result.response.ok) {
    const error = new Error(
      getErrorMessage(result.data)
    );

    error.status = result.response.status;
    error.data = result.data;

    throw error;
  }

  return result.data;
}