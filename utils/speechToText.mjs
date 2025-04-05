import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";
import { spawn } from "child_process";
import fs from "fs";
import vosk from "vosk";

/**
 * 检查模型是否已下载
 * @param {string} modelPath - 模型路径
 * @returns {boolean} - 是否存在模型
 */
const checkModel = (modelPath) => {
  return fs.existsSync(modelPath);
};

/**
 * 从音频文件生成字幕文本
 * @param {string} audioPath - 音频文件路径 (.mp3)
 * @param {string} modelPath - Vosk模型路径，默认为"model"
 * @param {number} sampleRate - 音频采样率，默认为16000
 * @param {number} bufferSize - 缓冲区大小，默认为4000
 * @returns {Promise<string>} - 返回识别的文本
 */
export const audioToText = async (
  audioPath,
  modelPath = "model",
  sampleRate = 16000,
  bufferSize = 4000
) => {
  // 检查模型是否存在
  if (!checkModel(modelPath)) {
    throw new Error(
      `请从 https://alphacephei.com/vosk/models 下载模型并解压到 ${modelPath} 目录`
    );
  }

  // 检查音频文件是否存在
  if (!fs.existsSync(audioPath)) {
    throw new Error(`音频文件 ${audioPath} 不存在`);
  }

  return new Promise((resolve, reject) => {
    try {
      // 设置日志级别
      vosk.setLogLevel(0);

      // 初始化模型和识别器
      const model = new vosk.Model(modelPath);
      const recognizer = new vosk.Recognizer({
        model: model,
        sampleRate: sampleRate,
      });

      let completeText = "";

      // 使用ffmpeg处理音频
      const ffmpeg_process = spawn(ffmpegInstaller.path, [
        "-loglevel",
        "quiet",
        "-i",
        audioPath,
        "-ar",
        String(sampleRate),
        "-ac",
        "1",
        "-f",
        "s16le",
        "-bufsize",
        String(bufferSize),
        "-",
      ]);

      ffmpeg_process.stdout.on("data", (data) => {
        if (recognizer.acceptWaveform(data)) {
          const result = recognizer.result();
          if (result.text) {
            completeText += result.text + " ";
          }
        }
      });

      ffmpeg_process.stderr.on("data", (data) => {
        console.error(`ffmpeg 错误: ${data}`);
      });

      ffmpeg_process.on("close", (code) => {
        // 获取最终结果
        const finalResult = recognizer.finalResult();
        if (finalResult.text) {
          completeText += finalResult.text;
        }

        // 释放资源
        recognizer.free();
        model.free();

        resolve(completeText.trim());
      });

      ffmpeg_process.on("error", (err) => {
        reject(`ffmpeg 进程错误: ${err.message}`);
      });
    } catch (error) {
      if (error instanceof Error) {
        reject(`语音识别错误: ${error.message}`);
      } else {
        reject(`语音识别错误: ${error}`);
      }
    }
  });
};

/**
 * 生成带时间戳的字幕文件 (SRT格式)
 * @param {string} audioPath - 音频文件路径
 * @param {string} outputPath - 输出SRT文件路径
 * @param {string} modelPath - Vosk模型路径，默认为"model"
 * @returns {Promise<string>} - 返回生成的SRT文件路径
 */
export const generateSubtitles = async (audioPath, outputPath, modelPath) => {
  // 检查模型是否存在
  if (!checkModel(modelPath)) {
    throw new Error(
      `请从 https://alphacephei.com/vosk/models 下载模型并解压到 ${modelPath} 目录`
    );
  }

  // 检查音频文件是否存在
  if (!fs.existsSync(audioPath)) {
    throw new Error(`音频文件 ${audioPath} 不存在`);
  }

  return new Promise((resolve, reject) => {
    try {
      // 设置日志级别
      vosk.setLogLevel(0);

      // 初始化模型和识别器
      const model = new vosk.Model(modelPath);
      const recognizer = new vosk.Recognizer({
        model: model,
        sampleRate: 16000,
      });

      // 启用词级别时间戳
      recognizer.setWords(true);

      let subtitles = [];
      let subtitleIndex = 1;

      // 使用ffmpeg处理音频
      const ffmpeg_process = spawn(ffmpegInstaller.path, [
        "-loglevel",
        "quiet",
        "-i",
        audioPath,
        "-ar",
        "16000",
        "-ac",
        "1",
        "-f",
        "s16le",
        "-",
      ]);

      ffmpeg_process.stdout.on("data", (data) => {
        if (recognizer.acceptWaveform(data)) {
          const result = JSON.parse(JSON.stringify(recognizer.result()));
          if (result.result && result.result.length > 0) {
            // 处理一个句子
            const firstWord = result.result[0];
            const lastWord = result.result[result.result.length - 1];

            const startTime = firstWord.start;
            const endTime = lastWord.end;
            const text = result.text;

            if (text.trim()) {
              subtitles.push({
                index: subtitleIndex++,
                startTime,
                endTime,
                text,
              });
            }
          }
        }
      });

      ffmpeg_process.stderr.on("data", (data) => {
        console.error(`ffmpeg 错误: ${data}`);
      });

      ffmpeg_process.on("close", (code) => {
        // 获取最终结果
        const finalResult = JSON.parse(
          JSON.stringify(recognizer.finalResult())
        );
        if (finalResult.result && finalResult.result.length > 0) {
          const firstWord = finalResult.result[0];
          const lastWord = finalResult.result[finalResult.result.length - 1];

          const startTime = firstWord.start;
          const endTime = lastWord.end;
          const text = finalResult.text;

          if (text.trim()) {
            subtitles.push({
              index: subtitleIndex++,
              startTime,
              endTime,
              text,
            });
          }
        }

        // 生成SRT文件内容
        let srtContent = "";
        subtitles.forEach((subtitle) => {
          const startTimeFormatted = formatTime(subtitle.startTime);
          const endTimeFormatted = formatTime(subtitle.endTime);

          srtContent += `${subtitle.index}\n`;
          srtContent += `${startTimeFormatted} --> ${endTimeFormatted}\n`;
          srtContent += `${subtitle.text}\n\n`;
        });

        // 写入SRT文件
        fs.writeFileSync(outputPath, srtContent);

        // 释放资源
        recognizer.free();
        model.free();

        resolve(outputPath);
      });

      ffmpeg_process.on("error", (err) => {
        reject(`ffmpeg 进程错误: ${err.message}`);
      });
    } catch (error) {
      if (error instanceof Error) {
        reject(`字幕生成错误: ${error.message}`);
      } else {
        reject(`字幕生成错误: ${error}`);
      }
    }
  });
};

/**
 * 将秒数格式化为SRT时间格式 (00:00:00,000)
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化的时间字符串
 */
function formatTime(seconds) {
  const date = new Date(seconds * 1000);
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const secs = String(date.getUTCSeconds()).padStart(2, "0");
  const ms = String(date.getUTCMilliseconds()).padStart(3, "0");

  return `${hours}:${minutes}:${secs},${ms}`;
}
