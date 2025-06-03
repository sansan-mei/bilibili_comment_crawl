// API相关函数

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
 * 获取B站视频详情URL
 * @param {string} b_vid - B站视频ID
 * @returns {string} 视频详情URL
 */
export const getBilibiliDetailUrl = (b_vid) => {
  return `https://api.bilibili.com/x/web-interface/view?bvid=${b_vid}`;
};

/**
 * 获取B站视频流URL (最低清晰度)
 * @param {string|number} bvid - B站视频BV号
 * @param {string|number} cid - 视频分P的ID
 * @returns {string} 获取视频流URL的API地址
 */
export const getBilibiliVideoStreamUrl = (bvid, cid) => {
  // 添加platform=html5参数绕过防盗链验证
  return `https://api.bilibili.com/x/player/playurl?bvid=${bvid}&cid=${cid}&qn=6&fnval=1&platform=html5`;
};

/**
 * 获取B站字幕列表Url
 * @param {string} bvid - BV号
 * @param {string|number} cid - 分P cid
 * @param {string|number} aid - 视频aid
 * @returns {string} 字幕API返回的原始数据，失败返回null
 */
export function getSubtitleListUrl(bvid, cid, aid) {
  const mainApiUrl = `https://api.bilibili.com/x/player/wbi/v2?cid=${cid}&aid=${aid}`;
  // const backupApiUrl = `https://api.bilibili.com/x/v2/dm/view?aid=${aid}&oid=${cid}&type=1`;
  return mainApiUrl;
}

/**
 * 获取B站字幕Url
 * @param {string} subtitleUrl - 字幕URL
 * @returns {string} 字幕URL
 */
export function getSubtitleUrl(subtitleUrl) {
  return `https:${subtitleUrl}`;
}
