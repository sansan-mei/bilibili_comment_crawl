import { execSync, spawn } from "child_process";
import os from "os";
import { delay } from "./utils.mjs";

/**
 * 释放指定端口
 * @param {number} port
 */
export async function killPortProcess(port) {
  try {
    if (os.platform() === "win32") {
      // 查找占用端口的PID
      const res = execSync(`netstat -ano | findstr :${port}`).toString();
      const lines = res.split("\n").filter(Boolean);
      const pids = new Set();
      lines.forEach((line) => {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== "0") pids.add(pid);
      });
      pids.forEach((pid) => {
        try {
          execSync(`taskkill /PID ${pid} /F`);
          console.log(`已杀死占用端口${port}的进程 PID: ${pid}`);
        } catch (e) {
          // 忽略找不到进程的报错
        }
      });
    } else {
      // macOS/Linux
      const res = execSync(`lsof -i :${port} -t || true`).toString();
      const pids = res.split("\n").filter(Boolean);
      pids.forEach((pid) => {
        try {
          execSync(`kill -9 ${pid}`);
          console.log(`已杀死占用端口${port}的进程 PID: ${pid}`);
        } catch (e) {
          // 忽略找不到进程的报错
        }
      });
    }
  } catch (e) {
    // 没有占用时会报错，忽略即可
  }
}

export async function buildApp() {
  await delay(2000);
  console.log("开始后台打包应用...");

  const buildProcess = spawn("pnpm", ["run", "build"], {
    stdio: "ignore", // 完全忽略所有输入输出
    shell: true,
    detached: true,
    windowsHide: true, // Windows 下隐藏窗口
  });

  // 立即分离进程
  buildProcess.unref();

  console.log("构建进程已在后台启动");
  return true;
}
