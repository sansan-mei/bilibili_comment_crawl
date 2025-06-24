// 知乎API相关函数

/**
 * 生成搜索请求URL
 * @param {string} keyword - 搜索关键词
 * @param {number} page - 页码，从1开始
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 搜索请求URL
 */
export const getSearchUrl = (keyword, page = 1, limit = 20) => {
  const params = new URLSearchParams({
    t: "general",
    q: keyword,
    correction: "1",
    offset: String((page - 1) * limit),
    limit: String(limit),
    filter_fields: "",
    lc_idx: String(page),
    show_all_topics: "0",
    search_source: "Guess",
  });
  return `https://www.zhihu.com/api/v4/search_v3?${params}`;
};

/**
 * 生成回答评论请求URL
 * @param {string|number} answerId - 回答ID
 * @param {number} offset - 偏移量
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 回答评论请求URL
 */
export const getAnswerCommentsUrl = (answerId, offset = 0, limit = 20) => {
  const params = new URLSearchParams({
    order: "normal",
    limit: String(limit),
    offset: String(offset),
    status: "open",
  });
  return `https://www.zhihu.com/api/v4/answers/${answerId}/root_comments?${params}`;
};

/**
 * 生成文章评论请求URL
 * @param {string|number} articleId - 文章ID
 * @param {number} offset - 偏移量
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 文章评论请求URL
 */
export const getArticleCommentsUrl = (articleId, offset = 0, limit = 20) => {
  const params = new URLSearchParams({
    order: "normal",
    limit: String(limit),
    offset: String(offset),
    status: "open",
  });
  return `https://www.zhihu.com/api/v4/articles/${articleId}/root_comments?${params}`;
};

/**
 * 生成用户信息请求URL
 * @param {string} urlToken - 用户URL令牌
 * @returns {string} 用户信息请求URL
 */
export const getUserInfoUrl = (urlToken) => {
  return `https://www.zhihu.com/api/v4/members/${urlToken}`;
};

/**
 * 生成用户回答列表请求URL
 * @param {string} urlToken - 用户URL令牌
 * @param {number} offset - 偏移量
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 用户回答列表请求URL
 */
export const getUserAnswersUrl = (urlToken, offset = 0, limit = 20) => {
  const params = new URLSearchParams({
    include:
      "data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,created_time,updated_time,review_info,relevant_info,question,excerpt,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized,paid_info,paid_info_content;data[*].mark_infos[*].url;data[*].author.follower_count,badge[*].topics",
    offset: String(offset),
    limit: String(limit),
    sort_by: "created",
  });
  return `https://www.zhihu.com/api/v4/members/${urlToken}/answers?${params}`;
};

/**
 * 生成回答详情请求URL
 * @param {string|number} answerId - 回答ID
 * @returns {string} 回答详情请求URL
 */
export const getAnswerDetailUrl = (answerId) => {
  const params = new URLSearchParams({
    include:
      "is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,created_time,updated_time,review_info,relevant_info,question,excerpt,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized,paid_info,paid_info_content;mark_infos[*].url;author.follower_count,badge[*].topics",
  });
  return `https://www.zhihu.com/api/v4/answers/${answerId}?${params}`;
};

/**
 * 生成文章详情请求URL
 * @param {string|number} articleId - 文章ID
 * @returns {string} 文章详情请求URL
 */
export const getArticleDetailUrl = (articleId) => {
  const params = new URLSearchParams({
    include:
      "content,voteup_count,comment_count,voting,author.follower_count,image_url,updated,can_comment,admin_closed_comment,comment_permission",
  });
  return `https://www.zhihu.com/api/v4/articles/${articleId}?${params}`;
};

/**
 * 生成视频详情请求URL
 * @param {string|number} videoId - 视频ID
 * @returns {string} 视频详情请求URL
 */
export const getVideoDetailUrl = (videoId) => {
  const params = new URLSearchParams({
    include:
      "title,description,play_count,voteup_count,comment_count,video.play_url,video.thumbnail_info",
  });
  return `https://www.zhihu.com/api/v4/zvideos/${videoId}?${params}`;
};

/**
 * 生成问题详情请求URL
 * @param {string|number} questionId - 问题ID
 * @returns {string} 问题详情请求URL
 */
export const getQuestionDetailUrl = (questionId) => {
  const params = new URLSearchParams({
    include:
      "detail,excerpt,relationship,is_editable,question_type,bound_topic_ids,comment_count,collapsed_by,suggest_edit,can_comment,content,voteup_count,created,updated,review_info,type,thumbnail",
  });
  return `https://www.zhihu.com/api/v4/questions/${questionId}?${params}`;
};

/**
 * 生成问题回答列表请求URL
 * @param {string|number} questionId - 问题ID
 * @param {number} offset - 偏移量
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 问题回答列表请求URL
 */
