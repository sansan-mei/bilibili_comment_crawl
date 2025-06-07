import { crawlScript } from "#crawl";
import { killPortProcess } from "#utils/electron";
import { config } from "dotenv";
import { app, Notification } from "electron";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

app.whenReady().then(async () => {
  const envPath = join(dirname(fileURLToPath(import.meta.url)), "../.env");
  config({ path: envPath });

  if (process.env.STATIC_PATH) {
    console.log(`\n已加载 STATIC_PATH: ${process.env.STATIC_PATH}\n`);
  }

  // 先释放端口
  await killPortProcess(39002);

  await crawlScript();

  new Notification({
    title: "哔哩哔哩脚本",
    body: "哔哩哔哩脚本启动成功",
  }).show();
});

// 防止应用在所有窗口关闭时退出（保持托盘运行）
app.on("window-all-closed", (/** @type {any} */ event) => {
  event.preventDefault();
});
