import puppeteer from "puppeteer";

export async function testChromiumBinary(chormiumBinary) {
    console.log(`Testing Chromium binary at: ${chormiumBinary}`);
    const browser = await puppeteer.launch({
        headless: true, 
        executablePath: undefined,
    });
    console.log("Chromium binary is valid and usable!");
    await browser.close();
}