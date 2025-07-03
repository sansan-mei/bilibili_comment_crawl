import { notifier } from "#utils/notifier";
import {
  existsSync,
  readdirSync,
  readFileSync,
  renameSync,
  unlinkSync,
} from "fs";
import UserAgent from "user-agents";
import { getYTDlpModule } from "./helper.mjs";

/**
 * 使用yt-dlp下载字幕内容
 * @param {string} videoId YouTube视频ID
 * @param {string} outputPath 输出目录
 * @returns {Promise<string>} 字幕内容
 */
export const downloadCaptionsWithYtDlp = async (videoId, outputPath) => {
  try {
    notifier.info("正在使用yt-dlp下载字幕内容...");
    const ytDlp = getYTDlpModule();
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    // 下载字幕文件，添加反检测参数
    const ytDlpArgs = [
      videoUrl,
      "--write-subs", // 下载手动字幕
      "--write-auto-subs", // 下载自动生成字幕
      "--sub-langs",
      "zh,zh-CN,zh-TW,zh-Hans,zh-Hant,en,en-US,en-GB", // 包含常见的中英文语言代码
      "--sub-format",
      "srt", // SRT格式
      "--skip-download", // 不下载视频
      "--user-agent",
      new UserAgent().toString(),
      "--sleep-interval",
      "1", // 请求间隔
      "--max-sleep-interval",
      "3", // 最大间隔
      "-o",
      `${outputPath}/subtitles.%(ext)s`, // 使用模板避免文件名冲突
    ];

    // 如果有cookies环境变量，添加cookies参数
    if (process.env.COOKIES) {
      ytDlpArgs.push("--add-header", `Cookie: ${process.env.COOKIES}`);
    }

    await ytDlp.execPromise(ytDlpArgs);

    // 查找下载的字幕文件并重命名为 subtitles.txt
    try {
      const files = readdirSync(outputPath);
      const subtitleFiles = files.filter((file) => file.endsWith(".srt"));

      if (subtitleFiles.length > 0) {
        // 优先选择中文字幕，其次英文字幕
        const preferredFile =
          subtitleFiles.find(
            (file) =>
              file.includes("zh") ||
              file.includes("cn") ||
              file.includes("Chinese") ||
              file.includes("Hans") ||
              file.includes("Hant")
          ) ||
          subtitleFiles.find(
            (file) => file.includes("en") || file.includes("English")
          ) ||
          subtitleFiles[0];

        notifier.info(`找到的字幕文件: ${subtitleFiles.join(", ")}`);
        notifier.info(`选择的字幕文件: ${preferredFile}`);

        const sourcePath = `${outputPath}/${preferredFile}`;
        const targetPath = `${outputPath}/subtitles.txt`;

        renameSync(sourcePath, targetPath);
        notifier.info(`字幕文件已重命名为: subtitles.txt`);

        // 清理其他字幕文件
        subtitleFiles.forEach((file) => {
          if (file !== preferredFile) {
            try {
              const filePath = `${outputPath}/${file}`;
              if (existsSync(filePath)) {
                unlinkSync(filePath);
              }
            } catch (cleanupError) {
              console.warn(`清理字幕文件失败: ${file}`, cleanupError);
            }
          }
        });
      }
    } catch (renameError) {
      console.warn("重命名字幕文件失败:", renameError);
    }

    // 读取下载的字幕文件
    const captionContents = readFileSync(
      `${outputPath}/subtitles.txt`,
      "utf-8"
    );

    return captionContents;
  } catch (error) {
    console.error(
      "yt-dlp下载字幕失败:",
      error instanceof Error ? error.message : String(error)
    );
    notifier.info("提示：请确保已安装yt-dlp或yt-dlp-wrap能正常工作");
    return "";
  }
};
