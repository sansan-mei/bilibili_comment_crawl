// 格式化数据相关函数
import { formatTime } from "./utils.mjs";

/**
 * 格式化评论为TXT内容
 * @param {IComment[]} comments - 评论数组
 * @returns {string} 格式化后的TXT内容
 */
export const formatCommentsToTxt = (comments) => {
  return comments
    .map((c) => {
      // 主评论
      let commentText = `${c.author}：${c.sex}：时间-${c.time}：内容-${c.content}：点赞-${c.like}：回复-${c.replyCount}`;

      // 添加子评论（如果有）
      if (c.childList && c.childList.length > 0) {
        const childComments = c.childList
          // @ts-ignore
          .map(
            (child) =>
              `  └─ ${child.author}：${child.sex}：时间-${child.time}：内容-${child.content}：点赞-${child.like}`
          )
          .join("\n");
        commentText += "\n" + childComments;
      }

      return commentText;
    })
    .join("\n\n"); // 使用两个换行符分隔不同的主评论及其子评论
};

/**
 * 将弹幕数据格式化为文本
 * @param {AnyArray} danmus - 弹幕数组
 * @returns {string} - 格式化后的文本
 */
export const formatDanmakuToTxt = (danmus) => {
  // 确保弹幕按时间排序
  const sortedDanmus = [...danmus].sort((a, b) => a.time - b.time);

  return sortedDanmus
    .map((danmu) => {
      const timeStr = formatTime(danmu.time);
      return `[${timeStr}] ${danmu.content} (发送者: ${danmu.sender}, 类型: ${danmu.type})`;
    })
    .join("\n");
};

/**
 * 将视频信息、评论、弹幕合成为一个txt文件
 * @param {string} videoInfo - 视频信息
 * @param {string} comments - 评论
 * @param {string} danmus - 弹幕
 * @param {string} zimu - 字幕
 * @returns {string} - 合成的txt文件内容
 */
export const mergeTxt = (videoInfo, comments, danmus, zimu) => {
  const txtContent = `————下面是视频信息：\n${videoInfo}\n————下面是弹幕：\n${danmus}\n————下面是字幕字幕：\n${zimu}\n————下面是评论：\n${comments}`;
  return txtContent;
};
