import { crawlScript } from "#crawl";
import { killPortProcess } from "#utils/electron";
import { app, Notification } from "electron";

app.whenReady().then(async () => {
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
