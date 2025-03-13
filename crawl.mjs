import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import UserAgent from "user-agents";
import {
  delay,
  ensureDirectoryExists,
  formatCommentsToTxt,
  getBilibiliDetailUrl,
  getMainCommentUrl,
  getReplyUrl,
} from "./utils/index.mjs";

/**
 * @typedef {Object} Comment
 * @property {string} content - 评论内容
 * @property {string} author - 评论作者
 * @property {string} sex - 作者性别
 * @property {number} time - 评论时间戳
 * @property {string} rpid - 评论id
 * @property {Array<Comment>}  childList - 子评论列表
 * @property {number} replyCount - 子评论数量
 */

/**
 * @typedef {Object} BilibiliDetail
 * @property {string} title - 视频标题
 * @property {string} description - 视频描述
 * @property {string} duration - 视频时长
 * @property {string} owner - 视频作者
 * @property {number} oid - 视频另一个id
 * @property {number} view - 视频播放量
 * @property {number} danmaku - 视频弹幕量
 * @property {number} reply - 视频评论量
 * @property {number} favorite - 视频收藏量
 * @property {number} coin - 视频投币量
 * @property {number} share - 视频分享量
 * @property {number} like - 视频点赞量
 */

// 获取环境变量，TypeScript 可以正确推断类型
function getOid() {
  return process.env.OID;
}

function getBVid() {
  return process.argv[2]?.includes("BV") ? process.argv[2] : process.env.B_VID;
}

const header = {
  "user-agent": new UserAgent().toString(),
  cookie: process.env.COOKIES,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 爬取B站评论
 * @returns {Promise<void>}
 */
const crawlBilibiliComments = async () => {
  /** @type {Array<Comment>} */
  const comments = [];
  /** @type {BilibiliDetail} */
  const detail = {};
  let preCommentLength = 0;
  let i = 0;

  const { data: detailResponse } = await axios.get(
    getBilibiliDetailUrl(getBVid()),
    {
      headers: header,
    }
  );
  detail.title = detailResponse.data.title;
  detail.description = detailResponse.data.desc;
  detail.oid = detailResponse.data.aid;
  detail.view = detailResponse.data.stat.view;
  detail.danmaku = detailResponse.data.stat.danmaku;
  detail.reply = detailResponse.data.stat.reply;
  detail.favorite = detailResponse.data.stat.favorite;
  detail.coin = detailResponse.data.stat.coin;
  detail.share = detailResponse.data.stat.share;
  detail.like = detailResponse.data.stat.like;

  process.env.OID = detail.oid.toString();

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
        continue;
      }

      for (const content of replies) {
        const replyCount = content.rcount;

        /** @type {Comment} */
        const commentObj = {
          content: content.content.message,
          author: content.member.uname,
          sex: content.member.sex,
          time: content.ctime,
          rpid: content.rpid,
          childList: [],
          replyCount,
        };
        if (replyCount > 0) {
          await delay();
          const { data: replyResponse } = await axios.get(
            getReplyUrl(content.rpid, getOid()),
            {
              headers: header,
            }
          );
          /** @type {Array<Comment>} */
          const childComments = replyResponse.data.replies.map(
            /** @param {any} reply */
            (reply) => ({
              content: reply.content.message,
              author: reply.member.uname,
              sex: reply.member.sex,
              time: reply.ctime,
              rpid: reply.rpid,
            })
          );
          commentObj.childList = childComments;
        }
        comments.push(commentObj);
      }

      console.log(
        `搜集到${comments.reduce(
          (acc, cur) => acc + cur.replyCount,
          0
        )}条子评论`
      );

      // 调整爬虫策略，上一次评论总数和这一次评论总数进行比较，如果有改变说明有新数据，如果没改变说明数据全部搜集完毕，爬虫停止
      if (comments.length === preCommentLength) {
        console.log("爬虫退出！！！");
        break;
      } else {
        preCommentLength = comments.length;
      }
    } catch (error) {
      console.error("请求失败，1秒后重试", error);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`搜集到${detail.reply}条评论`);

  // 调整代码，将其写成json,同时格式化后再保存
  // 再保存一份txt的

  // 创建以oid命名的目录
  const outputDir = path.join(__dirname, `${detail.title}-${detail.oid}`);
  ensureDirectoryExists(outputDir);

  fs.writeFileSync(
    path.join(outputDir, "bilibili_comment.json"),
    JSON.stringify(comments, null, 2),
    { encoding: "utf-8" }
  );

  const txtContent = formatCommentsToTxt(comments);

  fs.writeFileSync(path.join(outputDir, "bilibili_comment.txt"), txtContent, {
    encoding: "utf-8",
  });

  fs.writeFileSync(path.join(outputDir, "bilibili_detail.json"), JSON.stringify(detail, null, 2), {
    encoding: "utf-8",
  });

  console.log(`评论已保存到目录: ${outputDir}`);
};

// 执行爬虫
crawlBilibiliComments().catch((error) => {
  console.error("爬虫执行失败:", error);
});
