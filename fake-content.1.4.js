// 文章頁面保護（強化亂碼保護）- 優化版
(function() {
  // 使用閉包變量而非全域變數，避免污染全域命名空間
  const protectionState = {
    readingModeActive: false,
    protectionApplied: false,
    intervalId: null,
    isSelecting: false,  // 新增: 跟踪選擇狀態
    lastSelectionTime: 0 // 新增: 防抖動優化
  };
  
  // 自動插入CSS - 增強選擇保護
  const postProtectionCSS = `
  /* 文章內容保護樣式 - 針對性選擇器 */
  body.post-template .gh-content, 
  body.post-template .post-content, 
  body.post-template .post-full-content, 
  .reader-view-content,
  .reader-article-content,
  [data-ghost-reading-mode] .gh-article {
    position: relative;
  }
  
  /* 確保互動元素可點擊 */
  .post-content a, .gh-content a, .reader-view-content a,
  [data-ghost-reading-mode] a, 
  .kg-link-card, .kg-bookmark-container {
    position: relative;
    z-index: 92;
    pointer-events: auto !important;
  }

  /* 會員訂閱提示元素層級 */
  .gh-post-upgrade-cta {
    z-index: 95;
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
  
  /* 選擇時的保護樣式 - 新增 */
  .protection-active .real-content.selected {
    opacity: 0.01 !important;
    color: transparent !important;
  }
  
  .protection-active .fake-content.selected {
    opacity: 1 !important;
    position: static !important;
    display: inline !important;
    height: auto !important;
    line-height: normal !important;
    font-size: inherit !important;
    color: inherit !important;
    z-index: 999 !important;
    overflow: visible !important;
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
  
  // 在DOM開始載入就預先攔截閱讀模式 - 關鍵改進
  try {
    // 初始設置 - 在DOM載入前
    setupEarlyReadingModeDetection();
  } catch (e) {
    console.error('預先攔截閱讀模式失敗:', e);
  }
  
  // 在DOM加載後初始化主要保護功能
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeProtection);
  } else {
    initializeProtection();
  }
  
  // 預先攔截閱讀模式 - 核心改進
  function setupEarlyReadingModeDetection() {
    // 監聽閱讀模式快捷鍵 - 盡早攔截
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.altKey && e.key === 'r') || 
          (e.altKey && e.key === 'r') || 
          (e.ctrlKey && e.key === 'e')) {
        
        protectionState.readingModeActive = true;
        
        // 使用 requestAnimationFrame 確保在渲染循環中執行
        requestAnimationFrame(function() {
          setTimeout(protectReadingModeContent, 50);
          setTimeout(protectReadingModeContent, 200);
        });
      }
    }, true);
    
    // 攔截Ghost閱讀模式API (如果可用)
    document.addEventListener('readingmode:enter', function() {
      protectionState.readingModeActive = true;
      
      requestAnimationFrame(function() {
        setTimeout(protectReadingModeContent, 50);
        setTimeout(protectReadingModeContent, 200);
      });
    });
    
    // 監聽提前出現的閱讀模式按鈕
    document.addEventListener('click', function(e) {
      const target = e.target;
      const isReadingModeButton = 
        target.closest('[aria-label*="reading"], [title*="reading"], [class*="reading-mode"], [id*="reading-mode"]') ||
        (target.textContent && /reading mode/i.test(target.textContent));
      
      if (isReadingModeButton) {
        protectionState.readingModeActive = true;
        
        requestAnimationFrame(function() {
          setTimeout(protectReadingModeContent, 50);
          setTimeout(protectReadingModeContent, 200);
        });
      }
    }, true);
  }
  
  // 保護閱讀模式內容 - 迅速且直接
  function protectReadingModeContent() {
    const allTextElements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    let foundContent = false;
    
    // 尋找閱讀模式容器
    const readingContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode], .gh-article-reading-mode, ' +
      '.gh-rm-container, [class*="reading-mode"]'
    );
    
    if (readingContainers.length > 0) {
      // 處理閱讀模式容器內容
      readingContainers.forEach(container => {
        processReadingModeContainer(container);
        foundContent = true;
      });
    }
    
    // 後備方案 - 找不到容器時處理所有可見的段落
    if (!foundContent) {
      allTextElements.forEach(el => {
        if (isElementVisible(el) && 
            el.textContent.trim().length >= MIN_TEXT_LENGTH && 
            !el.closest('nav, footer, header, .sidebar') && 
            !el.dataset.protected) {
          
          processElement(el);
        }
      });
    }
  }
  
  // 檢查元素是否可見
  function isElementVisible(el) {
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
  
  // 處理閱讀模式容器 - 已移除遮罩相關代碼
  function processReadingModeContainer(container) {
    // 處理文本元素
    const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6');
    textElements.forEach(el => {
      if (el.textContent.trim().length >= MIN_TEXT_LENGTH && 
          !el.closest('a') && 
          !el.dataset.protected) {
        processElement(el);
      }
    });
    
    // 設置動態內容觀察
    setupDynamicContentObserver(container);
  }
  
  // 初始化主要保護功能
  function initializeProtection() {
    if (!isPostPage()) return;
    
    console.log("文章保護初始化");
    
    // 立即套用保護
    applyProtection();
    
    // 設置監聽器以處理動態加載的閱讀模式
    setupReadingModeObserver();
    
    // 監聽閱讀模式按鈕點擊
    setupReadingModeButtonListener();
    
    // 設置定期檢查機制 - 使用效能優化的方法
    setupEfficientPeriodicCheck();
    
    // 新增: 設置選擇文本保護
    setupSelectionProtection();
  }
  
  // 新增: 設置選擇文本保護 - 防止強制選擇文本
  function setupSelectionProtection() {
    // 添加反選擇保護類別到文檔
    document.body.classList.add('protection-active');
    
    // 監聽選擇變化事件
    document.addEventListener('selectionchange', handleSelectionChange, { passive: true });
    
    // 監聽滑鼠按鍵事件 - 捕獲階段，更難被繞過
    document.addEventListener('mousedown', function() {
      protectionState.isSelecting = true;
    }, { capture: true, passive: true });
    
    document.addEventListener('mouseup', function() {
      protectionState.isSelecting = false;
      // 處理可能的選擇
      setTimeout(handleSelectionChange, 10);
    }, { capture: true, passive: true });
    
    // 監聽鍵盤事件 - 以防是鍵盤選擇
    document.addEventListener('keydown', function(e) {
      // Shift+箭頭鍵通常用於選擇
      if (e.shiftKey && (e.key.startsWith('Arrow') || e.key === 'Home' || e.key === 'End' || e.key === 'PageUp' || e.key === 'PageDown')) {
        protectionState.isSelecting = true;
      }
    }, { capture: true, passive: true });
    
    document.addEventListener('keyup', function(e) {
      if (e.key === 'Shift') {
        protectionState.isSelecting = false;
        // 處理可能的選擇
        setTimeout(handleSelectionChange, 10);
      }
    }, { capture: true, passive: true });
    
    // 增強複製保護 - 攔截所有可能的複製途徑
    document.addEventListener('copy', handleCopyEvent, { capture: true });
    document.addEventListener('cut', handleCopyEvent, { capture: true });
    
    // 防止右鍵菜單選項中的「檢查元素」
    document.addEventListener('contextmenu', function(e) {
      if (isPostPage() && isProtectedElement(e.target)) {
        // 不阻止右鍵菜單，但是設置一個標記，我們將保護文本
        handleSelectionChange();
      }
    }, { passive: true });
  }
  
  // 新增: 處理選擇變化 - 立即保護被選中的文本
  function handleSelectionChange() {
    // 防抖動處理
    const now = Date.now();
    if (now - protectionState.lastSelectionTime < 50) return;
    protectionState.lastSelectionTime = now;
    
    if (!isPostPage()) return;
    
    // 獲取當前選擇
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
    
    // 檢查選擇是否包含受保護內容
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const containerElement = container.nodeType === 3 ? container.parentNode : container;
    
    // 如果選擇範圍包含受保護元素，執行保護
    if (isProtectedElement(containerElement)) {
      // 立即執行亂碼保護
      activateScrambleForSelection();
    }
  }
  
  // 新增: 檢查元素是否為受保護元素
  function isProtectedElement(element) {
    if (!element || !element.closest) return false;
    
    // 檢查是否在受保護區域內
    return element.closest('.gh-content, .post-content, .post-full-content, .reader-view-content, [data-ghost-reading-mode] .gh-article') !== null &&
           !element.closest('nav, footer, header, .sidebar, .site-header, .site-footer, .comment-section');
  }
  
  // 新增: 為選中內容激活亂碼保護
  function activateScrambleForSelection() {
    // 獲取所有真實內容和亂碼內容
    const realContents = document.querySelectorAll('.real-content');
    const fakeContents = document.querySelectorAll('.fake-content');
    
    // 應用亂碼保護
    enhanceCopyProtection();
    
    // 設置計時器恢復 - 延長持續時間以確保複製保護有效
    setTimeout(resetProtection, 1000);
  }
  
  // 設置高效的定期檢查
  function setupEfficientPeriodicCheck() {
    // 清除可能存在的舊計時器
    if (protectionState.intervalId) {
      clearInterval(protectionState.intervalId);
    }
    
    // 使用較短的間隔進行檢查，但使用防抖動技術減少處理
    let lastCheckTime = 0;
    
    protectionState.intervalId = setInterval(function() {
      const now = Date.now();
      
      // 避免頻繁處理
      if (now - lastCheckTime < 800) return;
      
      if (isPostPage()) {
        // 檢查閱讀模式是否啟用但未保護
        if (isReadingModeActive() && !document.querySelector('.reader-view-content .protection-container, [data-ghost-reading-mode] .protection-container')) {
          console.log("定期檢查：發現閱讀模式");
          applyProtectionToReadingMode();
          lastCheckTime = now;
        }
        
        // 檢查一般文章內容
        if (!document.querySelector('.gh-content .protection-container, .post-content .protection-container') && 
            (document.querySelector('.gh-content, .post-content'))) {
          console.log("定期檢查：發現未保護的文章內容");
          applyProtection();
          lastCheckTime = now;
        }
        
        // 新增: 檢查是否有移除保護類別的嘗試
        if (!document.body.classList.contains('protection-active')) {
          document.body.classList.add('protection-active');
        }
      } else {
        // 不是文章頁面時清除計時器
        clearInterval(protectionState.intervalId);
        protectionState.intervalId = null;
      }
    }, 500); // 較短的間隔，但有防抖動保護
  }
  
  // 監聽閱讀模式按鈕
  function setupReadingModeButtonListener() {
    // 使用事件代理來監聽可能的閱讀模式按鈕 - 減少事件處理器數量
    document.addEventListener('click', function(e) {
      // 檢查是否點擊了閱讀模式相關按鈕
      const target = e.target;
      const isReadingModeButton = 
        target.closest('[aria-label*="reading"], [title*="reading"], [class*="reading-mode"], [id*="reading-mode"]') ||
        (target.textContent && /reading mode/i.test(target.textContent));
      
      if (isReadingModeButton) {
        console.log("檢測到閱讀模式按鈕點擊");
        protectionState.readingModeActive = true;
        
        // 使用requestAnimationFrame優化處理時機
        requestAnimationFrame(function() {
          setTimeout(applyProtectionToReadingMode, 100);
          setTimeout(applyProtectionToReadingMode, 500);
        });
      }
    }, { passive: true }); // 使用passive選項提升事件處理效能
  }
  
  // 監視閱讀模式的變化
  function setupReadingModeObserver() {
    // 使用效能優化的選擇器進行觀察
    const readingModeObserver = new MutationObserver(function(mutations) {
      let readingModeDetected = false;
      
      // 優化處理邏輯，避免過度處理
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        
        // 針對屬性變化，快速檢查閱讀模式標記
        if (mutation.type === 'attributes') {
          const target = mutation.target;
          if (target.nodeType === 1 && 
             (target.getAttribute('data-ghost-reading-mode') !== null ||
              target.classList.contains('reader-view') ||
              target.classList.contains('gh-article-reading-mode'))) {
            readingModeDetected = true;
            break; // 找到後立即退出循環
          }
        }
        
        // 針對新增節點，檢查閱讀模式相關類別
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          for (let j = 0; j < mutation.addedNodes.length; j++) {
            const node = mutation.addedNodes[j];
            if (node.nodeType === 1) {
              if (node.classList && 
                 (node.classList.contains('reader-view') || 
                  node.classList.contains('gh-article-reading-mode') ||
                  node.getAttribute('data-ghost-reading-mode') !== null)) {
                readingModeDetected = true;
                break; // 找到後立即退出內部循環
              }
              
              // 檢查是否包含閱讀模式容器
              if (node.querySelector && node.querySelector('.reader-view, [data-ghost-reading-mode], .gh-article-reading-mode')) {
                readingModeDetected = true;
                break; // 找到後立即退出內部循環
              }
            }
          }
          
          if (readingModeDetected) break; // 找到後立即退出外部循環
        }
      }
      
      // 使用requestAnimationFrame優化處理時機
      if (readingModeDetected) {
        console.log("檢測到閱讀模式，應用專門保護");
        protectionState.readingModeActive = true;
        
        requestAnimationFrame(function() {
          applyProtectionToReadingMode();
        });
      }
    });
    
    // 使用更精細的觀察配置，減少不必要的觸發
    readingModeObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ghost-reading-mode']
    });
  }
  
  // 應用保護 - 移除遮罩功能相關代碼
  function applyProtection() {
    // 只在文章頁面上應用保護
    if (!isPostPage()) return;
    
    console.log("文章專用保護已啟用（強化亂碼）");
    
    // 添加亂碼保護
    setupTextScrambling();
    
    // 標記保護已應用
    protectionState.protectionApplied = true;
  }
  
  // 專門針對閱讀模式應用保護 - 移除遮罩相關代碼
  function applyProtectionToReadingMode() {
    // 確保是在閱讀模式下
    if (!isReadingModeActive()) return;
    
    console.log("閱讀模式專用保護已啟用");
    
    // 尋找閱讀模式容器 - 使用更精確的選擇器
    const readingModeContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode], .gh-article-reading-mode, ' +
      '.gh-rm-container, [class*="reading-mode"]'
    );
    
    if (readingModeContainers.length > 0) {
      console.log(`找到 ${readingModeContainers.length} 個閱讀模式容器`);
      
      // 為每個閱讀模式容器添加保護
      readingModeContainers.forEach(processReadingModeContainer);
      
      // 標記保護已應用
      protectionState.protectionApplied = true;
    } else {
      console.log("未找到閱讀模式容器，使用備用方法");
      
      // 備用方法：找到可能的閱讀模式內容
      const possibleReadingContent = findPossibleReadingContent();
      
      if (possibleReadingContent) {
        processReadingModeContainer(possibleReadingContent);
        protectionState.protectionApplied = true;
      } else {
        // 最後的備用方法：處理所有可見的段落
        protectReadingModeContent();
      }
    }
  }
  
  // 找到可能的閱讀模式內容
  function findPossibleReadingContent() {
    // 檢查主要內容區域
    const mainContent = document.querySelector('main, [role="main"], article, .gh-content');
    if (mainContent) return mainContent;
    
    // 尋找包含多個段落的容器
    const paragraphs = document.querySelectorAll('p');
    if (paragraphs.length > 0) {
      // 找出第一個可見的段落
      for (let i = 0; i < paragraphs.length; i++) {
        if (isElementVisible(paragraphs[i])) {
          // 尋找最近的內容容器
          return paragraphs[i].closest('article, [class*="article"], [class*="content"], div');
        }
      }
    }
    
    return null;
  }
  
  // 設置亂碼保護
  function setupTextScrambling() {
    // 優化：只在需要時延遲執行
    const contentContainers = document.querySelectorAll(
      '.post-content, .gh-content, article.post, .post-full-content, ' +
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode] .gh-article'
    );
    
    if (contentContainers.length > 0) {
      contentContainers.forEach(container => {
        // 處理文章內容元素
        processContentElements(container);
        
        // 添加動態內容觀察器
        setupDynamicContentObserver(container);
      });
    }
    
    // 處理印刷和複製保護事件
    document.addEventListener('copy', handleCopyEvent, { passive: true });
    document.addEventListener('beforeprint', enhanceCopyProtection, { passive: true });
  }
  
  // 處理複製事件 - 增強版
  function handleCopyEvent(e) {
    if (!isPostPage()) return;
    
    // 檢查選擇範圍是否包含受保護內容
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      const containerElement = container.nodeType === 3 ? container.parentNode : container;
      
      if (isProtectedElement(containerElement)) {
        // 立即激活亂碼保護
        enhanceCopyProtection();
        
        // 新增: 嘗試將亂碼直接設置到剪貼板
        try {
          // 生成符合選擇長度的亂碼
          const selectedText = selection.toString();
          const scrambledText = generateScrambledText(selectedText.length);
          
          // 將亂碼文本寫入剪貼板
          e.clipboardData.setData('text/plain', scrambledText);
          e.preventDefault(); // 防止默認複製行為
        } catch (error) {
          console.error('剪貼板操作錯誤:', error);
          // 如果直接操作剪貼板失敗，繼續使用DOM修改方式
        }
        
        // 延遲恢復
        setTimeout(resetProtection, 800);
      }
    }
  }
  
  // 處理內容區域中的所有文本元素
  function processContentElements(container) {
    // 使用更高效的選擇器，避免過度選擇
    const textElements = container.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote');
    
    // 過濾並處理元素
    Array.from(textElements)
      .filter(el => {
        return !el.dataset.protected && 
               !el.closest('nav, footer, .sidebar, .widget, .site-header, .site-footer, .comment-section, a') &&
               el.textContent.trim().length >= MIN_TEXT_LENGTH;
      })
      .forEach(processElement);
  }
  
  // 設置動態內容觀察
  function setupDynamicContentObserver(container) {
    // 使用優化的 MutationObserver 設置
    const observer = new MutationObserver(mutations => {
      if (!isPostPage()) return;
      
      let newElements = [];
      let protectionRemoved = false;
      
      mutations.forEach(mutation => {
        // 檢查是否有移除保護類別的嘗試
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            mutation.target.nodeType === 1 && 
            mutation.target === document.body &&
            !document.body.classList.contains('protection-active')) {
          protectionRemoved = true;
        }
        
        if (mutation.type === 'childList') {
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
                  if (el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a')) {
                    newElements.push(el);
                  }
                });
              }
            }
          });
        }
      });
      
      // 檢查是否嘗試移除保護類別
      if (protectionRemoved) {
        document.body.classList.add('protection-active');
      }
      
      // 批量處理新元素，提高效能
      if (newElements.length > 0) {
        // 使用requestAnimationFrame優化處理時機
        requestAnimationFrame(() => {
          newElements.forEach(processElement);
        });
      }
    });
    
    // 設定觀察選項 - 優化監聽範圍
    observer.observe(container, {
      childList: true,
      subtree: true
    });
    
    // 監視body的class變化，防止移除保護類別
    const bodyObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'attributes' && 
            mutation.attributeName === 'class' && 
            !document.body.classList.contains('protection-active')) {
          document.body.classList.add('protection-active');
        }
      });
    });
    
    bodyObserver.observe(document.body, {
      attributes: true,
      attributeFilter: ['class']
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
    
    // 創建保護容器和內容 - 使用文檔片段提高效能
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
    
    for (let i = 0; i < length; i++) {
      result += SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * charsLength));
    }
    
    return result;
  }
  
  // 增強複製保護 - 已加強對抗強制選擇工具
  function enhanceCopyProtection() {
    // 如果不是文章頁面，跳過
    if (!isPostPage()) return;
    
    // 獲取所有亂碼內容 - 使用更高效的變量管理
    const fakeContents = document.querySelectorAll('.fake-content');
    const realContents = document.querySelectorAll('.real-content');
    
    // 臨時隱藏真實內容並顯示亂碼
    const realLength = realContents.length;
    const fakeLength = fakeContents.length;
    
    // 批量修改樣式提高效能
    for (let i = 0; i < realLength; i++) {
      const real = realContents[i];
      real.style.visibility = 'hidden';
      real.classList.add('selected'); // 新增: 標記為選中狀態
    }
    
    for (let i = 0; i < fakeLength; i++) {
      const fake = fakeContents[i];
      fake.style.position = 'static';
      fake.style.display = 'inline';
      fake.style.opacity = '1';
      fake.style.height = 'auto';
      fake.style.color = 'rgba(0,0,0,0.9)';
      fake.style.zIndex = '9999';
      fake.classList.add('selected'); // 新增: 標記為選中狀態
    }
    
    // 新增: 防止JS重置選擇區域
    setTimeout(function() {
      // 檢查是否有選擇，如果被重置了就再次觸發保護
      const selection = window.getSelection();
      if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        if (isProtectedElement(range.commonAncestorContainer)) {
          // 選擇仍然存在並且在保護區域
          for (let i = 0; i < realLength; i++) {
            realContents[i].style.visibility = 'hidden';
          }
          
          for (let i = 0; i < fakeLength; i++) {
            fakeContents[i].style.opacity = '1';
          }
        }
      }
    }, 50);
  }
  
  // 重置保護 - 恢復正常顯示
  function resetProtection() {
    const fakeContents = document.querySelectorAll('.fake-content');
    const realContents = document.querySelectorAll('.real-content');
    
    const realLength = realContents.length;
    const fakeLength = fakeContents.length;
    
    // 批量恢復樣式
    for (let i = 0; i < realLength; i++) {
      const real = realContents[i];
      real.style.visibility = '';
      real.classList.remove('selected'); // 新增: 移除選中標記
    }
    
    for (let i = 0; i < fakeLength; i++) {
      const fake = fakeContents[i];
      fake.style.position = '';
      fake.style.display = '';
      fake.style.opacity = '';
      fake.style.height = '';
      fake.style.color = '';
      fake.style.zIndex = '';
      fake.classList.remove('selected'); // 新增: 移除選中標記
    }
  }
  
  // 新增: 監聽並阻止可能的DOM修改
  function protectAgainstDOMManipulation() {
    // 監視DOM操作，防止移除保護元素
    const observer = new MutationObserver(mutations => {
      let needReprotect = false;
      
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.removedNodes.length > 0) {
          // 檢查是否有保護元素被移除
          for (let i = 0; i < mutation.removedNodes.length; i++) {
            const node = mutation.removedNodes[i];
            if (node.nodeType === 1 && 
                (node.classList.contains('protection-container') || 
                 node.classList.contains('real-content') || 
                 node.classList.contains('fake-content'))) {
              needReprotect = true;
              break;
            }
          }
        }
      });
      
      if (needReprotect) {
        console.log("檢測到保護元素被移除，重新應用保護");
        applyProtection();
      }
    });
    
    // 觀察整個文檔
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }
  
  // 頁面載入完成後，再次檢查保護
  window.addEventListener('load', function() {
    // 頁面完全載入後，確保保護已應用
    if (isPostPage()) {
      if (isReadingModeActive()) {
        applyProtectionToReadingMode();
      } else {
        applyProtection();
      }
      
      // 新增: 應用DOM操作保護
      protectAgainstDOMManipulation();
      
      // 新增: 強化選擇保護
      setupSelectionProtection();
    }
  }, { passive: true }); // 使用passive提升效能
  
  // 立即執行一次初始檢查
  if (isPostPage()) {
    // 不依賴setTimeout
    requestAnimationFrame(function() {
      if (isReadingModeActive()) {
        applyProtectionToReadingMode();
      } else {
        applyProtection();
      }
    });
  }
})();
