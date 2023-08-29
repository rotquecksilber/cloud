"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const playwright_1 = require("playwright");
const { MongoClient } = require('mongodb');
const promises_1 = __importDefault(require("fs/promises"));
const saslprep = require('saslprep');
//@ts-ignore
const xml2js_1 = require("xml2js");
const proxyServer = process.env.PROXY_SERVER || '';
const proxyUsername = process.env.PROXY_USERNAME || '';
const proxyPassword = process.env.PROXY_PASSWORD || '';
const dbPassword = process.env.DB_PASSWORD || '';
class BrowserScrapper {
    constructor(url) {
        this.browser = null;
        this.page = null;
        this.url = url;
    }
    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    sleepRandomInterval(min, max) {
        return __awaiter(this, void 0, void 0, function* () {
            const randomTime = BrowserScrapper.getRandomInt(min, max);
            yield BrowserScrapper.sleep(randomTime);
        });
    }
    moveMouseRandomly(width, height) {
        return __awaiter(this, void 0, void 0, function* () {
            // if (!this.page) throw new Error("Page is not initialized");
            // const startX = Math.floor(Math.random() * width);
            // const startY = Math.floor(Math.random() * height);
            // const endX = Math.floor(Math.random() * width);
            // const endY = Math.floor(Math.random() * height);
            // const controlX = Math.floor(Math.random() * width);
            // const controlY = Math.floor(Math.random() * height);
            // const steps = 100;
            // for (let i = 0; i <= steps; i++) {
            //     const t = i / steps;
            //     const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * controlX + t * t * endX;
            //     const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * controlY + t * t * endY;
            //     await this.page.mouse.move(x, y);
            //     if (Math.random() < 0.05) {
            //         await BrowserScrapper.sleep(Math.random() * 2000 + 500);
            //     }
            // }
        });
    }
    setup() {
        return __awaiter(this, void 0, void 0, function* () {
            const mobileDevices = [
                playwright_1.devices['iPhone 7'],
                playwright_1.devices['iPhone 7 Plus'],
                playwright_1.devices['iPhone 8'],
                playwright_1.devices['iPhone 8 Plus'],
                playwright_1.devices['iPhone SE'],
                playwright_1.devices['iPhone X'],
                playwright_1.devices['iPhone XR'],
                playwright_1.devices['iPhone 11'],
                playwright_1.devices['iPhone 11 Pro'],
                playwright_1.devices['iPhone 11 Pro Max'],
                playwright_1.devices['iPhone 12'],
                playwright_1.devices['iPhone 12 Pro'],
                playwright_1.devices['iPhone 12 Pro Max'],
                playwright_1.devices['iPhone 12 Mini'],
                playwright_1.devices['Pixel 2'],
                playwright_1.devices['Pixel 2 XL'],
                playwright_1.devices['Pixel 3'],
                playwright_1.devices['Pixel 4'],
                playwright_1.devices['Pixel 5'],
                playwright_1.devices['Galaxy S8'],
                playwright_1.devices['Nexus 5X'],
                playwright_1.devices['Nexus 6P'],
            ];
            const randomDevice = mobileDevices[BrowserScrapper.getRandomInt(0, mobileDevices.length - 1)];
            this.browser = yield playwright_1.firefox.launch({
                headless: true,
                proxy: {
                    server: proxyServer,
                    username: proxyUsername,
                    password: proxyPassword
                }
            });
            const context = yield this.browser.newContext({
                userAgent: randomDevice.userAgent,
                viewport: randomDevice.viewport
            });
            this.page = yield context.newPage();
        });
    }
    scrape() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.page)
                throw new Error("Page is not initialized");
            const maxRetries = 3;
            const retryDelay = 60000; // Задержка перед повторной попыткой в миллисекундах
            for (let retry = 1; retry <= maxRetries; retry++) {
                try {
                    yield this.page.goto(this.url, {
                        waitUntil: 'domcontentloaded',
                    });
                    // Если запрос выполнен успешно, выход из цикла
                    break;
                }
                catch (error) {
                    const typedError = error; // Приводим error к типу Error
                    if (typedError.message.includes('NS_ERROR_PROXY_CONNECTION_REFUSED')) {
                        if (retry < maxRetries) {
                            console.error(`Encountered NS_ERROR_PROXY_CONNECTION_REFUSED error (attempt ${retry}). Retrying after 1 minute...${error}`);
                            yield BrowserScrapper.sleep(retryDelay); // Ожидание 1 минуты
                        }
                        else {
                            console.error(`Failed to scrape after ${maxRetries} attempts due to NS_ERROR_PROXY_CONNECTION_REFUSED error.${error}`);
                            return;
                        }
                    }
                    else if (typedError.message.includes('Timeout')) {
                        console.error(`Timeout exceeded (attempt ${retry}). Retrying after 1 minute...`);
                        yield BrowserScrapper.sleep(retryDelay * 2);
                    }
                    else {
                        console.error(`An error occurred during page.goto: ${typedError}`);
                        return;
                    }
                }
            }
            yield this.sleepRandomInterval(500, 5000);
            // 
            // await this.page.waitForSelector('.dUpOu');
            // await this.page.waitForSelector('.ap\\+\\+P');
            const viewport = this.page.viewportSize();
            if (viewport) {
                const { width, height } = viewport;
                yield this.moveMouseRandomly(width, height);
            }
            yield this.page.screenshot({ path: 'screenshot.jpg' });
            yield this.page.waitForSelector('._2Dcyn.AH6V0');
            let data = yield this.page.evaluate(() => {
                var _a;
                let metaPriceElement = document.querySelector('meta[itemprop="price"]');
                let element = document.querySelector("._2Dcyn.AH6V0");
                let priceMatches;
                if (metaPriceElement) {
                    const rawPrice = metaPriceElement.getAttribute('content');
                    if (rawPrice === null) {
                        return {
                            price: "Text content is null"
                        };
                    }
                    const cleanedPrice = rawPrice.replace(/\D/g, '');
                    priceMatches = cleanedPrice.trim();
                }
                else if (element) {
                    const rawPrice = element.textContent;
                    if (rawPrice === null) {
                        return {
                            price: "Element content is null"
                        };
                    }
                    const cleanedPrice = rawPrice.replace('₽', '').trim();
                    priceMatches = cleanedPrice.match(/\d+/g);
                    if (Array.isArray(priceMatches)) {
                        priceMatches = priceMatches.join('');
                    }
                }
                else {
                    return {
                        price: "No price element found"
                    };
                }
                if (!priceMatches) {
                    return {
                        price: "No price found"
                    };
                }
                const skuElement = document.querySelector('.dUpOu');
                if (skuElement) {
                    const skuText = (_a = skuElement.textContent) === null || _a === void 0 ? void 0 : _a.trim();
                    const skuPrefix = 'артикул: ';
                    let sku;
                    if (skuText !== undefined && skuText.startsWith(skuPrefix)) {
                        sku = skuText.slice(skuPrefix.length);
                    }
                    else {
                        sku = 'Элемент не найден';
                    }
                    const productNameElement = document.querySelector('.ap\\+\\+P');
                    if (productNameElement) {
                        const productNameText = productNameElement.textContent;
                        const productName = productNameText ? productNameText.trim() : 'Имя продукта не найдено';
                        return {
                            price: priceMatches,
                            sku: sku,
                            productName: productName,
                            url: window.location.href,
                        };
                    }
                    else {
                        // Если productNameElement не найден, вернем информацию об этом
                        return {
                            price: priceMatches,
                            sku: sku,
                            productName: "Имя продукта не найдено",
                            url: window.location.href,
                        };
                    }
                }
            });
            console.log(data);
            yield this.pushToMongoDB(data);
        });
    }
    pushToMongoDB(data) {
        return __awaiter(this, void 0, void 0, function* () {
            if (data === undefined) {
                console.log('Data is undefined, skipping MongoDB update');
                return;
            }
            const password = dbPassword;
            const sanitizedPassword = saslprep(password);
            const uri = `mongodb+srv://User1:${sanitizedPassword}@ga.snrkofs.mongodb.net/`;
            const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
            try {
                yield client.connect();
                const database = client.db("Golden_Apple");
                const collection = database.collection("SKU");
                const currentDate = new Date().toISOString().slice(0, 10);
                if (data.sku !== undefined) {
                    const existingDoc = yield collection.findOne({ _id: data.sku });
                    let newPriceEntry = {
                        date: currentDate,
                        value: data.price
                    };
                    if (existingDoc) {
                        yield collection.updateOne({ _id: data.sku }, {
                            $set: {
                                url: data.url,
                                productName: data.productName,
                            },
                            $push: {
                                price: newPriceEntry
                            }
                        });
                        console.log(`Document with SKU as _id: ${data.sku} updated`);
                    }
                    else {
                        yield collection.insertOne({
                            _id: data.sku,
                            url: data.url,
                            productName: data.productName,
                            price: [newPriceEntry]
                        });
                        console.log(`Document with SKU as _id: ${data.sku} created`);
                    }
                }
                else {
                    console.log('SKU is undefined, skipping MongoDB update');
                }
            }
            finally {
                yield client.close();
            }
        });
    }
    close() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.browser)
                yield this.browser.close();
        });
    }
}
function readSitemap() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const sitemapContent = yield promises_1.default.readFile('sitemap.xml', 'utf-8'); // Замените на путь к вашему sitemap.xml
            const parsedSitemap = yield parseSitemap(sitemapContent);
            const urls = parsedSitemap.urlset.url.map((urlObj) => urlObj.loc[0]);
            return urls;
        }
        catch (error) {
            console.error('Error reading sitemap:', error);
            return [];
        }
    });
}
function parseSitemap(xmlContent) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const result = yield (0, xml2js_1.parseStringPromise)(xmlContent);
            return result;
        }
        catch (error) {
            throw error;
        }
    });
}
function scrapeAllUrls() {
    return __awaiter(this, void 0, void 0, function* () {
        const urls = yield readSitemap();
        for (const url of urls) {
            const scrapper = new BrowserScrapper(url);
            yield scrapper.setup();
            yield scrapper.scrape();
            yield scrapper.close();
        }
    });
}
scrapeAllUrls();
// Usage
// const scrapper = new BrowserScrapper('https://goldapple.ru/19000042159-keeping-it-real-foundation');
// (async () => {
//     await scrapper.setup();
//     await scrapper.scrape();
//     await scrapper.close();
// })();
