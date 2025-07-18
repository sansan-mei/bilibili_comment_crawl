// 通用工具函数

import axios from "axios";
import fs from "fs";
import { createWriteStream } from "node:fs";
import path, { normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { notifier } from "./notifier.mjs";

/**
 * 延时函数
 * @param {number} base - 延时毫秒数，默认400ms
 * @param {number} [random] - 随机延时毫秒数，默认400ms
 * @returns {Promise<void>} - Promise对象
 */
export const delay = (base = 500, random = 500) =>
  new Promise((resolve) =>
    setTimeout(resolve, base + Math.floor(Math.random() * random))
  );

/** @type {(platform: Platform) => (ms?: number) => Promise<void>} */
export function _delay(platform) {
  const platform_map = {
    bilibili: { base: 100, random: 300 },
    douyin: { base: 150, random: 400 },
    xhs: { base: 200, random: 500 },
    youtube: { base: 80, random: 200 },
    zhihu: { base: 120, random: 350 },
    default: { base: 100, random: 400 },
  };
  const { base, random } = platform_map[platform] || platform_map.default;
  return (ms = base) => delay(ms || base, random);
}

/**
 * 清理文件名，移除不允许的特殊字符
 * @param {string} filename - 原始文件名
 * @returns {string} - 清理后的文件名
 */
export const sanitizeFilename = (filename) => {
  // Windows 非法字符: < > : " / \ | ? *
  // 以及控制字符和保留名称
  return filename
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/[\x00-\x1F\x7F]/g, "_")
    .replace(/^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i, "_$1")
    .replace(/\.$/, "_")
    .trim();
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
 * 从URL下载视频
 * @param {string} url - 视频URL
 * @param {string} videoPath - 视频保存路径
 * @param {AnyObject} headers - 请求头
 * @returns {Promise<void>}
 */
export const downloadVideo = async (url, videoPath, headers) => {
  try {
    notifier.log(`\n开始下载视频到: ${videoPath}`);

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
          notifier.log(`文件大小: ${stats.size} 字节`);
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

// 判断是不是electron环境
export function isElectron() {
  // 检测是否在 Electron 环境中
  return process.versions && process.versions.electron;
}

// 判断是不是electron打包环境
export async function isElectronPackaged() {
  if (!isElectron()) {
    return false;
  }
  try {
    const { app } = await import("electron");
    return app.isPackaged;
  } catch {
    return false;
  }
}

// 动态获取静态资源路径
export const getStaticPath = async () => {
  // 优先读取环境变量中的路径
  if (process.env.STATIC_PATH) {
    return normalize(process.env.STATIC_PATH);
  }

  if (await isElectronPackaged()) {
    const { app: electronApp } = await import("electron");
    return path.join(electronApp.getPath("userData"), "bilibili_data");
  } else {
    return path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../public"
    );
  }
};

/**
 *
 * @param {AnyObject} obj
 * @param {string[]} excludeKeys
 * @returns {AnyObject}
 */
export function filterObject(obj, excludeKeys) {
  return Object.fromEntries(
    Object.entries(obj).filter(([key]) => !excludeKeys.includes(key))
  );
}

/**
 * 格式化时间戳为年月日时分秒
 * @param {number} timestamp - 时间戳(秒)
 * @returns {string} 格式化后的时间字符串
 */
export function formatTimestamp(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

/**
 * 判断是否是macOS
 * @returns {boolean}
 */
export function isMac() {
  return process.platform === "darwin";
}
