import {
  delay,
  ensureDirectoryExists,
  existFile,
  fetchDanmaku,
  formatDanmakuToTxt,
  getBilibiliDetailUrl,
  getBVid,
  getMainCommentUrl,
  getOid,
  getReplyUrl,
  processVideoDetail,
  sanitizeFilename,
  saveCommentData
} from "#utils/index";
import axios from "axios";
import fs from "fs";
import inquirer from 'inquirer';
import path from "path";
import { fileURLToPath } from "url";
import UserAgent from "user-agents";

const header = {
  "user-agent": new UserAgent().toString(),
  cookie: process.env.COOKIES,
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));


/**
 * 爬取B站评论
 * @param {string} [forceBVid] - 强制使用的BV号（可选）
 * @returns {Promise<void>}
 */
const crawlBilibiliComments = async (forceBVid) => {
  /** @type {Array<IComment>} */
  const comments = [];
  /** @type {BilibiliDetail} */
  const detail = {
    title: "",
    description: "",
    duration: "",
    owner: "",
    oid: 0,
    view: 0,
    reply: 0,
    favorite: 0,
    coin: 0,
    share: 0,
    like: 0,
    cid: 0,
    danmaku: 0,
  };
  let preCommentLength = 0;
  let i = 0;
  let retryCount = 0;
  let noRepliesCount = 0; // 添加计数器，记录连续没有查询到评论的次数
  const MAX_NO_REPLIES = 3; // 最大允许连续没有查询到评论的次数

  // 使用强制传入的BV号或尝试从环境变量获取
  const bvid = getBVid(forceBVid);

  if (!bvid) {
    console.log('未提供有效的BV号，无法爬取视频');
    return;
  }

  console.log(`开始爬取视频 ${bvid} 的评论`);

  const { data: detailResponse } = await axios.get(
    getBilibiliDetailUrl(bvid),
    {
      headers: header,
    }
  );

  processVideoDetail(detail, detailResponse.data);
  console.log('已获取到视频详情' + detail.title)

  process.env.OID = detail.oid.toString();

  // 创建以oid命名的目录，清理文件名中的特殊字符
  const sanitizedTitle = sanitizeFilename(detail.title);
  const outputDir = path.join(__dirname, `${sanitizedTitle}-${detail.oid}`);
  ensureDirectoryExists(outputDir);

  const danmakuFilePath = path.join(outputDir, "bilibili_danmaku.txt");
  let danmakuTxtContent = ''

  /** @做一个函数，当读取到的弹幕数量有detail.danmaku的80%时就不读取 */
  if (!existFile(danmakuFilePath)) {
    const danmus = await fetchDanmaku(detail.cid, detail.danmaku);
    console.log(`成功获取${danmus.length}条弹幕，占总弹幕数的${((danmus.length / detail.danmaku) * 100).toFixed(2)}%`);

    // 将弹幕转换为简单的文本格式
    danmakuTxtContent = formatDanmakuToTxt(danmus);
    fs.writeFileSync(
      danmakuFilePath,
      danmakuTxtContent,
      { encoding: "utf-8" }
    );
    console.log(`评论和弹幕已保存到目录: ${outputDir}`);
  } else {
    console.log(`弹幕已存在，跳过获取弹幕`);
    danmakuTxtContent = fs.readFileSync(danmakuFilePath, { encoding: "utf-8" });
  }

  // 计算目标评论数量（90%的总评论数）
  const targetCommentCount = Math.floor(detail.reply * 0.9);
  console.log(`目标获取评论数: ${targetCommentCount}条（总评论数的90%）`);

  while (true) {
    try {
      const response = await axios.get(getMainCommentUrl(i, getOid()), {
        headers: header,
      });
      await delay();
      i += 1; // 获取到下一页

      const responseData = response.data;
      const replies = responseData.data.replies;
      if (!responseData.data || !replies) {
        console.log('没有查询到子评论，跳过');
        noRepliesCount++; // 增加计数器

        // 如果连续多次没有查询到评论，可能是cookies失效
        if (noRepliesCount >= MAX_NO_REPLIES) {
          console.log(`连续${MAX_NO_REPLIES}次没有查询到评论，请检查cookies是否失效`);
          break; // 退出循环
        }

        continue;
      }

      // 如果查询到了评论，重置计数器
      noRepliesCount = 0;

      for (const content of replies) {
        const replyCount = content.rcount;

        /** @type {IComment} */
        const commentObj = {
          content: content.content.message,
          author: content.member.uname,
          sex: content.member.sex,
          time: content.ctime,
          rpid: content.rpid,
          childList: [],
          replyCount,
        };
        if (replyCount > 0) {
          await delay();
          const { data: replyResponse } = await axios.get(
            getReplyUrl(content.rpid, getOid()),
            {
              headers: header,
            }
          );
          /** @type {Array<IComment>} */
          const childComments = replyResponse.data.replies.map(
            /** @param {AnyObject} reply */
            (reply) => ({
              content: reply.content.message,
              author: reply.member.uname,
              sex: reply.member.sex,
              time: reply.ctime,
              rpid: reply.rpid,
            })
          );
          commentObj.childList = childComments;
        }
        comments.push(commentObj);
      }

      const totalChildComments = comments.reduce(
        (acc, cur) => acc + cur.replyCount,
        0
      );

      console.log(
        `搜集到${comments.length}条主评论，${totalChildComments}条子评论，总计${comments.length + totalChildComments}条评论`
      );

      // 检查是否已达到目标评论数量（90%）
      const currentTotalComments = comments.length + comments.reduce(
        (acc, cur) => acc + cur.replyCount,
        0
      );

      if (currentTotalComments >= targetCommentCount) {
        console.log(`已达到目标评论数量（${currentTotalComments}/${detail.reply}，${((currentTotalComments / detail.reply) * 100).toFixed(2)}%），停止爬取`);
        break;
      }

      // 调整爬虫策略，上一次评论总数和这一次评论总数进行比较，如果有改变说明有新数据，如果没改变说明数据全部搜集完毕，爬虫停止
      if (comments.length === preCommentLength) {
        console.log("爬虫退出！！！");
        break;
      } else {
        preCommentLength = comments.length;
      }
    } catch (error) {
      console.error("请求失败，1秒后重试", error);

      // 添加重试计数器
      retryCount = (retryCount || 0) + 1;
      if (retryCount >= 3) {
        console.log("已重试3次，停止爬取更多评论，开始保存已获取的数据");
        break;
      }

      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  console.log(`搜集到${comments.length}条主评论，共计${comments.length + comments.reduce((acc, cur) => acc + cur.replyCount, 0)}条评论（包括子评论）`);

  // 调用封装的函数保存数据
  const { allPath } = await saveCommentData(outputDir, comments, detail, danmakuTxtContent);

  console.log(`评论已保存到目录: ${outputDir}`);

  if (process.env.executablePath) {
    const browser = (await import('#utils/browser')).default
    await browser.run(allPath)
  }
};



// 主程序入口
async function main() {
  const bvid = getBVid();
  if (bvid) {
    try {
      await crawlBilibiliComments(bvid);
    } catch (error) {
      console.error("爬虫执行失败:", error);
    }
    console.log('\n==================================================');
    console.log('爬虫任务已完成，现在进入交互模式');
    console.log('==================================================\n');
  } else {
    console.log('\n==================================================');
    console.log('欢迎使用 Bilibili 评论爬虫');
    console.log('==================================================\n');
  }

  // 启动交互式命令行界面
  startInteractiveMode();
}

// 执行主程序
main().catch(error => {
  console.error("程序运行失败:", error);
});

/**
 * 启动交互式命令行模式，使用inquirer库提供更好的用户体验
 */
function startInteractiveMode() {
  promptForAction();
}

/**
 * 提示用户选择操作
 */
async function promptForAction() {
  try {
    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作:',
        choices: [
          { name: '爬取新视频', value: 'crawl' },
          { name: '查看已爬取视频列表', value: 'list' },
          { name: '帮助信息', value: 'help' },
          { name: '退出程序', value: 'exit' }
        ],
        loop: false
      }
    ]);

    switch (action) {
      case 'crawl':
        await promptForBVid();
        break;
      case 'list':
        await listCrawledVideos();
        break;
      case 'help':
        showHelp();
        break;
      case 'exit':
        console.log('程序已退出');
        process.exit(0);
        break;
    }
  } catch (error) {
    console.error('发生错误:', error);
    promptForAction();
  }
}

