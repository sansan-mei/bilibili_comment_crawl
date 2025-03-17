// 导入fs模块，用于ensureDirectoryExists函数
import { DmSegMobileReply } from "#export/index";
import fs from "fs";
import path from "path";

// 延时函数
export const delay = (ms = 400) => new Promise(resolve => setTimeout(resolve, ms + Math.floor(Math.random() * 800)));

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

/**
 * 处理视频详情数据
 * @param {{
 *   title: string,
 *   description: string,
 *   oid: number,
 *   view: number,
 *   danmaku: number,
 *   reply: number,
 *   favorite: number,
 *   coin: number,
 *   share: number,
 *   like: number,
 *   cid: number
 * }} detail - 视频详情对象
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
 * 获取视频弹幕，当获取到总弹幕数的80%时停止
 * @param {number} cid - 视频cid
 * @param {number} totalDanmaku - 视频总弹幕数
 * @returns {Promise<Array<any>>} - 弹幕数组
 */
export const fetchDanmaku = async (cid, totalDanmaku) => {
  /** @type {Array<any>} */
  const danmus = [];
  const targetCount = Math.floor(totalDanmaku * 0.8); // 目标获取80%的弹幕
  let page = 1;

  try {
    while (danmus.length < targetCount) {
      console.log(`正在获取第${page}页弹幕，当前已获取${danmus.length}条，目标${targetCount}条`);

      // 使用已有的fetchBilDanMu函数获取弹幕
      const pageDanmus = await fetchBilDanMu(cid.toString(), page.toString());

      await delay(1000);

      if (!pageDanmus || pageDanmus.length === 0) {
        console.log(`第${page}页没有弹幕，可能已到达末尾`);
        break;
      }

      danmus.push(...pageDanmus);
      page++;

      // 如果已经获取了足够多的弹幕或者没有更多弹幕，就退出循环
      if (danmus.length >= targetCount) {
        console.log(`已获取足够的弹幕(${danmus.length}/${totalDanmaku})，停止获取`);
        break;
      }
    }

    return danmus;
  } catch (error) {
    console.error('获取弹幕失败:', error);
    return danmus; // 返回已获取的弹幕
  }
};

/**
 * 将弹幕数据格式化为文本
 * @param {Array<any>} danmus - 弹幕数组
 * @returns {string} - 格式化后的文本
 */
export const formatDanmakuToTxt = (danmus) => {
  return danmus.map(danmu => {
    const timeStr = formatTime(danmu.time);
    return `[${timeStr}] ${danmu.content} (发送者: ${danmu.sender}, 类型: ${danmu.type})`;
  }).join('\n');
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

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};


/**
 * 检查文件是否存在
 * @param {string} filePath - 文件路径
 * @returns {boolean} - 文件是否存在
 */
export const existFile = (filePath) => {
  return fs.existsSync(filePath);
};

// 将视频信息、评论、弹幕合成为一个txt文件
/**
 * 将视频信息、评论、弹幕合成为一个txt文件
 * @param {string} videoInfo - 视频信息
 * @param {string} comments - 评论
 * @param {string} danmus - 弹幕
 * @returns {string} - 合成的txt文件内容
 */
export const mergeTxt = (videoInfo, comments, danmus) => {
  const txtContent = `视频信息：\n${videoInfo}\n评论：\n${comments}\n弹幕：\n${danmus}`;
  return txtContent;
};


/**
 * 清理文件名，移除不允许的特殊字符
 * @param {string} filename - 原始文件名
 * @returns {string} - 清理后的文件名
 */
export const sanitizeFilename = (filename) => {
  // 替换Windows和大多数文件系统不允许的字符
  return filename.replace(/[\\/:*?"<>|]/g, '_');
}



// 获取环境变量，TypeScript 可以正确推断类型
export const getOid = () => {
  return process.env.OID;
}

export const getBVid = () => {
  /** @https://www.bilibili.com/list/watchlater?bvid=BV1T3QNYaEBL&oid=114155331782990 */
  // 将BV开头的12位字符提取出来,是任意字符，不是数字
  const argv2 = process.argv[2]
  if (argv2?.includes("BV")) {
    const result = argv2.match(/BV[a-zA-Z0-9]{10}/)?.[0]
    if (result) {
      return result
    } else {
      throw new Error("BV号格式错误")
    }
  }
  return process.env.B_VID;
}



/**
 * 保存评论和相关数据到文件
 * @param {string} outputDir - 输出目录路径
 * @param {Array<IComment>} comments - 评论数据
 * @param {BilibiliDetail} detail - 视频详情
 * @param {string} danmakuTxtContent - 弹幕内容
 * @returns {Promise<{allPath: string, commentPath: string, detailPath: string, danmakuPath: string}>}
 */
export const saveCommentData = async (outputDir, comments, detail, danmakuTxtContent) => {
  const allPath = path.join(outputDir, "bilibili_all.txt")
  const commentPath = path.join(outputDir, "bilibili_comment.txt")
  const detailPath = path.join(outputDir, "bilibili_detail.json")
  const danmakuPath = path.join(outputDir, "bilibili_danmaku.txt")
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
  const allTxtContent = mergeTxt(JSON.stringify(detail), txtContent, danmakuTxtContent);
  fs.writeFileSync(allPath, allTxtContent, {
    encoding: "utf-8",
  });

  return {
    allPath,
    commentPath,
    detailPath,
    danmakuPath
  }
};