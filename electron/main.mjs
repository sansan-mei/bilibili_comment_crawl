import { crawlScript } from "#crawl";
import { killPortProcess } from "#utils/electron";
import { app, Notification } from "electron";
import path from "path";
import { fileURLToPath } from "url";

app.whenReady().then(async () => {
  setWorkDir();

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

function setWorkDir() {
  try {
    // 获取当前目录
    const currentDir = path.dirname(fileURLToPath(import.meta.url));
    let workDir;

    // 检查是否在打包环境中（.asar文件内）
    if (currentDir.includes(".asar")) {
      // 打包环境：使用应用安装目录
      workDir = path.dirname(process.execPath);
      console.log("检测到打包环境，使用应用安装目录:", workDir);
    } else {
      // 开发环境：使用项目根目录
      workDir = path.resolve(currentDir, "..");
      console.log("检测到开发环境，使用项目根目录:", workDir);
    }

    // 切换工作目录
    process.chdir(workDir);
    console.log("Electron工作目录已设置为:", process.cwd());
  } catch (error) {
    console.error("设置工作目录失败:", error);
  }
}
