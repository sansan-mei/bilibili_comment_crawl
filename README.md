# &#x1F308;&#x1F308;&#x1F308;bilibili 评论弹幕视频信息爬取&#x1F308;&#x1F308;&#x1F308;

⭐**重点**：但是本项目只是学习使用，如果用作任何其他用途，本人概不负责！！！⚠⚠⚠

### 该项目只适用学习其他任何用途均禁止使用！！！

### 该项目只适用学习其他任何用途均禁止使用！！！

### 该项目只适用学习其他任何用途均禁止使用！！！

## 步骤：

- 1、找到自己想要爬取视频的 bvid

- 2、设置 cookies

## 找到视频的 bvid

会在视频的 url 那里显示，比如下面的视频 BV 开头 就是 BV1z5RPYHEoD

```
https://www.bilibili.com/list/watchlater?bvid=BV1z5RPYHEoD&oid=114114831651644
```

## 设置 cookies

命令行跑一下

```
cp .env.example .env
```

调一下参数

```javascript
COOKIES = your_cookies_here; // 可以f12打卡b站的控制台然后随便抓个请求复制下来
B_VID = 视频的bvid;
```

## 运行

然后 yarn dev 跑就完事了, 或者 yarn dev [bvid]
