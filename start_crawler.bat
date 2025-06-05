@echo off
cd /d %~dp0
echo 正在启动爬虫程序...
node %~dp0crawl.mjs -cmd
pause 