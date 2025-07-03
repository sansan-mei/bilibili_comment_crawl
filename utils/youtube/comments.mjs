import { notifier } from "#utils/notifier";
import { getCommentThreadsUrl } from "./api.mjs";
import { getApiKey } from "./helper.mjs";

/**
 * 获取视频评论直到达到指定数量
 * @param {string} videoId YouTube视频ID
 * @param {number} targetCount 需要获取的评论目标数量
 * @param {"relevance" | "time"} order 评论排序方式，默认为'relevance'（最热门），可选'time'（时间顺序）
 * @returns {Promise<YouTubeComment[]>} 评论数组
 */
export const fetchCommentsUntilCount = async (
  videoId,
  targetCount = 12000,
  order = "relevance"
) => {
  /** @type {YouTubeComment[]} */
  let comments = [];
  let nextPageToken = undefined;

  try {
    while (comments.length < targetCount) {
      const params = new URLSearchParams({
        part: "snippet,replies",
        videoId: videoId,
        key: `${getApiKey()}`,
        maxResults: "500",
        order: order,
      });

      // 添加页码令牌（如果有）
      if (nextPageToken) {
        params.append("pageToken", nextPageToken);
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 800 + Math.random() * 200)
      );
      const response = await fetch(
        `${getCommentThreadsUrl()}?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`API错误: ${response.status} ${response.statusText}`);
      }

      /** @type {YouTubeCommentResponse} */
      const data = await response.json();

      // 提取评论数据
      const newComments = data.items.map((item) => ({
        id: item.id,
        author: item.snippet.topLevelComment.snippet.authorDisplayName,
        text: item.snippet.topLevelComment.snippet.textDisplay,
        publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
        likeCount: item.snippet.topLevelComment.snippet.likeCount,
      }));

      comments = [...comments, ...newComments];
      notifier.info(`已获取 ${comments.length} 条评论`);

      // 更新nextPageToken
      nextPageToken = data.nextPageToken;

      // 如果没有更多页面或已经达到目标数量，退出循环
      if (!nextPageToken || comments.length >= targetCount) {
        notifier.info(`已收集全部公开评论 ${comments.length} 条`);
        break;
      }

      // 添加延迟避免触发API限制
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 如果超过目标数量，截取到目标数量
    if (comments.length > targetCount) {
      comments = comments.slice(0, targetCount);
    }

    return comments;
  } catch (error) {
    console.error("获取评论失败:", error);
    throw error;
  }
};
