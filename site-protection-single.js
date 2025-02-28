// 增強版全站防盜內容保護
(function() {
  // 啟動保護機制的主函數
  function initProtection() {
    console.log("增強版全站保護已啟用 (禁用選取、複製和右鍵)");
    
    // 設置基本防護
    setupBasicProtection();
    
    // 設置開發者工具檢測
    setupDevToolsDetection();
    
    // 針對Ghost的pages和tags頁面增加額外的保護
    setupGhostSpecificProtection();
  }
  
  // 設置基本防護
  function setupBasicProtection() {
    // 全站禁用右鍵功能
    document.addEventListener('contextmenu', handleProtection, true);
    
    // 全站禁用複製功能
    document.addEventListener('copy', handleProtection, true);
    
    // 禁用選取功能
    document.addEventListener('selectstart', handleProtection, true);
    
    // 禁用拖曳功能
    document.addEventListener('dragstart', handleProtection, true);
    
    // 禁用剪下功能
    document.addEventListener('cut', handleProtection, true);
    
    // 禁用粘貼功能
    document.addEventListener('paste', handleProtection, true);
    
    // 禁用保存頁面
    document.addEventListener('keydown', e => {
      // 允許表單元素
      if (isExemptElement(e.target)) {
        return true;
      }
      
      // 阻止Ctrl+S, Ctrl+P, Ctrl+U等常見功能鍵
      if (e.ctrlKey || e.metaKey) {
        if (['s', 'p', 'u', 'a'].includes(e.key.toLowerCase()) || 
            [83, 80, 85, 65].includes(e.keyCode)) {
          e.preventDefault();
          return false;
        }
      }
    }, true);
  }
  
  // 處理保護事件
  function handleProtection(e) {
    // 允許表單元素和聊天框使用右鍵和各種操作
    if (isExemptElement(e.target)) {
      return true;
    }
    
    e.preventDefault();
    e.stopPropagation();
    return false;
  }
  
  // 檢查元素是否為豁免元素 (表單和聊天框)
  function isExemptElement(element) {
    if (!element || !element.tagName) return false;
    
    // 檢查基本表單元素
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)) {
      return true;
    }
    
    // 檢查是否為Crisp聊天框元素
    if (element.closest('.crisp-client') || 
        element.closest('[class*="crisp"]')) {
      return true;
    }
    
    // 可編輯元素
    if (element.contentEditable === 'true') {
      return true;
    }
    
    // 確保連結可點擊
    if (element.tagName === 'A' || element.closest('a')) {
      return true;
    }
    
    // 檢查是否在登入/註冊表單內
    if (element.closest('form') && 
        (element.closest('form').classList.contains('login') || 
         element.closest('form').classList.contains('signup') || 
         element.closest('form').classList.contains('subscribe'))) {
      return true;
    }
    
    return false;
  }
  
  // 針對Ghost的pages和tags頁面增加額外的保護
  function setupGhostSpecificProtection() {
    // 使用MutationObserver監視DOM變化，以便在動態加載的內容上應用保護
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // 元素節點
              // 在新增的元素上應用CSS保護
              applyProtectionCSS(node);
              
              // 如果是頁面或標籤頁的主要內容容器，加強保護
              if (node.classList && (
                  node.classList.contains('page') || 
                  node.classList.contains('tag-template') || 
                  node.classList.contains('post-template'))) {
                applyExtraProtection(node);
              }
            }
          });
        }
      }
    });
    
    // 監視整個文檔的變化
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // 立即應用到當前DOM
    applyProtectionCSS(document.body);
    
    // 如果當前頁面是pages或tags頁面，加強保護
    if (window.location.pathname.includes('/page/') || 
        window.location.pathname.includes('/tag/')) {
      applyExtraProtection(document.body);
    }
  }
  
  // 應用CSS保護
  function applyProtectionCSS(element) {
    // 應用防選取樣式到內容元素
    const contentElements = element.querySelectorAll('.content, article, .post, .page, .post-content, .post-full-content');
    contentElements.forEach(el => {
      el.style.userSelect = 'none';
      el.style.webkitUserSelect = 'none';
      el.style.msUserSelect = 'none';
      el.style.mozUserSelect = 'none';
      el.style.webkitTouchCallout = 'none';
    });
  }
  
  // 對特定元素應用額外保護
  function applyExtraProtection(element) {
    // 為元素添加額外的事件監聽器
    element.addEventListener('mousedown', handleProtection, true);
    element.addEventListener('mouseup', handleProtection, true);
    element.addEventListener('selectstart', handleProtection, true);
    
    // 在所有子元素上應用保護
    const allChildren = element.querySelectorAll('*');
    allChildren.forEach(child => {
      // 跳過表單和豁免元素
      if (!isExemptElement(child)) {
        child.style.userSelect = 'none';
        child.style.webkitUserSelect = 'none';
        child.style.msUserSelect = 'none';
        child.style.mozUserSelect = 'none';
      }
    });
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
    
    // 防止控制台顯示
    console.defaultLog = console.log.bind(console);
    console.log = function() {
      if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].includes('禁止未授權複製')) {
        console.defaultLog.apply(console, arguments);
      }
    };
    
    // 防止查看頁面源代碼
    document.addEventListener('keydown', function(e) {
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.shiftKey && e.key === 'J') || 
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
      }
    });
  }
  
  // 在DOM加載後初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProtection);
  } else {
    // 如果DOM已經加載完成則直接執行
    initProtection();
  }
  
  // 確保在頁面完全加載後也執行一次保護
  window.addEventListener('load', () => {
    setTimeout(function() {
      applyProtectionCSS(document.body);
      
      // 如果當前頁面是pages或tags頁面，加強保護
      if (window.location.pathname.includes('/page/') || 
          window.location.pathname.includes('/tag/')) {
        applyExtraProtection(document.body);
      }
    }, 500);
  });
})();
