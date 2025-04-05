# &#x1F308;&#x1F308;&#x1F308;bilibili 评论弹幕视频信息爬取&#x1F308;&#x1F308;&#x1F308;

[English Version](README.en.md)

⭐**重点**：但是本项目只是学习使用，如果用作任何其他用途，本人概不负责！！！⚠⚠⚠

### 该项目只适用学习其他任何用途均禁止使用！！！

### 该项目只适用学习其他任何用途均禁止使用！！！

### 该项目只适用学习其他任何用途均禁止使用！！！

## 项目介绍

这是一个用于爬取 bilibili 视频评论、弹幕和视频信息的工具。它可以：

- 获取视频的基本信息（标题、描述、播放量等）
- 爬取视频的评论（包括主评论和子评论）
- 获取视频的 mp4、mp3
- 将数据保存为多种格式（JSON、TXT、media）
- 视频语音转文字生成字幕
- 提供交互式命令行界面
- 提供 浏览器插件方便的 API 服务接口

## 环境要求

- Node.js 20+
- 有效的 bilibili 账号 Cookie

## 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/yourusername/bilibili-comment-crawl-js.git
cd bilibili-comment-crawl-js
```

2. 安装依赖

```bash
npm i
# 或者
yarn
# 或者
bun i
```

3. 下载 Vosk 模型（可选，用于语音转文字功能）

从 https://alphacephei.com/vosk/models 下载中文语音模型，解压到项目根目录的 `model` 文件夹中。

## 使用方法

### 1. 找到自己想要爬取视频的 bvid

会在视频的 url 那里显示，比如下面的视频 BV 开头 就是 BV1z5RPYHEoD

```
https://www.bilibili.com/list/watchlater?bvid=BV1z5RPYHEoD&oid=114114831651644
```

### 2. 设置 cookies 和 bvid

首先复制环境变量示例文件：

```bash
cp .env.example .env
```

然后编辑 `.env` 文件，设置以下参数：

```
COOKIES=你的浏览器cookies，f12打开b站的控制台然后随便抓个请求复制request_headers里的cookie
B_VID=视频的bvid（可选，可在跑命令时传入）
EXECUTABLE_PATH=浏览器可执行文件路径（可选，用于自定义浏览器路径，主要用于Windows系统）
IS_FETCH_VIDEO_STREAM=0 # 是否获取视频流，0为不获取，1为获取
MODEL_PATH=model # Vosk模型路径，用于语音转文字功能
```

获取 Cookie 的步骤：

1. 登录 bilibili 网站
2. 按 F12 打开开发者工具
3. 切换到 Network 标签
4. 刷新页面，选择任意一个请求
5. 在请求头中找到并复制完整的 Cookie 值

### 3. 运行爬虫

```bash
# 使用 .env 文件中配置的 bvid
npm run dev
# 或者
yarn dev

# 也可以直接指定 bvid
npm run dev BV1z5RPYHEoD
# 或者
yarn dev BV1z5RPYHEoD
```

### 4. 通过交互式命令行使用

程序启动后，会自动进入交互式命令行界面，你可以：

1. 输入 BV 号爬取新视频
2. 查看已爬取视频列表
3. 查看帮助信息
4. 退出程序

### 5. 通过 API 接口使用

程序启动后，会自动启动一个本地 API 服务，默认端口为 39002：

```
http://127.0.0.1:39002/start-crawl/{bvid}
```

只要用于给插件请求使用

### 6. 查看结果

爬取完成后，程序会在当前目录下创建一个以视频标题和 oid 命名的文件夹，包含以下文件：

- `bilibili_all.txt`: 简单分行的包含下边全部信息的合成 txt 文件
- `bilibili_comments.txt`: 评论数据的文本格式
- `bilibili_danmaku.txt`: 弹幕数据的文本格式
- `bilibili_detail.json`: 视频详情的 JSON 格式

如果启用了视频语音转文字功能（IS_FETCH_VIDEO_STREAM=1），则会额外生成：

- `current.mp4`: 下载的视频文件
- `current.mp3`: 从视频中提取的音频文件
- `subtitles.txt`: 由语音识别生成的字幕文件

## 高级功能

### 视频语音转文字

设置 `IS_FETCH_VIDEO_STREAM=1` 并确保已下载正确的 Vosk 模型到 model 目录，程序会自动下载视频，提取音频并生成字幕文件。

### 浏览器自动化

设置 `EXECUTABLE_PATH` 环境变量指向 Chrome 浏览器可执行文件路径，程序可以在爬取完成后自动打开浏览器展示结果。

## 注意事项

- 爬虫会尝试获取视频总评论数的 90%（自行配置），如果评论数量很多，可能需要较长时间
- 如果请求失败，程序会自动重试最多 3 次
- 请合理设置爬取频率，避免对 bilibili 服务器造成过大压力
- 请遵守 bilibili 的用户协议和相关法律法规
- 视频语音转文字功能需要较多计算资源，请确保你的电脑配置足够
- 如果遇到浏览器相关问题，可以通过设置 `EXECUTABLE_PATH` 环境变量指定自定义浏览器路径

## 免责声明

本项目仅供学习和研究使用，请勿用于任何商业或非法用途。

## 常见问题

1. cookies 通常会在几天到十几天内过期，过期时如果启动脚本会获取不到评论
2. 提供的 hapi 服务是给笔者另一个仓库浏览器插件用的（https://github.com/sansan-mei/BrowserPluginBymyself），主要为了方便爬取
3. vosk 是用了 c++的东西的，所以如果用 bun 安装不了，请用原始的 npm
4. ffmpeg 不需要本地安装
5. 默认下载的最低分辨率视频
