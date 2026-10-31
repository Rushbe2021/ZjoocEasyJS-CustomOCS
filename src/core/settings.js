import { getConfig, setConfig } from './gmStorage.js';

class Settings {
    static STORAGE_KEY_POSITION = 'floating_window_position';
    static STORAGE_KEY_SIZE = 'floating_window_size';
    static STORAGE_KEY_MUTE = 'video_mute';
    static STORAGE_KEY_SPEED = 'video_speed';
    static STORAGE_KEY_EXAM_MODE = 'exam_mode';
    static STORAGE_KEY_DO_VIDEO = 'do_video';
    static DEFAULT_SIZE = { width: 300, height: 400 };

    static get speedRun() {
      return getConfig(this.STORAGE_KEY_DO_VIDEO, 'false') === 'true';
    }
    static set speedRun(value) {
      setConfig(this.STORAGE_KEY_DO_VIDEO, value.toString());
    }

    // 直接访问浮动窗口位置
    static get position() {
      const raw = getConfig(this.STORAGE_KEY_POSITION, null);
      if (!raw) {
        return { left: 0, top: 0 }; // 默认位置
      }
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return parsed && typeof parsed === 'object' ? parsed : { left: 0, top: 0 };
      } catch (error) {
        console.warn('[ZE窗口] 位置配置无效，已使用默认值', error);
        return { left: 0, top: 0 };
      }
    }
  
    static set position(value) {
      setConfig(this.STORAGE_KEY_POSITION, JSON.stringify(value));
    }

    // 浮动窗口尺寸
    static get size() {
      const raw = getConfig(this.STORAGE_KEY_SIZE, null);
      try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (parsed && Number.isFinite(parsed.width) && Number.isFinite(parsed.height)) {
          return {
            width: Math.max(1, parsed.width),
            height: Math.max(1, parsed.height),
          };
        }
      } catch (error) {
        console.warn('[ZE窗口] 尺寸配置无效，已使用默认值', error);
      }
      return { ...this.DEFAULT_SIZE };
    }

    static set size(value) {
      setConfig(
        this.STORAGE_KEY_SIZE,
        JSON.stringify({
          width: Math.max(1, Number(value.width) || this.DEFAULT_SIZE.width),
          height: Math.max(1, Number(value.height) || this.DEFAULT_SIZE.height),
        })
      );
    }
  
    // 直接访问视频倍速
    static get speed() {
      return getConfig(this.STORAGE_KEY_SPEED, '1') || '1'; // 默认倍速为1.0
    }
  
    static set speed(value) {
      setConfig(this.STORAGE_KEY_SPEED, String(value));
    }
  
    // 直接访问是否静音
    static get mute() {
      return getConfig(this.STORAGE_KEY_MUTE, 'false') === 'true';
    }
  
    static set mute(value) {
      setConfig(this.STORAGE_KEY_MUTE, value.toString());
    }
  
    // 直接访问考试模式
    static get examMode() {
      return getConfig(this.STORAGE_KEY_EXAM_MODE, 'false') === 'true';
    }
  
    static set examMode(value) {
      setConfig(this.STORAGE_KEY_EXAM_MODE, value.toString());
    }
  }
  export default Settings;