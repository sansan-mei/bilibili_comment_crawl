// 系统托盘管理模块
import { Menu, nativeImage, screen, Tray } from "electron";
import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { listCrawledVideos, openCrawledVideo, showHelp } from "./cli.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Tray | null} */
let tray = null;

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
    console.log("图标文件不存在，使用默认图标");
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Bilibili 评论爬虫");

  // 针对macOS的特殊处理
  if (process.platform === "darwin") {
    // 在macOS上，设置高亮模式
    tray.setIgnoreDoubleClickEvents(false);

    // 监听屏幕变化事件，确保托盘在屏幕切换时仍然可用
    screen.on("display-added", () => {
      console.log("检测到新显示器，重新初始化托盘");
      refreshTray();
    });

    screen.on("display-removed", () => {
      console.log("显示器已移除，重新初始化托盘");
      refreshTray();
    });

    screen.on("display-metrics-changed", () => {
      console.log("显示器配置已更改，重新初始化托盘");
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
    console.log("右键点击托盘图标");
  });

  console.log("✅ 系统托盘已创建");
  console.log(`📺 检测到 ${screen.getAllDisplays().length} 个显示器`);
}

/**
 * 刷新托盘 - 用于屏幕配置更改后重新初始化
 */
function refreshTray() {
  if (tray) {
    // 重新创建菜单（因为Tray没有getContextMenu方法）
    console.log(
      `🔄 刷新托盘菜单，当前屏幕数量: ${screen.getAllDisplays().length}`
    );
    createTrayMenu();
  }
}

/**
 * 创建托盘菜单的辅助函数
 */
function createTrayMenu() {
  if (!tray) return;

  const contextMenu = Menu.buildFromTemplate([
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
      label: `当前屏幕数量: ${screen.getAllDisplays().length}`,
      enabled: false,
    },
    {
      label: "显示器信息",
      click: () => {
        const displays = screen.getAllDisplays();
        console.log("\n=== 显示器信息 ===");
        displays.forEach((display, index) => {
          console.log(`屏幕 ${index + 1}:`);
          console.log(
            `  - 尺寸: ${display.bounds.width}x${display.bounds.height}`
          );
          console.log(`  - 位置: (${display.bounds.x}, ${display.bounds.y})`);
          console.log(
            `  - 主屏幕: ${
              display.bounds.x === 0 && display.bounds.y === 0 ? "是" : "否"
            }`
          );
          console.log(`  - DPI: ${display.scaleFactor}x`);
        });
        console.log("=================\n");
      },
    },
    { type: "separator" },
    {
      label: "退出程序",
      click: () => {
        console.log("程序已退出");
        destroyTray();
        process.exit(0);
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
    console.log("��️ 系统托盘已销毁");
  }
}
