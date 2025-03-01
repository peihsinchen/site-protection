// 文章頁面保護（輕量級亂碼保護）- 效能優化版
(function() {
  // 使用閉包變量而非全域變數，避免污染全域命名空間
  const protectionState = {
    readingModeActive: false,
    protectionApplied: false,
    intervalId: null,
    isSelecting: false,
    lastSelectionTime: 0
  };
  
  // 自動插入CSS - 輕量化
  const postProtectionCSS = `
  /* 文章內容保護樣式 - 精確選擇器 */
  body.post-template .gh-content, 
  body.post-template .post-content, 
  body.post-template article.post, 
  body.post-template .post-full-content, 
  .reader-view-content,
  .reader-article-content,
  [data-ghost-reading-mode] .gh-article {
    position: relative;
  }
  
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
  
  // 中文常用文字作為亂碼
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做要能會可能好很真的太過於又還但因所以如果就算雖然因為可是只有一些都沒有多少許多幾乎差不多經常總是從來未曾已經正在將要即將快要台灣';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  
  // 主要內容選擇器 - 精確定位文章內容區域
  const CONTENT_SELECTORS = [
    '.gh-content', 
    '.post-content', 
    'article.post', 
    '.post-full-content', 
    '.kg-canvas',
    '.entry-content',
    '.article-content'
  ].join(', ');
  
  // 檢查當前頁面是否為文章頁面 (包含閱讀模式)
  function isPostPage() {
    return document.body.classList.contains('post-template') || 
           document.body.classList.contains('reader-view') ||
           document.querySelector('[data-ghost-reading-mode]') !== null ||
           document.querySelector('.gh-article-reading-mode, .gh-rm-container, [class*="reading-mode"]') !== null ||
           /\/p\/|\/post\/|\/article\//.test(window.location.pathname);
  }

  // 檢查閱讀模式是否啟用
  function isReadingModeActive() {
    return document.body.classList.contains('reader-view') ||
           document.querySelector('[data-ghost-reading-mode]') !== null ||
           document.querySelector('.gh-article-reading-mode, .gh-rm-container, [class*="reading-mode"]') !== null ||
           protectionState.readingModeActive;
  }
  
  // 初始化 - 輕量版
  function initializeProtection() {
    if (!isPostPage()) return;
    
    console.log("文章保護初始化 - 輕量版");
    
    // 應用保護到文章內容
    applyProtectionToContent();
    
    // 設置監聽器以處理閱讀模式
    setupBasicReadingModeDetection();
    
    // 設置選擇和複製保護 - 輕量級版本
    setupBasicSelectionProtection();
  }
  
  // 發現文章內容并應用保護
  function applyProtectionToContent() {
    // 首先尋找主要內容區域
    const contentAreas = document.querySelectorAll(CONTENT_SELECTORS);
    
    if (contentAreas.length > 0) {
      console.log(`找到 ${contentAreas.length} 個內容區域`);
      
      // 為每個內容區域應用保護
      contentAreas.forEach(container => {
        processContentElements(container);
      });
      
      // 標記保護已應用
      protectionState.protectionApplied = true;
    } else if (isReadingModeActive()) {
      // 如果在閱讀模式中找不到標準內容區域
      applyProtectionToReadingMode();
    }
  }
  
  // 處理閱讀模式
  function applyProtectionToReadingMode() {
    // 尋找閱讀模式容器 - 使用精確選擇器
    const readingContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode] .gh-article, .gh-article-reading-mode'
    );
    
    if (readingContainers.length > 0) {
      readingContainers.forEach(container => {
        processContentElements(container);
      });
      
      // 標記保護已應用
      protectionState.protectionApplied = true;
    } else {
      // 最小範圍備用方案
      const article = document.querySelector('article, main [role="main"]');
      if (article) {
        processContentElements(article);
        protectionState.protectionApplied = true;
      }
    }
  }
  
  // 處理內容區域中的文本元素 - 只處理主要文本
  function processContentElements(container) {
    // 只處理實際的段落和標題，避免處理過多
    const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote');
    
    // 過濾並處理元素
    Array.from(textElements)
      .filter(el => {
        return !el.dataset.protected && 
               !el.closest('nav, footer, .sidebar, .site-header, .site-footer, a, button') &&
               el.textContent.trim().length >= MIN_TEXT_LENGTH;
      })
      .forEach(processElement);
    
    // 輕量級內容觀察
    setupLightContentObserver(container);
  }
  
  // 輕量級內容觀察器
  function setupLightContentObserver(container) {
    // 使用效能較低的配置
    const observer = new MutationObserver(mutations => {
      // 檢查是否有新添加的內容
      let newElements = [];
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(node => {
            // 只處理元素節點
            if (node.nodeType === 1) {
              // 檢查是否為文本元素
              if (isTextElement(node) && !node.dataset.protected) {
                newElements.push(node);
              }
              
              // 收集子元素
              if (node.querySelectorAll) {
                const childElements = node.querySelectorAll('p:not([data-protected]), h1:not([data-protected]), h2:not([data-protected]), h3:not([data-protected]), h4:not([data-protected]), h5:not([data-protected]), h6:not([data-protected]), blockquote:not([data-protected])');
                childElements.forEach(el => {
                  if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a, button')) {
                    newElements.push(el);
                  }
                });
              }
            }
          });
        }
      });
      
      // 批量處理新元素，提高效能
      if (newElements.length > 0) {
        // 使用requestAnimationFrame優化處理時機
        requestAnimationFrame(() => {
          newElements.forEach(processElement);
        });
      }
    });
    
    // 設定觀察選項 - 只觀察子元素變化，減少負擔
    observer.observe(container, {
      childList: true,
      subtree: true
    });
  }
  
  // 輕量級選擇保護
  function setupBasicSelectionProtection() {
    // 主要處理複製事件 - 這是最關鍵的部分
    document.addEventListener('copy', function(e) {
      if (!isPostPage()) return;
      
      // 檢查選擇區域
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      
      const range = selection.getRangeAt(0);
      
      // 檢查選擇是否包含文章內容
      const container = range.commonAncestorContainer;
      const containerEl = container.nodeType === 3 ? container.parentNode : container;
      
      // 檢查是否從頂部選擇 - 特別處理從頂部選擇的情況
      let isFromTop = false;
      const contentAreas = document.querySelectorAll(CONTENT_SELECTORS);
      
      if (contentAreas.length > 0) {
        // 檢查選擇範圍是否超出了內容區域
        const firstContentArea = contentAreas[0];
        const lastContentArea = contentAreas[contentAreas.length - 1];
        
        if (range.startContainer !== range.endContainer) {
          // 檢查選擇是否跨越多個區域
          if (document.body.contains(range.startContainer) && document.body.contains(range.endContainer)) {
            // 檢查選擇是否包含頂部元素
            const headerEl = document.querySelector('header, .site-header, .header');
            if (headerEl && headerEl.contains(range.startContainer)) {
              isFromTop = true;
            }
          }
        }
      }
      
      // 如果是普通文章內容或從頂部選擇，則替換為亂碼
      if (isFromTop || containerEl.closest(CONTENT_SELECTORS)) {
        // 生成符合選擇長度的亂碼
        const selectedText = selection.toString();
        if (selectedText.length > 0) {
          const scrambledText = generateScrambledText(selectedText.length);
          
          // 將亂碼文本寫入剪貼板
          e.clipboardData.setData('text/plain', scrambledText);
          e.preventDefault(); // 防止默認複製行為
        }
      }
    }, { capture: true });
    
    // 監聽 Ctrl+A 全選
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isPostPage()) {
        // 標記全選狀態以便在複製時處理
        protectionState.isFullPageSelection = true;
      }
    }, { passive: true });
  }
  
  // 基本閱讀模式檢測
  function setupBasicReadingModeDetection() {
    // 監聽閱讀模式切換
    document.addEventListener('click', function(e) {
      const target = e.target;
      const isReadingModeButton = 
        target.closest('[aria-label*="reading"], [title*="reading"], [class*="reading-mode"], [id*="reading-mode"]') ||
        (target.textContent && /reading mode/i.test(target.textContent));
      
      if (isReadingModeButton && isPostPage()) {
        protectionState.readingModeActive = true;
        
        // 延遲處理閱讀模式
        setTimeout(function() {
          applyProtectionToReadingMode();
        }, 500);
      }
    }, { passive: true });
    
    // 簡易觀察器以檢測閱讀模式的DOM變化
    const observer = new MutationObserver(function(mutations) {
      if (!isPostPage()) return;
      
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            (mutation.target.classList.contains('reader-view') || 
             mutation.target.classList.contains('gh-article-reading-mode'))) {
          
          protectionState.readingModeActive = true;
          setTimeout(applyProtectionToReadingMode, 500);
          break;
        }
        
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (node.nodeType === 1 && 
                (node.classList && node.classList.contains('reader-view') || 
                 node.querySelector && node.querySelector('[data-ghost-reading-mode]'))) {
              
              protectionState.readingModeActive = true;
              setTimeout(applyProtectionToReadingMode, 500);
              break;
            }
          }
        }
      }
    });
    
    // 使用輕量級配置觀察
    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class'],
      childList: true,
      subtree: false // 僅觀察body的直接子元素變化
    });
  }
  
  // 檢查是否為文本元素
  function isTextElement(node) {
    const tagName = node.tagName && node.tagName.toLowerCase();
    return tagName === 'p' || tagName === 'h1' || tagName === 'h2' || 
           tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || 
           tagName === 'h6' || tagName === 'blockquote';
  }
  
  // 處理單個元素
  function processElement(element) {
    // 已處理元素跳過
    if (element.dataset.protected === 'true') return;
    
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
  
  // 生成亂碼文本 - 使用更高效的算法
  function generateScrambledText(length) {
    if (length <= 0) return '';
    
    let result = '';
    const charsLength = SCRAMBLE_CHARS.length;
    
    // 對於非常長的文本，減少隨機計算的次數
    if (length > 1000) {
      // 創建一個較短的亂碼，然後重複使用
      const baseScramble = generateScrambledText(500);
      const repeats = Math.floor(length / 500);
      const remainder = length % 500;
      
      result = baseScramble.repeat(repeats);
      if (remainder > 0) {
        result += baseScramble.substring(0, remainder);
      }
      
      return result;
    }
    
    // 正常長度的文本使用標準方法
    for (let i = 0; i < length; i++) {
      result += SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * charsLength));
    }
    
    return result;
  }
  
  // 啟動保護
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProtection);
  } else {
    initializeProtection();
  }
  
  // 頁面完全載入後再次檢查
  window.addEventListener('load', function() {
    if (isPostPage() && !protectionState.protectionApplied) {
      applyProtectionToContent();
    }
  }, { passive: true });
  
  // 處理列印
  document.addEventListener('beforeprint', function() {
    if (isPostPage()) {
      const realContents = document.querySelectorAll('.real-content');
      const fakeContents = document.querySelectorAll('.fake-content');
      
      realContents.forEach(el => el.style.display = 'none');
      fakeContents.forEach(el => {
        el.style.position = 'static';
        el.style.display = 'inline';
        el.style.opacity = '1';
        el.style.height = 'auto';
        el.style.color = 'black';
      });
    }
  }, { passive: true });
})();
