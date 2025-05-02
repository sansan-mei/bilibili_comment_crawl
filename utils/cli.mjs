// 交互式命令行界面相关函数
import { execSync } from "child_process";
import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import { fileURLToPath } from "url";
import { crawlBilibiliComments } from "../crawl.mjs";

/**
 * 启动交互式命令行模式，使用inquirer库提供更好的用户体验
 */
export function startInteractiveMode() {
  promptForAction();
}

/**
 * 提示用户选择操作
 */
export async function promptForAction() {
  try {
    const { action } = await inquirer.prompt([
      {
        type: "list",
        name: "action",
        message: "请选择操作:",
        choices: [
          { name: "爬取新视频", value: "crawl" },
          { name: "查看已爬取视频列表", value: "list" },
          { name: "浏览器打开文件列表", value: "open" },
          { name: "帮助信息", value: "help" },
          { name: "退出程序", value: "exit" },
        ],
        loop: false,
      },
    ]);

    switch (action) {
      case "crawl":
        await promptForBVid();
        break;
      case "list":
        await listCrawledVideos();
        break;
      case "help":
        showHelp();
        break;
      case "open":
        openCrawledVideo();
        break;
      case "exit":
        console.log("程序已退出");
        process.exit(0);
        break;
    }
  } catch (error) {
    console.error("发生错误:", error);
    promptForAction();
  }
}

/**
 * 提示用户输入BV号
 */
export async function promptForBVid() {
  const { bvid } = await inquirer.prompt([
    {
      type: "input",
      name: "bvid",
      message: "请输入B站视频BV号:",
      validate: (input) => {
        const bvidMatch = input.match(/BV[a-zA-Z0-9]{10}/);
        if (bvidMatch) {
          return true;
        }
        return "BV号格式错误，请输入正确的BV号或包含BV号的链接";
      },
    },
  ]);

  try {
    await crawlBilibiliComments(bvid);
    console.log(`视频 ${bvid} 的评论爬取完成`);
  } catch (error) {
    console.error(`爬取视频 ${bvid} 失败:`, error);
  }

  promptForAction();
}

/**
 * 列出已爬取的视频
 */
export async function listCrawledVideos() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(__dirname, "../public");
  const dirs = fs
    .readdirSync(rootDir)
    .filter((dir) => fs.lstatSync(path.join(rootDir, dir)).isDirectory())
    .filter((dir) => /\d+$/.test(dir));

  if (dirs.length === 0) {
    console.log("\n暂无爬取记录");
    promptForAction();
    return;
  }

  const choices = dirs.map((dir) => ({
    name: dir,
    value: dir,
  }));

  choices.push({ name: "返回上级菜单", value: "back" });

  const { selectedDir } = await inquirer.prompt([
    {
      type: "list",
      name: "selectedDir",
      message: "已爬取的视频列表:",
      choices: choices,
    },
  ]);

  if (selectedDir === "back") {
    promptForAction();
    return;
  }

  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: `选择对 ${selectedDir} 的操作:`,
      choices: [
        { name: "查看视频详情", value: "view" },
        { name: "返回列表", value: "back" },
      ],
    },
  ]);

  if (action === "view") {
    try {
      const detailPath = path.join(
        rootDir,
        selectedDir,
        "bilibili_detail.json"
      );
      if (fs.existsSync(detailPath)) {
        const detailContent = fs.readFileSync(detailPath, {
          encoding: "utf-8",
        });
        const detail = JSON.parse(detailContent);
        console.log("\n视频详情:");
        console.log(`标题: ${detail.title}`);
        console.log(`观看次数: ${detail.view}`);
        console.log(`评论数: ${detail.reply}`);
        console.log(`弹幕数: ${detail.danmaku}`);
        console.log(`点赞数: ${detail.like}`);
        console.log(`投币数: ${detail.coin}`);
        console.log(`收藏数: ${detail.favorite}`);
        console.log(`分享数: ${detail.share}\n`);
      } else {
        console.log("未找到视频详情文件");
      }
    } catch (error) {
      console.error("读取视频详情失败:", error);
    }
  }

  listCrawledVideos();
}

/**
 * 显示帮助信息
 */
export function showHelp() {
  console.log("\n帮助信息:");
  console.log("1. 爬取新视频 - 输入B站视频BV号，爬取视频评论和弹幕");
  console.log("2. 查看已爬取视频列表 - 显示已爬取的视频列表，可以查看详情");
  console.log("3. 浏览器打开文件列表 - 浏览器打开已爬取的视频文件列表");
  console.log("4. 帮助信息 - 显示本帮助信息");
  console.log("5. 退出程序 - 退出爬虫程序\n");

  promptForAction();
}

/**
 * 浏览器打开已爬取的视频
 */
export async function openCrawledVideo() {
  const platform = process.platform;
  const command = platform === "win32" ? "start" : "open";
  execSync(`${command} http://127.0.0.1:39002`);

  promptForAction();
}
