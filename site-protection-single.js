// 全站禁用選取、複製與右鍵功能
(function() {
  // 在DOM加載後初始化
  document.addEventListener('DOMContentLoaded', () => {
    console.log("全站保護已啟用 (禁用選取、複製和右鍵)");
    
    // 設置基本防護
    setupBasicProtection();
    
    // 設置開發者工具檢測
    setupDevToolsDetection();
  });
  
  // 設置基本防護
  function setupBasicProtection() {
    // 全站禁用右鍵功能 (表單元素和聊天框例外)
    document.addEventListener('contextmenu', e => {
      // 允許表單元素和聊天框使用右鍵
      if (isExemptElement(e.target)) {
        return true;
      }
      
      e.preventDefault();
      return false;
    });
    
    // 全站禁用複製功能 (表單元素和聊天框例外)
    document.addEventListener('copy', e => {
      if (isExemptElement(e.target)) {
        return true;
      }
      
      e.preventDefault();
      return false;
    });
    
    // 禁用選取功能 (表單元素和聊天框例外)
    document.addEventListener('selectstart', e => {
      if (isExemptElement(e.target)) {
        return true;
      }
      
      e.preventDefault();
      return false;
    });
    
    // 禁用拖曳功能
    document.addEventListener('dragstart', e => {
      if (isExemptElement(e.target)) {
        return true;
      }
      
      e.preventDefault();
      return false;
    });
    
    // 禁用保存頁面
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.keyCode === 83)) {
        e.preventDefault();
        return false;
      }
    }, true);
  }
  
  // 檢查元素是否為豁免元素 (表單和聊天框)
  function isExemptElement(element) {
    return element.tagName === 'INPUT' || 
           element.tagName === 'TEXTAREA' || 
           element.tagName === 'SELECT' ||
           element.closest('.crisp-client') ||
           element.closest('[class*="crisp"]') ||
           element.contentEditable === 'true' ||
           element.tagName === 'A' ||  // 確保連結可點擊
           element.closest('a');       // 確保連結內容可點擊
  }
  
  // 設置開發者工具檢測
  function setupDevToolsDetection() {
    let devToolsWarning = false;
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    
    const detectDevTools = () => {
      // 檢測方式：監控窗口尺寸突然變化或開發者工具常見特性
      const widthDelta = Math.abs(window.outerWidth - window.innerWidth - (window.outerWidth - lastWidth));
      const heightDelta = Math.abs(window.outerHeight - window.innerHeight - (window.outerHeight - lastHeight));
      const threshold = 30;
      
      // 更新上次尺寸
      lastWidth = window.innerWidth;
      lastHeight = window.innerHeight;
      
      // 檢測開發者工具
      const devToolsOpen = widthDelta > threshold || 
                           heightDelta > threshold || 
                           window.outerWidth - window.innerWidth > 160 || 
                           window.outerHeight - window.innerHeight > 160 ||
                           (window.Firebug && window.Firebug.chrome && window.Firebug.chrome.isInitialized) ||
                           /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor) && typeof window.chrome !== "undefined";
      
      if (devToolsOpen && !devToolsWarning) {
        console.clear();
        console.log('%c⚠️ 警告: 本站內容禁止未授權複製 ⚠️', 'font-size:20px; color:red; font-weight:bold;');
        devToolsWarning = true;
      } else if (!devToolsOpen) {
        devToolsWarning = false;
      }
    };
    
    window.addEventListener('resize', detectDevTools);
    setInterval(detectDevTools, 1000);
  }
})();