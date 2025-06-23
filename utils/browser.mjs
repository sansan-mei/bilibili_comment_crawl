import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import UserAgent from "user-agents";
import { promisify } from "util";
import { delay, notifier } from "./index.mjs";

chromium.use(stealth());

const execAsync = promisify(exec);

// 设置浏览器安装位置
const browsersPath = path.join(process.cwd(), "browsers");
process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

// 检查并安装浏览器
async function ensureBrowserInstalled() {
  // 确保环境变量在整个进程中生效
  process.env.PLAYWRIGHT_BROWSERS_PATH = browsersPath;

  // 检查浏览器目录是否存在
  const chromiumDirs = fs.existsSync(browsersPath)
    ? fs.readdirSync(browsersPath).filter((dir) => dir.startsWith("chromium-"))
    : [];

  if (chromiumDirs.length > 0) {
    notifier.log(`浏览器已安装在: ${path.join(browsersPath, chromiumDirs[0])}`);
    return true;
  }

  notifier.log("浏览器未安装，开始自动安装...");

  try {
    // 设置环境变量并安装
    const env = {
      ...process.env,
      PLAYWRIGHT_BROWSERS_PATH: browsersPath,
    };

    notifier.log("正在安装浏览器，请稍候...");
    const { stdout, stderr } = await execAsync(
      "npx playwright install chromium",
      {
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 20, // 10MB buffer
        env,
      }
    );

    if (stdout) notifier.log(stdout);
    if (stderr) notifier.log(stderr);

    notifier.log("浏览器安装完成");
    return true;
  } catch (installError) {
    notifier.log(`浏览器安装失败: ${String(installError)}`);
    return false;
  }
}

// 启动新的Chrome浏览器
async function connectBrowser() {
  // 确保浏览器已安装
  const browserInstalled = await ensureBrowserInstalled();
  if (!browserInstalled) {
    throw new Error("浏览器安装失败，无法启动");
  }

  // 查找浏览器可执行文件
  let executablePath = process.env.EXECUTABLE_PATH;
  if (!executablePath) {
    // 查找安装的 chromium 目录
    const chromiumDirs = fs
      .readdirSync(browsersPath)
      .filter((dir) => dir.startsWith("chromium-"));
    if (chromiumDirs.length > 0) {
      const chromiumPath = path.join(browsersPath, chromiumDirs[0]);
      // Windows 系统的浏览器路径
      executablePath = path.join(chromiumPath, "chrome-win", "chrome.exe");
      if (!fs.existsSync(executablePath)) {
        // Linux/Mac 系统的浏览器路径
        executablePath = path.join(chromiumPath, "chrome-linux", "chrome");
        if (!fs.existsSync(executablePath)) {
          executablePath = path.join(
            chromiumPath,
            "chrome-mac",
            "Chromium.app",
            "Contents",
            "MacOS",
            "Chromium"
          );
        }
      }
      notifier.log(`使用浏览器路径: ${executablePath}`);
    }
  }

  if (executablePath) {
    executablePath = path.normalize(executablePath);
  }

  // 设置用户数据目录 - 存放在浏览器安装位置
  const userDataDir = path.join(browsersPath, "user-data");

  // 确保用户数据目录存在
  if (!fs.existsSync(userDataDir)) {
    fs.mkdirSync(userDataDir, { recursive: true });
    notifier.log(`创建浏览器数据目录: ${userDataDir}`);
  } else {
    notifier.log(`使用现有浏览器数据目录: ${userDataDir}`);
  }

  // 设置环境变量来隐藏Google API密钥警告
  process.env.GOOGLE_API_KEY = "no-api-key";
  process.env.GOOGLE_DEFAULT_CLIENT_ID = "no-client-id";
  process.env.GOOGLE_DEFAULT_CLIENT_SECRET = "no-client-secret";

  // 启动浏览器实例
  const browser = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    viewport: { width: 1920, height: 1080 }, // 设置桌面视口大小
    args: [
      "--window-size=1920,1080", // 设置窗口大小
      "--disable-blink-features=AutomationControlled", // 禁用自动化控制特性
      "--exclude-switches=enable-automation", // 排除自动化开关
    ],
    executablePath,
    userAgent: new UserAgent().toString(),
    ignoreDefaultArgs: ["--enable-automation"], // 忽略默认的自动化参数
  });

  return browser;
}

class Browser {
  constructor() {
    this.browserInitializing = true;
    this.init();
    this.browserInitialized = false;
  }

  async init() {
    this.browser = await connectBrowser();
    this.browserInitialized = true;
    this.browserInitializing = false;
  }

  /** @param {string} targetUrl */
  async checkPage(targetUrl = "https://grok.com/") {
    // 确保浏览器实例存在
    if (!this.browser) {
      if (this.browserInitializing) {
        notifier.log("浏览器正在初始化中，等待...");
        while (this.browserInitializing) {
          await delay(1000);
        }
      } else if (!this.browserInitialized) {
        notifier.log("浏览器未初始化，开始初始化...");
        await this.init();
      }
    }

    if (!this.browser) {
      throw new Error("浏览器初始化失败");
    }

    // 获取所有页面 (launchPersistentContext 返回的是 context，直接操作)
    const pages = this.browser.pages();
    for (const page of pages) {
      const pageUrl = page.url();
      if (pageUrl === targetUrl) {
        return page;
      }
      if (pageUrl.includes(targetUrl)) {
        await page.goto(targetUrl);
        return page;
      }
    }

    // 创建新页面
    const page = await this.browser.newPage();

    // stealth插件会自动处理反检测措施，不需要手动添加

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
      const absoluteFilePath = path.isAbsolute(filePath)
        ? filePath
        : path.resolve(process.cwd(), filePath);
      notifier.log(`准备上传文件: ${absoluteFilePath}`);

      // 等待文件输入元素出现并设置文件
      await page.waitForSelector(selector, { timeout: 5000 });
      await page.setInputFiles(selector, absoluteFilePath);

      notifier.log(`成功上传文件: ${absoluteFilePath}`);
      return true;
    } catch {
      return false;
    }
  }

  async clickSubmit() {
    const page = await this.checkPage();
    await page.bringToFront();
    await delay(5000);

    await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await page.click('button[type="submit"]');

    notifier.log("成功点击提交按钮");
    await this.browser?.close();
  }

  /** @param {string} filePath */
  async run(filePath) {
    await this.uploadFile(filePath);
    await this.clickSubmit();
  }
}

const browser = new Browser();

export { browser as default };