/**
 * 提示用户输入BV号
 */
async function promptForBVid() {
  const { bvid } = await inquirer.prompt([
    {
      type: 'input',
      name: 'bvid',
      message: '请输入B站视频BV号:',
      validate: (input) => {
        const bvidMatch = input.match(/BV[a-zA-Z0-9]{10}/);
        if (bvidMatch) {
          return true;
        }
        return 'BV号格式错误，请输入正确的BV号或包含BV号的链接';
      }
    }
  ]);

  // 直接传递BV号给爬虫函数，而不是通过环境变量
  try {
    await crawlBilibiliComments(bvid);
    console.log(`视频 ${bvid} 的评论爬取完成`);
  } catch (error) {
    console.error(`爬取视频 ${bvid} 失败:`, error);
  }

  // 爬取完毕后，继续提示用户选择操作
  promptForAction();
}

/**
 * 列出已爬取的视频
 */
async function listCrawledVideos() {
  // 列出 __dirname 目录下所有以数字结尾的文件夹
  const dirs = fs.readdirSync(__dirname)
    .filter(dir => fs.lstatSync(path.join(__dirname, dir)).isDirectory())
    .filter(dir => /\d+$/.test(dir));

  if (dirs.length === 0) {
    console.log('\n暂无爬取记录');
    promptForAction();
    return;
  }

  // 格式化显示爬取的视频列表
  const choices = dirs.map(dir => ({
    name: dir,
    value: dir
  }));

  choices.push({ name: '返回上级菜单', value: 'back' });

  const { selectedDir } = await inquirer.prompt([
    {
      type: 'list',
      name: 'selectedDir',
      message: '已爬取的视频列表:',
      choices: choices
    }
  ]);

  if (selectedDir === 'back') {
    promptForAction();
    return;
  }

  // 如果选择了某个视频，可以提供查看该视频详情的选项
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: `选择对 ${selectedDir} 的操作:`,
      choices: [
        { name: '查看视频详情', value: 'view' },
        { name: '返回列表', value: 'back' }
      ]
    }
  ]);

  if (action === 'view') {
    try {
      const detailPath = path.join(__dirname, selectedDir, 'bilibili_detail.json');
      if (fs.existsSync(detailPath)) {
        const detailContent = fs.readFileSync(detailPath, { encoding: 'utf-8' });
        const detail = JSON.parse(detailContent);
        console.log('\n视频详情:');
        console.log(`标题: ${detail.title}`);
        console.log(`观看次数: ${detail.view}`);
        console.log(`评论数: ${detail.reply}`);
        console.log(`弹幕数: ${detail.danmaku}`);
        console.log(`点赞数: ${detail.like}`);
        console.log(`投币数: ${detail.coin}`);
        console.log(`收藏数: ${detail.favorite}`);
        console.log(`分享数: ${detail.share}\n`);
      } else {
        console.log('未找到视频详情文件');
      }
    } catch (error) {
      console.error('读取视频详情失败:', error);
    }
  }

  // 返回视频列表
  listCrawledVideos();
}

/**
 * 显示帮助信息
 */
function showHelp() {
  console.log('\n帮助信息:');
  console.log('1. 爬取新视频 - 输入B站视频BV号，爬取视频评论和弹幕');
  console.log('2. 查看已爬取视频列表 - 显示已爬取的视频列表，可以查看详情');
  console.log('3. 帮助信息 - 显示本帮助信息');
  console.log('4. 退出程序 - 退出爬虫程序\n');

  promptForAction();
}
