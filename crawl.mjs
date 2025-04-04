#!/usr/bin/env node

import {
  delay,
  ensureDirectoryExists,
  existFile,
  fetchDanmaku,
  formatDanmakuToTxt,
  getBilibiliDetailUrl,
  getBVid,
  getMainCommentUrl,
  getOid,
  getReplyUrl,
  logStart,
  processVideoDetail,
  sanitizeFilename,
  saveCommentData,
  startInteractiveMode,
} from "#utils/index";
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import UserAgent from "user-agents";

const header = {
  "user-agent": new UserAgent().toString(),
  cookie: process.env.COOKIES,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {Map<string,'running' | 'ready'>} */
const queue = new Map();

/**
 * 爬取B站评论
 * @param {string} [forceBVid] - 强制使用的BV号（可选）
 * @returns {Promise<void>}
 */
const crawlBilibiliComments = async (forceBVid) => {
  /** @如果有正在运行的，那就推到map然后等运行完再 */
  const taskList = [...queue.values()];
  if (taskList.includes("running") && forceBVid) {
    !queue.has(forceBVid) && queue.set(forceBVid, "ready");
    return;
  }

  /** @type {Array<IComment>} */
  const comments = [];
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
  let preCommentLength = 0;
  let i = 0;
  let retryCount = 0;
  let noRepliesCount = 0; // 添加计数器，记录连续没有查询到评论的次数
  const MAX_NO_REPLIES = 3; // 最大允许连续没有查询到评论的次数

  // 使用强制传入的BV号或尝试从环境变量获取
  const bvid = getBVid(forceBVid);

  if (!bvid) {
    console.log("未提供有效的BV号，无法爬取视频");
    return;
  }

  queue.set(bvid, "running");
  console.log(`开始爬取视频 ${bvid} 的评论`);

  const { data: detailResponse } = await axios.get(getBilibiliDetailUrl(bvid), {
    headers: header,
  });

  processVideoDetail(detail, detailResponse.data);
  console.log(`已获取到视频详情：【${detail.title}】\n`);

  process.env.OID = detail.oid.toString();

  // 创建以oid命名的目录，清理文件名中的特殊字符
  const sanitizedTitle = sanitizeFilename(detail.title);
  const outputDir = path.join(__dirname, `${sanitizedTitle}-${detail.oid}`);
  ensureDirectoryExists(outputDir);

  const danmakuFilePath = path.join(outputDir, "bilibili_danmaku.txt");
  let danmakuTxtContent = "";

  /** @做一个函数，当读取到的弹幕数量有detail.danmaku的80%时就不读取 */
  if (!existFile(danmakuFilePath)) {
    const danmus = await fetchDanmaku(detail.cid, detail.danmaku);
    console.log(
      `成功获取${danmus.length}条弹幕，占总弹幕数的${(
        (danmus.length / detail.danmaku) *
        100
      ).toFixed(2)}%`
    );

    // 将弹幕转换为简单的文本格式
    danmakuTxtContent = formatDanmakuToTxt(danmus);
    fs.writeFileSync(danmakuFilePath, danmakuTxtContent, { encoding: "utf-8" });
    console.log(`评论和弹幕已保存到目录: ${outputDir}`);
  } else {
    console.log(`弹幕已存在，跳过获取弹幕`);
    danmakuTxtContent = fs.readFileSync(danmakuFilePath, { encoding: "utf-8" });
  }

  // 计算目标评论数量（90%的总评论数）
  const targetCommentCount = Math.floor(detail.reply * 0.9);
  console.log(`目标获取评论数: ${targetCommentCount}条（总评论数的90%）`);

  while (true) {
    try {
      const response = await axios.get(getMainCommentUrl(i, getOid()), {
        headers: header,
      });
      await delay();
      i += 1; // 获取到下一页

      const responseData = response.data;
      const replies = responseData.data.replies;
      if (!responseData.data || !replies) {
        console.log("没有查询到子评论，跳过");
        noRepliesCount++; // 增加计数器

        // 如果连续多次没有查询到评论，可能是cookies失效
        if (noRepliesCount >= MAX_NO_REPLIES) {
          console.log(
            `连续${MAX_NO_REPLIES}次没有查询到评论，请检查cookies是否失效`
          );
          break; // 退出循环
        }

        continue;
      }

      // 如果查询到了评论，重置计数器
      noRepliesCount = 0;

      for (const content of replies) {
        const replyCount = content.rcount;

        /** @type {IComment} */
        const commentObj = {
          content: content.content.message,
          author: content.member.uname,
          sex: content.member.sex,
          time: content.ctime,
          rpid: content.rpid,
          childList: [],
          replyCount,
          like: content.like,
        };
        if (replyCount > 0) {
          await delay();
          const { data: replyResponse } = await axios.get(
            getReplyUrl(content.rpid, getOid()),
            {
              headers: header,
            }
          );
          /** @type {Array<IComment>} */
          const childComments = replyResponse.data.replies.map(
            /** @param {AnyObject} reply */
            (reply) => ({
              content: reply.content.message,
              author: reply.member.uname,
              sex: reply.member.sex,
              time: reply.ctime,
              rpid: reply.rpid,
              like: reply.like,
            })
          );
          commentObj.childList = childComments;
        }
        comments.push(commentObj);
      }

      const totalChildComments = comments.reduce(
        (acc, cur) => acc + cur.replyCount,
        0
      );

      console.log(
        `搜集到${comments.length}条主评论，${totalChildComments}条子评论，总计${
          comments.length + totalChildComments
        }条评论`
      );

      // 检查是否已达到目标评论数量（90%）
      const currentTotalComments =
        comments.length +
        comments.reduce((acc, cur) => acc + cur.replyCount, 0);

      if (currentTotalComments >= targetCommentCount) {
        console.log(
          `已达到目标评论数量（${currentTotalComments}/${detail.reply}，${(
            (currentTotalComments / detail.reply) *
            100
          ).toFixed(2)}%），停止爬取`
        );
        break;
      }

      // 调整爬虫策略，上一次评论总数和这一次评论总数进行比较，如果有改变说明有新数据，如果没改变说明数据全部搜集完毕，爬虫停止
      if (comments.length === preCommentLength) {
        console.log("爬虫退出！！！");
        break;
      } else {
        preCommentLength = comments.length;
      }
    } catch (error) {
      console.error("请求失败，1秒后重试", error);

      // 添加重试计数器
      retryCount = (retryCount || 0) + 1;
      if (retryCount >= 3) {
        console.log("已重试3次，停止爬取更多评论，开始保存已获取的数据");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(
    `搜集到${comments.length}条主评论，共计${
      comments.length + comments.reduce((acc, cur) => acc + cur.replyCount, 0)
    }条评论（包括子评论）`
  );

  // 调用封装的函数保存数据
  const { allPath } = await saveCommentData(
    outputDir,
    comments,
    detail,
    danmakuTxtContent
  );

  console.log(`评论已保存到目录: ${outputDir}`);

  if (process.env.executablePath) {
    const browser = (await import("#utils/browser")).default;
    await browser.run(allPath);
  }

  queue.delete(bvid);
  // 检查队列中是否有待执行的任务
  for (const [nextBVid, status] of queue.entries()) {
    if (status === "ready") {
      console.log(`\n开始执行队列中的下一个任务: ${nextBVid}`);
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
    console.log("\n==================================================");
    console.log("爬虫任务已完成，现在进入交互模式");
    console.log("==================================================\n");
  } else {
    console.log("\n==================================================");
    console.log("欢迎使用 Bilibili 评论爬虫");
    console.log("==================================================\n");
  }

  // 启动Hapi服务器
  await logStart(crawlBilibiliComments);
  // 启动交互式命令行界面
  startInteractiveMode();
}

// 执行主程序
main().catch((error) => {
  console.error("程序运行失败:", error);
});

export { crawlBilibiliComments };
