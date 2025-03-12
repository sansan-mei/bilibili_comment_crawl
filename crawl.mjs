import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import UserAgent from "user-agents";


const oid = process.argv[2] || process.env.OID
/**
 * @typedef {Object} Comment
 * @property {string} content - 评论内容
 * @property {string} author - 评论作者
 * @property {string} sex - 作者性别
 * @property {number} time - 评论时间戳
 * @property {string} rpid - 评论id
 * @property {Array}  childList - 子评论列表
 * @property {number} replyCount - 子评论数量
 */

/**
 * @param {number} page - 页码
 * @returns {string} 请求URL
 */
const url = (page) => {
  return `https://api.bilibili.com/x/v2/reply/main?csrf=40a227fcf12c380d7d3c81af2cd8c5e8&mode=3&next=${page}&oid=${oid}&plat=1&type=1`;
}

const replyUrl = (rpid) => {
  return `https://api.bilibili.com/x/v2/reply/reply?oid=${oid}&type=1&root=${rpid}&ps=50000&pn=1`;
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
  /** @type {Comment[]} */
  const comments = [];
  let preCommentLength = 0;
  let i = 0;

  while (true) {
    try {
      const response = await axios.get(url(i), {
        headers: header,
      });
      i += 1; // 获取到下一页

      const responseData = response.data;
      const replies = responseData.data.replies
      if (!responseData.data || !replies) {
        continue;
      }

      for (const content of replies) {
        const replyCount = content.rcount

        const commentObj = {
          content: content.content.message,
          author: content.member.uname,
          sex: content.member.sex,
          time: content.ctime,
          rpid: content.rpid,
          childList: [],
          replyCount,
        }
        if (replyCount > 0) {
          await delay()
          const { data: replyResponse } = await axios.get(replyUrl(content.rpid), {
            headers: header,
          })
          commentObj.childList = replyResponse.data.replies.map(reply => ({
            content: reply.content.message,
            author: reply.member.uname,
            sex: reply.member.sex,
            time: reply.ctime,
            rpid: reply.rpid,
          }))
        }
        comments.push(commentObj);
      }

      console.log(`搜集到${comments.reduce((acc, cur) => acc + cur.replyCount, 0)}条评论`);

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

  // 调整代码，将其写成json,同时格式化后再保存
  // 再保存一份txt的
  fs.writeFileSync(
    path.join(__dirname, "bilibili_comment.json"),
    JSON.stringify(comments, null, 2),
    { encoding: "utf-8" }
  );

  const txtContent = comments
    .map((c) => `${c.author}：${c.sex}：${c.time}：${c.content}`)
    .join("\n");
  fs.writeFileSync(path.join(__dirname, "bilibili_comment.txt"), txtContent, {
    encoding: "utf-8",
  });
};

// 执行爬虫
crawlBilibiliComments().catch((error) => {
  console.error("爬虫执行失败:", error);
});
