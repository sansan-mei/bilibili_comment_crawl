import Hapi from "@hapi/hapi";

/**
 * 处理函数
 * @type {Function}
 */
let handle;

const app = Hapi.server({
  port: 39002,
  host: "127.0.0.1",
});

app.route({
  method: "GET",
  path: "/start-crawl/{b_vid}",
  handler: (request) => {
    const { b_vid } = request.params;
    handle?.(b_vid);
    return handle ? "请求成功，正在处理..." : "未提供处理函数";
  },
});

/**
 * 启动Hapi服务器
 * @param {Function} _handle - 启动成功后的回调函数
 */
function logStart(_handle) {
  app.start().then(() => {
    console.log("\n==================================================");
    console.log("Hapi服务器启动成功");
    console.log("==================================================\n");
    handle = _handle;
  });
}

const httpServer = app;
export { httpServer, logStart };
