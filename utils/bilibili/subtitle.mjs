/**
 * 将字幕数据转换为ASS格式
 * @param {Array<BilibiliSubtitleDetail>} subtitles - 字幕数据数组
 * @returns {string} ASS格式的字幕文本
 */
export const convertToASS = (subtitles) => {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
Timer: 100.0000

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,微软雅黑,54,&H00FFFFFF,&H00FFFFFF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,20,20,20,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = subtitles
    .map((subtitle, index) => {
      const start = formatTimeASS(subtitle.from);
      const end = formatTimeASS(subtitle.to);
      return `Dialogue: 0,${start},${end},Default,,0,0,0,,${subtitle.content}`;
    })
    .join("\n");

  return header + events;
};

/**
 * 将字幕数据转换为SRT格式
 * @param {Array<BilibiliSubtitleDetail>} subtitles - 字幕数据数组
 * @returns {string} SRT格式的字幕文本
 */
export const convertToSRT = (subtitles) => {
  return subtitles
    .map((subtitle, index) => {
      const start = formatTimeSRT(subtitle.from);
      const end = formatTimeSRT(subtitle.to);
      return `${index + 1}\n${start} --> ${end}\n${subtitle.content}\n`;
    })
    .join("\n");
};

/**
 * 格式化时间为ASS格式 (H:MM:SS.cc)
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间
 */
const formatTimeASS = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const centisecs = Math.floor((seconds % 1) * 100);
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}.${centisecs.toString().padStart(2, "0")}`;
};

/**
 * 格式化时间为SRT格式 (HH:MM:SS,mmm)
 * @param {number} seconds - 秒数
 * @returns {string} 格式化后的时间
 */
const formatTimeSRT = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const millisecs = Math.floor((seconds % 1) * 1000);
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${secs.toString().padStart(2, "0")},${millisecs
    .toString()
    .padStart(3, "0")}`;
};
