// 文件系统操作相关函数
import fs from "fs";
import path from "path";
import { formatCommentsToTxt, mergeTxt } from "./format.mjs";

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 文件是否存在
 */
export const existFile = (filePath) => {
  return fs.existsSync(filePath);
};

/**
 * 保存评论和相关数据到文件
 * @param {string} outputDir - 输出目录路径
 * @param {AnyArray} comments - 评论数据
 * @param {BilibiliDetail} detail - 视频详情
 * @param {string} danmakuTxtContent - 弹幕内容
 * @returns {Promise<{allPath: string, commentPath: string, detailPath: string, danmakuPath: string}>}
 */
export const saveCommentData = async (
  outputDir,
  comments,
  detail,
  danmakuTxtContent
) => {
  const allPath = path.join(outputDir, "bilibili_all.txt");
  const commentPath = path.join(outputDir, "bilibili_comment.txt");
  const detailPath = path.join(outputDir, "bilibili_detail.json");
  const danmakuPath = path.join(outputDir, "bilibili_danmaku.txt");
  // 格式化评论为文本
  const txtContent = formatCommentsToTxt(comments);

  // 保存评论到文件
  fs.writeFileSync(commentPath, txtContent, {
    encoding: "utf-8",
  });

  // 保存视频详情到文件
  fs.writeFileSync(detailPath, JSON.stringify(detail, null, 2), {
    encoding: "utf-8",
  });

  // 合并所有内容并保存
  const allTxtContent = mergeTxt(
    JSON.stringify(detail),
    txtContent,
    danmakuTxtContent
  );
  fs.writeFileSync(allPath, allTxtContent, {
    encoding: "utf-8",
  });

  return {
    allPath,
    commentPath,
    detailPath,
    danmakuPath,
  };
};
