// 给env加类型
declare namespace NodeJS {
  interface ProcessEnv {
    OID: string;
    B_VID: string;
  }
}

// AnyObject
declare type AnyObject = Record<string, any>;

declare type AnyArray = Array<any>;
