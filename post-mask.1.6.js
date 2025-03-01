/**
 * Ghost Blog 文章內容保護遮罩 - 改進版
 * 將遮罩添加到 body 的最前面，阻止開發者工具直接選取內容
 */

// 立即將 CSS 樣式添加到 head 中
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
    
    /* 確保所有互動元素在遮罩上方 */
   .gh-navigation,
   .gh-footer,
   .gh-comments,
   a, a:hover, a:focus, a:active,
   a, button, [role="button"], [onclick], .clickable {
      position: relative;
      z-index: 95 !important;
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
        });
    }
});
