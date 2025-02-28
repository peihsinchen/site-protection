// 禁止選取文字、複製、拖曳和右鍵功能的JavaScript代碼（改進版）
(function() {
  // 在頁面載入完成後使用CSS設置而不是直接修改style
  document.addEventListener('DOMContentLoaded', function() {
    // 建立一個樣式元素
    const style = document.createElement('style');
    style.textContent = `
      body {
        user-select: none;
        -webkit-user-select: none;
        -ms-user-select: none;
        -moz-user-select: none;
        -webkit-touch-callout: none;
      }
    `;
    document.head.appendChild(style);
  });
  
  // 禁止複製功能 - 使用被動監聽減少性能影響
  document.addEventListener('copy', function(e) {
    e.preventDefault();
    return false;
  }, { passive: false });
  
  // 禁止剪切功能
  document.addEventListener('cut', function(e) {
    e.preventDefault();
    return false;
  }, { passive: false });
  
  // 禁止拖曳 - 改進方式，減少視覺跳動
  document.addEventListener('mousedown', function(e) {
    // 處理滑鼠按下，標記開始位置
    if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
      window._preventDragX = e.clientX;
      window._preventDragY = e.clientY;
    }
  });

  document.addEventListener('mousemove', function(e) {
    // 如果已經標記了開始拖曳，且移動距離超過閾值，取消默認行為
    if (window._preventDragX !== undefined && window._preventDragY !== undefined) {
      const moveX = Math.abs(e.clientX - window._preventDragX);
      const moveY = Math.abs(e.clientY - window._preventDragY);
      
      // 僅在確實為拖曳行為時（移動超過100像素）才進行處理
      if (moveX > 100 || moveY > 100) {
        e.preventDefault();
        // 防止文本選擇出現藍色高亮
        if (window.getSelection) {
          if (window.getSelection().empty) {  // Chrome
            window.getSelection().empty();
          } else if (window.getSelection().removeAllRanges) {  // Firefox
            window.getSelection().removeAllRanges();
          }
        }
      }
    }
  }, { passive: false });

  document.addEventListener('mouseup', function() {
    // 清除標記
    window._preventDragX = undefined;
    window._preventDragY = undefined;
  });
  
  // 禁止右鍵菜單
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  }, { passive: false });
  
  // 禁止觸摸長按選單（移動設備）- 使用CSS統一處理
  document.addEventListener('touchstart', function(e) {
    // 不在此處設置style，降低視覺跳動風險
  }, { passive: true }); // 使用passive提高滾動性能
  
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
  }, { passive: false });
  
  console.log('內容保護已啟用 (改進版)');
})();
