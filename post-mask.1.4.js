(function addStyles() {
  const styleEl = document.createElement('style');
  styleEl.textContent = `
    /* 頁面遮罩層 */
    .page-protection-mask {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 90;
      background-color: transparent;
      pointer-events: auto;
    }
    
    /* 將互動元素分組，避免全局 z-index 衝突 */
    /* 第一組：基本交互元素 */
    .gh-navigation, 
    .gh-footer, 
    .gh-outer, 
    .gh-post-upgrade-cta, 
    .gh-comments, 
    .gh-canvas, 
    .gh-head, 
    .gh-head-actions, 
    .gh-portal-close-button, 
    .gh-signin, 
    .gh-signup, 
    .gh-notification, 
    .gh-member-actions, 
    .gh-menu, 
    .gh-search {
      position: relative;
      z-index: 95;
      pointer-events: auto;
    }
    
    /* 第二組：基本交互控件 */
    a, button, 
    input, textarea, select,
    .bookmark, 
    .kg-bookmark-container {
      position: relative;
      z-index: 96;
      pointer-events: auto;
    }
    
    /* 第三組：卡片內部元素 */
    .kg-card a, 
    .kg-card button, 
    [data-kg-card] a, 
    [data-kg-card] button {
      position: relative;
      z-index: 97;
      pointer-events: auto;
    }

  `;
  document.head.appendChild(styleEl);
})();

// 添加事件監聽器以創建遮罩
document.addEventListener('DOMContentLoaded', function() {
  // 只在文章頁面添加遮罩，不包括頁面(page)
  if (document.body.classList.contains('post-template')) {
    // 創建全頁面保護遮罩元素
    const mask = document.createElement('div');
    mask.className = 'page-protection-mask';
    
    // 添加到 body 的最前面（作為第一個子元素）
    if (document.body.firstChild) {
      document.body.insertBefore(mask, document.body.firstChild);
    } else {
      document.body.appendChild(mask);
    }
    
    // 添加額外的防護措施 - 阻止在文檔上的選擇事件
    document.addEventListener('selectstart', function(e) {
      // 允許在互動元素上選擇文字
      const isInteractive = e.target.closest('a, button, input, textarea, .gh-comments, .gh-navigation, .gh-footer');
      
      if (!isInteractive) {
        e.preventDefault();
        return false;
      }
    });
  }
});
