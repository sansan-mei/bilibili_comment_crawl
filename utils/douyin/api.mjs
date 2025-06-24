// 抖音(DouYin)API相关函数

/**
 * 生成搜索视频请求URL
 * @returns {string} 搜索请求URL
 */
export const getSearchVideosUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/general/search/single/";
};

/**
 * 生成搜索视频请求参数
 * @param {string} keyword - 搜索关键词
 * @param {number} offset - 偏移量，用于分页
 * @param {string} publishTime - 发布时间类型：0-不限，1-一天内，7-一周内，30-一月内
 * @param {string} searchId - 搜索ID，用于关联搜索会话
 * @returns {object} 请求参数
 */
export const getSearchVideosParams = (
  keyword,
  offset = 0,
  publishTime = "0",
  searchId = ""
) => {
  return {
    keyword: keyword,
    offset: String(offset),
    count: "10",
    publish_time: publishTime,
    sort_type: "0",
    search_source: "tab_search",
    query_correct_type: "1",
    is_filter_search: "0",
    search_id: searchId,
  };
};

/**
 * 生成视频详情请求URL
 * @returns {string} 视频详情请求URL
 */
export const getVideoDetailUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/aweme/detail/";
};

/**
 * 生成视频详情请求参数
 * @param {string} awemeId - 视频ID
 * @returns {object} 请求参数
 */
export const getVideoDetailParams = (awemeId) => {
  return {
    aweme_id: awemeId,
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
    os: "mac",
    browser_name: "Chrome",
    browser_version: "116.0.0.0",
  };
};

/**
 * 生成用户信息请求URL
 * @returns {string} 用户信息请求URL
 */
export const getUserInfoUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/im/user/info/";
};

/**
 * 生成用户信息请求参数
 * @param {string} secUserId - 用户安全ID
 * @returns {object} 请求参数
 */
