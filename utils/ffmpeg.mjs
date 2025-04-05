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
    // 如果视频已经有了，那就跳过
    if (existFile(videoPath) && existFile(audioPath)) {
      console.log(`资源已存在，跳过下载`);
      return;
    }

    // 下载视频
    if (!existFile(videoPath)) {
      await downloadVideo(videoUrl, videoPath, header);
      console.log("\n================================");
      console.log(`视频下载完成并保存到: ${videoPath}`);
      console.log("===============================\n");
    }

    // 提取音频
    if (!existFile(audioPath)) {
      await extractAudio(videoPath, audioPath);
      console.log("\n================================");
      console.log(`音频提取完成并保存到: ${audioPath}`);
      console.log("===============================\n");
    }

    if (!existFile(subtitlesPath)) {
      // 生成字幕
      console.log("\n================================");
      console.log(`开始生成字幕`);
      await generateSubtitles(audioPath, subtitlesPath, process.env.MODEL_PATH);
      console.log(`字幕生成完成并保存到: ${subtitlesPath}`);
      console.log("===============================\n");
    }
  } catch (error) {
    console.error("处理视频和音频时出错:", error);
  }
};
