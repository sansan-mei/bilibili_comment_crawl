import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import UserAgent from "user-agents";
import {
  delay,
  ensureDirectoryExists,
  existFile,
  fetchDanmaku,
  formatCommentsToTxt,
  formatDanmakuToTxt,
  getBilibiliDetailUrl,
  getBVid,
  getMainCommentUrl,
  getOid,
  getReplyUrl,
  mergeTxt,
  processVideoDetail,
  sanitizeFilename
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
 * @property {number} cid - 读取评论所需要的id
 */


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

  const { data: detailResponse } = await axios.get(
    getBilibiliDetailUrl(getBVid()),
    {
      headers: header,
    }
  );

  processVideoDetail(detail, detailResponse.data);
  console.log('已获取到视频详情')

  process.env.OID = detail.oid.toString();

  // 创建以oid命名的目录，清理文件名中的特殊字符
  const sanitizedTitle = sanitizeFilename(detail.title);
  const outputDir = path.join(__dirname, `${sanitizedTitle}-${detail.oid}`);
  ensureDirectoryExists(outputDir);

  const danmakuFilePath = path.join(outputDir, "bilibili_danmaku.txt");
  let danmakuTxtContent = ''

  /** @做一个函数，当读取到的弹幕数量有detail.danmaku的80%时就不读取 */
  if (!existFile(danmakuFilePath)) {
    const danmus = await fetchDanmaku(detail.cid, detail.danmaku);
    console.log(`成功获取${danmus.length}条弹幕，占总弹幕数的${((danmus.length / detail.danmaku) * 100).toFixed(2)}%`);

    // 将弹幕转换为简单的文本格式
    danmakuTxtContent = formatDanmakuToTxt(danmus);
    fs.writeFileSync(
      danmakuFilePath,
      danmakuTxtContent,
      { encoding: "utf-8" }
    );
    console.log(`评论和弹幕已保存到目录: ${outputDir}`);
  } else {
    console.log(`弹幕已存在，跳过获取弹幕`);
  }

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
        console.log('没有查询到子评论，跳过')
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

      // 添加重试计数器
      retryCount = (retryCount || 0) + 1;
      if (retryCount >= 3) {
        console.log("已重试3次，停止爬取更多评论，开始保存已获取的数据");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`搜集到${detail.reply}条评论`);

  const txtContent = formatCommentsToTxt(comments);

  fs.writeFileSync(path.join(outputDir, "bilibili_comment.txt"), txtContent, {
    encoding: "utf-8",
  });

  fs.writeFileSync(path.join(outputDir, "bilibili_detail.json"), JSON.stringify(detail, null, 2), {
    encoding: "utf-8",
  });

  const allTxtContent = mergeTxt(JSON.stringify(detail), txtContent, danmakuTxtContent);
  fs.writeFileSync(path.join(outputDir, "bilibili_all.txt"), allTxtContent, {
    encoding: "utf-8",
  });

  console.log(`评论已保存到目录: ${outputDir}`);
};

// 执行爬虫
crawlBilibiliComments().catch((error) => {
  console.error("爬虫执行失败:", error);
});
