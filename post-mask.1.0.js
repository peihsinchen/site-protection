/**
 * Ghost Blog 內容保護遮罩 
 * 創建一個全頁面透明遮罩，防止用戶選取文章內容
 * 同時保持所有互動元素可點擊
 */

(function() {
    'use strict';
    
    // 當頁面加載完成後執行
    document.addEventListener('DOMContentLoaded', function() {
        // 只在文章頁面添加遮罩
        if (document.body.classList.contains('post-template')) {
            // 添加CSS樣式
            addProtectionStyles();
            
            // 創建全頁面保護遮罩
            createProtectionMask();
        }
    });
    
    /**
     * 添加必要的CSS樣式
     */
    function addProtectionStyles() {
        const styleElement = document.createElement('style');
        styleElement.textContent = `
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
        
        // 將樣式添加到頁面頭部
        document.head.appendChild(styleElement);
    }
    
    /**
     * 創建保護遮罩元素
     */
    function createProtectionMask() {
        // 創建全頁面保護遮罩元素
        const mask = document.createElement('div');
        mask.className = 'page-protection-mask';
        
        // 添加到 body 中
        document.body.appendChild(mask);
    }
})();
