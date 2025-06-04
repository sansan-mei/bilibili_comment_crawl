import { execSync } from "child_process";
import os from "os";

/**
 *
 * @param {import("child_process").ChildProcessWithoutNullStreams} child
 */
export function handleChildProcess(child) {
  // 合并 data 事件，按行输出，过滤控制字符
  let stdoutBuffer = "";
  child.stdout.on("data", (data) => {
    stdoutBuffer += data.toString("utf8");
    let lines = stdoutBuffer.split("\n");
    stdoutBuffer = lines.pop() ?? ""; // 保证为string
    lines.forEach((line) =>
      process.stdout.write(
        (line ?? "").replace(/[\x00-\x1F\x7F-\x9F]/g, "") + "\n"
      )
    );
  });
  child.stdout.on("end", () => {
    if (stdoutBuffer) process.stdout.write(stdoutBuffer);
  });

  let stderrBuffer = "";
  child.stderr.on("data", (data) => {
    stderrBuffer += data.toString("utf8");
    let lines = stderrBuffer.split("\n");
    stderrBuffer = lines.pop() ?? "";
    lines.forEach((line) =>
      process.stderr.write(
        (line ?? "").replace(/[\x00-\x1F\x7F-\x9F]/g, "") + "\n"
      )
    );
  });
  child.stderr.on("end", () => {
    if (stderrBuffer) process.stderr.write(stderrBuffer);
  });

  child.on("close", (code) => {
    console.log(`子进程退出，code: ${code}`);
  });
}

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
