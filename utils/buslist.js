import { getCookie } from "../modules/cookie.js";

const busListUrl = "https://transport.zone01oujda.ma/api/buses";
const referrer = "https://transport.zone01oujda.ma/dashboard";
const headers = {
  "User-Agent":
    "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:132.0) Gecko/20100101 Firefox/132.0",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.5",
  Authorization: "Bearer undefined",
  "Sec-GPC": "1",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "same-origin",
  Priority: "u=4",
};

export const getBuses = async (hour, minute, from, to) => {
  try {
    headers.Cookie = getCookie();

    const busesResp = await fetch(busListUrl, {
      credentials: "include",
      headers,
      referrer: referrer,
      method: "GET",
      mode: "cors",
    });

    const body = await busesResp.json();
    const busesList = body.busData;

    if (!busesResp.ok) {
      const message = {
        title: "can't get bus list",
        status: busesResp.status,
        body,
      };

      const error = new Error();
      error.name = "can't get bus list";
      error.message = JSON.stringify(message);

      throw error;
    }
    for (let index = 0; index < busesList.length; index++) {
      const bus = busesList[index];
      const busTime = new Date(bus.busTime);

      if (
        busTime.getHours() == hour &&
        busTime.getMinutes() == minute &&
        bus.busFrom == from &&
        bus.busTo == to
      ) {
        console.log("found bus id:", bus.id);
        return bus.id;
      }
    }
  } catch (error) {
    console.error(error.message);
  }
};
