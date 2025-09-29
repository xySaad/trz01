import puppeteer from "puppeteer";
import { config } from "dotenv";
import { pipeline } from "@xenova/transformers";
import { convertMp3BufferToWav, waveBufferToF64 } from "./utils/audio.js";
import { Signal } from "./utils/signal.js";

config();
if (!process.env.TOKEN) {
  throw new Error("Missing TOKEN in .env");
}

const transcriber = await pipeline(
  "automatic-speech-recognition",
  "Xenova/whisper-tiny"
);

const sleep = async (delay) => await new Promise((r) => setTimeout(r, delay));

async function main() {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath: "/usr/bin/chromium-browser",
  });
  const page = await browser.newPage();

  browser.setCookie({
    domain: "transport.zone01oujda.ma",
    name: "__Secure-elgencia.session_token",
    value: process.env.TOKEN,
    path: "/",
    secure: true,
    httpOnly: true,
  });

  await page.goto("https://transport.zone01oujda.ma/");
  // await page.goto("https://2captcha.com/demo/recaptcha-v2");

  const answer = new Signal();
  page.on("response", async (response) => {
    try {
      if (
        response.url().includes("payload") &&
        response.request().resourceType() === "media"
      ) {
        const buffer = await response.buffer();
        console.log("Got media response bytes:", buffer.length);
        let audioData = waveBufferToF64(await convertMp3BufferToWav(buffer));
        const result = await transcriber(audioData);
        console.log("result:", result.text);
        answer.resolve(result.text);
      }
    } catch (err) {
      console.error("Error handling response:", err);
    }
  });

  await page
    .locator("::-p-xpath(//td[text() = '19:00']/following-sibling::*[3])")
    .click();

  const iframe = await page.waitForSelector('iframe[title="reCAPTCHA"]');
  const frame = await iframe.contentFrame();
  await frame.waitForSelector("#rc-anchor-container");
  await sleep(Math.random() * 100 + 100);
  await frame.locator("#rc-anchor-container").click();

  const challenge_iframe = await page.waitForSelector(
    'iframe[title="recaptcha challenge expires in two minutes"]'
  );

  const challenge_frame = await challenge_iframe.contentFrame();
  await challenge_frame.waitForSelector(".audio-button-holder");
  await sleep(Math.random() * 100 + 100);
  await challenge_frame.locator(".audio-button-holder").click();

  frame
    .waitForSelector(".recaptcha-checkbox-checked")
    .then(() => answer.reject());

  while (true) {
    try {
      const text = await answer.promise;
      answer.reset();
      await challenge_frame.type("#audio-response", text, { delay: 60 });
      await challenge_frame.click("#recaptcha-verify-button", { delay: 10 });
    } catch {
      break;
    }
  }

  await page.locator("::-p-xpath(//button[text() = 'Confirm'])").click();
  await new Promise(() => {});
  await browser.close();
}

await main();
