// 小红书(XHS)API相关函数

/**
 * 生成搜索笔记请求URL
 * @param {string} keyword - 搜索关键词
 * @param {string} searchId - 搜索ID
 * @param {number} page - 页码，从1开始
 * @param {string} sortType - 排序类型：general, time_descending, popularity_descending
 * @returns {string} 搜索请求URL
 */
export const getSearchNotesUrl = (
  keyword,
  searchId,
  page = 1,
  sortType = "general"
) => {
  return "https://edith.xiaohongshu.com/api/sns/web/v1/search/notes";
};

/**
 * 生成搜索笔记请求参数
 * @param {string} keyword - 搜索关键词
 * @param {string} searchId - 搜索ID
 * @param {number} page - 页码，从1开始
 * @param {string} sortType - 排序类型
 * @returns {object} 请求参数
 */
export const getSearchNotesParams = (
  keyword,
  searchId,
  page = 1,
  sortType = "general"
) => {
  return {
    keyword: keyword,
    search_id: searchId,
    page: String(page),
    page_size: "20",
    sort: sortType,
    note_type: "0",
  };
};

/**
 * 生成笔记详情请求URL
 * @param {string} noteId - 笔记ID
 * @returns {string} 笔记详情请求URL
 */
export const getNoteDetailUrl = (noteId) => {
  return `https://www.xiaohongshu.com/explore/${noteId}`;
};

/**
 * 生成笔记详情API请求URL
 * @param {string} noteId - 笔记ID
 * @returns {string} API请求URL
 */
export const getNoteDetailApiUrl = (noteId) => {
  return `https://edith.xiaohongshu.com/api/sns/web/v1/feed`;
};

/**
 * 生成笔记详情API请求参数
 * @param {string} noteId - 笔记ID
 * @param {string} xsecSource - xsec_source参数
 * @param {string} xsecToken - xsec_token参数
 * @returns {object} 请求参数
 */
export const getNoteDetailApiParams = (noteId, xsecSource, xsecToken) => {
  return {
    source_note_id: noteId,
    image_formats: ["jpg", "webp", "avif"],
    extra: { need_body_topic: "1" },
    xsec_source: xsecSource,
    xsec_token: xsecToken,
  };
};

/**
 * 生成用户信息请求URL
 * @param {string} userId - 用户ID
 * @returns {string} 用户信息请求URL
 */
export const getUserInfoUrl = (userId) => {
  return `https://www.xiaohongshu.com/user/profile/${userId}`;
};

/**
 * 生成用户笔记列表请求URL
 * @returns {string} 用户笔记列表请求URL
 */
export const getUserNotesUrl = () => {
  return "https://edith.xiaohongshu.com/api/sns/web/v1/user_posted";
};

/**
 * 生成用户笔记列表请求参数
 * @param {string} userId - 用户ID
 * @param {string} cursor - 游标，用于分页
 * @param {number} numNotes - 每页笔记数量
 * @returns {object} 请求参数
 */
export const getUserNotesParams = (userId, cursor = "", numNotes = 30) => {
  return {
    user_id: userId,
    cursor: cursor,
    num: String(numNotes),
    image_formats: "jpg,webp,avif",
  };
};

/**
 * 生成笔记评论请求URL
 * @returns {string} 评论请求URL
 */
export const getNoteCommentsUrl = () => {
  return "https://edith.xiaohongshu.com/api/sns/web/v2/comment/page";
};

/**
 * 生成笔记评论请求参数
 * @param {string} noteId - 笔记ID
 * @param {string} cursor - 游标，用于分页
 * @param {string} topCommentId - 顶级评论ID，用于获取子评论
 * @param {string} xsecToken - xsec_token参数
 * @returns {object} 请求参数
 */
export const getNoteCommentsParams = (
  noteId,
  cursor = "",
  topCommentId = "",
  xsecToken = ""
) => {
  return {
    note_id: noteId,
    cursor: cursor,
    top_comment_id: topCommentId,
    image_formats: "jpg,webp,avif",
    xsec_token: xsecToken,
  };
};

/**
 * 生成子评论请求参数
 * @param {string} noteId - 笔记ID
 * @param {string} rootCommentId - 根评论ID
 * @param {number} num - 评论数量
 * @param {string} cursor - 游标
 * @param {string} xsecToken - xsec_token参数
 * @returns {object} 请求参数
 */
