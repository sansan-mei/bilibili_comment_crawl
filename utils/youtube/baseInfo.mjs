import { notifier } from "#utils/notifier";
import { getVideoInfoUrl } from "./api.mjs";
import { getApiKey } from "./helper.mjs";

/**
 * 获取视频基础信息
 * @param {string} videoId YouTube视频ID
 * @returns {Promise<YouTubeVideoInfo>} 视频基础信息对象
 */
export const fetchVideoInfo = async (videoId) => {
  try {
    const params = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      id: videoId,
      key: getApiKey(),
    });

    const response = await fetch(`${getVideoInfoUrl()}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`API错误: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      throw new Error("未找到视频信息");
    }

    const video = data.items[0];
    const videoInfo = {
      id: video.id,
      title: video.snippet.title,
      description: video.snippet.description,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      publishedAt: video.snippet.publishedAt,
      duration: video.contentDetails.duration,
      viewCount: video.statistics.viewCount,
      likeCount: video.statistics.likeCount,
      commentCount: video.statistics.commentCount,
      categoryId: video.snippet.categoryId,
      tags: video.snippet.tags || [],
      thumbnails: video.snippet.thumbnails,
    };

    notifier.info(`已获取视频信息: ${videoInfo.title}`);
    notifier.info(
      `观看次数: ${videoInfo.viewCount}, 点赞数: ${videoInfo.likeCount}`
    );

    return videoInfo;
  } catch (error) {
    console.error("获取视频信息失败:", error);
    throw error;
  }
};
