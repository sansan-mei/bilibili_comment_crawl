import { getStaticPath, notifier } from "#utils/index";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { getVideoInfoUrl } from "./api.mjs";
import { fetchCommentsUntilCount } from "./comments.mjs";
import { getApiKey, getYoutubeVideoId, mergeYoutubeData } from "./helper.mjs";
import { downloadCaptionsWithYtDlp } from "./subtitle.mjs";

/**
 * 获取视频基础信息
 * @param {string} videoId YouTube视频ID
 * @returns {Promise<YouTubeVideoInfo>} 视频基础信息对象
 */
const fetchVideoInfo = async (videoId) => {
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

/**
 * 获取完整的视频数据（包括基础信息、评论、字幕列表和字幕内容）
 * @param {string} url YouTube视频URL
 * @param {number} targetCount 评论目标数量
 * @param {"relevance" | "time"} order 评论排序方式
 */
const fetchVideoData = async (
  url,
  targetCount = 12000,
  order = "relevance"
) => {
  const videoId = getYoutubeVideoId(url);
  try {
    notifier.info("开始获取视频数据...");

    // 获取视频基础信息
    const videoInfo = await fetchVideoInfo(videoId);

    const staticPath = await getStaticPath();

    const currentPath = `${staticPath}/${videoInfo.title}`;

    /** @type {YouTubeComment[]} */
    let comments = [];
    /** @type {string} */
    let captionContents = "";

    const videoInfoPath = `${currentPath}/video_info.json`;
    const commentsPath = `${currentPath}/comments.json`;
    const subtitlesPath = `${currentPath}/subtitles.txt`;
    const fullDataPath = `${currentPath}/full_data.txt`;

    if (!existsSync(currentPath)) {
      mkdirSync(currentPath, { recursive: true });
    }

    // 保存视频基础信息到JSON文件
    writeFileSync(videoInfoPath, JSON.stringify(videoInfo, null, 2));
    notifier.info(`视频信息已保存到: ${videoInfoPath}`);

    if (!existsSync(commentsPath)) {
      comments = await fetchCommentsUntilCount(videoId, targetCount, order);
      // 保存评论到JSON文件
      writeFileSync(commentsPath, JSON.stringify(comments, null, 2));
      notifier.info(`评论已保存到: ${commentsPath}`);
    } else {
      comments = JSON.parse(readFileSync(commentsPath, "utf-8"));
      notifier.info("已存在评论数据，跳过获取");
    }

    if (!existsSync(subtitlesPath)) {
      captionContents = await downloadCaptionsWithYtDlp(videoId, currentPath);
      writeFileSync(subtitlesPath, captionContents);
      notifier.info(`字幕内容已保存到: ${subtitlesPath}`);
    } else {
      captionContents = readFileSync(subtitlesPath, "utf-8");
      notifier.info("已存在字幕内容数据，跳过获取");
    }

    const fullData = mergeYoutubeData(videoInfo, comments, captionContents);
    writeFileSync(fullDataPath, fullData);
    notifier.info(`完整数据已保存到: ${fullDataPath}`);

    notifier.info(captionContents ? `字幕内容已获取` : `字幕内容获取失败`);
    notifier.clear();
  } catch (error) {
    console.error("获取视频数据失败:", error);
  }
};

export { fetchVideoData as fetchYoutubeVideoData };
