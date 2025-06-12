// 文件系统操作相关函数
import fs, { existsSync, mkdirSync } from "fs";
import {
  filterObject,
  getAllPath,
  getCommentPath,
  getDanmakuPath,
  getDetailPath,
  mergeTxt,
} from "./index.mjs";

/**
 * 确保目录存在
 * @param {string} dirPath - 目录路径
 */
export const ensureDirectoryExists = (dirPath) => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 文件是否存在
 */
export const existFile = (filePath) => {
  return existsSync(filePath);
};

/**
 * 保存评论和相关数据到文件
 * @param {string} outputDir - 输出目录路径
 * @param {string} comments - 评论数据
 * @param {BilibiliDetail} detail - 视频详情
 * @param {string} danmakuTxtContent - 弹幕内容
 * @param {string} zimuTextContent - 字幕内容
 * @returns {Promise<{allPath: string, commentPath: string, detailPath: string, danmakuPath: string}>}
 */
export const saveCommentData = async (
  outputDir,
  comments,
  detail,
  danmakuTxtContent,
  zimuTextContent
) => {
  const allPath = getAllPath(outputDir);
  const commentPath = getCommentPath(outputDir);
  const detailPath = getDetailPath(outputDir);
  const danmakuPath = getDanmakuPath(outputDir);

  // 保存评论到文件
  fs.writeFileSync(commentPath, comments, {
    encoding: "utf-8",
  });

  // 保存视频详情到文件
  fs.writeFileSync(detailPath, JSON.stringify(detail, null, 2), {
    encoding: "utf-8",
  });

  // 合并所有内容并保存
  const allTxtContent = mergeTxt(
    JSON.stringify(filterObject(detail, ["oid", "cid"])),
    comments,
    danmakuTxtContent,
    zimuTextContent
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
