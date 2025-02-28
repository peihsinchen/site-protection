// 文章頁面保護（遮罩和亂碼）- 相容版
(function() {
  // 設定變數和常量
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做要能會可能好很真的太過於又還但因所以如果就算雖然因為可是只有一些都沒有多少許多幾乎差不多經常總是從來未曾已經正在將要即將快要台灣';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  
  // 自動插入CSS - 僅針對保護元素
  const postProtectionCSS = `
  /* 亂碼保護相關樣式 */
  .protection-container {
    position: relative;
    display: inline;
    width: auto;
  }
  
  .real-content {
    position: relative;
    z-index: 2;
  }
  
  .fake-content {
    position: absolute;
    display: inline-block;
    opacity: 0.01;
    color: rgba(0,0,0,0.01);
    height: 0;
    line-height: 0;
    font-size: 0;
    overflow: hidden;
    pointer-events: none;
    white-space: nowrap;
    left: 0;
    top: 0;
    z-index: -1;
    user-select: text !important;
    -webkit-user-select: text !important;
    -moz-user-select: text !important;
    -ms-user-select: text !important;
  }
  
  /* 打印時顯示亂碼 */
  @media print {
    .real-content {
      display: none !important;
    }
    .fake-content {
      display: block !important;
      position: static !important;
      opacity: 1 !important;
      color: black !important;
      height: auto !important;
      overflow: visible !important;
      white-space: normal !important;
    }
  }`;
  
  // 將CSS插入到頁面中
  const styleEl = document.createElement('style');
  styleEl.textContent = postProtectionCSS;
  document.head.appendChild(styleEl);
  
  // 檢查當前頁面是否為文章頁面
  function isPostPage() {
    return document.body.classList.contains('post-template') || 
           document.body.classList.contains('reader-view') ||
           document.querySelector('[data-ghost-reading-mode]') !== null ||
           /\/p\/|\/post\/|\/article\//.test(window.location.pathname);
  }
  
  // 在DOM加載後初始化
  document.addEventListener('DOMContentLoaded', initializeProtection);
  
  // 初始化保護功能
  function initializeProtection() {
    // 只在文章頁面應用保護
    if (!isPostPage()) return;
    
    console.log("文章保護已初始化");
    
    // 立即套用保護
    applyProtection();
    
    // 設置監聽器以處理動態加載的內容和閱讀模式
    setupContentObserver();
    
    // 監聽閱讀模式按鈕點擊
    setupReadingModeListener();
    
    // 檢查頁面變更
    setupPageChangeDetection();
  }
  
  // 設置內容觀察器
  function setupContentObserver() {
    // 觀察整個文檔的變化，特別注意閱讀模式的出現
    const contentObserver = new MutationObserver(mutations => {
      let shouldApplyProtection = false;
      let readingModeDetected = false;
      
      // 分析變更
      mutations.forEach(mutation => {
        // 處理新增節點
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            // 只處理元素節點
            if (node.nodeType === 1) {
              // 檢查是否為閱讀模式相關元素
              if (node.classList && 
                 (node.classList.contains('reader-view') || 
                  node.getAttribute('data-ghost-reading-mode') !== null ||
                  (node.className && typeof node.className === 'string' && 
                   node.className.includes('reading-mode')))) {
                readingModeDetected = true;
              }
              
              // 檢查是否有內容需要保護
              const paragraphs = node.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
              if (paragraphs.length > 0) {
                shouldApplyProtection = true;
              }
            }
          });
        }
        
        // 處理屬性變更，特別是閱讀模式相關屬性
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.nodeType === 1 && 
             (target.classList.contains('reader-view') || 
              target.getAttribute('data-ghost-reading-mode') !== null ||
              (target.className && typeof target.className === 'string' && 
               target.className.includes('reading-mode')))) {
            readingModeDetected = true;
          }
        }
      });
      
      // 根據變更類型應用保護
      if (readingModeDetected) {
        console.log("檢測到閱讀模式，應用保護");
        applyProtectionToReadingMode();
      } else if (shouldApplyProtection) {
        applyProtection();
      }
    });
    
    // 設定觀察選項
    contentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ghost-reading-mode']
    });
  }
  
  // 設置閱讀模式監聽
  function setupReadingModeListener() {
    // 使用事件委派監聽可能的閱讀模式按鈕點擊
    document.addEventListener('click', function(e) {
      // 查找常見的閱讀模式按鈕特徵
      const target = e.target;
      if (target.closest('[aria-label*="reading"], [title*="reading"], [class*="reading-mode"]') ||
          (target.textContent && 
           (target.textContent.includes('Reading') || target.textContent.includes('reading')))) {
        
        console.log("檢測到閱讀模式按鈕點擊");
        
        // 延遲應用保護，等待閱讀模式打開
        setTimeout(applyProtectionToReadingMode, 200);
        setTimeout(applyProtectionToReadingMode, 500); // 再嘗試一次
      }
    }, false); // 使用冒泡階段，不干擾其他點擊處理
    
    // 監聽可能的閱讀模式快捷鍵
    document.addEventListener('keydown', function(e) {
      // 常見的閱讀模式快捷鍵組合
      if ((e.ctrlKey && e.altKey && e.key === 'r') || 
          (e.altKey && e.key === 'r') || 
          (e.ctrlKey && e.key === 'e')) {
        console.log("檢測到閱讀模式快捷鍵");
        
        // 延遲應用保護
        setTimeout(applyProtectionToReadingMode, 200);
        setTimeout(applyProtectionToReadingMode, 500); // 再嘗試一次
      }
    }, false); // 使用冒泡階段，不干擾其他鍵盤處理
  }
  
  // 設置頁面變更檢測
  function setupPageChangeDetection() {
    // 監聽 URL 變更 (針對 SPA)
    let lastUrl = location.href;
    const urlObserver = new MutationObserver(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        
        // 檢查是否為文章頁面
        if (isPostPage()) {
          console.log("檢測到 URL 變更，重新應用保護");
          setTimeout(applyProtection, 300);
        }
      }
    });
    
    // 觀察 URL 變更
    urlObserver.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
    
    // 頁面完全載入後，再次檢查
    window.addEventListener('load', function() {
      if (isPostPage()) {
        setTimeout(applyProtection, 300);
        
        // 特別檢查閱讀模式
        const readingModeActive = document.querySelector('.reader-view, [data-ghost-reading-mode], [class*="reading-mode"]');
        if (readingModeActive) {
          setTimeout(applyProtectionToReadingMode, 300);
        }
      }
    });
  }
  
  // 應用保護
  function applyProtection() {
    // 只在文章頁面上應用保護
    if (!isPostPage()) return;
    
    // 處理內容元素
    const contentContainers = document.querySelectorAll(
      '.post-content, .gh-content, article.post, .post-full-content, .post-content-body'
    );
    
    if (contentContainers.length > 0) {
      contentContainers.forEach(container => {
        // 處理容器內的所有文本元素
        processContentElements(container);
      });
    }
  }
  
  // 專門針對閱讀模式應用保護
  function applyProtectionToReadingMode() {
    // 尋找閱讀模式容器
    const readingModeContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode], .gh-article-reading-mode, ' +
      '.gh-rm-container, [class*="reading-mode"]'
    );
    
    if (readingModeContainers.length > 0) {
      console.log(`找到 ${readingModeContainers.length} 個閱讀模式容器`);
      
      // 為每個閱讀模式容器處理內容
      readingModeContainers.forEach(container => {
        processContentElements(container);
      });
    } else {
      // 後備方案 - 尋找網頁中所有內容區塊
      const mainContent = document.querySelector('main, [role="main"], .gh-content');
      if (mainContent) {
        processContentElements(mainContent);
      }
    }
  }
  
  // 處理內容元素
  function processContentElements(container) {
    // 選擇文章內容元素，避免處理導航等元素
    const textElements = container.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, .post-text, .post-excerpt'
    );
    
    // 過濾掉已處理的元素和不需要處理的元素
    const toProcess = Array.from(textElements).filter(el => {
      return !el.dataset.protected && 
             !el.closest('nav, footer, .sidebar, .widget, .site-header, .site-footer, .comment-section, a') &&
             el.textContent.trim().length >= MIN_TEXT_LENGTH;
    });
    
    // 處理每個元素
    toProcess.forEach(processElement);
  }
  
  // 處理單個元素
  function processElement(element) {
    // 標記為已處理
    element.dataset.protected = 'true';
    
    // 獲取文本內容
    const textContent = element.textContent.trim();
    
    // 創建保護容器和內容
    const fragment = document.createDocumentFragment();
    const container = document.createElement('span');
    container.className = 'protection-container';
    
    // 創建前置亂碼內容元素
    const fakeBefore = document.createElement('span');
    fakeBefore.className = 'fake-content';
    fakeBefore.textContent = generateScrambledText(Math.floor(textContent.length / 2));
    
    // 創建原始內容元素
    const realContent = document.createElement('span');
    realContent.className = 'real-content';
    realContent.innerHTML = element.innerHTML;
    
    // 創建後置亂碼內容元素
    const fakeAfter = document.createElement('span');
    fakeAfter.className = 'fake-content';
    fakeAfter.textContent = generateScrambledText(Math.ceil(textContent.length / 2));
    
    // 組裝元素：亂碼 文字 亂碼
    container.appendChild(fakeBefore);
    container.appendChild(realContent);
    container.appendChild(fakeAfter);
    fragment.appendChild(container);
    
    // 清空原元素並插入保護容器
    element.innerHTML = '';
    element.appendChild(fragment);
  }
  
  // 生成亂碼文本
  function generateScrambledText(length) {
    return Array.from({length}, () => 
      SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * SCRAMBLE_CHARS.length))
    ).join('');
  }
  
  // 處理複製保護
  document.addEventListener('copy', function() {
    if (!isPostPage()) return;
    
    // 獲取所有亂碼內容
    const fakeContents = document.querySelectorAll('.fake-content');
    const realContents = document.querySelectorAll('.real-content');
    
    // 臨時隱藏真實內容並顯示亂碼
    for (let i = 0; i < realContents.length; i++) {
      realContents[i].style.visibility = 'hidden';
    }
    
    for (let i = 0; i < fakeContents.length; i++) {
      fakeContents[i].style.position = 'static';
      fakeContents[i].style.display = 'inline';
      fakeContents[i].style.opacity = '1';
      fakeContents[i].style.height = 'auto';
      fakeContents[i].style.color = 'rgba(0,0,0,0.9)';
    }
    
    // 短暫延遲後恢復原狀
    setTimeout(() => {
      for (let i = 0; i < realContents.length; i++) {
        realContents[i].style.visibility = '';
      }
      
      for (let i = 0; i < fakeContents.length; i++) {
        fakeContents[i].style.position = '';
        fakeContents[i].style.display = '';
        fakeContents[i].style.opacity = '';
        fakeContents[i].style.height = '';
        fakeContents[i].style.color = '';
      }
    }, 500);
  });
  
  // 如果頁面已經加載，立即初始化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeProtection();
  }
})();
