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
  processVideoDetail,
  sanitizeFilename,
  saveCommentData
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


/**
 * 爬取B站评论
 * @returns {Promise<void>}
 */
const crawlBilibiliComments = async () => {
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
        console.log('没有查询到子评论，跳过');
        noRepliesCount++; // 增加计数器

        // 如果连续多次没有查询到评论，可能是cookies失效
        if (noRepliesCount >= MAX_NO_REPLIES) {
          console.log(`连续${MAX_NO_REPLIES}次没有查询到评论，请检查cookies是否失效`);
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
        `搜集到${comments.length}条主评论，${totalChildComments}条子评论，总计${comments.length + totalChildComments}条评论`
      );

      // 检查是否已达到目标评论数量（90%）
      const currentTotalComments = comments.length + comments.reduce(
        (acc, cur) => acc + cur.replyCount,
        0
      );

      if (currentTotalComments >= targetCommentCount) {
        console.log(`已达到目标评论数量（${currentTotalComments}/${detail.reply}，${((currentTotalComments / detail.reply) * 100).toFixed(2)}%），停止爬取`);
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

  console.log(`搜集到${comments.length}条主评论，共计${comments.length + comments.reduce((acc, cur) => acc + cur.replyCount, 0)}条评论（包括子评论）`);

  // 调用封装的函数保存数据
  const { allPath } = await saveCommentData(outputDir, comments, detail, danmakuTxtContent);

  console.log(`评论已保存到目录: ${outputDir}`);

  if (process.env.executablePath) {
    const browser = (await import('#utils/browser')).default
    await browser.run(allPath)
  }
};



// 执行爬虫
crawlBilibiliComments().catch((error) => {
  console.error("爬虫执行失败:", error);
});
