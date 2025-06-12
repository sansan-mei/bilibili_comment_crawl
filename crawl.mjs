#!/usr/bin/env node

import { fetchBilibiliComments } from "#utils/comments";
import {
  convertToSRT,
  ensureDirectoryExists,
  existFile,
  fetchDanmaku,
  formatDanmakuToTxt,
  getBilibiliDetailUrl,
  getBilibiliVideoStreamUrl,
  getBVid,
  getDanmakuPath,
  getHeaders,
  getStaticPath,
  getSubtitleListUrl,
  getSubtitlesPath,
  getSubtitleUrl,
  logStart,
  notifier,
  processVideoAndAudio,
  processVideoDetail,
  sanitizeFilename,
  saveCommentData,
  startInteractiveMode,
} from "#utils/index";
import axios from "axios";
import fs from "fs";
import { join } from "path";

/** @type {Map<string,'running' | 'ready'>} */
const queue = new Map();

/**
 * 爬取B站评论
 * @param {string} [forceBVid] - 强制使用的BV号（可选）
 * @returns {Promise<void>}
 */
const crawlBilibiliComments = async (forceBVid) => {
  // 使用强制传入的BV号或尝试从环境变量获取
  const bvid = getBVid(forceBVid);

  /** @type {BilibiliDetail} */
  const detail = {
    title: "",
    description: "",
    duration: "",
    owner: "",
    oid: 0,
    view: 0,
    reply: 0,
    favorite: 0,
    coin: 0,
    share: 0,
    like: 0,
    cid: 0,
    danmaku: 0,
  };

  /** @如果有正在运行的，那就推到map然后等运行完再 */
  const taskList = [...queue.values()];
  if (taskList.includes("running") && forceBVid) {
    !queue.has(bvid) &&
      queue.set(bvid, "ready") &&
      notifier.log("\n检测到任务进入队列");
    return;
  }

  if (!bvid) {
    notifier.log("未提供有效的BV号，无法爬取视频");
    return;
  }

  queue.set(bvid, "running");
  notifier.log(`开始爬取视频 ${bvid} 的评论`);

  const { data: detailResponse } = await axios.get(getBilibiliDetailUrl(bvid), {
    headers: getHeaders(),
  });

  processVideoDetail(detail, detailResponse.data);
  notifier.log(`已获取到视频详情：【${detail.title}】\n`);

  process.env.OID = detail.oid.toString();

  // 创建以oid命名的目录，清理文件名中的特殊字符
  const sanitizedTitle = sanitizeFilename(detail.title);

  // 使用统一的路径获取函数
  const basePath = await getStaticPath();
  const outputDir = join(basePath, `${sanitizedTitle}-${detail.oid}`);
  notifier.log(`数据保存到: ${outputDir}`);

  const danmakuFilePath = getDanmakuPath(outputDir);
  const subtitlesPath = getSubtitlesPath(outputDir);

  ensureDirectoryExists(outputDir);

  /** @type {string} */
  let danmakuTxtContent = "";
  /** @type {string} */
  let zimuTextContent = "";
  /** @type {string} */
  let commentTxtContent = "";

  const notifierTitle = `(${detail.title.slice(0, 8)}...)`;

  notifier.info(`${notifierTitle} 正在获取弹幕`);
  if (!existFile(danmakuFilePath)) {
    const danmus = await fetchDanmaku(detail.cid, detail.danmaku);
    notifier.log(
      `成功获取${danmus.length}条弹幕，占总弹幕数的${(
        (danmus.length / detail.danmaku) *
        100
      ).toFixed(2)}%`
    );

    // 将弹幕转换为简单的文本格式
    danmakuTxtContent = formatDanmakuToTxt(danmus);
    fs.writeFileSync(danmakuFilePath, danmakuTxtContent, { encoding: "utf-8" });
    notifier.log(`评论和弹幕已保存到目录: ${outputDir}`);
  } else {
    notifier.log(`弹幕已存在，跳过获取弹幕`);
    danmakuTxtContent = fs.readFileSync(danmakuFilePath, { encoding: "utf-8" });
  }
  notifier.info(`${notifierTitle} 弹幕获取完成`);

  notifier.info(`${notifierTitle} 正在获取字幕`);
  if (!existFile(subtitlesPath)) {
    notifier.log(`开始爬取官方字幕`);
    const { data: subtitleListResponse } = await axios.get(
      getSubtitleListUrl(bvid, detail.cid, detail.oid),
      {
        headers: getHeaders(),
      }
    );

    const subtitleUrl = subtitleListResponse?.data.subtitle.subtitles.find(
      /** @param {BilibiliSubtitle} v */
      (v) => v.lan.includes("zh")
    );

    if (subtitleUrl?.subtitle_url) {
      notifier.log(`已获取到官方字幕URL：${subtitleUrl.subtitle_url}`);
      const { data: subtitleResponse } = await axios.get(
        getSubtitleUrl(subtitleUrl.subtitle_url),
        {
          headers: getHeaders(),
        }
      );
      notifier.log(`已获取到官方字幕内容`);
      /** @type {Array<BilibiliSubtitleDetail>} */
      const subtitleDetail = subtitleResponse.body;
      zimuTextContent = convertToSRT(subtitleDetail);
      fs.writeFileSync(subtitlesPath, zimuTextContent, { encoding: "utf-8" });
    } else {
      notifier.log("没有获取到官方字幕URL，跳过爬取");
    }
  } else {
    notifier.log(`已存在官方字幕，跳过爬取`);
    zimuTextContent = fs.readFileSync(subtitlesPath, { encoding: "utf-8" });
  }
  notifier.info(`${notifierTitle} 字幕获取完成`);

  // 获取评论
  commentTxtContent = await fetchBilibiliComments(
    detail,
    outputDir,
    notifierTitle
  );

  notifier.info(`${notifierTitle} 正在合并数据`);
  const { allPath } = await saveCommentData(
    outputDir,
    commentTxtContent,
    detail,
    danmakuTxtContent,
    zimuTextContent
  );
  notifier.info(`${notifierTitle} 合并数据完成`);

  if (process.env.EXECUTABLE_PATH) {
    const browser = (await import("#utils/browser")).default;
    await browser.run(allPath);
  }

  if (process.env.IS_FETCH_VIDEO_STREAM === "1") {
    const videoInfoUrl = getBilibiliVideoStreamUrl(bvid, detail.cid);
    notifier.info(`${notifierTitle} 已获取到视频流URL`);

    /** @type {{data:BilibiliVideoInfo}} */
    const { data: videoInfoResponse } = await axios.get(videoInfoUrl, {
      headers: getHeaders(),
    });
    // 这是一个mp4视频流地址，需要下载并将音频提取出来转文本？有什么简单的方式？

    const videoUrl = videoInfoResponse.data.durl?.[0]?.url;

    await processVideoAndAudio(outputDir, videoUrl, getHeaders());
    notifier.info(`${notifierTitle} 流处理完成`);
  }

  notifier.notify("哔哩哔哩脚本", `${detail.title}-收集成功`);

  queue.delete(bvid);
  notifier.clear();

  // 检查队列中是否有待执行的任务
  for (const [nextBVid, status] of queue.entries()) {
    if (status === "ready") {
      notifier.log(`\n开始执行队列中的下一个任务: ${nextBVid}`);
      await crawlBilibiliComments(nextBVid);
      break;
    }
  }
};

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
  await logStart(crawlBilibiliComments);

  // 启动交互式命令行界面
  startInteractiveMode();
}

// 检查命令行参数，如果有 --cmd 或 -cmd 就直接跑 main
if (process.argv.includes("--cmd") || process.argv.includes("-cmd")) {
  main();
}

export { crawlBilibiliComments, main as crawlScript };
