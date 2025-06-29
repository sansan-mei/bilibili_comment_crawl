#!/usr/bin/env node

import { crawlBilibiliComments } from "#utils/bilibili/index";
import {
  getBVid,
  logStart,
  notifier,
  startInteractiveMode,
} from "#utils/index";
import { fetchYoutubeVideoData } from "#utils/youtube/index";

// 主程序入口
async function main() {
  const bvid = getBVid();
  if (bvid) {
    try {
      await crawlBilibiliComments(bvid);
    } catch (error) {
      console.error("爬虫执行失败:", error);
    }
    notifier.log("\n==================================================");
    notifier.log("爬虫任务已完成，现在进入交互模式");
    notifier.log("==================================================\n");
  } else {
    notifier.log("\n==================================================");
    notifier.log("欢迎使用 Bilibili 信息爬虫");
    notifier.log("==================================================\n");
  }

  // 启动Hapi服务器
  await logStart(handleMap);

  // 启动交互式命令行界面
  startInteractiveMode();
}

/**
 * @param {any} platform
 * @param {string} video_id
 */
function handleMap(platform, video_id) {
  const map = {
    bilibili: crawlBilibiliComments,
    youtube: fetchYoutubeVideoData,
  };
  /** @type {keyof typeof map} */
  const key = platform;
  if (map[key]) {
    map[key](video_id);
  }
}

// 检查命令行参数，如果有 --cmd 或 -cmd 就直接跑 main
if (process.argv.includes("--cmd") || process.argv.includes("-cmd")) {
  main();
}

export { crawlBilibiliComments, main as crawlScript };
