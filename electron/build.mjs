import { buildApp } from "#utils/electron";
import AutoLaunch from "auto-launch";
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

buildApp();
