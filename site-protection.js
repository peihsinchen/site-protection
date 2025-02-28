/**
 * 全站內容保護機制
 * 用於防止內容被複製、選取、右鍵操作等
 */
(function() {
  // 在DOM加載後初始化
  document.addEventListener('DOMContentLoaded', function() {
    setupGlobalProtection();
  });

  // 設置全站保護
  function setupGlobalProtection() {
    // 禁用選取文字功能 (全站)
    disableSelection(document.body);
    
    // 監聽動態添加的元素，為其禁用選取
    observeDynamicContent(document.body);
    
    // 禁用右鍵功能 (除豁免元素外)
    document.addEventListener('contextmenu', function(e) {
      if (isExemptElement(e.target)) {
        return true;
      }
      e.preventDefault();
      return false;
    }, true);
    
    // 禁用複製功能 (除豁免元素外)
    document.addEventListener('copy', function(e) {
      if (isExemptElement(e.target)) {
        return true;
      }
      
      // 允許亂碼被複製 (配合文章保護機制)
      if (e.target.closest('.fake-content')) {
        return true;
      }
      
      e.preventDefault();
      return false;
    }, true);
    
    // 禁用剪切功能
    document.addEventListener('cut', function(e) {
      if (isExemptElement(e.target)) {
        return true;
      }
      e.preventDefault();
      return false;
    }, true);
    
    // 禁用拖拽功能
    document.addEventListener('dragstart', function(e) {
      if (isExemptElement(e.target)) {
        return true;
      }
      e.preventDefault();
      return false;
    }, true);
    
    // 禁用開發者工具快捷鍵
    document.addEventListener('keydown', function(e) {
      // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C
      if (
        e.keyCode === 123 || 
        (e.ctrlKey && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67)) ||
        (e.ctrlKey && (e.key === 's' || e.keyCode === 83))
      ) {
        e.preventDefault();
        return false;
      }
    }, true);
    
    // 檢測開發者工具
    setupDevToolsDetection();
  }
  
  // 檢查元素是否為豁免元素 (表單和聊天框)
  function isExemptElement(element) {
    return element.tagName === 'INPUT' || 
           element.tagName === 'TEXTAREA' || 
           element.tagName === 'SELECT' ||
           element.closest('.crisp-client') ||
           element.closest('[class*="crisp"]') ||
           element.tagName === 'A' ||  // 確保連結可點擊
           element.closest('a');       // 確保連結內容可點擊
  }
  
  // 為元素及其子元素禁用選取功能
  function disableSelection(element) {
    if (!element) return;
    
    // 跳過豁免元素
    if (isExemptElement(element)) return;
    
    // 設置CSS屬性禁止選取
    element.style.userSelect = 'none';
    element.style.webkitUserSelect = 'none';
    element.style.mozUserSelect = 'none';
    element.style.msUserSelect = 'none';
    
    // 禁用觸控設備的選取
    element.style.webkitTouchCallout = 'none';
    
    // 設置屬性禁止拖拽
    element.setAttribute('unselectable', 'on');
    element.setAttribute('draggable', 'false');
    
    // 處理鼠標按下事件以防止選取開始
    element.addEventListener('mousedown', function(e) {
      if (!isExemptElement(e.target)) {
        e.preventDefault();
      }
    }, false);

    // 處理選取開始事件
    element.addEventListener('selectstart', function(e) {
      if (!isExemptElement(e.target)) {
        e.preventDefault();
      }
    }, false);
    
    // 遞歸處理所有子元素
    const children = element.children;
    for (let i = 0; i < children.length; i++) {
      if (!isExemptElement(children[i])) {
        disableSelection(children[i]);
      }
    }
  }
  
  // 觀察動態添加的內容，為其禁用選取
  function observeDynamicContent(container) {
    // 使用 MutationObserver 監視 DOM 變化
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            // 只處理元素節點
            if (node.nodeType === 1) {
              disableSelection(node);
            }
          });
        }
      });
    });
    
    // 設定觀察選項
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }
  
  // 設置開發者工具檢測
  function setupDevToolsDetection() {
    let devToolsWarning = false;
    let lastWidth = window.innerWidth;
    let lastHeight = window.innerHeight;
    
    const detectDevTools = function() {
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
        
        // 發現開發者工具時的額外動作
        if (typeof window.enhanceCopyProtection === 'function') {
          window.enhanceCopyProtection();
        }
      } else if (!devToolsOpen) {
        devToolsWarning = false;
      }
    };
    
    window.addEventListener('resize', detectDevTools);
    setInterval(detectDevTools, 1000);
  }
})();