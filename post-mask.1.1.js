/**
 * Ghost Blog 內容保護遮罩 (修正版)
 * 創建一個全頁面透明遮罩，防止用戶選取文章內容
 */

(function() {
    'use strict';
    
    // 立即執行初始化函數
    init();
    
    // 如果DOM還沒準備好，等待DOMContentLoaded
    if (document.readyState !== 'loading') {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
    
    /**
     * 初始化函數
     */
    function init() {
        // 檢查是否為文章頁面
        if (isPostPage()) {
            console.log('Ghost Protection: 檢測到文章頁面，添加保護遮罩');
            
            // 添加CSS樣式
            addProtectionStyles();
            
            // 創建全頁面保護遮罩
            createProtectionMask();
        } else {
            console.log('Ghost Protection: 非文章頁面，不添加保護遮罩');
        }
    }
    
    /**
     * 檢查是否為文章頁面
     */
    function isPostPage() {
        // 多種方式檢查是否為文章頁面
        return document.body.classList.contains('post-template') || 
               document.body.classList.contains('post') ||
               document.querySelector('article.post') !== null ||
               window.location.pathname.match(/\/[^\/]+\/[^\/]+\/?$/) !== null;
    }
    
    /**
     * 添加必要的CSS樣式
     */
    function addProtectionStyles() {
        // 檢查是否已經添加了樣式
        if (document.getElementById('ghost-protection-styles')) {
            return;
        }
        
        const styleElement = document.createElement('style');
        styleElement.id = 'ghost-protection-styles';
        styleElement.innerHTML = `
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
            header, footer, nav,
            .gh-navigation, .gh-nav, .gh-header, 
            .gh-footer, .gh-outer, 
            .gh-post-upgrade-cta,
            .gh-comments, .gh-canvas,
            a, button, .bookmark, input, textarea, select,
            .kg-bookmark-container,
            [class*="gh-"], [id*="gh-"],
            [class*="kg-"], [id*="kg-"],
            [class*="comments"], [id*="comments"],
            [class*="menu"], [id*="menu"],
            [class*="search"], [id*="search"],
            [class*="subscribe"], [id*="subscribe"],
            [class*="nav"], [id*="nav"],
            [class*="header"], [id*="header"],
            [class*="footer"], [id*="footer"] {
                position: relative;
                z-index: 95 !important;
            }
        `;
        
        // 將樣式添加到頁面頭部
        document.head.appendChild(styleElement);
        console.log('Ghost Protection: 樣式已添加');
    }
    
    /**
     * 創建保護遮罩元素
     */
    function createProtectionMask() {
        // 檢查是否已經創建了遮罩
        if (document.querySelector('.page-protection-mask')) {
            return;
        }
        
        // 創建全頁面保護遮罩元素
        const mask = document.createElement('div');
        mask.className = 'page-protection-mask';
        
        // 添加到 body 中
        document.body.appendChild(mask);
        console.log('Ghost Protection: 遮罩已添加');
    }
})();
