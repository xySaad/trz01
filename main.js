import puppeteer from "puppeteer";
import { config } from "dotenv";
import fs from "fs/promises";
import wavefile from "wavefile";
import { pipeline } from "@xenova/transformers";
import ffmpeg from "fluent-ffmpeg";
import ffmpegStatic from "ffmpeg-static";
import { Readable } from "stream";
import { Buffer } from "buffer";

// Set FFmpeg path
ffmpeg.setFfmpegPath(ffmpegStatic);

async function convertMp3BufferToWav(mp3Buffer) {
  return new Promise((resolve, reject) => {
    // Create a readable stream from the MP3 buffer
    const mp3Stream = new Readable();
    mp3Stream.push(mp3Buffer);
    mp3Stream.push(null); // Signal end of stream

    // Buffer to store WAV data
    const chunks = [];

    // Convert MP3 stream to WAV
    ffmpeg(mp3Stream)
      .inputFormat("mp3")
      .audioChannels(1) // Mono
      .audioFrequency(16000) // 16kHz for Whisper compatibility
      .audioCodec("pcm_s16le") // PCM signed 16-bit little-endian
      .toFormat("wav")
      .on("error", (err) => {
        console.error("FFmpeg error:", err);
        reject(err);
      })
      .on("end", () => {
        console.log("Conversion complete");
        resolve(Buffer.concat(chunks));
      })
      .pipe() // Stream output
      .on("data", (chunk) => chunks.push(chunk))
      .on("error", (err) => reject(err));
  });
}

const transcriber = await pipeline(
  "automatic-speech-recognition",
  "Xenova/whisper-tiny"
);

config();

async function main() {
  const browser = await puppeteer.launch({ headless: false });
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

  page.on("response", async (response) => {
    try {
      if (
        response.url().includes("payload") &&
        response.request().resourceType() === "media"
      ) {
        const buffer = await response.buffer();
        console.log("Got media response bytes:", buffer.length);

        await fs.writeFile("payload.mp3", buffer);
        console.log("Saved payload.mp3");
        let wav = new wavefile.WaveFile(await convertMp3BufferToWav(buffer));
        wav.toBitDepth("32f");
        wav.toSampleRate(16000);
        let audioData = wav.getSamples();
        if (Array.isArray(audioData)) {
          if (audioData.length > 1) {
            const SCALING_FACTOR = Math.sqrt(2);
            for (let i = 0; i < audioData[0].length; ++i) {
              audioData[0][i] =
                (SCALING_FACTOR * (audioData[0][i] + audioData[1][i])) / 2;
            }
          }

          audioData = audioData[0];
        }

        const result = await transcriber(audioData);
        console.log("result:", result.text);
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
  await frame.locator("#rc-anchor-container").click();

  const challenge_iframe = await page.waitForSelector(
    'iframe[title="recaptcha challenge expires in two minutes"]'
  );
  const challenge_frame = await challenge_iframe.contentFrame();
  await challenge_frame.locator(".audio-button-holder").click();

  await new Promise(() => {});
  await browser.close();
}

await main();
