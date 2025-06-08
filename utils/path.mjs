import { join } from "path";

/**
 * @param {string} outputDir
 */
export function getDanmakuPath(outputDir) {
  return join(outputDir, "bilibili_danmaku.txt");
}
/**
 * @param {string} outputDir
 */
export function getCommentPath(outputDir) {
  return join(outputDir, "bilibili_comment.txt");
}

/**
 * @param {string} outputDir
 */
export function getDetailPath(outputDir) {
  return join(outputDir, "bilibili_detail.json");
}

/**
 * @param {string} outputDir
 */
export function getAllPath(outputDir) {
  return join(outputDir, "bilibili_all.txt");
}

/**
 * @param {string} outputDir
 */
export function getSubtitlesPath(outputDir) {
  return join(outputDir, "subtitles.txt");
}

/**
 * @param {string} outputDir
 */
export function getVideoPath(outputDir) {
  return join(outputDir, "current.mp4");
}

/**
 * @param {string} outputDir
 */
export function getAudioPath(outputDir) {
  return join(outputDir, "current.mp3");
}
