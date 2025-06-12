// 系统托盘管理模块
import AutoLaunch from "auto-launch";
import { app, Menu, nativeImage, screen, Tray } from "electron";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { listCrawledVideos, openCrawledVideo, showHelp } from "./cli.mjs";
import { notifier } from "./notifier.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Tray | null} */
let tray = null;

/** @type {AutoLaunch | null} */
let autoLauncher = null;

/**
 * 初始化自启动管理器
 */
function initAutoLauncher() {
  if (autoLauncher) return autoLauncher;

  // 根据平台确定应用路径
  const appPath = process.execPath;

  if (appPath) {
    autoLauncher = new AutoLaunch({
      name: "Bilibili脚本",
      path: appPath,
      mac: {
        useLaunchAgent: true,
      },
    });
  }

  return autoLauncher;
}

/**
 * 检查自启动状态
 */
async function checkAutoLaunchStatus() {
  const launcher = initAutoLauncher();
  if (!launcher) return false;

  try {
    return await launcher.isEnabled();
  } catch (error) {
    notifier.log(
      `检查自启动状态失败:${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
}

/**
 * 切换自启动状态
 */
async function toggleAutoLaunch() {
  const launcher = initAutoLauncher();
  if (!launcher) {
    notifier.log("自启动功能不可用");
    return;
  }

  try {
    const isEnabled = await launcher.isEnabled();
    if (isEnabled) {
      await launcher.disable();
      notifier.log("✅ 已关闭开机自启动");
    } else {
      await launcher.enable();
      notifier.log("✅ 已开启开机自启动");
    }
    // 重新创建菜单以更新状态显示
    createTrayMenu();
  } catch (error) {
    notifier.log(
      `切换自启动状态失败:${
        error instanceof Error ? error.message : String(error)
      }`
    );
  }
}

/**
 * 创建系统托盘
 */
export async function createSystemTray() {
  if (tray) {
    // 托盘已存在，不重复创建
    return;
  }

  // 尝试加载图标文件，如果失败则使用空图标
  let icon;
  try {
    const iconPath = path.join(__dirname, "../image/icon.png");
    const iconBuffer = await readFile(iconPath);
    icon = nativeImage.createFromBuffer(iconBuffer);

    // 针对macOS优化图标尺寸
    if (process.platform === "darwin") {
      // macOS菜单栏图标推荐尺寸是16x16到22x22像素
      icon = icon.resize({ width: 18, height: 18 });
      // 设置为模板图像，让系统自动适配暗色模式
      icon.setTemplateImage(true);
    }
  } catch (error) {
    notifier.log("图标文件不存在，使用默认图标");
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Bilibili 爬虫");

  // 针对macOS的特殊处理
  if (process.platform === "darwin") {
    // 在macOS上，设置高亮模式
    tray.setIgnoreDoubleClickEvents(false);

    // 监听屏幕变化事件，确保托盘在屏幕切换时仍然可用
    screen.on("display-added", () => {
      notifier.log("检测到新显示器，重新初始化托盘");
      refreshTray();
    });

    screen.on("display-removed", () => {
      notifier.log("显示器已移除，重新初始化托盘");
      refreshTray();
    });

    screen.on("display-metrics-changed", () => {
      notifier.log("显示器配置已更改，重新初始化托盘");
      refreshTray();
    });
  }

  // 创建托盘菜单
  createTrayMenu();

  // 左键单击托盘图标 - 显示上下文菜单
  tray.on("click", () => {
    tray?.popUpContextMenu();
  });

  // 右键点击事件（主要用于调试）
  tray.on("right-click", () => {
    notifier.log("右键点击托盘图标");
  });

  notifier.log("✅ 系统托盘已创建");
  notifier.log(`📺 检测到 ${screen.getAllDisplays().length} 个显示器`);
}

/**
 * 刷新托盘 - 用于屏幕配置更改后重新初始化
 */
export function refreshTray() {
  if (tray) {
    createTrayMenu();
  }
}

/**
 * 创建托盘菜单的辅助函数
 * @param {Electron.MenuItemConstructorOptions} [menu]
 */
export async function createTrayMenu(menu) {
  if (!tray) return;

  // 检查自启动状态
  const isAutoLaunchEnabled = await checkAutoLaunchStatus();

  const contextMenu = Menu.buildFromTemplate([
    ...(menu ? [menu] : []),
    {
      label: "查看已爬取视频列表",
      click: async () => {
        await listCrawledVideos();
      },
    },
    {
      label: "浏览器打开文件列表",
      click: async () => {
        await openCrawledVideo();
      },
    },
    {
      label: "帮助信息",
      click: () => {
        showHelp();
      },
    },
    { type: "separator" },
    {
      label: `${isAutoLaunchEnabled ? "关闭" : "开启"}开机自启动`,
      click: async () => {
        await toggleAutoLaunch();
      },
    },
    { type: "separator" },
    {
      label: "退出程序",
      click: () => {
        notifier.log("程序已退出");
        destroyTray();
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

/**
 * 销毁托盘
 */
export function destroyTray() {
  if (tray) {
    // 移除屏幕事件监听器
    screen.removeAllListeners("display-added");
    screen.removeAllListeners("display-removed");
    screen.removeAllListeners("display-metrics-changed");

    tray.destroy();
    tray = null;
    notifier.log("✅ 系统托盘已销毁");
  }
}
