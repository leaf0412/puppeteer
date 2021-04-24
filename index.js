const pupp = require('puppeteer');

const searchKeyList = [
  'manye个人博客',
  'site:blog.bylove.vip',
  '"manye个人博客"',
  '"vue 、react、面试、前端开发manye 个人博客."',
  "manye 博客",
  "ubuntu16.04 安装nodejs pm2 nginx mongodb",
  "pm2 配置文件来进行自动部署项目",
  "前端开发 manye 个人博客"
]

function getRandomInt({ min = 0, max }) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
const timer = 3.5 * 60 * 1000

let mobileNum = 0;
let PCNum = 0;
let isMobile = false;
let viewport = {
  width: 1200,
  height: 980
};
let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
async function run() {
  const browser = await pupp.launch({
    headless: true
  });

  setTimeout(() => {
    console.log('本次超时')
    browser.close();
  }, timer)
  const page = await browser.newPage();
  const num = getRandomInt({ max: 7 })
  if (num % 2 === 0) {
    isMobile = true
    viewport = {
      width: 375,
      height: 667,
      isMobile
    }
    userAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 9_1 like Mac OS X) AppleWebKit/601.1.46 (KHTML, like Gecko) Version/9.0 Mobile/13B143 Safari/601.1"
  }
  await page.emulate({
    viewport,
    userAgent
  })
  await page.goto('https://www.google.com.hk/', { waitUntil: "load", timeout: 0 });
  await page.waitForTimeout(getRandomInt({ min: 1000, max: 5000 }))
  await page.waitForSelector('input.gLFyf')
  await page.type(
    'input.gLFyf',
    searchKeyList[num],
    { delay: getRandomInt({ min: 100, max: 200 }), timeout: 0 }
  );
  //模拟回车键
  await page.keyboard.press('Enter');
  await page.waitForTimeout(getRandomInt({ min: 1000, max: 5000 }))
  if (!isMobile) {
    PCNum++
    await page.waitForSelector(`#search .g a`)
    // if (num == 1) {
      await page.click(`#search .g:nth-child(${getRandomInt({ min: 1, max: 4 })}) a`)
    // } else {
    //   await page.click(`#search .g a`)
    // }
  } else {
    mobileNum++
    await page.waitForSelector(`#rso .KJDcUb a`)
    await page.click(`#rso .KJDcUb a`)
  }

  await page.waitForTimeout(getRandomInt({ min: 1000, max: 5000 }))
  await page.close();
  let data = {
    mobileNum,
    PCNum
  }
  console.log(JSON.stringify(data))
  // console.log(`结束本次 移动设备次数${mobileNum} 桌面设备次数${PCNum}`)
  browser.close()
}

run()
