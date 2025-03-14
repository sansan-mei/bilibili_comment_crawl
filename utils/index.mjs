// 导入fs模块，用于ensureDirectoryExists函数
import fs from "fs";
import protobuf from 'protobufjs';

// 初始化protobuf
const root = protobuf.loadSync("./bilibli.proto");
const DmSegMobileReply = root.lookupType('bilibili.community.service.dm.v1.DmSegMobileReply');

// 延时函数
export const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 生成主评论请求URL
 * @param {number} page - 页码
 * @param {string|number} oid - 视频ID
 * @returns {string} 请求URL
 */
export const getMainCommentUrl = (page, oid) => {
  return `https://api.bilibili.com/x/v2/reply/main?csrf=40a227fcf12c380d7d3c81af2cd8c5e8&mode=3&next=${page}&oid=${oid}&plat=1&type=1`;
};

/**
 * 生成子评论请求URL
 * @param {string|number} rpid - 评论ID
 * @param {string|number} oid - 视频ID
 * @returns {string} 请求URL
 */
export const getReplyUrl = (rpid, oid) => {
  return `https://api.bilibili.com/x/v2/reply/reply?oid=${oid}&type=1&root=${rpid}&ps=50000&pn=1`;
};

/**
 * 格式化评论为TXT内容
 * @param {Array<any>} comments - 评论数组
 * @returns {string} 格式化后的TXT内容
 */
export const formatCommentsToTxt = (comments) => {
  return comments
    .map((c) => {
      // 主评论
      let commentText = `${c.author}：${c.sex}：${c.time}：${c.content}`;

      // 添加子评论（如果有）
      if (c.childList && c.childList.length > 0) {
        const childComments = c.childList
          // @ts-ignore
          .map(child => `  └─ ${child.author}：${child.sex}：${child.time}：${child.content}`)
          .join("\n");
        commentText += "\n" + childComments;
      }

      return commentText;
    })
    .join("\n\n");  // 使用两个换行符分隔不同的主评论及其子评论
};

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
 * 获取B站视频详情URL
 * @param {string} b_vid - B站视频ID
 * @returns {string} 视频详情URL
 */
export const getBilibiliDetailUrl = (b_vid) => {
  return `https://api.bilibili.com/x/web-interface/view?bvid=${b_vid}`
};

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
    [1, '滚动弹幕'],
    [4, '底部弹幕'],
    [5, '顶部弹幕'],
    [6, '逆向弹幕'],
    [7, '高级弹幕'],
    [8, '代码弹幕'],
    [9, 'BAS弹幕']
  ]);
  return types.get(mode) || '未知类型';
};

/**
 * 解码二进制弹幕数据
 * @param {ArrayBuffer} buffer - 二进制弹幕数据
 * @returns {Array<any>} 解析后的弹幕数组
 */
export const decodeDanMu = (buffer) => {
  try {
    const decoded = DmSegMobileReply.decode(new Uint8Array(buffer));
    // @ts-ignore - 忽略elems属性不存在的错误
    return decoded.elems.map(dm => ({
      id: dm.idStr || dm.id.toString(),
      time: dm.progress / 1000, // 转换为秒
      content: dm.content,
      type: parseMode(dm.mode),
      sender: dm.midHash,
      sendTime: parseTime(dm.ctime),
      pool: ['普通池', '字幕池', '特殊池'][dm.pool] || '未知',
      attributes: {
        protected: !!(dm.attr & 1),
        live: !!(dm.attr & 2),
        highLike: !!(dm.attr & 4)
      }
    }));
  } catch (err) {
    console.error('解码失败:', err);
    throw new Error('弹幕数据解析失败');
  }
};

/**
 * 获取B站弹幕数据
 * @param {string} oid - 视频ID
 * @param {string} segmentIndex - 分段索引
 * @returns {Promise<Array<any>|undefined>} 弹幕数据数组
 */
export const fetchBilDanMu = async (oid, segmentIndex = '1') => {
  const url = new URL('https://api.bilibili.com/x/v2/dm/web/seg.so');

  url.searchParams.append('type', '1');
  url.searchParams.append('oid', oid);
  url.searchParams.append('segment_index', segmentIndex);

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': process.env.COOKIES
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP错误 ${response.status}: ${await response.text()}`);
    }

    const buffer = await response.arrayBuffer();
    return decodeDanMu(buffer);
  } catch (error) {
    if (error instanceof Error) {
      console.error('请求失败:', error.message);
    } else {
      console.error('请求失败:', error);
    }
    return undefined;
  }
};
