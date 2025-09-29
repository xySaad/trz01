import { convertMp3BufferToWav, waveBufferToF64 } from "./audio.js";
import { pipeline } from "@xenova/transformers";
import { Signal } from "../utils/signal.js";

const transcriber = await pipeline(
  "automatic-speech-recognition",
  "Xenova/whisper-tiny"
);

export class CaptchaSolver {
  #answer = null;
  #page = null;
  constructor(page) {
    this.#page = page;
    this.#answer = new Signal();
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
          this.#answer.resolve(result.text);
        }
      } catch (err) {
        console.error("Error handling response:", err);
      }
    });
  }

  async execFlow(flow) {
    for (const selector of flow) {
      if (selector == "[CAPTCHA]") {
        await this.solveCaptcha();
        continue;
      }
      await this.#page.locator(selector).click();
    }
  }

  async solveCaptcha() {
    const iframe = await this.#page.waitForSelector(
      'iframe[title="reCAPTCHA"]'
    );
    const frame = await iframe.contentFrame();
    await frame.waitForSelector("#rc-anchor-container");
    await frame.locator("#rc-anchor-container").click();

    const challenge_iframe = await this.#page.waitForSelector(
      'iframe[title="recaptcha challenge expires in two minutes"]'
    );

    const challenge_frame = await challenge_iframe.contentFrame();
    await challenge_frame.waitForSelector(".audio-button-holder");
    await challenge_frame.locator(".audio-button-holder").click();

    frame
      .waitForSelector(".recaptcha-checkbox-checked")
      .then(() => this.#answer.reject());

    while (true) {
      try {
        const text = await this.#answer.promise;
        this.#answer.reset();
        await challenge_frame.type("#audio-response", text, { delay: 20 });
        await challenge_frame.click("#recaptcha-verify-button", { delay: 10 });
      } catch {
        break;
      }
    }
  }
}
