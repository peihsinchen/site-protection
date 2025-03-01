/**
 * Ghost Blog 文章閱讀進度條
 * 在文章頁面頂部顯示閱讀進度
 * 從頁面頂部開始計算，內容區域結束時達到100%
 */

(function() {
  'use strict';

  // 只在文章頁面添加進度條
  if (document.body.classList.contains('post-template')) {
    // 添加進度條樣式
    const style = document.createElement('style');
    style.textContent = `
      .reading-progress-bar {
        position: fixed;
        top: 0;
        left: 0;
        height: 3px;
        background-color: var(--ghost-accent-color);
        width: 0%;
        z-index: 100;
        transition: width 0.1s ease;
      }
    `;
    document.head.appendChild(style);

    // 創建進度條元素
    const progressBar = document.createElement('div');
    progressBar.className = 'reading-progress-bar';
    document.body.appendChild(progressBar);
    
    // 計算閱讀進度並更新進度條
    function updateProgressBar() {
      // 獲取文章內容區塊，使用準確的類選擇器
      const contentElement = document.querySelector('.gh-content.gh-canvas.is-body');
      
      if (!contentElement) return;
      
      // 獲取內容區塊的位置和尺寸
      const contentRect = contentElement.getBoundingClientRect();
      const contentTop = contentRect.top + window.pageYOffset; // 內容頂部位置
      const contentHeight = contentElement.offsetHeight; // 內容總高度
      const contentBottom = contentTop + contentHeight; // 內容底部位置
      
      // 獲取視窗高度
      const windowHeight = window.innerHeight;
      // 獲取當前滾動位置
      const currentScrollPos = window.pageYOffset;
      
      // 計算進度 - 以整個頁面的滾動來計算，而不是僅限於內容區域
      let progress;
      
      if (currentScrollPos <= 0) {
        // 頁面頂部，進度為0
        progress = 0;
      } 
      else if (currentScrollPos + windowHeight >= contentBottom) {
        // 已滾動到內容底部或更下方，進度為100%
        progress = 100;
      } 
      else {
        // 計算進度百分比：當前滾動位置相對於(內容底部 - 視窗高度)的百分比
        // 這確保當滾動到內容底部時顯示100%，而不是整個頁面底部
        progress = (currentScrollPos / (contentBottom - windowHeight)) * 100;
        // 確保進度在0-100之間
        progress = Math.min(Math.max(progress, 0), 100);
      }
      
      // 更新進度條寬度
      progressBar.style.width = progress + '%';
    }
    
    // 當滾動頁面時更新進度條
    window.addEventListener('scroll', updateProgressBar);
    
    // 初始化進度條
    updateProgressBar();
    
    // 當窗口大小改變時重新計算
    window.addEventListener('resize', updateProgressBar);
  }
})();
