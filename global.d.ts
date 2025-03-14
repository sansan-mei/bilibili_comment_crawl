// 给env加类型
declare namespace NodeJS {
  interface ProcessEnv {
    B_VID: string;
    COOKIES: string;
    OID: string;
  }
}

// AnyObject
declare type AnyObject = Record<string, any>;

declare type AnyArray = Array<any>;
