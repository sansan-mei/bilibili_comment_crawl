import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";
import { existFile } from "./file.mjs";
import { generateSubtitles } from "./speechToText.mjs";
import { downloadVideo } from "./utils.mjs";

// 设置ffmpeg路径
ffmpeg.setFfmpegPath(ffmpegInstaller.path);

/**
 * 提取视频音频
 * @param {string} videoPath - 视频路径
 * @param {string} audioPath - 音频路径
 * @returns {Promise<any>}
 */
export const extractAudio = (videoPath, audioPath) => {
  return new Promise((resolve, reject) => {
    ffmpeg(videoPath)
      .outputOptions("-vn")
      .audioCodec("libmp3lame")
      .audioFrequency(16000)
      .audioChannels(1)
      .format("mp3")
      .output(audioPath)
      .on("end", resolve)
      .on("error", reject)
      .run();
  });
};

export { ffmpeg };

/**
 * 处理视频和音频
 * @param {string} videoPath - 视频路径
 * @param {string} audioPath - 音频路径
 * @param {string} videoUrl - 视频URL
 * @param {string} subtitlesPath - 字幕路径
 * @param {Object} header - 请求头
 */
export const processVideoAndAudio = async (
  videoPath,
  audioPath,
  videoUrl,
  subtitlesPath,
  header
) => {
  try {
    // 检查视频和音频是否已存在
    const hasVideo = existFile(videoPath);
    const hasAudio = existFile(audioPath);
    const hasSubtitles = existFile(subtitlesPath);

    // 如果视频和音频都已有
    if (hasVideo && hasAudio) {
      if (hasSubtitles) {
        console.log(`资源已存在，跳过下载和处理`);
        return;
      } else {
        console.log(`视频和音频已存在，尝试生成字幕`);
      }
    }

    // 下载视频
    if (!hasVideo) {
      await downloadVideo(videoUrl, videoPath, header);
      console.log("\n================================");
      console.log(`视频下载完成并保存到: ${videoPath}`);
      console.log("===============================\n");
    }

    // 提取音频
    if (!hasAudio) {
      await extractAudio(videoPath, audioPath);
      console.log("\n================================");
      console.log(`音频提取完成并保存到: ${audioPath}`);
      console.log("===============================\n");
    }

    if (!hasSubtitles && process.env.MODEL_PATH) {
      // 尝试生成字幕，即使失败也不会影响整体流程
      try {
        console.log("\n================================");
        console.log(`开始生成字幕`);
        await generateSubtitles(audioPath, subtitlesPath, process.env.MODEL_PATH);
        console.log(`字幕生成完成并保存到: ${subtitlesPath}`);
        console.log("===============================\n");
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn(`字幕生成失败: ${errorMessage}`);
        console.log(`继续处理其他任务...`);
      }
    }
  } catch (error) {
    console.error("处理视频和音频时出错:", error);
  }
};
