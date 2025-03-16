import path from 'path';
import protobuf from 'protobufjs';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 初始化protobuf
const root = protobuf.loadSync(path.join(__dirname, "../bilibli.proto"));
export const DmSegMobileReply = root.lookupType('bilibili.community.service.dm.v1.DmSegMobileReply');
