/**
 * Ghost Blog 文章內容保護遮罩
 * 與 Code Injection 中完全相同的功能
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
    .gh-outer,
    .gh-post-upgrade-cta,
    .gh-comments,
    .gh-canvas,
    a, button, .bookmark,
    .kg-bookmark-container,
    .kg-card a,
    .kg-card button,
    [data-kg-card] a,
    [data-kg-card] button,
    .gh-head,
    .gh-head-actions,
    .gh-portal-close-button,
    .gh-signin,
    .gh-signup,
    .gh-notification,
    .gh-member-actions,
    input, textarea, select,
    .gh-menu,
    .gh-search {
        position: relative;
        z-index: 95;
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
        
        // 添加到 body 中
        document.body.appendChild(mask);
    }
});
