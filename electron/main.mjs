import { handleChildProcess, killPortProcess } from "#utils/electron";
import AutoLaunch from "auto-launch";
import { spawn } from "child_process";
import { app, Notification } from "electron";
import path from "path";

const bilibiliAutoLauncher = new AutoLaunch({
  name: "BilibiliCrawler",
  path: process.execPath, // Electron 可执行文件
});

// 开机自启
bilibiliAutoLauncher.enable();

app.whenReady().then(async () => {
  // 先释放端口
  await killPortProcess(39002);

  // 这里假设 crawl.mjs 在根目录
  const crawlPath = path.join(app.getAppPath(), "crawl.mjs");
  console.log("crawlScriptPath", crawlPath);

  const child = spawn(process.execPath, [crawlPath], {
    shell: true,
    env: { ...process.env, LANG: "zh_CN.UTF-8" },
  });

  handleChildProcess(child);

  setTimeout(() => {
    new Notification({
      title: "哔哩哔哩脚本",
      body: "哔哩哔哩脚本启动成功",
    }).show();
  }, 5000);
});
