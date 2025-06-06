import { buildApp } from "#utils/electron";
import AutoLaunch from "auto-launch";
import os from "os";
import path from "path";

// 根据平台确定应用路径
let appPath;
if (os.platform() === "win32") {
  appPath = path.join(process.cwd(), "dist", "Bilibili脚本.exe");
} else if (os.platform() === "darwin") {
  appPath = path.join(process.cwd(), "dist", "Bilibili脚本.app");
}

// 只在有应用路径时设置自启动
if (appPath) {
  const bilibiliAutoLauncher = new AutoLaunch({
    name: "Bilibili脚本",
    path: appPath,
  });

  // 开机自启
  bilibiliAutoLauncher.enable();
}

buildApp();
