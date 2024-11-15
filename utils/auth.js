const authUrl = "https://transport.zone01oujda.ma/api/auth/login";
const referrer = "https://transport.zone01oujda.ma/dashboard";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Content-Type": "application/json",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Priority: "u=0",
};

export const requestCookie = async (username, password) => {
  const body = JSON.stringify({
    username,
    password,
    rememberMe: true,
  });

  try {
    const resp = await fetch(authUrl, {
      credentials: "omit",
      headers,
      referrer,
      body,
      method: "POST",
      mode: "cors",
    });
    if (!resp.ok) {
      const error = new Error();
      error.name = "can't request cookie";
      error.message = { status: resp.status, body };
      throw error;
    }
    const cookie = resp.headers.getSetCookie();
    return cookie;
  } catch (error) {
    console.error(error.message);
  }
};
