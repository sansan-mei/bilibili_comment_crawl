import { getStaticPath, notifier, sanitizeFilename } from "#utils/index";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fetchVideoInfo } from "./baseInfo.mjs";
import { fetchCommentsUntilCount } from "./comments.mjs";
import { getYoutubeVideoId, mergeYoutubeData } from "./helper.mjs";
import { downloadCaptionsWithYtDlp } from "./subtitle.mjs";

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

    // 清理文件名中的非法字符
    const currentPath = `${staticPath}/${sanitizeFilename(videoInfo.title)}`;

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
    notifier.notify("youtube脚本", `${videoInfo.title}-视频数据获取完成`);
  } catch (error) {
    console.error("获取视频数据失败:", error);
  }
};

export { fetchVideoData as fetchYoutubeVideoData };
