import { createNotice, isElectron } from "#utils/index";

class Notifier {
  constructor() {
    this._isElectron = isElectron();
  }

  /**
   * 显示普通消息
   * @param {string} message
   */
  async info(message) {
    if (this._isElectron) {
      const { createTrayMenu } = await import("#utils/tray");
      createTrayMenu({ label: message });
    } else {
      console.log(message);
    }
  }

  /**
   * 显示通知
   * @param {string} title
   * @param {string} body
   */
  notify(title, body) {
    if (this._isElectron) {
      createNotice({ title, body });
    } else {
      console.log(`${title}: ${body}`);
    }
  }

  /**
   * 显示日志
   * @param {string} message
   */
  log(message) {
    console.log(message);
  }

  /**
   * 清除托盘菜单
   */
  async clear() {
    if (this._isElectron) {
      const { createTrayMenu } = await import("#utils/tray");
      createTrayMenu();
    }
  }
}

export const notifier = new Notifier();
