@echo off
cd /d %~dp0
echo 正在启动爬虫程序...
echo 1 | node --env-file=.env crawl.mjs
pause 