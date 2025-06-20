import axios from "axios";
import { readFileSync } from "fs";
import { join } from "path";
import {
  delay,
  existFile,
  formatCommentsToTxt,
  formatTimestamp,
  getCommentPath,
  getHeaders,
  getMainCommentUrl,
  getOid,
  getReplyUrl,
  notifier,
} from "../index.mjs";

/**
 * 获取B站评论
 * @param {BilibiliDetail} detail - 视频详情
 * @param {string} outputDir - 输出目录
 * @param {string} notifierTitle - 通知标题
 * @returns {Promise<string>} 评论数组
 */
export const fetchBilibiliComments = async (
  detail,
  outputDir,
  notifierTitle
) => {
  /** @type {Array<IComment>} */
  let comments = [];
  let preCommentLength = 0;
  let i = 0;
  let retryCount = 0;
  let noRepliesCount = 0; // 添加计数器，记录连续没有查询到评论的次数
  const MAX_NO_REPLIES = 3; // 最大允许连续没有查询到评论的次数

  /** @计算基数0.1-1 */
  const base = 1;
  const targetCommentCount = Math.floor(detail.reply * base);
  notifier.log(
    `目标获取评论数: ${targetCommentCount}条（总评论数的${base * 100}%）`
  );

  const hasAll = existFile(join(outputDir, "bilibili_all.txt"));
  while (true) {
    if (hasAll) {
      notifier.log("已存在bilibili_all.txt文件，跳过爬取");
      return readFileSync(getCommentPath(outputDir), {
        encoding: "utf-8",
      });
    }
    try {
      notifier.info(`${notifierTitle} 正在获取${i + 1}页评论`);
      const response = await axios.get(getMainCommentUrl(i, getOid()), {
        headers: getHeaders(),
      });
      await delay();
      i += 1; // 获取到下一页

      const responseData = response.data;
      const replies = responseData.data.replies;
      if (!responseData.data || !replies) {
        notifier.log("没有查询到子评论，跳过");
        noRepliesCount++; // 增加计数器

        // 如果连续多次没有查询到评论，可能是cookies失效
        if (noRepliesCount >= MAX_NO_REPLIES) {
          notifier.log(
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
          time: formatTimestamp(content.ctime),
          rpid: content.rpid,
          childList: [],
          replyCount,
          like: content.like,
          member: content.member,
          reply_control: content.reply_control,
        };
        if (replyCount > 0) {
          await delay();
          const { data: replyResponse } = await axios.get(
            getReplyUrl(content.rpid, getOid()),
            {
              headers: getHeaders(),
            }
          );
          /** @type {Array<IComment>} */
          const childComments = replyResponse.data.replies.map(
            /** @param {AnyObject} reply */
            (reply) => ({
              content: reply.content.message,
              author: reply.member.uname,
              sex: reply.member.sex,
              time: formatTimestamp(reply.ctime),
              rpid: reply.rpid,
              like: reply.like,
              reply_control: reply.reply_control,
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

      notifier.log(
        `搜集到${comments.length}条主评论，${totalChildComments}条子评论，总计${
          comments.length + totalChildComments
        }条评论`
      );

      // 检查是否已达到目标评论数量（90%）
      const currentTotalComments =
        comments.length +
        comments.reduce((acc, cur) => acc + cur.replyCount, 0);

      if (currentTotalComments >= targetCommentCount) {
        notifier.log(
          `已达到目标评论数量（${currentTotalComments}/${detail.reply}，${(
            (currentTotalComments / detail.reply) *
            100
          ).toFixed(2)}%），停止爬取`
        );
        break;
      }

      // 调整爬虫策略，上一次评论总数和这一次评论总数进行比较，如果有改变说明有新数据，如果没改变说明数据全部搜集完毕，爬虫停止
      if (comments.length === preCommentLength) {
        notifier.log("爬虫退出！！！");
        break;
      } else {
        preCommentLength = comments.length;
      }
    } catch (error) {
      console.error("请求失败，1秒后重试", error);

      // 添加重试计数器
      retryCount = (retryCount || 0) + 1;
      if (retryCount >= 3) {
        notifier.log("已重试3次，停止爬取更多评论，开始保存已获取的数据");
        break;
      }

      await delay(1000);
    }
  }

  notifier.info(`${notifierTitle} 评论获取完成`);

  return formatCommentsToTxt(comments);
};
