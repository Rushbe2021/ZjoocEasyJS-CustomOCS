class Settings {
    static STORAGE_KEY_POSITION = 'floating_window_position';
    static STORAGE_KEY_SIZE = 'floating_window_size';
    static STORAGE_KEY_MUTE = 'video_mute';
    static STORAGE_KEY_SPEED = 'video_speed';
    static STORAGE_KEY_EXAM_MODE = 'exam_mode';
    static STORAGE_KEY_DO_VIDEO = 'do_video';
    static DEFAULT_SIZE = { width: 300, height: 400 };

    static get speedRun() {
      return localStorage.getItem(this.STORAGE_KEY_DO_VIDEO) === 'true';
    }
    static set speedRun(value) {
      localStorage.setItem(this.STORAGE_KEY_DO_VIDEO, value.toString());
    }

    // 直接访问浮动窗口位置
    static get position() {
      const position = localStorage.getItem(this.STORAGE_KEY_POSITION);
      return position ? JSON.parse(position) : { left: 0, top: 0 }; // 默认位置
    }
  
    static set position(value) {
      localStorage.setItem(this.STORAGE_KEY_POSITION, JSON.stringify(value));
    }

    // 浮动窗口尺寸
    static get size() {
      try {
        const parsed = JSON.parse(localStorage.getItem(this.STORAGE_KEY_SIZE) || 'null');
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
      localStorage.setItem(
        this.STORAGE_KEY_SIZE,
        JSON.stringify({
          width: Math.max(1, Number(value.width) || this.DEFAULT_SIZE.width),
          height: Math.max(1, Number(value.height) || this.DEFAULT_SIZE.height),
        })
      );
    }
  
    // 直接访问视频倍速
    static get speed() {
      return localStorage.getItem(this.STORAGE_KEY_SPEED) || "1"; // 默认倍速为1.0
    }
  
    static set speed(value) {
      localStorage.setItem(this.STORAGE_KEY_SPEED,  String(value));
    }
  
    // 直接访问是否静音
    static get mute() {
      return localStorage.getItem(this.STORAGE_KEY_MUTE) === 'true';
    }
  
    static set mute(value) {
      localStorage.setItem(this.STORAGE_KEY_MUTE, value.toString());
    }
  
    // 直接访问考试模式
    static get examMode() {
      return localStorage.getItem(this.STORAGE_KEY_EXAM_MODE) === 'true';
    }
  
    static set examMode(value) {
      localStorage.setItem(this.STORAGE_KEY_EXAM_MODE, value.toString());
    }
  }
  export default Settings;