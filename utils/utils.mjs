// 通用工具函数

/**
 * 延时函数
 * @param {number} ms - 延时毫秒数，默认400ms
 * @returns {Promise<void>} - Promise对象
 */
export const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms + Math.floor(Math.random() * 800)));

/**
 * 清理文件名，移除不允许的特殊字符
 * @param {string} filename - 原始文件名
 * @returns {string} - 清理后的文件名
 */
export const sanitizeFilename = (filename) => {
  // 替换Windows和大多数文件系统不允许的字符
  return filename.replace(/[\\/:*?"<>|]/g, '_');
}

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
}

/**
 * 获取环境变量中的OID
 * @returns {string} - 视频OID
 */
export const getOid = () => {
  return process.env.OID;
}

/**
 * 将秒数格式化为时:分:秒格式
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时间字符串
 */
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}; 