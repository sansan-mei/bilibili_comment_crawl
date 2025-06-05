import { crawlScript } from "#crawl";
import { killPortProcess } from "#utils/electron";
import AutoLaunch from "auto-launch";
import { app, Notification } from "electron";
import path from "path";

const appPath = path.join(
  process.cwd(),
  "dist",
  "win-unpacked",
  "Bilibili脚本.exe"
);

const bilibiliAutoLauncher = new AutoLaunch({
  name: "Bilibili脚本",
  path: appPath,
});

// 开机自启
bilibiliAutoLauncher.enable();

app.whenReady().then(async () => {
  // 先释放端口
  await killPortProcess(39002);

  await crawlScript();

  new Notification({
    title: "哔哩哔哩脚本",
    body: "哔哩哔哩脚本启动成功",
  }).show();

  // 检查并打包
  // buildApp();
});

// 防止应用在所有窗口关闭时退出（保持托盘运行）
app.on("window-all-closed", (/** @type {any} */ event) => {
  event.preventDefault();
});
