class Settings {
    static STORAGE_KEY_POSITION = 'floating_window_position';
    static STORAGE_KEY_MUTE = 'video_mute';
    static STORAGE_KEY_SPEED = 'video_speed';
    static STORAGE_KEY_EXAM_MODE = 'exam_mode';
    static STORAGE_KEY_DO_VIDEO = 'do_video';

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