import Hapi from "@hapi/hapi";
import Inert from "@hapi/inert";
import { notifier } from "./notifier.mjs";
import { getStaticPath } from "./utils.mjs";

/**
 * 处理函数
 * @type {Function}
 */
let handle;

const app = Hapi.server({
  port: 39002,
  host: "127.0.0.1",
});

// 注册静态资源插件
await app.register(Inert);

// 稍后在 logStart 函数中配置静态资源路由

app.route({
  method: "POST",
  path: "/start-crawl/{b_vid}",
  handler: (request) => {
    const { b_vid } = request.params;
    /** @type {any} */
    const pl = request.payload;
    /** @type {Array<{name:string,value:string}>} */
    const cookies = pl?.cookies;
    if (cookies) {
      process.env.COOKIES = cookies
        .map((item) => `${item.name}=${item.value}`)
        .join("; ");
    }
    if (handle && cookies) {
      handle(b_vid);
      notifier.notify("Bilibili脚本", "正在请求处理...");
      return "请求成功，正在处理...";
    } else {
      return "未提供处理函数";
    }
  },
});

/**
 * 启动Hapi服务器
 * @param {Function} _handle - 启动成功后的回调函数
 */
async function logStart(_handle) {
  // 在启动前配置静态资源路由
  const staticPath = await getStaticPath();
  app.route({
    method: "GET",
    path: "/{param*}",
    options: {
      files: {
        relativeTo: "/",
      },
    },
    handler: {
      directory: {
        path: staticPath,
        listing: true,
        index: true,
      },
    },
  });

  await app.start();
  notifier.log("\n==================================================");
  notifier.log("Hapi服务器启动成功");
  notifier.log("==================================================\n");
  handle = _handle;
}

const httpServer = app;
export { httpServer, logStart };
