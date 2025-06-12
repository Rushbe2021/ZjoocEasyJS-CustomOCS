class Settings {
    static STORAGE_KEY_TOKEN = 'floating_window_token';
    static STORAGE_KEY_POSITION = 'floating_window_position';
    static STORAGE_KEY_MUTE = 'video_mute';
    static STORAGE_KEY_SPEED = 'video_speed';
    static STORAGE_KEY_EXAM_MODE = 'exam_mode';
    static STORAGE_KEY_USERNAME = 'username';
    static STORAGE_KEY_CREATE_TIME = 'create_time';
    static STORAGE_KEY_DEEPSEEK_API_KEY = 'deepseek_api_key';
    static STORAGE_KEY_DEEPSEEKPROXY = 'deepseekproxy';
    static STORAGE_KEY_DO_VIDEO = 'do_video';
    
    static get createTime() {
      return localStorage.getItem(this.STORAGE_KEY_CREATE_TIME);
    }
    static set createTime(value) {
      localStorage.setItem(this.STORAGE_KEY_CREATE_TIME, value);
    }
    // DeepSeek API Key
    static get deepseekApiKey() {
        return localStorage.getItem(this.STORAGE_KEY_DEEPSEEK_API_KEY) || '';
    }

    static set deepseekApiKey(value) {
        localStorage.setItem(this.STORAGE_KEY_DEEPSEEK_API_KEY, value);
    }

   // DeepSeek Proxy
    static get deepseekProxy() {
      // 获取本地存储的值并解析为布尔类型
      const value = localStorage.getItem(this.STORAGE_KEY_DEEPSEEKPROXY);
      return value === 'true'; // 如果是字符串 "true" 则返回 true，否则返回 false
    }

    static set deepseekProxy(value) {
      // 将传入的值转换为字符串，并存入本地存储
      localStorage.setItem(this.STORAGE_KEY_DEEPSEEKPROXY, value.toString());
    }

    // 直接访问 DoVideo
    static get doVideo() {
      return localStorage.getItem(this.STORAGE_KEY_DO_VIDEO) === 'true';
    }
    static set doVideo(value) {
      localStorage.setItem(this.STORAGE_KEY_DO_VIDEO, value.toString());
    }

    // 直接访问用户名
    static get username() {
      return localStorage.getItem(this.STORAGE_KEY_USERNAME);
    }
    static set username(value) {
      localStorage.setItem(this.STORAGE_KEY_USERNAME, value);
    }
  
    // 直接访问 token
    static get token() {
      return localStorage.getItem(this.STORAGE_KEY_TOKEN);
    }
  
    static set token(value) {
      localStorage.setItem(this.STORAGE_KEY_TOKEN, value);
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