export const getQuestionAnswersUrl = (questionId, offset = 0, limit = 20) => {
  const params = new URLSearchParams({
    include:
      "data[*].is_normal,admin_closed_comment,reward_info,is_collapsed,annotation_action,annotation_detail,collapse_reason,is_sticky,collapsed_by,suggest_edit,comment_count,can_comment,content,editable_content,voteup_count,reshipment_settings,comment_permission,created_time,updated_time,review_info,relevant_info,question,excerpt,relationship.is_authorized,is_author,voting,is_thanked,is_nothelp,is_labeled,is_recognized,paid_info,paid_info_content;data[*].mark_infos[*].url;data[*].author.follower_count,badge[*].topics",
    offset: String(offset),
    limit: String(limit),
    platform: "desktop",
    sort_by: "default",
  });
  return `https://www.zhihu.com/api/v4/questions/${questionId}/answers?${params}`;
};

/**
 * 生成用户文章列表请求URL
 * @param {string} urlToken - 用户URL令牌
 * @param {number} offset - 偏移量
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 用户文章列表请求URL
 */
export const getUserArticlesUrl = (urlToken, offset = 0, limit = 20) => {
  const params = new URLSearchParams({
    include:
      "data[*].comment_count,suggest_edit,is_normal,thumbnail_extra_info,thumbnail,can_comment,comment_permission,admin_closed_comment,content,voteup_count,created,updated,upvoted_followees,voting,review_info,is_labeled,label_info;data[*].author.follower_count,badge[*].topics",
    offset: String(offset),
    limit: String(limit),
    sort_by: "created",
  });
  return `https://www.zhihu.com/api/v4/members/${urlToken}/articles?${params}`;
};

/**
 * 生成用户专栏列表请求URL
 * @param {string} urlToken - 用户URL令牌
 * @param {number} offset - 偏移量
 * @param {number} limit - 每页数量，默认20
 * @returns {string} 用户专栏列表请求URL
 */
export const getUserColumnsUrl = (urlToken, offset = 0, limit = 20) => {
  const params = new URLSearchParams({
    include:
      "data[*].intro,followers,articles_count,image_url,updated,comment_permission",
    offset: String(offset),
    limit: String(limit),
  });
  return `https://www.zhihu.com/api/v4/members/${urlToken}/columns?${params}`;
};

/**
 * 生成热榜请求URL
 * @returns {string} 热榜请求URL
 */
export const getHotListUrl = () => {
  return "https://www.zhihu.com/api/v3/feed/topstory/hot-lists/total?limit=50&desktop=true";
};

/**
 * 生成推荐内容请求URL
 * @param {string} session_token - 会话令牌
 * @param {number} limit - 数量限制，默认6
 * @returns {string} 推荐内容请求URL
 */
export const getRecommendUrl = (session_token, limit = 6) => {
  const params = new URLSearchParams({
    action: "down",
    limit: String(limit),
    session_token: session_token,
    desktop: "true",
  });
  return `https://www.zhihu.com/api/v3/feed/topstory/recommend?${params}`;
};

/**
 * 判断知乎URL类型
 * @param {string} url - 知乎URL
 * @returns {string} URL类型：'answer', 'article', 'video', 'question', 'unknown'
 */
export const judgeZhihuUrlType = (url) => {
  if (url.includes("/answer/")) return "answer";
  if (url.includes("/p/")) return "article";
  if (url.includes("/zvideo/")) return "video";
  if (url.includes("/question/") && !url.includes("/answer/"))
    return "question";
  return "unknown";
};

/**
 * 从知乎URL中提取ID
 * @param {string} url - 知乎URL
 * @returns {object} 包含提取的ID信息
 */
export const extractZhihuIds = (url) => {
  /** @type {AnyObject} */
  const result = { type: judgeZhihuUrlType(url) };

  switch (result.type) {
    case "answer":
      const answerMatch = url.match(/\/question\/(\d+)\/answer\/(\d+)/);
      if (answerMatch) {
        result.questionId = answerMatch[1];
        result.answerId = answerMatch[2];
      }
      break;
    case "article":
      const articleMatch = url.match(/\/p\/(\d+)/);
      if (articleMatch) {
        result.articleId = articleMatch[1];
      }
      break;
    case "video":
      const videoMatch = url.match(/\/zvideo\/(\d+)/);
      if (videoMatch) {
        result.videoId = videoMatch[1];
      }
      break;
    case "question":
      const questionMatch = url.match(/\/question\/(\d+)/);
      if (questionMatch) {
        result.questionId = questionMatch[1];
      }
      break;
  }

  return result;
};

/**
 * 知乎API请求头配置
 * @param {string} cookies - Cookie字符串
 * @returns {object} 请求头对象
 */
export const getZhihuHeaders = (cookies = "") => {
  return {
    accept: "*/*",
    "accept-language": "zh-CN,zh;q=0.9",
    cookie: cookies,
    priority: "u=1, i",
    referer:
      "https://www.zhihu.com/search?q=python&time_interval=a_year&type=content",
    "user-agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    "x-api-version": "3.0.91",
    "x-app-za": "OS=Web",
    "x-requested-with": "fetch",
    "x-zse-93": "101_3_3.0",
  };
};
