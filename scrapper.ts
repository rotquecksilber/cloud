import { firefox, Browser, Page, devices } from 'playwright';
const { MongoClient } = require('mongodb');
import fs from 'fs/promises';
const saslprep = require('saslprep');
//@ts-ignore
import { parseStringPromise } from 'xml2js';

const proxyServer = process.env.PROXY_SERVER || '';
const proxyUsername = process.env.PROXY_USERNAME || '';
const proxyPassword = process.env.PROXY_PASSWORD || '';
const dbPassword = process.env.DB_PASSWORD || '';



type DataType  = {
    price: string;
    sku?: undefined;
    productName?: undefined;
    url?: undefined;
} | {
    price: string;
    sku: string;
    productName: string;
    url: string;
} | undefined


class BrowserScrapper {
    private browser: Browser | null = null;
    private page: Page | null = null;
    private url: string;

    constructor(url: string) {
        this.url = url;
    }

    private static sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private static getRandomInt(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    private async sleepRandomInterval(min: number, max: number): Promise<void> {
        const randomTime = BrowserScrapper.getRandomInt(min, max);
        await BrowserScrapper.sleep(randomTime);
    }

    private async moveMouseRandomly(width: number, height: number): Promise<void> {
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
    }

    public async setup(): Promise<void> {
		const mobileDevices = [
    devices['iPhone 7'],
    devices['iPhone 7 Plus'],
    devices['iPhone 8'],
    devices['iPhone 8 Plus'],
    devices['iPhone SE'],
    devices['iPhone X'],
    devices['iPhone XR'],
    devices['iPhone 11'],
    devices['iPhone 11 Pro'],
    devices['iPhone 11 Pro Max'],
    devices['iPhone 12'],
    devices['iPhone 12 Pro'],
    devices['iPhone 12 Pro Max'],
    devices['iPhone 12 Mini'],
    devices['Pixel 2'],
    devices['Pixel 2 XL'],
    devices['Pixel 3'],
    devices['Pixel 4'],
    devices['Pixel 5'],
    devices['Galaxy S8'],
    devices['Nexus 5X'],
    devices['Nexus 6P'],
		];
        const randomDevice = mobileDevices[BrowserScrapper.getRandomInt(0, mobileDevices.length - 1)];
		
        this.browser = await firefox.launch({
            headless: true,
            proxy: {
                server: proxyServer,
                username: proxyUsername,
                password: proxyPassword
            }
        });

        const context = await this.browser.newContext({
            userAgent: randomDevice.userAgent,
            viewport: randomDevice.viewport
        });

        this.page = await context.newPage();
    }

public async scrape(): Promise<void> {
    if (!this.page) throw new Error("Page is not initialized");

    const maxRetries = 3;
    const retryDelay = 60000; // Задержка перед повторной попыткой в миллисекундах

    for (let retry = 1; retry <= maxRetries; retry++) {
        try {
            await this.page.goto(this.url, {
                waitUntil: 'domcontentloaded',
            });

            // Если запрос выполнен успешно, выход из цикла
            break;
        } catch (error) {
            const typedError = error as Error; // Приводим error к типу Error

            if (typedError.message.includes('NS_ERROR_PROXY_CONNECTION_REFUSED')) {
                if (retry < maxRetries) {
                    console.error(`Encountered NS_ERROR_PROXY_CONNECTION_REFUSED error (attempt ${retry}). Retrying after 1 minute...${error}`);
                    await BrowserScrapper.sleep(retryDelay); // Ожидание 1 минуты
                } else {
                    console.error(`Failed to scrape after ${maxRetries} attempts due to NS_ERROR_PROXY_CONNECTION_REFUSED error.${error}`);
                    return;
                }
            } else if (typedError.message.includes('Timeout')) {
                console.error(`Timeout exceeded (attempt ${retry}). Retrying after 1 minute...`);
                await BrowserScrapper.sleep(retryDelay*2);
            } else {
                console.error(`An error occurred during page.goto: ${typedError}`);
                return;
            }
        }
    }

        await this.sleepRandomInterval(500, 5000);

        // 
        // await this.page.waitForSelector('.dUpOu');
        // await this.page.waitForSelector('.ap\\+\\+P');


        const viewport = this.page.viewportSize();
        if (viewport) {
            const { width, height } = viewport;
            await this.moveMouseRandomly(width, height);
        }

        await this.page.screenshot({ path: 'screenshot.jpg' });

        await this.page.waitForSelector('._2Dcyn.AH6V0');

let data = await this.page.evaluate(() => {
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
    } else if (element) {
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
    } else {
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
                const skuText = skuElement.textContent?.trim();
                const skuPrefix = 'артикул: ';

                let sku;

                if (skuText !== undefined && skuText.startsWith(skuPrefix)) {
                    sku = skuText.slice(skuPrefix.length);
                } else {
                    sku = 'Элемент не найден';
                }

                const productNameElement = document.querySelector('.ap\\+\\+P');
                if (productNameElement) {
                    const productNameText = productNameElement.textContent;
                    const productName = productNameText ? productNameText.trim() : 'Имя продукта не найдено';

                    return {
                        price: priceMatches, // Join extracted numbers to form the price string
                        sku: sku,
                        productName: productName,
                        url: window.location.href,
                    };
                } else {
                    // Если productNameElement не найден, вернем информацию об этом
                    return {
                        price: priceMatches, // Join extracted numbers to form the price string
                        sku: sku,
                        productName: "Имя продукта не найдено",
                        url: window.location.href,
                    };
                }
            }
        });
        console.log(data);
		await this.pushToMongoDB(data);
    }

private async pushToMongoDB(data: DataType) {
    if (data === undefined) {
        console.log('Data is undefined, skipping MongoDB update');
        return;
    }

    const password = dbPassword;
    const sanitizedPassword = saslprep(password);

    const uri = `mongodb+srv://User1:${sanitizedPassword}@ga.snrkofs.mongodb.net/`;
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    try {
        await client.connect();
        const database = client.db("Golden_Apple");
        const collection = database.collection("SKU");

        const currentDate = new Date().toISOString().slice(0, 10);

        if (data.sku !== undefined) {
            const existingDoc = await collection.findOne({ _id: data.sku });

            let newPriceEntry = {
                date: currentDate,
                value: data.price
            };

            if (existingDoc) {
                await collection.updateOne(
                    { _id: data.sku },
                    {
                        $set: {
                            url: data.url,
                            productName: data.productName,
                        },
                        $push: {
                            price: newPriceEntry
                        }
                    }
                );
                console.log(`Document with SKU as _id: ${data.sku} updated`);
            } else {
                await collection.insertOne({
                    _id: data.sku,
                    url: data.url,
                    productName: data.productName,
                    price: [newPriceEntry]
                });
                console.log(`Document with SKU as _id: ${data.sku} created`);
            }
        } else {
            console.log('SKU is undefined, skipping MongoDB update');
        }
    } finally {
        await client.close();
    }
}


    public async close(): Promise<void> {
        if (this.browser) await this.browser.close();
    }
}



async function readSitemap() {
    try {
        const sitemapContent = await fs.readFile('sitemap.xml', 'utf-8'); // Замените на путь к вашему sitemap.xml
        const parsedSitemap = await parseSitemap(sitemapContent);
        const urls = parsedSitemap.urlset.url.map((urlObj: any) => urlObj.loc[0]);
        return urls;
    } catch (error) {
        console.error('Error reading sitemap:', error);
        return [];
    }
}

async function parseSitemap(xmlContent: string) {
    try {
        const result = await parseStringPromise(xmlContent);
        return result;
    } catch (error) {
        throw error;
    }
}

async function scrapeAllUrls() {
    const urls = await readSitemap();

    for (const url of urls) {
        const scrapper = new BrowserScrapper(url);
        await scrapper.setup();
        await scrapper.scrape();
        await scrapper.close();
    }
}

scrapeAllUrls();

// Usage
// const scrapper = new BrowserScrapper('https://goldapple.ru/19000042159-keeping-it-real-foundation');
// (async () => {
//     await scrapper.setup();
//     await scrapper.scrape();
//     await scrapper.close();
// })();

