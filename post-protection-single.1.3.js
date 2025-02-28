// 文章頁面保護（遮罩和亂碼）- 優化高效版
(function() {
  // 立即執行初始檢查並攔截閱讀模式
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做要能會可能好很真的太過於又還但因所以如果就算雖然因為可是只有一些都沒有多少許多幾乎差不多經常總是從來未曾已經正在將要即將快要台灣';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  
  // 關鍵：攔截閱讀模式API
  interceptReadingMode();
  
  // 自動插入CSS - 特別優化閱讀模式樣式優先級
  const postProtectionCSS = `
  /* 文章內容保護樣式 - 高優先級 */
  body.post-template .gh-content, 
  .reader-view-content,
  .reader-article-content,
  [data-ghost-reading-mode] .gh-article,
  .gh-article-reading-mode,
  .gh-rm-container,
  [class*="reading-mode"] {
    position: relative !important;
  }
  
  /* 內容區域保護遮罩 - 高優先級 */
  .content-protection-overlay {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    z-index: 90 !important;
    background-color: transparent !important;
    cursor: auto !important;
    pointer-events: auto !important;
  }

  /* 確保互動元素可點擊 */
  a, button, input, textarea, select,
  [role="button"], .button, .btn,
  .kg-link-card, .kg-bookmark-container,
  .gh-content a, .post-content a {
    position: relative !important;
    z-index: 92 !important;
    pointer-events: auto !important;
  }

  /* 會員訂閱提示元素層級 */
  .gh-post-upgrade-cta {
    z-index: 95 !important;
  }
  
  /* 亂碼保護相關樣式 - 高優先級 */
  .protection-container {
    position: relative !important;
    display: inline !important;
    width: auto !important;
  }
  
  .real-content {
    position: relative !important;
    z-index: 2 !important;
  }
  
  .fake-content {
    position: absolute !important;
    display: inline-block !important;
    opacity: 0.01 !important;
    color: rgba(0,0,0,0.01) !important;
    height: 0 !important;
    line-height: 0 !important;
    font-size: 0 !important;
    overflow: hidden !important;
    pointer-events: none !important;
    white-space: nowrap !important;
    left: 0 !important;
    top: 0 !important;
    z-index: -1 !important;
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
  
  // 將CSS插入到頁面頭部，確保優先級
  const styleEl = document.createElement('style');
  styleEl.textContent = postProtectionCSS;
  document.head.insertBefore(styleEl, document.head.firstChild);
  
  // 初始化保護並設置所有監聽器
  initializeProtection();
  
  // 攔截閱讀模式API - 核心解決方案
  function interceptReadingMode() {
    try {
      // 攔截可能的閱讀模式切換函數
      const originalOpen = window.open;
      window.open = function() {
        const result = originalOpen.apply(this, arguments);
        
        // 檢查是否是閱讀模式窗口
        setTimeout(() => {
          if (result && result.document) {
            injectProtectionToWindow(result);
          }
        }, 100);
        
        return result;
      };
      
      // 攔截新窗口創建
      document.addEventListener('DOMNodeInserted', function(e) {
        if (e.target.nodeName === 'IFRAME' || 
            (e.target.className && typeof e.target.className === 'string' && 
             e.target.className.includes('reading'))) {
          setTimeout(() => {
            try {
              if (e.target.contentWindow) {
                injectProtectionToWindow(e.target.contentWindow);
              }
            } catch (err) {
              console.log('無法訪問iframe內容：', err);
            }
          }, 100);
        }
      }, true);
      
      // 攔截可能的閱讀模式函數
      const observer = new MutationObserver(function(mutationsList) {
        for (const mutation of mutationsList) {
          if (mutation.type === 'childList' && 
              mutation.addedNodes.length > 0) {
            for (const node of mutation.addedNodes) {
              if (node.nodeType === 1) {
                // 如果添加的節點可能是閱讀模式容器
                if (isReadingModeContainer(node)) {
                  console.log('檢測到閱讀模式容器添加');
                  applyProtectionToElement(node);
                  
                  // 向下搜索段落並處理
                  const paragraphs = node.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
                  paragraphs.forEach(p => {
                    if (p.textContent.trim().length >= MIN_TEXT_LENGTH && !p.closest('a')) {
                      processElement(p);
                    }
                  });
                }
              }
            }
          }
        }
      });
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true
      });
      
      // 攔截Ghost可能的閱讀模式函數
      if (window.ghost) {
        // 如果有Ghost對象，嘗試攔截其API
        interceptGhostAPI();
      } else {
        // 監聽Ghost對象的出現
        Object.defineProperty(window, 'ghost', {
          configurable: true,
          set: function(newValue) {
            delete window.ghost;
            window.ghost = newValue;
            interceptGhostAPI();
          },
          get: function() {
            return window._ghost;
          }
        });
      }
    } catch (e) {
      console.error('攔截閱讀模式時出錯：', e);
    }
  }
  
  // 攔截Ghost API
  function interceptGhostAPI() {
    try {
      if (window.ghost && window.ghost.reading) {
        const originalToggle = window.ghost.reading.toggle;
        window.ghost.reading.toggle = function() {
          console.log('閱讀模式切換被攔截');
          
          // 調用原始函數
          const result = originalToggle.apply(this, arguments);
          
          // 然後應用我們的保護
          setTimeout(() => {
            applyProtectionToReadingMode();
          }, 10);
          
          // 再次嘗試應用保護
          setTimeout(() => {
            applyProtectionToReadingMode();
          }, 100);
          
          return result;
        };
      }
    } catch (e) {
      console.error('攔截Ghost API時出錯：', e);
    }
  }
  
  // 向外部窗口注入保護
  function injectProtectionToWindow(win) {
    try {
      if (!win || !win.document) return;
      
      // 創建並插入樣式
      const style = win.document.createElement('style');
      style.textContent = postProtectionCSS;
      win.document.head.insertBefore(style, win.document.head.firstChild);
      
      // 等待DOM加載
      if (win.document.readyState === 'loading') {
        win.document.addEventListener('DOMContentLoaded', () => {
          applyProtectionToDocument(win.document);
        });
      } else {
        applyProtectionToDocument(win.document);
      }
    } catch (e) {
      console.error('注入保護到窗口時出錯：', e);
    }
  }
  
  // 應用保護到特定文檔
  function applyProtectionToDocument(doc) {
    const container = doc.querySelector('body');
    if (container) {
      // 處理所有文本元素
      const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
      textElements.forEach(el => {
        if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a')) {
          processElementInDocument(el, doc);
        }
      });
    }
  }
  
  // 在特定文檔中處理元素
  function processElementInDocument(element, doc) {
    // 已處理元素跳過
    if (element.dataset.protected === 'true') return;
    
    // 標記為已處理
    element.dataset.protected = 'true';
    
    const textContent = element.textContent.trim();
    if (textContent.length < MIN_TEXT_LENGTH) return;
    
    // 創建保護容器和內容
    const fragment = doc.createDocumentFragment();
    const container = doc.createElement('span');
    container.className = 'protection-container';
    
    // 創建前置亂碼內容元素
    const fakeBefore = doc.createElement('span');
    fakeBefore.className = 'fake-content';
    fakeBefore.textContent = generateScrambledText(Math.floor(textContent.length / 2));
    
    // 創建原始內容元素
    const realContent = doc.createElement('span');
    realContent.className = 'real-content';
    realContent.innerHTML = element.innerHTML;
    
    // 創建後置亂碼內容元素
    const fakeAfter = doc.createElement('span');
    fakeAfter.className = 'fake-content';
    fakeAfter.textContent = generateScrambledText(Math.ceil(textContent.length / 2));
    
    // 組裝元素
    container.appendChild(fakeBefore);
    container.appendChild(realContent);
    container.appendChild(fakeAfter);
    fragment.appendChild(container);
    
    // 清空原元素並插入保護容器
    element.innerHTML = '';
    element.appendChild(fragment);
  }
  
  // 檢查元素是否為閱讀模式容器
  function isReadingModeContainer(element) {
    if (!element || !element.classList) return false;
    
    // 檢查類名和屬性
    return element.classList.contains('reader-view') || 
           element.classList.contains('gh-article-reading-mode') ||
           element.classList.contains('gh-rm-container') ||
           element.hasAttribute('data-ghost-reading-mode') ||
           (typeof element.className === 'string' && 
            element.className.includes('reading')) ||
           // 檢查ID
           (element.id && element.id.includes('reading'));
  }
  
  // 初始化保護
  function initializeProtection() {
    // 監聽DOM加載完成
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyInitialProtection);
    } else {
      applyInitialProtection();
    }
    
    // 頁面完全加載後再次應用
    window.addEventListener('load', function() {
      setTimeout(applyProtectionAgain, 300);
    });
    
    // 監聽閱讀模式按鈕點擊
    document.addEventListener('click', function(e) {
      // 檢查是否點擊了閱讀模式相關按鈕
      const target = e.target;
      if (target.closest('[aria-label*="reading"],[title*="reading"],[class*="reading"]') ||
          (target.textContent && /reading/i.test(target.textContent))) {
        console.log("檢測到閱讀模式按鈕點擊");
        
        // 使用多個延遲確保覆蓋各種情況
        setTimeout(applyProtectionToReadingMode, 10);
        setTimeout(applyProtectionToReadingMode, 100);
        setTimeout(applyProtectionToReadingMode, 300);
      }
    }, true);
    
    // 監聽閱讀模式快捷鍵
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.altKey && e.key === 'r') || 
          (e.altKey && e.key === 'r') || 
          (e.ctrlKey && e.key === 'e')) {
        console.log("檢測到閱讀模式快捷鍵");
        
        // 使用多個延遲確保覆蓋各種情況
        setTimeout(applyProtectionToReadingMode, 10);
        setTimeout(applyProtectionToReadingMode, 100);
        setTimeout(applyProtectionToReadingMode, 300);
      }
    });
    
    // 處理複製事件
    document.addEventListener('copy', enhanceCopyProtection);
    
    // 設置定期檢查
    setInterval(checkAndApplyProtection, 1000);
  }
  
  // 應用初始保護
  function applyInitialProtection() {
    console.log("應用初始保護");
    
    // 添加遮罩
    setupOverlay();
    
    // 處理當前頁面內容
    const containers = document.querySelectorAll('.post-content, .gh-content, article, .post-full-content');
    containers.forEach(container => {
      applyProtectionToElement(container);
    });
    
    // 處理閱讀模式容器
    const readingContainers = document.querySelectorAll('.reader-view, [data-ghost-reading-mode], .gh-article-reading-mode');
    if (readingContainers.length > 0) {
      console.log("發現閱讀模式容器");
      readingContainers.forEach(container => {
        applyProtectionToElement(container);
      });
    }
  }
  
  // 再次應用保護
  function applyProtectionAgain() {
    console.log("再次應用保護");
    
    // 查找所有尚未處理的文本元素
    const textElements = document.querySelectorAll('p:not([data-protected]), h1:not([data-protected]), h2:not([data-protected]), h3:not([data-protected]), h4:not([data-protected]), h5:not([data-protected]), h6:not([data-protected])');
    textElements.forEach(el => {
      if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a')) {
        processElement(el);
      }
    });
    
    // 特別檢查閱讀模式容器
    applyProtectionToReadingMode();
  }
  
  // 檢查並應用保護
  function checkAndApplyProtection() {
    // 檢查閱讀模式容器
    const readingContainers = document.querySelectorAll('.reader-view, [data-ghost-reading-mode], .gh-article-reading-mode, .gh-rm-container, [class*="reading-mode"]');
    
    if (readingContainers.length > 0) {
      readingContainers.forEach(container => {
        // 尋找未處理的文本元素
        const unprotectedElements = container.querySelectorAll('p:not([data-protected]), h1:not([data-protected]), h2:not([data-protected]), h3:not([data-protected]), h4:not([data-protected]), h5:not([data-protected]), h6:not([data-protected])');
        
        if (unprotectedElements.length > 0) {
          console.log(`檢測到${unprotectedElements.length}個未保護元素`);
          unprotectedElements.forEach(el => {
            if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a')) {
              processElement(el);
            }
          });
        }
      });
    }
  }
  
  // 應用保護到閱讀模式
  function applyProtectionToReadingMode() {
    console.log("應用閱讀模式保護");
    
    // 找到所有閱讀模式容器
    const containers = document.querySelectorAll('.reader-view, [data-ghost-reading-mode], .gh-article-reading-mode, .gh-rm-container, [class*="reading-mode"]');
    
    if (containers.length > 0) {
      containers.forEach(container => {
        applyProtectionToElement(container);
      });
    } else {
      // 尋找主要內容容器
      const mainContent = document.querySelector('main, [role="main"], article, .gh-content');
      if (mainContent) {
        applyProtectionToElement(mainContent);
      }
    }
  }
  
  // 應用保護到元素
  function applyProtectionToElement(container) {
    // 添加遮罩層
    if (!container.querySelector('.content-protection-overlay')) {
      const overlay = document.createElement('div');
      overlay.className = 'content-protection-overlay';
      
      if (container.firstChild) {
        container.insertBefore(overlay, container.firstChild);
      } else {
        container.appendChild(overlay);
      }
    }
    
    // 處理所有文本元素
    const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    textElements.forEach(el => {
      if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a') && !el.dataset.protected) {
        processElement(el);
      }
    });
    
    // 觀察動態添加的元素
    setupObserver(container);
  }
  
  // 設置遮罩層
  function setupOverlay() {
    // 添加透明遮罩層到主要內容區域
    const contentAreas = document.querySelectorAll('.gh-content, .post-content, .post-full-content, article');
    
    contentAreas.forEach(area => {
      if (!area.querySelector('.content-protection-overlay')) {
        const overlay = document.createElement('div');
        overlay.className = 'content-protection-overlay';
        
        if (area.firstChild) {
          area.insertBefore(overlay, area.firstChild);
        } else {
          area.appendChild(overlay);
        }
      }
    });
  }
  
  // 設置觀察器
  function setupObserver(container) {
    // 使用 MutationObserver 監視容器的變化
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            // 只處理元素節點
            if (node.nodeType === 1) {
              // 直接檢查是否為文本元素
              if ((node.tagName === 'P' || 
                   node.tagName === 'H1' || 
                   node.tagName === 'H2' || 
                   node.tagName === 'H3' || 
                   node.tagName === 'H4' || 
                   node.tagName === 'H5' || 
                   node.tagName === 'H6') && 
                  !node.dataset.protected && 
                  node.textContent.trim().length >= MIN_TEXT_LENGTH && 
                  !node.closest('a')) {
                processElement(node);
              }
              
              // 檢查子元素
              const childElements = node.querySelectorAll('p:not([data-protected]), h1:not([data-protected]), h2:not([data-protected]), h3:not([data-protected]), h4:not([data-protected]), h5:not([data-protected]), h6:not([data-protected])');
              childElements.forEach(el => {
                if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a')) {
                  processElement(el);
                }
              });
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
  
  // 處理單個元素
  function processElement(element) {
    // 已處理元素跳過
    if (element.dataset.protected === 'true' || 
        element.classList.contains('protection-container') || 
        element.classList.contains('real-content') || 
        element.classList.contains('fake-content')) {
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
    
    // 組裝元素
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
        fakeContents[i].style.zIndex = '';
      }
    }, 500);
  }
  
  // 立即執行一次初始保護
  setTimeout(applyInitialProtection, 0);
})();
