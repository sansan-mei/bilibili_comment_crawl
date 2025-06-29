import UserAgent from "user-agents";

/**
 * 获取BV号
 * @param {string} [arg] - 命令行参数
 * @returns {string} - BV号
 */
export const getBVid = (arg) => {
  /** @https://www.bilibili.com/list/watchlater?bvid=BV1T3QNYaEBL&oid=114155331782990 */
  const argv2 = arg || process.argv[2];
  if (argv2?.includes("BV")) {
    const result = argv2.match(/BV[a-zA-Z0-9]{10}/)?.[0];
    if (result) {
      return result;
    } else {
      throw new Error("BV号格式错误");
    }
  }

  // 最后尝试从环境变量B_VID获取
  return process.env.B_VID;
};

/**
 * 处理视频详情数据
 * @param {BilibiliDetail} detail - 视频详情对象
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
  detail.owner = data.owner.name;
};

/**
 * 获取请求头
 * @returns {AnyObject} 请求头
 */
export const getHeaders = () => {
  return {
    "user-agent": new UserAgent().toString(),
    cookie: process.env.COOKIES,
    referer: "https://www.bilibili.com/",
    origin: "https://www.bilibili.com/",
  };
};

/**
 * 获取环境变量中的OID
 * @returns {string} - 视频OID
 */
export const getOid = () => {
  return process.env.OID;
};
