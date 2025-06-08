import { execSync } from "child_process";
import { Notification } from "electron";
import os from "os";

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

/**
 * @param {import("electron").NotificationConstructorOptions} obj
 * @param {number} [time=1500]
 */
export async function createNotice(obj, time = 1500) {
  const notice = new Notification({
    ...obj,
  });

  notice.show();

  setTimeout(() => {
    notice.close();
  }, time);
}
