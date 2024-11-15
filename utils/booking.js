import { getCookie } from "../modules/cookie.js";

const referrer = "https://transport.zone01oujda.ma/dashboard";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  "Alt-Used": "transport.zone01oujda.ma",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Priority: "u=0",
};

export const book = async (busId) => {
  headers.Cookie = getCookie();

  const bookUrl = `https://transport.zone01oujda.ma/api/buses/${busId}/booking`;

  try {
    const resp = await fetch(bookUrl, {
      credentials: "include",
      headers,
      referrer,
      method: "POST",
      mode: "cors",
    });

    const body = await resp.text();

    if (!resp.ok) {
      const error = new Error();
      error.name = "can't book";
      error.message = { status: resp.status, body };

      throw error;
    }

    return body;
  } catch (error) {
    return error.message;
  }
};
