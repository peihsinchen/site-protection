// 禁止選取文字、複製、拖曳和右鍵功能的JavaScript代碼（極簡版）
(function() {
  // 立即在文檔頭部添加禁止選取的CSS
  const style = document.createElement('style');
  style.innerHTML = `
    html, body {
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      pointer-events: auto !important;
      -webkit-touch-callout: none !important;
    }
    
    /* 允許輸入框和文本區域正常工作 */
    input, textarea {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
  `;
  
  // 確保樣式最先應用
  if (document.head) {
    document.head.appendChild(style);
  } else {
    // 如果head還不存在，等待DOM加載完成
    document.addEventListener('DOMContentLoaded', function() {
      document.head.appendChild(style);
    });
  }
  
  // 禁止所有可能引起選取的鼠標事件
  function preventEvent(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      if (window.getSelection) {
        if (window.getSelection().empty) {
          window.getSelection().empty();
        } else if (window.getSelection().removeAllRanges) {
          window.getSelection().removeAllRanges();
        }
      }
      e.preventDefault();
    }
  }
  
  // 直接攔截所有選擇相關事件 - 使用捕獲模式確保最早處理
  document.addEventListener('selectstart', preventEvent, { capture: true });
  document.addEventListener('dragstart', preventEvent, { capture: true });
  
  // 禁止複製功能
  document.addEventListener('copy', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }, { capture: true });
  
  // 禁止剪切功能
  document.addEventListener('cut', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }, { capture: true });
  
  // 禁止右鍵菜單
  document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      e.preventDefault();
    }
  }, { capture: true });
  
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
  
  console.log('內容保護已啟用 (極簡版)');
})();
