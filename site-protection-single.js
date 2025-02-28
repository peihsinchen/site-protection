// 文章頁面保護（遮罩和亂碼）- 加強版
(function() {
  // 自動插入CSS - 擴展選擇器以涵蓋閱讀模式
  const postProtectionCSS = `
  /* 文章內容保護樣式 - 涵蓋閱讀模式 */
  body.post-template .gh-content, 
  body.post-template .post-content, 
  body.post-template .post-full-content, 
  body.post-template .kg-card,
  body.post-template .kg-canvas,
  body.post-template .kg-prose,
  .reader-view-content,
  .reader-article-content,
  [data-ghost-reading-mode] * {
    position: relative;
  }
  
  /* 內容區域保護遮罩 - 加強閱讀模式支援 */
  body.post-template .content-protection-overlay,
  .reader-view .content-protection-overlay,
  [data-ghost-reading-mode] .content-protection-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 90;
    background-color: transparent;
    cursor: auto;
    pointer-events: auto;
  }

  /* 確保互動元素可點擊 - 特別是Markdown連結 */
  a, button, input, textarea, select,
  [role="button"], .button, .btn,
  .kg-link-card, .kg-bookmark-container,
  .gh-content a, .post-content a {
    position: relative;
    z-index: 92;
    pointer-events: auto !important;
  }

  /* 會員訂閱提示元素層級 */
  .gh-post-upgrade-cta {
    z-index: 95;
  }
  
  /* 亂碼保護相關樣式 - 加強閱讀模式支援 */
  body.post-template .protection-container,
  .reader-view .protection-container,
  [data-ghost-reading-mode] .protection-container {
    position: relative;
    display: inline;
    width: auto;
  }
  
  body.post-template .real-content,
  .reader-view .real-content,
  [data-ghost-reading-mode] .real-content {
    position: relative;
    z-index: 2;
  }
  
  body.post-template .fake-content,
  .reader-view .fake-content,
  [data-ghost-reading-mode] .fake-content {
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
  
  /* 打印時顯示亂碼 - 加強閱讀模式支援 */
  @media print {
    body.post-template .real-content,
    .reader-view .real-content,
    [data-ghost-reading-mode] .real-content {
      display: none !important;
    }
    body.post-template .fake-content,
    .reader-view .fake-content,
    [data-ghost-reading-mode] .fake-content {
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
  
  // 中文常用文字作為亂碼
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做要能會可能好很真的太過於又還但因所以如果就算雖然因為可是只有一些都沒有多少許多幾乎差不多經常總是從來未曾已經正在將要即將快要台灣';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  
  // 檢查當前頁面是否為文章頁面 (包含閱讀模式)
  function isPostPage() {
    // 檢查 body 是否有 post-template 類或閱讀模式相關屬性
    return document.body.classList.contains('post-template') || 
           document.body.classList.contains('reader-view') ||
           document.querySelector('[data-ghost-reading-mode]') !== null ||
           // 額外檢查特定的文章頁面 URL 模式 (可選)
           /\/p\/|\/post\/|\/article\//.test(window.location.pathname);
  }
  
  // 在DOM加載後初始化
  document.addEventListener('DOMContentLoaded', initializeProtection);
  
  // 初始化保護功能
  function initializeProtection() {
    // 立即套用保護
    applyProtection();
    
    // 設置監聽器以處理動態加載的閱讀模式
    setupReadingModeObserver();
    
    // 監聽類別變化 (針對閱讀模式切換)
    observeBodyClassChanges();
  }
  
  // 監視 body 類別變化 (針對閱讀模式切換)
  function observeBodyClassChanges() {
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          // 當 body 類別變化時重新應用保護
          if (isPostPage()) {
            console.log("檢測到閱讀模式變化，重新套用保護");
            applyProtection();
          }
        }
      });
    });
    
    bodyObserver.observe(document.body, { 
      attributes: true,
      attributeFilter: ['class']
    });
  }
  
  // 監視閱讀模式的變化
  function setupReadingModeObserver() {
    // 使用 MutationObserver 監視 DOM 變化，特別是閱讀模式的出現
    const readingModeObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' || mutation.type === 'attributes') {
          // 檢查是否有閱讀模式相關元素被添加
          if (document.querySelector('.reader-view, [data-ghost-reading-mode]')) {
            console.log("檢測到閱讀模式，應用保護");
            applyProtection();
          }
        }
      });
    });
    
    // 設定觀察選項 - 監視整個文檔
    readingModeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ghost-reading-mode']
    });
  }
  
  // 應用保護
  function applyProtection() {
    // 只在文章頁面上應用保護
    if (isPostPage()) {
      console.log("文章專用保護已啟用（遮罩和亂碼）");
      
      // 添加遮罩
      setupOverlay();
      
      // 添加亂碼保護
      setupTextScrambling();
    }
  }
  
  // 設置遮罩層
  function setupOverlay() {
    // 添加透明遮罩層 - 包含閱讀模式元素
    const contentAreas = document.querySelectorAll(`
      .gh-content, .post-content, .post-full-content,
      .reader-view-content, .reader-article-content,
      [data-ghost-reading-mode] .gh-article
    `);
    
    contentAreas.forEach(area => {
      // 檢查是否已有遮罩層
      if (!area.querySelector('.content-protection-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'content-protection-overlay';
        
        // 將遮罩作為第一個子元素插入，確保覆蓋全部內容
        if (area.firstChild) {
          area.insertBefore(overlay, area.firstChild);
        } else {
          area.appendChild(overlay);
        }
      }
    });
  }
  
  // 設置亂碼保護
  function setupTextScrambling() {
    // 延遲執行，確保不影響頁面載入速度
    setTimeout(() => {
      // 擴展選擇器以包含閱讀模式元素
      const contentContainers = document.querySelectorAll(`
        .post-content, .gh-content, article.post, .post-full-content, .post-content-body,
        .reader-view-content, .reader-article-content, 
        [data-ghost-reading-mode] .gh-article, [data-ghost-reading-mode] article
      `);
      
      if (contentContainers.length > 0) {
        contentContainers.forEach(container => {
          // 處理文章內容元素
          processContentElements(container);
          
          // 添加動態內容觀察器
          observeDynamicContent(container);
        });
      }
    }, 300);
    
    // 處理印刷和頁面離開事件
    window.addEventListener('beforeprint', enhanceCopyProtection);
    window.addEventListener('beforeunload', enhanceCopyProtection);
    
    // 增加：監聽複製事件
    document.addEventListener('copy', function(e) {
      if (isPostPage()) {
        // 臨時激活亂碼保護
        enhanceCopyProtection();
        
        // 500ms 後恢復正常顯示
        setTimeout(resetProtection, 500);
      }
    });
  }
  
  // 處理內容區域中的所有文本元素
  function processContentElements(container) {
    // 選擇文章內容元素 - 擴展以包含閱讀模式特有元素
    const textElements = container.querySelectorAll(`
      p, h1, h2, h3, h4, h5, h6, li, blockquote, td, .post-text, .post-excerpt,
      div[class^="gh-"], div[class*=" gh-"],
      span:not(.protection-container):not(.real-content):not(.fake-content):not(.meta):not(.author):not(.date)
    `);
    
    // 排除導航、頁腳和連結元素
    const toProcess = Array.from(textElements).filter(el => {
      return !hasParentMatchingSelector(el, 'nav, footer, .sidebar, .widget, .site-header, .site-footer, .comment-section, a');
    });
    
    // 處理每個元素
    toProcess.forEach(processElement);
  }
  
  // 檢查元素是否有特定選擇器的父元素
  function hasParentMatchingSelector(element, selector) {
    let parent = element.parentElement;
    while (parent) {
      if (parent.matches && parent.matches(selector)) {
        return true;
      }
      parent = parent.parentElement;
    }
    return false;
  }
  
  // 處理單個元素
  function processElement(element) {
    // 已處理元素跳過
    if (element.dataset.protected === 'true' || 
        element.classList.contains('protection-container') || 
        element.classList.contains('real-content') || 
        element.classList.contains('fake-content') ||
        element.closest('a')) { // 不處理連結內部的文本
      return;
    }
    
    // 標記為已處理
    element.dataset.protected = 'true';
    
    const textContent = element.textContent.trim();
    if (textContent.length < MIN_TEXT_LENGTH) return;
    
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
  
  // 增強複製保護
  function enhanceCopyProtection() {
    // 如果不是文章頁面，跳過
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
      fakeContents[i].style.zIndex = '9999';
    }
  }
  
  // 重置保護 - 恢復正常顯示
  function resetProtection() {
    const fakeContents = document.querySelectorAll('.fake-content');
    const realContents = document.querySelectorAll('.real-content');
    
    // 恢復正常顯示
    for (let i = 0; i < realContents.length; i++) {
      realContents[i].style.visibility = '';
    }
    
    for (let i = 0; i < fakeContents.length; i++) {
      fakeContents[i].style.position = '';
      fakeContents[i].style.display = '';
      fakeContents[i].style.opacity = '';
      fakeContents[i].style.height = '';
      fakeContents[i].style.color = '';
      fakeContents[i].style.zIndex = '';
    }
  }
  
  // 觀察動態添加的內容
  function observeDynamicContent(container) {
    // 使用 MutationObserver 監視 DOM 變化
    const observer = new MutationObserver(mutations => {
      // 如果不是文章頁面，跳過處理
      if (!isPostPage()) return;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            // 只處理元素節點
            if (node.nodeType === 1) {
              if (node.textContent.trim().length >= MIN_TEXT_LENGTH && !node.closest('a')) {
                processElement(node);
              }
              
              // 處理新添加元素的子元素
              const childElements = node.querySelectorAll(`
                p, h1, h2, h3, h4, h5, h6, li, blockquote, td, .post-text, .post-excerpt,
                div[class^="gh-"], div[class*=" gh-"],
                span:not(.protection-container):not(.real-content):not(.fake-content):not(.meta):not(.author):not(.date)
              `);
              Array.from(childElements)
                .filter(el => el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a'))
                .forEach(processElement);
            }
          });
        }
      });
    });
    
    // 設定觀察選項
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }
  
  // 如果頁面已經加載，立即初始化
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    initializeProtection();
  }
})();
