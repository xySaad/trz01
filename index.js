import schedule from "node-schedule";
import config from "./config.json" assert { type: "json" };
import { setCookie } from "./modules/cookie.js";
import { requestCookie } from "./utils/auth.js";
import { getBuses } from "./utils/buslist.js";
import { book } from "./utils/booking.js";
import { readPassword } from "./utils/readPassword.js";

const run = async (credentials, wantedBus) => {
  const { username, password } = credentials;
  const { busTime, depart, destination } = wantedBus;

  const cookie = await requestCookie(username, password);

  setCookie(cookie);

  const busId = await getBuses(
    busTime.split(":")[0],
    busTime.split(":")[1],
    depart,
    destination
  );

  const message = await book(busId);
  console.log(message);
};

const main = async () => {
  const password = await readPassword();
  const credentials = { username: config.username, password };

  config.schedule.forEach((task) => {
    const hour = task.runOn.split(":")[0];
    const minute = task.runOn.split(":")[1];

    const job = schedule.scheduleJob(`${minute} ${hour} * * *`, function () {
      console.log("running task:", task);
      run(credentials, task);
    });

    const nextRunTime = new Date(job.nextInvocation());
    console.log("waiting for", nextRunTime);
  });
};

main();
