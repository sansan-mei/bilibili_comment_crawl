import { crawlScript } from "#crawl";
import { createNotice, killPortProcess } from "#utils/electron";
import { notifier } from "#utils/notifier";
import { config } from "dotenv";
import { app } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

app.whenReady().then(async () => {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
  config({ path: envPath });

  if (process.env.STATIC_PATH) {
    notifier.log(`\n已加载 STATIC_PATH: ${process.env.STATIC_PATH}\n`);
  }

  // 先释放端口
  await killPortProcess(39002);

  await crawlScript();

  createNotice({
    title: "哔哩哔哩脚本",
    body: "启动成功",
  });
});

// 防止应用在所有窗口关闭时退出（保持托盘运行）
app.on("window-all-closed", (/** @type {any} */ event) => {
  event.preventDefault();
});

// 监听未捕获的 Promise 错误
process.on("unhandledRejection", (reason) => {
  console.error("未处理的 Promise 错误:", reason);
  createNotice({
    title: "系统错误",
    body: `Promise 错误，应用将重启: ${
      reason instanceof Error ? reason.message : String(reason)
    }`,
  });

  // 延迟重启，让通知有时间显示
  setTimeout(() => {
    app.relaunch();
    app.quit();
  }, 2000);
});

// 监听未捕获的异常
process.on("uncaughtException", (error) => {
  console.error("未捕获的异常:", error);
  createNotice({
    title: "系统异常",
    body: `异常，应用将重启: ${error.message}`,
  });

  // 延迟重启，让通知有时间显示
  setTimeout(() => {
    app.relaunch();
    app.quit();
  }, 2000);
});
