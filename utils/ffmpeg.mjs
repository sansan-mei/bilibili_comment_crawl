import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

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
