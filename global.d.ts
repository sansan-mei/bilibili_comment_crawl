// 给env加类型
declare namespace NodeJS {
  interface ProcessEnv {
    B_VID: string;
    COOKIES: string;
    OID: string;
    EXECUTABLE_PATH: string;
    IS_FETCH_VIDEO_STREAM: string;
    MODEL_PATH: string;
    STATIC_PATH: string;
  }
}

// AnyObject
declare type AnyObject = Record<string, any>;

declare type AnyArray = Array<any>;

declare type IComment = {
  content: string;
  author: string;
  sex: string;
  time: number;
  rpid: string;
  childList: Array<IComment>;
  replyCount: number;
  like: number;
  member: AnyObject;
  reply_control: {
    location: string;
    time_desc: string;
    translation_switch: number;
  };
};

declare type BilibiliDetail = {
  title: string;
  description: string;
  duration: string;
  owner: string;
  oid: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  like: number;
  cid: number;
};

declare type BilibiliVideoInfo = {
  data: {
    durl: Array<{
      url: string;
    }>;
  };
};

declare type BilibiliSubtitle = {
  ai_status: number;
  ai_type: number;
  id: number;
  id_str: string;
  is_lock: boolean;
  lan: string;
  lan_doc: string;
  subtitle_url?: string;
  subtitle_url_v2?: string;
  type: number;
};

declare type BilibiliSubtitleDetail = {
  content: string;
  from: number;
  location: number;
  music: number;
  sid: number;
  to: number;
};
