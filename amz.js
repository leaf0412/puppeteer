const puppeteer = require('puppeteer');
const fs = require('fs');
const chalk = require('chalk');
const log = console.log;
const red = chalk.red;
const blue = chalk.blue;
const orange = chalk.keyword('orange');

async function spider(page) {
  return await page.evaluateOnNewDocument(() => {
    () => {
      window.chrome = {
        app: {
          isInstalled: false,
          InstallState: {
            DISABLED: 'disabled',
            INSTALLED: 'installed',
            NOT_INSTALLED: 'not_installed'
          },
          RunningState: {
            CANNOT_RUN: 'cannot_run',
            READY_TO_RUN: 'ready_to_run',
            RUNNING: 'running'
          }
        },
        runtime: {
          OnInstalledReason: {
            CHROME_UPDATE: 'chrome_update',
            INSTALL: 'install',
            SHARED_MODULE_UPDATE: 'shared_module_update',
            UPDATE: 'update'
          },
          OnRestartRequiredReason: {
            APP_UPDATE: 'app_update',
            OS_UPDATE: 'os_update',
            PERIODIC: 'periodic'
          },
          PlatformArch: {
            ARM: 'arm',
            ARM64: 'arm64',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64'
          },
          PlatformNaclArch: {
            ARM: 'arm',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64'
          },
          PlatformOs: {
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            MAC: 'mac',
            OPENBSD: 'openbsd',
            WIN: 'win'
          },
          RequestUpdateCheckStatus: {
            NO_UPDATE: 'no_update',
            THROTTLED: 'throttled',
            UPDATE_AVAILABLE: 'update_available'
          }
        }
      };
      const newProto = navigator.__proto__;
      delete newProto.webdriver;
      navigator.__proto__ = newProto;
    };
  });
}

function getRandomInt({ min = 0, max }) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// 格式化时间
function time(time = +new Date()) {
  var date = new Date(time + 8 * 3600 * 1000);
  return date.toJSON().substr(0, 19).replace('T', ' ').replace(/-/g, '.');
}

//
function shuffleSort(arr) {
  var newArr = [...arr];
  var n = newArr.length;
  while (n--) {
    var index = Math.floor(Math.random() * n);
    [newArr[index], newArr[n]] = [newArr[n], newArr[index]];
  }
  return newArr;
}

const browserOption = {
  headless: true,
  // 延迟
  slowMo: 5
};
let userAgent = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36'
];
const chromeOption = {
  viewport: {
    width: 1280,
    height: 800
  },
  userAgent: userAgent[getRandomInt({ max: 1 })]
};
const waitGotoUrlOption = {
  waitUntil: 'domcontentloaded',
  timeout: 0
};
const url =
  'https://www.amazon.com/Best-Sellers-Home-Kitchen/zgbs/home-garden/ref=zg_bs_nav_0';

let productDetailInfo = [];
function getProductsInfo(page) {
  return new Promise(async (resolve) => {
    try {
      const productInfo = await page.evaluate(() => {
        let list = [];
        document.querySelectorAll('.zg-item-immersion').forEach((item) => {
          list.push({
            link: item.querySelector('.a-link-normal').href,
            stars: item.querySelector(
              '.a-icon-row.a-spacing-none .a-link-normal span.a-icon-alt'
            )?.innerText,
            reviews: item.querySelector(
              '.a-icon-row.a-spacing-none .a-size-small.a-link-normal'
            )?.innerText,
            picture: item.querySelector('.a-section.a-spacing-small img').src,
            price:
              item.querySelector('.a-size-base.a-color-price')?.innerText || 0
          });
        });
        return list;
      });
      log(red('揍你'));
      productDetailInfo.push(...productInfo);
      resolve();
    } catch (err) {
      red(err, 'error');
    }
  });
}

function gotoNextPage(page) {
  return new Promise(async (resolve) => {
    try {
      const nextPage = await page.$eval(
        '.a-pagination .a-last a',
        (item) => item.href
      );
      log(blue(nextPage), 'nextPage');
      if (nextPage) {
        await page.waitForTimeout(getRandomInt({ min: 2000, max: 2500 }));
        await page.goto(nextPage, waitGotoUrlOption);
        log(red('揍你'));
        await getProductsInfo(page);
        log(red('揍你'));
        await gotoNextPage(page);
      } else {
        resolve();
      }
    } catch (err) {
      red(err, 'error');
    }
  });
}

async function run(url) {
  const browser = await puppeteer.launch(browserOption);
  try {
    const page = await browser.newPage();
    await spider(page);
    await page.emulate(chromeOption);
    await page.goto(url, waitGotoUrlOption);
    // 设置  纽约
    // await page.waitForSelector(
    //   '.glow-toaster-button-submit .a-button-input[type="submit"]'
    // )
    // await page.click('.glow-toaster-button-submit .a-button-input[type="submit"]')
    // await page.waitForTimeout(2000)
    if (await page.$('#GLUXZipUpdateInput')) {
      // await page.waitForSelector('#GLUXZipUpdateInput')
      // await page.type('#GLUXZipUpdateInput', '10010', { delay: 200, timeout })
      // await page.click('#GLUXZipUpdate input[type="submit"]')
      // await page.waitForTimeout(2000)
      // await page.keyboard.press('Enter')
      // await page.waitForTimeout(2000)
    }
    await getProductsInfo(page);
    await gotoNextPage(page);
    log(blue('获取数据总条数', productDetailInfo.length));
    // await saveProductInfo(page, shuffleSort(productDetailInfo));
  } catch (err) {
    log(red(err));
  } finally {
    await browser.close();
  }
}

// 截取商品 id
// /\/dp\/(.*?)\//i.exec(location.pathname)

async function saveProductInfo(page, productDetailInfo) {
  let productList = [];
  for (let i = 0; i < productDetailInfo.length; i++) {
    log(blue(`正在抓取第${i + 1}条商品数据...`));
    try {
      const productUrl = productDetailInfo[i].link;
      const productId = /\/dp\/(.*?)\//i.exec(productUrl);
      await page.goto(productUrl, waitGotoUrlOption);
      const productInfo = await page.evaluate(async () => {
        const sleep = (time = 1000) => {
          return new Promise((resolve) => {
            setTimeout(() => resolve(), time);
          });
        };
        for (var y = 0; y <= 5; y++) {
          window.scrollTo(0, 1280 * y);
          await sleep();
        }
        var getKeys = {
          rank: '亚马逊热销商品排名',
          available: 'Amazon.cn上架时间'
        };
        // var getKeys = {
        //   rank: 'Best Sellers Rank',
        //   available: 'Date First Available',
        // }
        let information = {
          productTitle: document.querySelector('#productTitle').innerText
        };
        const productDetailTable = document.querySelectorAll(
          '.prodDetSectionEntry'
        );
        const productDetailList = document.querySelectorAll(
          '.detail-bullet-list .a-list-item .a-text-bold'
        );
        const productDetail =
          productDetailTable.length > 0
            ? productDetailTable
            : productDetailList;
        productDetail.forEach((item) => {
          for (let i in getKeys) {
            if (item.innerText.includes(getKeys[i])) {
              information[i] = item.nextElementSibling.innerText;
            }
          }
        });
        return information;
      });
      productList.push(
        Object.assign({}, productInfo, productDetailInfo[i], { productId })
      );
      await page.waitForTimeout(getRandomInt({ min: 2000, max: 2500 }));
    } catch (err) {
      log(red(err));
      continue;
    }
  }
  await fs.writeFileSync(
    `./${time()}-product.js`,
    JSON.stringify(productList),
    {
      encoding: 'utf8'
    }
  );
}

run(url);
