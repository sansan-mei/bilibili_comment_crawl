import Hapi from "@hapi/hapi";
import Inert from "@hapi/inert";

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

// 配置静态资源路由
app.route({
  method: "GET",
  path: "/{param*}",
  handler: {
    directory: {
      path: "public",
      listing: true,
      index: true,
    },
  },
});

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
    handle?.(b_vid);
    return handle ? "请求成功，正在处理..." : "未提供处理函数";
  },
});

/**
 * 启动Hapi服务器
 * @param {Function} _handle - 启动成功后的回调函数
 */
async function logStart(_handle) {
  await app.start();
  console.log("\n==================================================");
  console.log("Hapi服务器启动成功");
  console.log("==================================================\n");
  handle = _handle;
}

const httpServer = app;
export { httpServer, logStart };
