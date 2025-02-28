// 優化版防選取代碼 - 避免閃動問題
(function() {
  // 1. 立即添加CSS樣式，確保優先級最高
  const style = document.createElement('style');
  style.innerHTML = `
    /* 防止選取時的閃動 */
    html, body {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      -webkit-touch-callout: none !important;
    }
    
    /* 覆蓋選取高亮 */
    ::selection {
      background: transparent !important;
      color: inherit !important;
    }
    
    /* 允許輸入框和文本區域正常工作 */
    input, textarea {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
  `;
  
  // 確保樣式是第一個添加到head的，提高優先級
  if (document.head) {
    document.head.insertBefore(style, document.head.firstChild);
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      document.head.insertBefore(style, document.head.firstChild);
    });
  }
  
  // 2. 優化的事件處理，減少閃動
  function preventWithoutFlashing(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      // 立即清除選取，避免閃動
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
      
      e.preventDefault();
      return false;
    }
  }
  
  // 用一個統一的高優先級處理器處理所有選取相關事件
  document.addEventListener('selectstart', preventWithoutFlashing, { capture: true });
  document.addEventListener('mousedown', function(e) {
    // 只攔截左鍵點擊
    if (e.button === 0 && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      // 清除任何現有選取
      if (window.getSelection) {
        window.getSelection().removeAllRanges();
      }
    }
  }, { capture: true });
  
  // 禁止複製功能
  document.addEventListener('copy', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
  
  // 禁止剪切功能
  document.addEventListener('cut', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
  
  // 禁止拖曳 - 關鍵改進，避免處理mousemove
  document.addEventListener('dragstart', preventWithoutFlashing, { capture: true });
  
  // 禁止右鍵菜單
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
  
  // 禁止觸摸長按選單（移動設備）
  document.addEventListener('touchstart', function(e) {
    // 不使用動態樣式變更，改用CSS
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }, { passive: false, capture: true });
  
  // 阻止F12開發者工具（可選）
  document.addEventListener('keydown', function(e) {
    // F12鍵
    if (e.keyCode === 123) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+I
    if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+C
    if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+Shift+J
    if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
      e.preventDefault();
      return false;
    }
    
    // Ctrl+U (查看源代碼)
    if (e.ctrlKey && e.keyCode === 85) {
      e.preventDefault();
      return false;
    }
  }, { capture: true });
  
  console.log('防選取保護已啟用 (優化版)');
})();
