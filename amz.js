const puppeteer = require('puppeteer');
const fs = require('fs');
const _async = require('async');
const chalk = require('chalk');
const log = console.log;
const red = chalk.red;
const blue = chalk.blue;
const orange = chalk.keyword('orange');
const { categoryTotalInfo } = require('./Home_Kitchen');
const xlsx = require('node-xlsx')
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
Date.prototype.format = function (fmt) {
  var o = {
    'M+': this.getMonth() + 1, //月份
    'd+': this.getDate(), //日
    'h+': this.getHours(), //小时
    'm+': this.getMinutes(), //分
    's+': this.getSeconds(), //秒
    'q+': Math.floor((this.getMonth() + 3) / 3), //季度
    S: this.getMilliseconds() //毫秒
  };
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + '').substr(4 - RegExp.$1.length)
    );
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      );
    }
  }
  return fmt;
};

// 打乱数组顺序
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

async function getProductsInfo(page, productDetailInfo) {
  try {
    const productInfo = await page.evaluate(() => {
      let list = [];
      document.querySelectorAll('.zg-item-immersion').forEach((item) => {
        if (item.querySelector('.a-link-normal')) {
          list.push({
            link: item.querySelector('.a-link-normal')?.href,
            stars: item.querySelector(
              '.a-icon-row.a-spacing-none .a-link-normal span.a-icon-alt'
            )?.innerText,
            reviews: item.querySelector(
              '.a-icon-row.a-spacing-none .a-size-small.a-link-normal'
            )?.innerText,
            picture: item.querySelector('.a-section.a-spacing-small img')?.src,
            price:
              item.querySelector('.a-size-base.a-color-price')?.innerText || 0
          });
        }
      });
      return list;
    });
    productDetailInfo.push(...productInfo);
  } catch (err) {
    red(err, 'error');
  }
}

async function gotoNextPage(page, productDetailInfo) {
  try {
    while (await page.$('.a-pagination .a-last a')) {
      const nextPage = await page.$eval(
        '.a-pagination .a-last a',
        (item) => item.href
      );
      await page.goto(nextPage, waitGotoUrlOption);
      await page.waitForTimeout(getRandomInt({ min: 1000, max: 2500 }));
      await getProductsInfo(page, productDetailInfo);
    }
  } catch (err) {
    red(err, 'error');
  }
}

async function run(url, type, productDetailInfo, callback) {
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
    await getProductsInfo(page, productDetailInfo);
    await gotoNextPage(page, productDetailInfo);
    log(blue(`${type} 获取数据总条数`, productDetailInfo.length));
    await saveProductInfo(page, type, shuffleSort(productDetailInfo));
    callback(null, `${type} 获取数据结束`);
  } catch (err) {
    callback(err);
    log(red(err));
  } finally {
    await browser.close();
  }
}

// 截取商品 id
// /\/dp\/(.*?)\//i.exec(location.pathname)

async function saveProductInfo(page, type, productDetailInfo) {
  let productList = [];
  const productLength = productDetailInfo.length;
  for (let i = 0; i < productLength; i++) {
    log(
      blue(
        `${type} 正在抓取第${i + 1}条商品数据... 进度 ${
          ((i + 1) / productLength) * 100
        }%`
      )
    );
    try {
      const productUrl = productDetailInfo[i].link;
      const productId = /\/dp\/(.*?)\//i.exec(productUrl)[1];
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
          productTitle: document.querySelector('#productTitle')?.innerText
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
        Object.assign(
          {},
          { rank: '无', available: '无' },
          productInfo,
          productDetailInfo[i],
          { productId }
        )
      );
      await page.waitForTimeout(getRandomInt({ min: 1000, max: 2500 }));
    } catch (err) {
      log(red(err));
      continue;
    }
  }
  writeXls(productList, type)
  await fs.appendFileSync(
    `./${new Date().format('yyyy-MM-dd')}-${type}-product.js`,
    JSON.stringify(productList),
    {
      encoding: 'utf8'
    }
  );
}

const start = async () => {
  log(orange(`start spider`));
  _async.mapLimit(
    categoryTotalInfo,
    2,
    (item, callback) => {
      run(item.link, item.name, [], callback);
    },
    (err, res) => {
      if (err) {
        console.log('err======>', err);
      }
      console.log('==========>  ', res);
    }
  );
};

start();

// {
//   rank:
//     '商品里排第76名家居厨房用品 (查看商品销售排行榜家居厨房用品)\n商品里排第1名地毯及室内装饰品清洁机\n',
//   available: '无',
//   productTitle: 'Bissell 多功能便携式地毯和室内装饰清洁器,1400B,绿色',
//   link:
//     'https://www.amazon.com/-/zh/dp/B0016HF5GK/ref=zg_bs_home-garden_76?_encoding=UTF8&psc=1&refRID=8XWE029PATFKM8RDRAPD',
//   stars: '平均 4.6 星',
//   reviews: '21,275',
//   picture:
//     'https://images-na.ssl-images-amazon.com/images/I/71ZrlZFuOfL._AC_UL200_SR200,200_.jpg',
//   price: 'US$149.99 - US$195.29',
//   productId: 'B0016HF5GK'
// }

function writeXls(data, name) {
  let title = ['排名', '上架时间', '商品标题', '亚马逊商品链接', '评分', '评价数量', '商品图片', '商品价格', '商品ID'];

let list = [];
list.push(title);

data.forEach((item) => {
  let info = [];
  info.push(item.rank);
  info.push(item.available);
  info.push(item.productTitle);
  info.push(item.link);
  info.push(item.stars);
  info.push(item.reviews);
  info.push(item.picture);
  info.push(item.price);
  info.push(item.productId);
  list.push(info);
});
  const options = {
    '!cols': [{ wch: 30 }, { wch: 100 }, { wch: 20 }, { wch: 20 }],
    '!margins': {left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3},
  };

  let buffer = xlsx.build(
    [
      {
        name: 'sheet1',
        data: list
      }
    ],
    options
  );
  fs.writeFileSync(`./${name}.xlsx`, buffer, { flag: 'w' });
}
