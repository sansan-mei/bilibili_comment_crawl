// 格式化数据相关函数
import { formatTime } from "#utils/utils";

/**
 * 清理异常的Unicode行结束符
 * @param {string} text - 要清理的文本
 * @returns {string} 清理后的文本
 */
const cleanUnusualLineTerminators = (text) => {
  // 移除 Line Separator (U+2028) 和 Paragraph Separator (U+2029)
  return text.replace(/[\u2028\u2029]/g, " ");
};

/**
 * 格式化评论为TXT内容
 * @param {IComment[]} comments - 评论数组
 * @returns {string} 格式化后的TXT内容
 */
export const formatCommentsToTxt = (comments) => {
  return comments
    .map((c) => {
      const location = c?.reply_control?.location || "未知";
      const time = c?.reply_control?.time_desc || "未知";
      const content = cleanUnusualLineTerminators(c.content);

      // 主评论
      let commentText = `${c.author}：${c.sex}：时间-${c.time}：内容-${content}：点赞-${c.like}：回：地区复-${c.replyCount}-${location}：回复时间-${time}`;

      // 添加子评论（如果有）
      if (c.childList && c.childList.length > 0) {
        const childComments = c.childList
          // @ts-ignore
          .map((child) => {
            const _location = child?.reply_control?.location || "未知";
            const _time = child?.reply_control?.time_desc || "未知";
            const _content = cleanUnusualLineTerminators(child.content);

            return `  └─ ${child.author}：${child.sex}：时间-${child.time}：内容-${_content}：点赞-${child.like}：地区-${_location}：回复时间-${_time}`;
          })
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
  const txtContent = `<video_info>
${videoInfo}
</video_info>

<video_danmus>
${danmus}
</video_danmus>

<video_zimu>
${zimu}
</video_zimu>

<video_comments>
${comments}
</video_comments>`;
  return txtContent;
};
