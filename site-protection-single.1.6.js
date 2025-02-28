// 改進版內容保護代碼 - 修復游標問題
(function() {
  // 禁止文字選取 - 但保留鏈接和按鈕的可用性
  function applyProtection() {
    // 選取所有非按鈕、鏈接的元素
    const elements = document.querySelectorAll('body *:not(a):not(button):not([role="button"])');
    elements.forEach(el => {
      el.style.userSelect = 'none';
      el.style.webkitUserSelect = 'none';
      el.style.msUserSelect = 'none';
      el.style.mozUserSelect = 'none';
    });
    
    // 確保所有可點擊元素有正確的游標
    const clickableElements = document.querySelectorAll('a, button, [role="button"], [onclick], .clickable');
    clickableElements.forEach(el => {
      el.style.cursor = 'pointer';
    });
  }
  
  // 應用保護並在DOM變化時重新應用
  applyProtection();
  const observer = new MutationObserver(applyProtection);
  observer.observe(document.body, { childList: true, subtree: true });
  
  // 禁止複製功能 - 只在非表單元素上
  document.addEventListener('copy', function(e) {
    if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      return false;
    }
  });
  
  // 禁止剪切功能 - 只在非表單元素上
  document.addEventListener('cut', function(e) {
    if (!['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
      e.preventDefault();
      return false;
    }
  });
  
  // 禁止拖曳 - 更精確的實現
  document.addEventListener('dragstart', function(e) {
    // 允許鏈接和按鈕正常使用
    if (!e.target.closest('a, button, [role="button"]')) {
      e.preventDefault();
      return false;
    }
  });
  
  // 禁止右鍵菜單
  document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
  });
  
  // 禁止F12開發者工具（可選）
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
  });
  
  console.log('改進版內容保護已啟用');
})();