export const getSubCommentsParams = (
  noteId,
  rootCommentId,
  num = 10,
  cursor = "",
  xsecToken = ""
) => {
  return {
    note_id: noteId,
    root_comment_id: rootCommentId,
    num: String(num),
    cursor: cursor,
    image_formats: "jpg,webp,avif",
    xsec_token: xsecToken,
  };
};

/**
 * 生成媒体文件请求URL（图片/视频）
 * @param {string} mediaUrl - 媒体文件URL
 * @returns {string} 处理后的媒体URL
 */
export const getMediaUrl = (mediaUrl) => {
  // 小红书媒体URL通常已经是完整的，直接返回
  return mediaUrl;
};

/**
 * 生成热门搜索关键词URL
 * @returns {string} 热门搜索URL
 */
export const getHotSearchUrl = () => {
  return "https://edith.xiaohongshu.com/api/sns/web/v1/search/hot_list";
};

/**
 * 生成推荐笔记请求URL
 * @returns {string} 推荐笔记URL
 */
export const getRecommendNotesUrl = () => {
  return "https://edith.xiaohongshu.com/api/sns/web/v1/homefeed";
};

/**
 * 生成推荐笔记请求参数
 * @param {string} cursor - 游标，用于分页
 * @param {number} refreshType - 刷新类型
 * @returns {object} 请求参数
 */
export const getRecommendNotesParams = (cursor = "", refreshType = 1) => {
  return {
    cursor_score: cursor,
    num: "6",
    refresh_type: String(refreshType),
    note_index: "0",
    unread_begin_note_id: "",
    unread_end_note_id: "",
    unread_note_count: "0",
    category: "homefeed.food_v3",
  };
};

/**
 * 从小红书URL中提取笔记ID
 * @param {string} url - 小红书笔记URL
 * @returns {object} 包含笔记ID和其他信息
 */
export const parseNoteUrlInfo = (url) => {
  const result = {
    noteId: "",
    xsecSource: "",
    xsecToken: "",
  };

  // 匹配不同格式的小红书URL
  const patterns = [
    /xiaohongshu\.com\/explore\/([a-zA-Z0-9]+)/,
    /xiaohongshu\.com\/discovery\/item\/([a-zA-Z0-9]+)/,
    /xhslink\.com\/[a-zA-Z0-9]+/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      result.noteId = match[1] || "";
      break;
    }
  }

  // 从URL参数中提取xsec信息
  const urlObj = new URL(url);
  result.xsecSource = urlObj.searchParams.get("xsec_source") || "";
  result.xsecToken = urlObj.searchParams.get("xsec_token") || "";

  return result;
};

/**
 * 生成搜索ID（用于搜索接口）
 * @returns {string} 随机生成的搜索ID
 */
export const generateSearchId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * 小红书API请求头配置
 * @param {string} cookies - Cookie字符串
 * @param {string} userAgent - User-Agent
 * @returns {object} 请求头对象
 */
export const getXhsHeaders = (cookies = "", userAgent = "") => {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/json;charset=UTF-8",
    Cookie: cookies,
    Origin: "https://www.xiaohongshu.com",
    Referer: "https://www.xiaohongshu.com/",
    "User-Agent":
      userAgent ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
  };
};

/**
 * 小红书搜索排序类型枚举
 */
export const SearchSortType = {
  GENERAL: "general", // 综合
  TIME_DESCENDING: "time_descending", // 最新
  POPULARITY_DESCENDING: "popularity_descending", // 最热
};

/**
 * 小红书笔记类型枚举
 */
export const NoteType = {
  ALL: "0", // 全部
  VIDEO: "1", // 视频
  IMAGE: "2", // 图文
};

/**
 * 验证笔记URL是否为有效的小红书链接
 * @param {string} url - URL字符串
 * @returns {boolean} 是否为有效的小红书URL
 */
export const isValidXhsUrl = (url) => {
  const xhsPatterns = [
    /xiaohongshu\.com\/explore\/[a-zA-Z0-9]+/,
    /xiaohongshu\.com\/discovery\/item\/[a-zA-Z0-9]+/,
    /xhslink\.com\/[a-zA-Z0-9]+/,
  ];

  return xhsPatterns.some((pattern) => pattern.test(url));
};

/**
 * 格式化小红书时间戳
 * @param {number} timestamp - 时间戳（毫秒）
 * @returns {string} 格式化后的时间字符串
 */
export const formatXhsTime = (timestamp) => {
  return new Date(timestamp).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};
