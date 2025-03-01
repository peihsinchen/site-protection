// 全面優化的內容保護代碼
(function() {
  // 定義可選取的元素選擇器
  const SELECTABLE_ELEMENTS = 'a, button, [role="button"], input, textarea, [contenteditable="true"]';
  
  // 應用 CSS 規則以防止選取
  function applyCssProtection() {
    // 如果樣式已存在，不重複添加
    if (document.getElementById('content-protection-styles')) return;
    
    const styleSheet = document.createElement('style');
    styleSheet.id = 'content-protection-styles';
    styleSheet.textContent = `
      body, body *:not(${SELECTABLE_ELEMENTS}) {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
        -webkit-touch-callout: none !important;
      }
      
      a, button, [role="button"], [onclick], .clickable {
        cursor: pointer !important;
      }
    `;
    document.head.appendChild(styleSheet);
  }
  
  // 應用元素級保護
  function applyElementProtection() {
    // 選取所有非可選取元素
    const elements = document.querySelectorAll(`body *:not(${SELECTABLE_ELEMENTS})`);
    
    elements.forEach(el => {
      el.style.webkitUserSelect = 'none';
      el.style.mozUserSelect = 'none';
      el.style.msUserSelect = 'none';
      el.style.userSelect = 'none';
      el.style.webkitTouchCallout = 'none'; // 特別針對 iOS/Safari
      
      // 為元素添加屬性，防止長按選取
      el.setAttribute('unselectable', 'on');
      
      // 禁止元素的拖曳
      el.setAttribute('draggable', 'false');
    });
  }
  
  // 設置 MutationObserver 在 DOM 變化時重新應用保護
  function setupMutationObserver() {
    // 使用防抖動函數提高性能
    let timeout;
    const observer = new MutationObserver(mutations => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        applyElementProtection();
      }, 100);
    });
    
    observer.observe(document.body, { 
      childList: true, 
      subtree: true, 
      attributes: false 
    });
  }
  
  // 事件攔截器
  function setupEventListeners() {
    // 阻止選取開始事件 (特別針對移動設備)
    document.addEventListener('selectstart', function(e) {
      if (!e.target.closest(SELECTABLE_ELEMENTS)) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
    
    // 攔截觸摸選取
    document.addEventListener('touchstart', function(e) {
      // 允許在表單元素上的觸摸操作
      if (!e.target.closest(SELECTABLE_ELEMENTS)) {
        // 設置標記，表示這是非表單元素上的觸摸
        window._nonSelectableTouch = true;
      } else {
        window._nonSelectableTouch = false;
      }
    }, { passive: true });
    
    // 處理長按選取 (Android 常用方式)
    document.addEventListener('touchend', function(e) {
      if (window._nonSelectableTouch) {
        // 清除任何可能的選取
        window.getSelection().removeAllRanges();
        window._nonSelectableTouch = false;
      }
    }, { passive: false });
    
    // 禁止複製功能 - 只在非表單元素上
    document.addEventListener('copy', function(e) {
      if (!e.target.closest(SELECTABLE_ELEMENTS)) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
    
    // 禁止剪切功能 - 只在非表單元素上
    document.addEventListener('cut', function(e) {
      if (!e.target.closest(SELECTABLE_ELEMENTS)) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
    
    // 禁止粘貼功能 - 只在非表單元素上
    document.addEventListener('paste', function(e) {
      if (!e.target.closest(SELECTABLE_ELEMENTS)) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
    
    // 禁止拖曳 - 更精確的實現
    document.addEventListener('dragstart', function(e) {
      if (!e.target.closest(SELECTABLE_ELEMENTS)) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
    
    // 禁止右鍵菜單
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      return false;
    }, { passive: false });
    
    // 禁止 F12 開發者工具和相關快捷鍵
    document.addEventListener('keydown', function(e) {
      const ctrlKey = e.ctrlKey || e.metaKey; // 支援 Mac 的 Command 鍵
      
      // 確保在輸入區域內允許所有鍵盤操作
      if (e.target.closest('input, textarea, [contenteditable="true"]')) {
        return true;
      }
      
      // F12 鍵
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        return false;
      }
      
      // 開發者工具快捷鍵
      if (ctrlKey && e.shiftKey && (e.key === 'I' || e.keyCode === 73 || 
                                   e.key === 'C' || e.keyCode === 67 || 
                                   e.key === 'J' || e.keyCode === 74)) {
        e.preventDefault();
        return false;
      }
      
      // 查看源代碼 (Ctrl+U)
      if (ctrlKey && (e.key === 'U' || e.keyCode === 85)) {
        e.preventDefault();
        return false;
      }
      
      // 阻止 Ctrl+A 全選 (但在表單元素中允許)
      if (ctrlKey && (e.key === 'A' || e.keyCode === 65)) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });
  }
  
  // 定期清除任何可能出現的選取
  function setupSelectionClearer() {
    setInterval(() => {
      // 檢查是否有活動的選取範圍且不在可選取元素內
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const element = container.nodeType === 1 ? container : container.parentElement;
        
        if (element && !element.closest(SELECTABLE_ELEMENTS)) {
          selection.removeAllRanges();
        }
      }
    }, 500);
  }
  
  // 啟動所有保護機制
  function initProtection() {
    applyCssProtection();
    applyElementProtection();
    setupMutationObserver();
    setupEventListeners();
    setupSelectionClearer();
    
    // 在頁面載入和調整大小時重新應用保護
    window.addEventListener('load', applyElementProtection);
    window.addEventListener('resize', applyElementProtection);
    
    console.log('增強版內容保護已啟用 (含 Android 支援)');
  }
  
  // 初始化
  initProtection();
})();
