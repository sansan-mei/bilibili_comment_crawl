// 系统托盘管理模块
import { Menu, nativeImage, Tray } from "electron";
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
  } catch (error) {
    console.log("图标文件不存在，使用默认图标");
    icon = nativeImage.createEmpty();
  }

  tray = new Tray(icon);
  tray.setToolTip("Bilibili 评论爬虫");

  // 创建托盘菜单
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
      label: "退出程序",
      click: () => {
        console.log("程序已退出");
        process.exit(0);
      },
    },
  ]);

  tray.setContextMenu(contextMenu);

  // 双击托盘图标的行为（可选）
  tray.on("double-click", () => {
    console.log("双击了托盘图标");
  });
}

/**
 * 销毁托盘
 */
export function destroyTray() {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}
