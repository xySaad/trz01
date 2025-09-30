import cron from "node-cron";
import { config as loadenv } from "dotenv";
import puppeteer from "puppeteer";
import { CaptchaSolver } from "./reCaptchaSovler/solver.js";
import { intoUTC } from "./utils/time.js";
import { testChromiumBinary } from "./utils/test.js";
import { Signal } from "./utils/signal.js";

loadenv();
if (!process.env.TOKEN) throw new Error("Missing TOKEN in .env");
const { default: config } = await import("./config.json", {
  with: { type: "json" },
});

async function bookSeat(page, time) {
  await page.goto("https://transport.zone01oujda.ma/");
  const solver = new CaptchaSolver(page);

  await solver.execFlow([
    `::-p-xpath(//td[text() = '${time}']/following-sibling::*[3])`,
    "[CAPTCHA]",
    "::-p-xpath(//button[text() = 'Confirm'])",
  ]);
}

const POLL_INTERVAL = 2000;
const API_URL = "https://transport.zone01oujda.ma/api/buses";

async function pollBuses({ hour, minute }) {
  await new Promise((resolve) => {
    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(API_URL, {
          cache: "no-store",
          credentials: "include",
          headers: {
            Cookie: `__Secure-elgencia.session_token=${process.env.TOKEN}`,
          },
        });

        if (!res.ok) throw new Error(`sattus code: ${res.status}`);
        const data = await res.json();

        const targetBus = data.buses.find((bus) => {
          const date = new Date(bus.date);
          return date.getUTCHours() === hour && date.getUTCMinutes() === minute;
        });

        if (targetBus) {
          clearInterval(intervalId);
          resolve();
        }
      } catch (err) {
        console.error("Error polling buses:", err);
      }
    }, POLL_INTERVAL);
  });
}

async function runTask(traject) {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: config.chormiumBinary,
  });

  browser.setCookie({
    domain: "transport.zone01oujda.ma",
    name: "__Secure-elgencia.session_token",
    value: process.env.TOKEN,
    path: "/",
    secure: true,
    httpOnly: true,
  });

  const page = await browser.newPage();

  console.log(`Starting polling for ${traject} bus...`);
  const [hour, minute] = traject.split(":");
  await pollBuses(intoUTC(hour, minute));
  await bookSeat(page, [hour, minute].join(":"));
  const end = new Signal();
  page.on("response", (e) => e.url().includes("booking") && end.resolve());
  await end.promise;
  await browser.close();
}

async function main() {
  await testChromiumBinary(config.chormiumBinary);
  if (config.test_slot) await runTask(config.test_slot);
  config.slots.forEach(({ run_at, traject }) => {
    const [hour, minute, seconds] = run_at.split(":");
    cron.schedule(`${seconds} ${minute} ${hour} * * *`, () => runTask(traject));
  });
}

await main();
