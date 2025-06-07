import { delay } from "#utils/utils";
import { spawn } from "child_process";
import os from "node:os";

buildApp();

async function buildApp() {
  await delay(2000);
  console.log("开始构建应用...");

  // 根据当前平台决定构建参数
  const buildArgs = ["build", "--publish", "never"];
  if (os.platform() === "darwin") {
    buildArgs.push("--mac");
  } else if (os.platform() === "win32") {
    buildArgs.push("--win");
  }

  return new Promise((resolve, reject) => {
    const buildProcess = spawn("electron-builder", buildArgs, {
      stdio: ["ignore", "pipe", "pipe"], // 捕获stdout和stderr
      shell: true,
      windowsHide: true,
    });

    let output = "";
    let errorOutput = "";

    // 捕获正常输出
    buildProcess.stdout?.on("data", (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(text); // 实时输出到终端
    });

    // 捕获错误输出
    buildProcess.stderr?.on("data", (data) => {
      const text = data.toString();
      errorOutput += text;
      process.stderr.write(text); // 实时输出到终端
    });

    buildProcess.on("close", (code) => {
      console.log(`构建进程已关闭，退出码: ${code}`);

      if (code === 0) {
        console.log("✅ 构建成功！");
        resolve({
          success: true,
          code,
          output,
          errorOutput,
        });
      } else {
        console.log("❌ 构建失败！");
        console.log("错误输出:", errorOutput);
        resolve({
          success: false,
          code,
          output,
          errorOutput,
        });
      }
    });

    buildProcess.on("error", (error) => {
      console.error(`构建进程发生错误: ${error}`);
      reject({
        success: false,
        error: error.message,
        output,
        errorOutput,
      });
    });
  });
}
