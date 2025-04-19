$Action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c D:\code\python\bilibili_comment_crawl\start_crawler.bat"
$Trigger = New-ScheduledTaskTrigger -AtStartup
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -DontStopOnIdleEnd
$Principal = New-ScheduledTaskPrincipal -UserId "$env:COMPUTERNAME\$env:USERNAME" -LogonType S4U
Register-ScheduledTask -TaskName "BilibiliCommentCrawler" -Action $Action -Trigger $Trigger -Settings $Settings -Principal $Principal -Description "开机自动运行B站评论爬虫" 