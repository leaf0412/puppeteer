const puppeteer = require('puppeteer')
const fs = require('fs')
const chalk = require('chalk')
const log = console.log
const red = chalk.red
const blue = chalk.blue
const orange = chalk.keyword('orange')

async function spider(page) {
  return await page.evaluateOnNewDocument(() => {
    ;() => {
      window.chrome = {
        app: {
          isInstalled: false,
          InstallState: {
            DISABLED: 'disabled',
            INSTALLED: 'installed',
            NOT_INSTALLED: 'not_installed',
          },
          RunningState: {
            CANNOT_RUN: 'cannot_run',
            READY_TO_RUN: 'ready_to_run',
            RUNNING: 'running',
          },
        },
        runtime: {
          OnInstalledReason: {
            CHROME_UPDATE: 'chrome_update',
            INSTALL: 'install',
            SHARED_MODULE_UPDATE: 'shared_module_update',
            UPDATE: 'update',
          },
          OnRestartRequiredReason: {
            APP_UPDATE: 'app_update',
            OS_UPDATE: 'os_update',
            PERIODIC: 'periodic',
          },
          PlatformArch: {
            ARM: 'arm',
            ARM64: 'arm64',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          PlatformNaclArch: {
            ARM: 'arm',
            MIPS: 'mips',
            MIPS64: 'mips64',
            X86_32: 'x86-32',
            X86_64: 'x86-64',
          },
          PlatformOs: {
            ANDROID: 'android',
            CROS: 'cros',
            LINUX: 'linux',
            MAC: 'mac',
            OPENBSD: 'openbsd',
            WIN: 'win',
          },
          RequestUpdateCheckStatus: {
            NO_UPDATE: 'no_update',
            THROTTLED: 'throttled',
            UPDATE_AVAILABLE: 'update_available',
          },
        },
      }
      const newProto = navigator.__proto__
      delete newProto.webdriver
      navigator.__proto__ = newProto
    }
  })
}

function getRandomInt({ min = 0, max }) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
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
    S: this.getMilliseconds(), //毫秒
  }
  if (/(y+)/.test(fmt)) {
    fmt = fmt.replace(
      RegExp.$1,
      (this.getFullYear() + '').substr(4 - RegExp.$1.length)
    )
  }
  for (var k in o) {
    if (new RegExp('(' + k + ')').test(fmt)) {
      fmt = fmt.replace(
        RegExp.$1,
        RegExp.$1.length == 1 ? o[k] : ('00' + o[k]).substr(('' + o[k]).length)
      )
    }
  }
  return fmt
}

//
function shuffleSort(arr) {
  var newArr = [...arr]
  var n = newArr.length
  while (n--) {
    var index = Math.floor(Math.random() * n)
    ;[newArr[index], newArr[n]] = [newArr[n], newArr[index]]
  }
  return newArr
}

const browserOption = {
  headless: false,
  // 延迟
  slowMo: 5,
}
let userAgent = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36',
]
const chromeOption = {
  viewport: {
    width: 1280,
    height: 800,
  },
  userAgent: userAgent[getRandomInt({ max: 1 })],
}
const waitGotoUrlOption = {
  waitUntil: 'domcontentloaded',
  timeout: 0,
}
  
let categoryTotalInfo = [
  {
    name: 'Home_Kitchen',
    link: 'https://www.amazon.com/Best-Sellers-Home-Kitchen/zgbs/home-garden/ref=zg_bs_nav_0',
  },
]
async function getCategoryInfo(page) {
  try {
    const categoryInfo = await page.evaluate(() => {
      let list = []
      document
        .querySelector('#zg_browseRoot .zg_selected')
        .parentElement.nextElementSibling.querySelectorAll('li a')
        .forEach(item => {
          console.log(item, 'item')
          list.push({
            name: item?.innerText,
            link: item?.href,
          })
        })
      return list
    })
    return categoryInfo
  } catch (err) {
    red(err, 'error')
  }
}

async function run(url, type) {
  const browser = await puppeteer.launch(browserOption)
  try {
    const page = await browser.newPage()
    await spider(page)
    await page.emulate(chromeOption)
    await page.goto(url, waitGotoUrlOption)
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
    const info = await getCategoryInfo(page)
    categoryTotalInfo.push(...shuffleSort(info))
    for (let i = 0; i < info.length; i++) {
      const { link } = info[i]
      await page.goto(link, waitGotoUrlOption)
      const list = await getCategoryInfo(page)
      categoryTotalInfo.push(...list)
    }
    log(blue('获取数据总条数', categoryTotalInfo.length))
    fs.writeFileSync(
      `${type}.js`,
      `
    const categoryTotalInfo = ${JSON.stringify(categoryTotalInfo)}
    module.exports = {
      categoryTotalInfo
    }`
    )
  } catch (err) {
    log(red(err))
  } finally {
    await browser.close()
  }
}
const {link, name} = categoryTotalInfo[0]
run(link, name)
