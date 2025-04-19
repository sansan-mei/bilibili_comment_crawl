@echo off
chcp 65001 > nul
echo Current directory: %~dp0
echo.
echo Step 1: Creating startup item
echo Creating shortcut...
copy /y "%~dp0start_crawler.bat" "%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\BilibiliCommentCrawler.bat"
if errorlevel 1 (
    echo Failed to create shortcut!
    pause
    exit /b 1
)
echo Startup item created successfully!
echo.
echo Step 2: Stopping existing crawler
echo Stopping...
taskkill /f /im node.exe /fi "WINDOWTITLE eq start_crawler.bat" > nul 2>&1
echo.
echo Step 3: Starting crawler
echo Starting...
cd /d "%~dp0"
start /min "" "start_crawler.bat"
echo Crawler started in background
echo.
echo Press any key to close this window...
pause > nul 