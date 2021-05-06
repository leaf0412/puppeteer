const puppeteer = require('puppeteer');

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

const browserOption = {
  headless: false,
  // 延迟
  slowMo: 20
};
let userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.114 Safari/537.36';
const chromeOption = {
  viewport: {
    width: 1280,
    height: 800
  },
  userAgent
};

(async () => {
  const browser = await puppeteer.launch(browserOption);
  const page = await browser.newPage();
  await spider(page);
  await page.emulate(chromeOption);
  const dimensions = await page.evaluate(() => {
    // 在这里可以进行DOM操作
    return {
      width: document.documentElement.clientWidth,
      height: document.documentElement.clientHeight,
      deviceScaleFactor: window.devicePixelRatio
    };
  });
})();