export const getUserInfoParams = (secUserId) => {
  return {
    sec_user_id: secUserId,
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 生成用户视频列表请求URL
 * @returns {string} 用户视频列表请求URL
 */
export const getUserVideosUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/aweme/post/";
};

/**
 * 生成用户视频列表请求参数
 * @param {string} secUserId - 用户安全ID
 * @param {number} maxCursor - 游标，用于分页
 * @param {number} count - 每页视频数量
 * @returns {object} 请求参数
 */
export const getUserVideosParams = (secUserId, maxCursor = 0, count = 35) => {
  return {
    sec_user_id: secUserId,
    max_cursor: String(maxCursor),
    locate_query: "false",
    show_live_replay_strategy: "1",
    need_time_list: "1",
    time_list_query: "0",
    whale_cut_token: "",
    cut_version: "1",
    count: String(count),
    publish_video_strategy_type: "2",
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 生成视频评论请求URL
 * @returns {string} 评论请求URL
 */
export const getVideoCommentsUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/comment/list/";
};

/**
 * 生成视频评论请求参数
 * @param {string} awemeId - 视频ID
 * @param {number} cursor - 游标，用于分页
 * @param {number} count - 每页评论数量
 * @returns {object} 请求参数
 */
export const getVideoCommentsParams = (awemeId, cursor = 0, count = 20) => {
  return {
    aweme_id: awemeId,
    cursor: String(cursor),
    count: String(count),
    item_type: "0",
    insert_ids: "",
    whale_cut_token: "",
    cut_version: "1",
    rcFT: "",
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 生成子评论请求URL
 * @returns {string} 子评论请求URL
 */
export const getSubCommentsUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/comment/list/reply/";
};

/**
 * 生成子评论请求参数
 * @param {string} itemId - 视频ID
 * @param {string} commentId - 评论ID
 * @param {number} cursor - 游标，用于分页
 * @param {number} count - 每页子评论数量
 * @returns {object} 请求参数
 */
export const getSubCommentsParams = (
  itemId,
  commentId,
  cursor = 0,
  count = 20
) => {
  return {
    item_id: itemId,
    comment_id: commentId,
    cursor: String(cursor),
    count: String(count),
    item_type: "0",
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 生成热门搜索关键词URL
 * @returns {string} 热门搜索URL
 */
export const getHotSearchUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/hot/search/list/";
};

/**
 * 生成热门搜索关键词参数
 * @returns {object} 请求参数
 */
export const getHotSearchParams = () => {
  return {
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 生成推荐视频请求URL
 * @returns {string} 推荐视频URL
 */
export const getRecommendVideosUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/tab/feed/";
};

/**
 * 生成推荐视频请求参数
 * @param {number} maxCursor - 游标，用于分页
 * @param {number} count - 每页视频数量
 * @returns {object} 请求参数
 */
export const getRecommendVideosParams = (maxCursor = 0, count = 12) => {
  return {
    max_cursor: String(maxCursor),
    count: String(count),
    refresh_index: "1",
    webapp_id: "6383",
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 生成直播间信息请求URL
 * @returns {string} 直播间信息URL
 */
export const getLiveRoomUrl = () => {
  return "https://live.douyin.com/webcast/room/web/enter/";
};

/**
 * 生成直播间信息请求参数
 * @param {string} webRid - 直播间ID
 * @returns {object} 请求参数
 */
export const getLiveRoomParams = (webRid) => {
  return {
    aid: "6383",
    app_name: "douyin_web",
    live_id: "1",
    device_platform: "web",
    language: "zh-CN",
    enter_from: "web_live",
    cookie_enabled: "true",
    screen_width: "1920",
    screen_height: "1080",
    browser_language: "zh-CN",
    browser_platform: "MacIntel",
    browser_name: "Chrome",
    browser_version: "116.0.0.0",
    web_rid: webRid,
  };
};

/**
 * 生成音乐详情请求URL
 * @returns {string} 音乐详情URL
 */
export const getMusicDetailUrl = () => {
  return "https://www.douyin.com/aweme/v1/web/music/detail/";
};

/**
 * 生成音乐详情请求参数
 * @param {string} musicId - 音乐ID
 * @returns {object} 请求参数
 */
export const getMusicDetailParams = (musicId) => {
  return {
    music_id: musicId,
    aid: "1128",
    version_name: "23.5.0",
    device_platform: "webapp",
  };
};

/**
 * 从抖音URL中提取视频ID
 * @param {string} url - 抖音视频URL
 * @returns {object} 包含视频ID和其他信息
 */
export const parseDouyinUrl = (url) => {
  const result = {
    awemeId: "",
    type: "unknown",
  };

  // 匹配不同格式的抖音URL
  const patterns = [
    // 标准视频链接
    { pattern: /douyin\.com\/video\/(\d+)/, type: "video" },
    // 用户主页
    { pattern: /douyin\.com\/user\/([^?]+)/, type: "user" },
    // 短链接
    { pattern: /v\.douyin\.com\/([a-zA-Z0-9]+)/, type: "short" },
    // 直播间
    { pattern: /live\.douyin\.com\/(\d+)/, type: "live" },
    // 音乐页面
    { pattern: /douyin\.com\/music\/(\d+)/, type: "music" },
  ];

  for (const { pattern, type } of patterns) {
    const match = url.match(pattern);
    if (match) {
      result.awemeId = match[1];
      result.type = type;
      break;
    }
  }

  return result;
};

/**
 * 抖音API请求头配置
 * @param {string} cookies - Cookie字符串
 * @param {string} userAgent - User-Agent
 * @returns {object} 请求头对象
 */
export const getDouyinHeaders = (cookies = "", userAgent = "") => {
  return {
    Accept: "application/json, text/plain, */*",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
    "Accept-Encoding": "gzip, deflate, br",
    "Content-Type": "application/json;charset=UTF-8",
    Cookie: cookies,
    Host: "www.douyin.com",
    Origin: "https://www.douyin.com/",
    Referer: "https://www.douyin.com/",
    "User-Agent":
      userAgent ||
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
  };
};

/**
 * 抖音发布时间类型枚举
 */
export const PublishTimeType = {
  ALL: "0", // 不限
  ONE_DAY: "1", // 一天内
  ONE_WEEK: "7", // 一周内
  ONE_MONTH: "30", // 一月内
};

/**
 * 抖音搜索排序类型枚举
 */
export const SearchSortType = {
  DEFAULT: "0", // 综合排序
  LATEST: "1", // 最新发布
  MOST_LIKED: "2", // 最多点赞
};

/**
 * 验证URL是否为有效的抖音链接
 * @param {string} url - URL字符串
 * @returns {boolean} 是否为有效的抖音URL
 */
export const isValidDouyinUrl = (url) => {
  const douyinPatterns = [
    /douyin\.com\/video\/\d+/,
    /douyin\.com\/user\/[^?]+/,
    /v\.douyin\.com\/[a-zA-Z0-9]+/,
    /live\.douyin\.com\/\d+/,
    /douyin\.com\/music\/\d+/,
  ];

  return douyinPatterns.some((pattern) => pattern.test(url));
};

/**
 * 格式化抖音时间戳
 * @param {number} timestamp - 时间戳（秒）
 * @returns {string} 格式化后的时间字符串
 */
export const formatDouyinTime = (timestamp) => {
  return new Date(timestamp * 1000).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

/**
 * 生成随机设备ID
 * @returns {string} 随机设备ID
 */
export const generateDeviceId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * 生成X-Bogus参数（简化版，实际需要复杂算法）
 * @param {string} url - 请求URL
 * @param {object} params - 请求参数
 * @returns {string} X-Bogus值
 */
export const generateXBogus = (url, params) => {
  // 这里只是占位符，实际的X-Bogus生成需要复杂的算法
  // 在实际使用中需要实现真正的X-Bogus生成逻辑
  return "DFSzswVLQDNjTkRUm6q6ZgkbJxlbJE6lTxhBmv-KE-0wm6";
};

/**
 * 构建完整的抖音API请求URL
 * @param {string} baseUrl - 基础URL
 * @param {object} params - 请求参数
 * @returns {string} 完整的请求URL
 */
export const buildDouyinApiUrl = (baseUrl, params) => {
  const urlParams = new URLSearchParams();

  // 添加所有参数
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      urlParams.append(key, String(value));
    }
  });

  // 添加通用参数
  const timestamp = Math.floor(Date.now() / 1000);
  urlParams.append("_signature", generateXBogus(baseUrl, params));
  urlParams.append("ts", String(timestamp));

  return `${baseUrl}?${urlParams.toString()}`;
};
