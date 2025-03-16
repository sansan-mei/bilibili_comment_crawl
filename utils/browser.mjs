import fs from 'fs';
import path from 'path';
import { connect, launch } from 'puppeteer-core';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    const browser = await launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--remote-debugging-port=9222'  // 添加远程调试端口
      ],
      executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
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
    await page.click('button[type="submit"]');
    console.log('成功点击提交按钮')
    await this.browser?.close()
  }

  /** @param {string} filePath */
  async run(filePath) {
    await this.uploadFile(filePath);
    await this.clickSubmit();
  }
}

const browser = new Browser()

export { browser as default };

browser.checkPage()