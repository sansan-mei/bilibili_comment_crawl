// 弹幕相关功能
import { DmSegMobileReply } from "#export/index";
import { notifier } from "./notifier.mjs";
import { delay, getHeaders } from "./utils.mjs";

/**
 * 将protobuf时间戳转换为ISO时间
 * @param {number} timestamp - 时间戳（秒）
 * @returns {string} ISO格式时间字符串
 */
export const parseTime = (timestamp) => {
  return new Date(timestamp * 1000).toISOString();
};

/**
 * 解析弹幕类型
 * @param {number} mode - 弹幕类型代码
 * @returns {string} 弹幕类型描述
 */
export const parseMode = (mode) => {
  const types = new Map([
    [1, "滚动弹幕"],
    [4, "底部弹幕"],
    [5, "顶部弹幕"],
    [6, "逆向弹幕"],
    [7, "高级弹幕"],
    [8, "代码弹幕"],
    [9, "BAS弹幕"],
  ]);
  return types.get(mode) || "未知类型";
};

/**
 * 解码二进制弹幕数据
 * @param {ArrayBuffer} buffer - 二进制弹幕数据
 * @returns {AnyArray} 解析后的弹幕数组
 */
export const decodeDanMu = (buffer) => {
  const danmakuHashMap = new DanMaKuHashMap();
  try {
    const decoded = DmSegMobileReply.decode(new Uint8Array(buffer));
    // @ts-ignore - 忽略elems属性不存在的错误
    return decoded.elems.map((dm) => {
      return {
        id: dm.idStr || dm.id.toString(),
        time: dm.progress / 1000, // 转换为秒
        content: dm.content,
        type: parseMode(dm.mode),
        sender: danmakuHashMap.add(dm.midHash),
        sendTime: parseTime(dm.ctime),
        pool: ["普通池", "字幕池", "特殊池"][dm.pool] || "未知",
        attributes: {
          protected: !!(dm.attr & 1),
          live: !!(dm.attr & 2),
          highLike: !!(dm.attr & 4),
        },
      };
    });
  } catch (err) {
    console.error("解码失败:", err);
    throw new Error("弹幕数据解析失败");
  }
};

/**
 * 获取B站弹幕数据
 * @param {string} oid - 视频ID
 * @param {string} segmentIndex - 分段索引
 * @returns {Promise<AnyArray|undefined>} 弹幕数据数组
 */
export const fetchBilDanMu = async (oid, segmentIndex = "1") => {
  const url = new URL("https://api.bilibili.com/x/v2/dm/web/seg.so");

  url.searchParams.append("type", "1");
  url.searchParams.append("oid", oid);
  url.searchParams.append("segment_index", segmentIndex);

  try {
    const response = await fetch(url, {
      headers: getHeaders(),
    });

    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}: ${await response.text()}`);
    }

    const buffer = await response.arrayBuffer();
    return decodeDanMu(buffer);
  } catch (error) {
    if (error instanceof Error) {
      console.error("请求失败:", error.message);
    } else {
      console.error("请求失败:", error);
    }
    return undefined;
  }
};

/**
 * 获取视频弹幕，当获取到总弹幕数的80%时停止
 * @param {number} cid - 视频cid
 * @param {number} totalDanmaku - 视频总弹幕数
 * @returns {Promise<AnyArray>} - 弹幕数组
 */
export const fetchDanmaku = async (cid, totalDanmaku) => {
  /** @type {AnyArray} */
  const danmus = [];
  const targetCount = Math.floor(totalDanmaku * 0.8); // 目标获取80%的弹幕
  let page = 1;

  try {
    while (danmus.length < targetCount) {
      notifier.log(
        `正在获取第${page}页弹幕，当前已获取${danmus.length}条，目标${targetCount}条`
      );

      // 使用已有的fetchBilDanMu函数获取弹幕
      const pageDanmus = await fetchBilDanMu(cid.toString(), page.toString());

      await delay(1000);

      if (!pageDanmus || pageDanmus.length === 0) {
        notifier.log(`第${page}页没有弹幕，可能已到达末尾`);
        break;
      }

      danmus.push(...pageDanmus);
      page++;

      // 如果已经获取了足够多的弹幕或者没有更多弹幕，就退出循环
      if (danmus.length >= targetCount) {
        notifier.log(
          `已获取足够的弹幕(${danmus.length}/${totalDanmaku})，停止获取`
        );
        break;
      }
    }

    // 按时间排序弹幕
    danmus.sort((a, b) => a.time - b.time);
    notifier.log("弹幕已按时间排序");

    return danmus;
  } catch (error) {
    console.error("获取弹幕失败:", error);
    return danmus; // 返回已获取的弹幕
  }
};

class DanMaKuHashMap {
  constructor() {
    this.map = new Map();
    this.counter = 1;
  }
  /**
   *
   * @param {string} key
   */
  add(key) {
    const renderName = this.get(key);
    if (renderName) {
      return renderName;
    }
    const newRenderName = `user_${this.counter++}`;
    this.map.set(key, newRenderName);
    return newRenderName;
  }

  /**
   *
   * @param {string} key
   * @returns {string}
   */
  get(key) {
    return this.map.get(key);
  }

  clear() {
    this.map.clear();
  }
}
