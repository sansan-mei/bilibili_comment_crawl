import fs from 'fs';
import path from 'path';
import { connect, launch } from 'puppeteer-core';
import UserAgent from 'user-agents';
import { delay } from './index.mjs';

// 尝试连接到已打开的Chrome浏览器
async function connectBrowser() {
  try {
    // 尝试连接到已打开的Chrome浏览器
    const browser = await connect({
      browserURL: 'http://127.0.0.1:9222',
      defaultViewport: null
    });
    console.log('成功连接到已打开的Chrome浏览器');
    return browser;
  } catch (error) {
    console.log('无法连接到已打开的Chrome浏览器，将启动新的浏览器实例');
    // 直接将错误转换为字符串
    console.log(String(error));

    // 如果连接失败，则启动新的浏览器实例
    // 处理跨系统路径问题
    let executablePath = process.env.executablePath;
    if (executablePath) {
      // 标准化路径，处理不同系统的路径分隔符
      executablePath = path.normalize(executablePath);
    }

    // 启动浏览器实例
    const browser = await launch({
      headless: false,
      defaultViewport: null, // 使用默认视口大小
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=9222',
        '--disable-blink-features=AutomationControlled', // 禁用自动化控制特性
        '--disable-web-security', // 禁用网页安全策略
        '--disable-features=IsolateOrigins,site-per-process', // 禁用站点隔离
        '--disable-site-isolation-trials',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--disable-dev-shm-usage', // 禁用/dev/shm使用
        '--disable-accelerated-2d-canvas', // 禁用加速2D画布
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu', // 禁用GPU硬件加速
        '--start-maximized', // 最大化窗口
        new UserAgent().toString()
      ],
      executablePath
    });

    // 为所有页面设置额外的防检测措施
    browser.on('targetcreated', async (target) => {
      try {
        const page = await target.page();
        if (page) {
          // 注入脚本以绕过检测
          await page.evaluateOnNewDocument(() => {
            // 覆盖navigator.webdriver
            Object.defineProperty(navigator, 'webdriver', {
              get: () => false,
            });

            // 覆盖navigator.plugins
            Object.defineProperty(navigator, 'plugins', {
              get: () => [1, 2, 3, 4, 5],
            });

            // 添加假的chrome对象
            // @ts-ignore - 忽略类型检查
            window.chrome = {
              runtime: {},
              app: {},
              loadTimes: () => { },
              csi: () => { },
              webstore: {}
            };

            // 添加语言
            Object.defineProperty(navigator, 'languages', {
              get: () => ['zh-CN', 'zh', 'en-US', 'en'],
            });

            // 修改permissions API
            if (navigator.permissions) {
              // @ts-ignore - 忽略类型检查
              const originalQuery = navigator.permissions.query;
              // @ts-ignore - 忽略类型检查
              navigator.permissions.query = (parameters) => {
                if (parameters.name === 'notifications') {
                  return Promise.resolve({ state: Notification.permission });
                }
                return originalQuery(parameters);
              };
            }
          });
        }
      } catch (err) {
        console.error('设置防检测措施时出错:', String(err));
      }
    });

    return browser;
  }
}

class Browser {
  constructor() {
    this.browserInitializing = true
    this.init()
    this.browserInitialized = false
  }

  async init() {
    this.browser = await connectBrowser();
    this.browserInitialized = true
    this.browserInitializing = false
  }

  /** @param {string} targetUrl */
  async checkPage(targetUrl = 'https://grok.com/') {
    // 确保浏览器实例存在
    if (!this.browser) {
      // 如果浏览器正在初始化中，等待初始化完成
      if (this.browserInitializing) {
        console.log('浏览器正在初始化中，等待...')
        while (this.browserInitializing) {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      } else if (!this.browserInitialized) {
        // 如果浏览器尚未初始化，重新初始化
        console.log('浏览器未初始化，开始初始化...')
      }
    }

    // 此时浏览器实例应该存在，但为了类型安全，再次检查
    if (!this.browser) {
      throw new Error('浏览器初始化失败')
    }

    const pages = await this.browser.pages()
    for (const page of pages) {
      const pageUrl = await page.url()
      if (pageUrl === targetUrl) {
        return page
      }
      if (pageUrl.includes(targetUrl)) {
        await page.goto(targetUrl)
        return page;
      }
    }
    const page = await this.browser.newPage();
    await page.goto(targetUrl);
    return page;
  }

  /** 
   * 上传文件到页面
   * @param {string} filePath 文件的绝对路径
   * @param {string} selector 文件输入框的选择器，默认为 'input[type="file"]'
   */
  async uploadFile(filePath, selector = 'input[type="file"]') {
    const page = await this.checkPage();

    try {
      // 检查文件是否存在
      if (!fs.existsSync(filePath)) {
        throw new Error(`文件不存在: ${filePath}`);
      }

      // 确保文件路径是绝对路径
      const absoluteFilePath = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
      console.log(`准备上传文件: ${absoluteFilePath}`);

      // 等待文件输入元素出现在页面上
      /** @type {AnyObject | null} */
      const fileInput = await page.waitForSelector(selector, { timeout: 5000 });
      if (!fileInput) {
        throw new Error('文件输入框未找到')
      }

      await fileInput.uploadFile(absoluteFilePath)
      console.log(`成功上传文件: ${absoluteFilePath}`)
      return true
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`文件上传失败: ${errorMessage}`);
      return false;
    }
  }

  async clickSubmit() {
    const page = await this.checkPage();
    await page.bringToFront();
    await delay(10000)
    const submitButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    if (!submitButton) {
      throw new Error('提交按钮未找到')
    }
    await submitButton.click();
    console.log('成功点击提交按钮')
    this.browser?.disconnect()
  }

  /** @param {string} filePath */
  async run(filePath) {
    await this.uploadFile(filePath);
    await this.clickSubmit();
  }
}

const browser = new Browser()

export { browser as default };
