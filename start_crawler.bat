@echo off
cd /d %~dp0
echo 正在启动爬虫程序...
echo 1 | node %~dp0crawl.mjs
pause 