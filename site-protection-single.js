// 簡化版全站防盜內容保護
(function() {
  // 在DOM加載後執行
  document.addEventListener('DOMContentLoaded', function() {
    console.log("全站保護已啟用 (禁用選取、複製和右鍵)");
    
    // 全站CSS防護 (針對Ghost常見內容區域)
    applyCSSProtection();
    
    // 設置事件攔截
    setupEventInterception();
    
    // 設置開發者工具檢測
    setupDevToolsDetection();
  });
  
  // 應用CSS防護 - 效能較好且直接
  function applyCSSProtection() {
    const style = document.createElement('style');
    style.innerHTML = `
      body, body *, .content, .post, .page, article, .post-content, .post-full-content,
      .page-template main, .tag-template main, .post-template main,
      .gh-content, .gh-canvas, .site-content, .site-main {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      /* 豁免表單元素 */
      input, textarea, select, .crisp-client, [class*="crisp"], [contenteditable="true"],
      form.login *, form.signup *, form.subscribe * {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
        -webkit-touch-callout: default !important;
      }
    `;
    document.head.appendChild(style);
  }
  
  // 設置事件攔截
  function setupEventInterception() {
    // 函數：檢查元素是否為豁免元素
    function isExemptElement(element) {
      if (!element || !element.tagName) return false;
      
      return element.tagName === 'INPUT' || 
             element.tagName === 'TEXTAREA' || 
             element.tagName === 'SELECT' ||
             element.closest('.crisp-client') ||
             element.closest('[class*="crisp"]') ||
             element.contentEditable === 'true' ||
             (element.closest('form') && 
              (element.closest('form').classList.contains('login') || 
               element.closest('form').classList.contains('signup') || 
               element.closest('form').classList.contains('subscribe')));
    }
    
    // 函數：處理保護事件
    function handleProtection(e) {
      if (isExemptElement(e.target)) {
        return true;
      }
      
      e.preventDefault();
      return false;
    }
    
    // 使用事件捕獲，確保保護機制優先執行
    document.addEventListener('contextmenu', handleProtection, true);
    document.addEventListener('copy', handleProtection, true);
    document.addEventListener('selectstart', handleProtection, true);
    document.addEventListener('dragstart', handleProtection, true);
    document.addEventListener('cut', handleProtection, true);
    document.addEventListener('paste', handleProtection, true);
    
    // 禁用鍵盤快捷鍵
    document.addEventListener('keydown', function(e) {
      if (isExemptElement(e.target)) {
        return true;
      }
      
      // 禁用常見快捷鍵 (Ctrl+S, Ctrl+P, Ctrl+C, Ctrl+A)
      if ((e.ctrlKey || e.metaKey) && ['s', 'p', 'c', 'a'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        return false;
      }
      
      // 禁用F12和查看源碼快捷鍵
      if (e.key === 'F12' || 
          (e.ctrlKey && e.shiftKey && e.key === 'I') || 
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        return false;
      }
    }, true);
  }
  
  // 設置開發者工具檢測 (簡化版)
  function setupDevToolsDetection() {
    let devToolsWarning = false;
    
    const detectDevTools = () => {
      // 簡化檢測邏輯，提高效能
      const devToolsOpen = 
        window.outerWidth - window.innerWidth > 160 || 
        window.outerHeight - window.innerHeight > 160;
      
      if (devToolsOpen && !devToolsWarning) {
        console.clear();
        console.log('%c⚠️ 警告: 本站內容禁止未授權複製 ⚠️', 'font-size:20px; color:red; font-weight:bold;');
        devToolsWarning = true;
      } else if (!devToolsOpen) {
        devToolsWarning = false;
      }
    };
    
    // 降低檢測頻率，提高效能
    window.addEventListener('resize', detectDevTools);
    setInterval(detectDevTools, 2000);
  }
  
  // 確保頁面完全加載後再次應用保護
  window.addEventListener('load', function() {
    // 再次應用CSS保護，確保所有動態加載的內容都被覆蓋
    applyCSSProtection();
  });
})();
