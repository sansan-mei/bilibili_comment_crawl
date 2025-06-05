import { crawlScript } from "#crawl";
import { killPortProcess } from "#utils/electron";
import AutoLaunch from "auto-launch";
import { app, Notification } from "electron";

const bilibiliAutoLauncher = new AutoLaunch({
  name: "Bilibili脚本",
  path: process.execPath, // Electron 可执行文件
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
});
