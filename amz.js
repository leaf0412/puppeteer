const puppeteer = require('puppeteer')
const fs = require('fs')

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

const browserOption = {
  headless: true,
  // 延迟
  slowMo: 5,
}
let userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36'
const chromeOption = {
  viewport: {
    width: 1280,
    height: 800,
  },
  userAgent,
}
const waitGotoUrlOption = {
  waitUntil: 'domcontentloaded',
  timeout: 0,
}
const url =
  'https://www.amazon.com/Best-Sellers-Home-Kitchen/zgbs/home-garden/ref=zg_bs_nav_0'
async function run(url) {
  try {
    const browser = await puppeteer.launch(browserOption)
    const page = await browser.newPage()
    await spider(page)
    await page.emulate(chromeOption)
    await page.goto(url, waitGotoUrlOption)
    // 设置发货地址到  纽约
    // await page.waitForSelector(
    //   '.glow-toaster-button-submit .a-button-input[type="submit"]'
    // )
    // await page.click('.glow-toaster-button-submit .a-button-input[type="submit"]')
    // await page.waitForTimeout(2000)
    // await page.waitForSelector('#GLUXZipUpdateInput')
    // await page.type('#GLUXZipUpdateInput', '10010', { delay: 200, timeout })
    // await page.click('#GLUXZipUpdate input[type="submit"]')
    // await page.waitForTimeout(2000)
    // await page.keyboard.press('Enter')
    // await page.waitForTimeout(2000)
    const productUrls = await page.evaluate(() => {
      // 在这里可以进行DOM操作
      let list = []
      document.querySelectorAll('.zg-item-immersion').forEach(item => {
        list.push(item.querySelector('.a-link-normal').href)
      })
      return list
    })
    await saveProductInfo(page, productUrls)
    await browser.close()
  } catch (err) {
    console.log(err)
  }
}
// 截取商品 id
// /\/dp\/(.*?)\//i.exec(location.pathname)

async function saveProductInfo(page, productUrls) {
  let productList = []
  for (let i = 0; i < productUrls.length; i++) {
    console.log(`正在抓取第${i + 1}条商品数据...`)
    try {
      await page.goto(productUrls[i], waitGotoUrlOption)

      const productInfo = await page.evaluate(() => {
        // 在这里可以进行DOM操作
        for (var y = 0; y <= 1280; y += 100) {
          window.scrollTo(0, y)
        }
        var getKeys = {
          rank: '亚马逊热销商品排名',
          available: 'Amazon.cn上架时间',
          productId: 'ASIN',
        }
        // var getKeys = {
        //   rank: 'Best Sellers Rank',
        //   available: 'Date First Available',
        //   productId: 'ASIN',
        // }
        var information = {}
        const productDetailTable = document.querySelectorAll(
          '.prodDetSectionEntry'
        )
        const productDetailList = document.querySelectorAll(
          '.detail-bullet-list .a-list-item .a-text-bold'
        )
        const productDetail =
          productDetailTable.length > 0 ? productDetailTable : productDetailList
        productDetail.forEach(item => {
          for (let i in getKeys) {
            if (item.innerText.includes(getKeys[i])) {
              information[i] = item.nextElementSibling.innerText
            }
          }
        })
        return information
      })
      // await page.waitForTimeout(getRandomInt({ min: 1000, max: 2000 }))
      productList.push(Object.assign({}, productInfo, { url: productUrls[i] }))
    } catch (err) {
      continue
    }
  }
  await fs.writeFileSync('./product.js', JSON.stringify(productList), {
    encoding: 'utf8',
  })
}

run(url)
