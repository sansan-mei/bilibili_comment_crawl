# &#x1F308;&#x1F308;&#x1F308;Bilibili Comment, Danmaku, and Video Info Crawler&#x1F308;&#x1F308;&#x1F308;

[中文版](README.md)

⭐**IMPORTANT**: This project is for educational purposes only. I am not responsible for any other use!!! ⚠⚠⚠

### This project is for EDUCATIONAL PURPOSES ONLY. Any other use is prohibited!!!

### This project is for EDUCATIONAL PURPOSES ONLY. Any other use is prohibited!!!

### This project is for EDUCATIONAL PURPOSES ONLY. Any other use is prohibited!!!

## Project Introduction

This is a tool for crawling comments, danmaku (bullet screen comments), and video information from Bilibili. It can:

- Get basic video information (title, description, view count, etc.)
- Crawl video comments (including main comments and replies)
- Retrieve video danmaku
- Save data in multiple formats (JSON, TXT, HTML)

## Requirements

- Node.js 20+
- Valid Bilibili account cookies

## Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/bilibili-comment-crawl-js.git
cd bilibili-comment-crawl-js
```

2. Install dependencies

```bash
npm install
# or
yarn install
```

## Usage

### 1. Find the bvid of the video you want to crawl

The bvid is displayed in the video URL. For example, in the following URL, the bvid is BV1z5RPYHEoD:

```
https://www.bilibili.com/list/watchlater?bvid=BV1z5RPYHEoD&oid=114114831651644
```

### 2. Set up cookies and bvid

First, copy the environment variable example file:

```bash
cp .env.example .env
```

Then edit the `.env` file and set the following parameters:

```
COOKIES=your_browser_cookies_here
B_VID=video_bvid
EXECUTABLE_PATH=browser_executable_path (optional, for custom browser path)
```

Steps to get cookies:

1. Log in to the Bilibili website
2. Press F12 to open developer tools
3. Switch to the Network tab
4. Refresh the page and select any request
5. Find and copy the complete Cookie value from the request headers

### 3. Run the crawler

```bash
# Using the bvid configured in the .env file
npm run dev
# or
yarn dev

# Or directly specify a bvid
npm run dev BV1z5RPYHEoD
# or
yarn dev BV1z5RPYHEoD
```

### 4. View the results

After crawling is complete, the program will create a folder named after the video title and oid in the current directory, containing the following files:

- `bilibili_all.txt`: A simple text file containing all information combined
- `bilibili_comments.txt`: Comments data in text format
- `bilibili_danmaku.txt`: Danmaku data in text format
- `bilibili_detail.json`: Video details in JSON format

## Notes

- The crawler will attempt to retrieve 90% of the total comments (configurable), which may take a long time if there are many comments
- If a request fails, the program will automatically retry up to 3 times
- Please set a reasonable crawling frequency to avoid putting too much pressure on Bilibili's servers
- Please comply with Bilibili's user agreement and relevant laws and regulations
- If you encounter browser-related issues, you can set the `EXECUTABLE_PATH` environment variable to specify a custom browser path

## Disclaimer

This project is for educational and research purposes only. Do not use it for any commercial or illegal purposes. The user assumes all responsibility for any consequences resulting from the use of this tool.
