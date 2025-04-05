// 通用工具函数

import axios from "axios";
import fs from "fs";
import { createWriteStream } from "node:fs";

/**
 * 延时函数
 * @param {number} ms - 延时毫秒数，默认400ms
 * @returns {Promise<void>} - Promise对象
 */
export const delay = (ms = 400) =>
  new Promise((resolve) =>
    setTimeout(resolve, ms + Math.floor(Math.random() * 800))
  );

/**
 * 清理文件名，移除不允许的特殊字符
 * @param {string} filename - 原始文件名
 * @returns {string} - 清理后的文件名
 */
export const sanitizeFilename = (filename) => {
  // 替换Windows和大多数文件系统不允许的字符
  return filename.replace(/[\\/:*?"<>|]/g, "_");
};

/**
 * 获取BV号
 * @param {string} [arg] - 命令行参数
 * @returns {string} - BV号
 */
export const getBVid = (arg) => {
  /** @https://www.bilibili.com/list/watchlater?bvid=BV1T3QNYaEBL&oid=114155331782990 */
  const argv2 = arg || process.argv[2];
  if (argv2?.includes("BV")) {
    const result = argv2.match(/BV[a-zA-Z0-9]{10}/)?.[0];
    if (result) {
      return result;
    } else {
      throw new Error("BV号格式错误");
    }
  }

  // 最后尝试从环境变量B_VID获取
  return process.env.B_VID;
};

/**
 * 获取环境变量中的OID
 * @returns {string} - 视频OID
 */
export const getOid = () => {
  return process.env.OID;
};

/**
 * 将秒数格式化为时:分:秒格式
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
};

/**
 * 处理视频详情数据
 * @param {BilibiliDetail} detail - 视频详情对象
 * @param {any} data - API返回的数据
 * @returns {void}
 */
export const processVideoDetail = (detail, data) => {
  detail.title = data.title;
  detail.description = data.desc;
  detail.oid = data.aid;
  detail.view = data.stat.view;
  detail.danmaku = data.stat.danmaku;
  detail.reply = data.stat.reply;
  detail.favorite = data.stat.favorite;
  detail.coin = data.stat.coin;
  detail.share = data.stat.share;
  detail.like = data.stat.like;
  detail.cid = data.cid;
  detail.danmaku = data.stat.danmaku;
};

/**
 * 处理视频流数据，提取视频URL
 * @param {any} data - API返回的数据
 * @returns {string|null} 视频URL，如果没有则返回null
 */
export const extractVideoUrl = (data) => {
  if (data && data.data && data.data.durl && data.data.durl.length > 0) {
    return data.data.durl[0].url;
  }
  return null;
};

/**
 * 从URL下载视频
 * @param {string} url - 视频URL
 * @param {string} videoPath - 视频保存路径
 * @param {AnyObject} headers - 请求头
 * @returns {Promise<void>}
 */
export const downloadVideo = async (url, videoPath, headers) => {
  try {
    console.log(`\n开始下载视频到: ${videoPath}`);

    const response = await axios.get(url, {
      responseType: "stream",
      headers,
      timeout: 60000, // 60秒超时
    });

    const writer = createWriteStream(videoPath);
    response.data.pipe(writer);

    // 返回Promise，不使用泛型语法
    return new Promise((resolve, reject) => {
      writer.on("finish", () => {
        // 验证文件是否存在和大小
        if (fs.existsSync(videoPath)) {
          const stats = fs.statSync(videoPath);
          console.log(`文件大小: ${stats.size} 字节`);
        } else {
          console.error(`文件下载完成但无法找到: ${videoPath}`);
        }
        resolve();
      });
      writer.on("error", (err) => {
        console.error(`写入文件时出错: ${err.message}`);
        reject(err);
      });
    });
  } catch (error) {
    console.error(
      "下载视频失败:",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
};
