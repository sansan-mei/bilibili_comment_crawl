// 导入fs模块，用于ensureDirectoryExists函数
import fs from "fs";

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
 * @param {AnyArray} comments - 评论数组
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
}
