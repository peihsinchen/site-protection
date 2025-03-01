// 文章頁面保護（僅亂碼，無遮罩）- 優化版
(function() {
  // 使用閉包變量而非全域變數，避免污染全域命名空間
  const protectionState = {
    readingModeActive: false,
    protectionApplied: false,
    intervalId: null
  };
  
  // 簡化CSS - 只保留印刷保護所需樣式
  const postProtectionCSS = `
  /* 亂碼保護相關樣式 */
  .protection-container {
    position: relative;
    display: inline;
    width: auto;
  }
  
  .real-content {
    position: relative;
  }
  
  .fake-content {
    position: absolute;
    display: none;
    opacity: 0;
    height: 0;
    overflow: hidden;
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
    

    
    // 立即套用保護
    applyProtection();
    
    // 設置監聽器以處理動態加載的閱讀模式
    setupReadingModeObserver();
    
    // 監聽閱讀模式按鈕點擊
    setupReadingModeButtonListener();
    
    // 設置定期檢查機制 - 使用效能優化的方法
    setupEfficientPeriodicCheck();
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

          applyProtectionToReadingMode();
          lastCheckTime = now;
        }
        
        // 檢查一般文章內容
        if (!document.querySelector('.gh-content .protection-container, .post-content .protection-container') && 
            (document.querySelector('.gh-content, .post-content'))) {

          applyProtection();
          lastCheckTime = now;
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
    

    
    // 添加亂碼保護
    setupTextScrambling();
    
    // 標記保護已應用
    protectionState.protectionApplied = true;
  }
  
  // 專門針對閱讀模式應用保護 - 移除遮罩相關代碼
  function applyProtectionToReadingMode() {
    // 確保是在閱讀模式下
    if (!isReadingModeActive()) return;
    

    
    // 尋找閱讀模式容器 - 使用更精確的選擇器
    const readingModeContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode], .gh-article-reading-mode, ' +
      '.gh-rm-container, [class*="reading-mode"]'
    );
    
    if (readingModeContainers.length > 0) {

      
      // 為每個閱讀模式容器添加保護
      readingModeContainers.forEach(processReadingModeContainer);
      
      // 標記保護已應用
      protectionState.protectionApplied = true;
    } else {

      
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
    document.addEventListener('copy', handleCopyEvent);
    document.addEventListener('beforeprint', enhanceCopyProtection, { passive: true });
  }
  
  // 處理複製事件 - 直接替換剪貼簿內容為亂碼
  function handleCopyEvent(e) {
    if (!isPostPage()) return;
    
    // 阻止默認複製行為
    e.preventDefault();
    
    // 獲取被選中的文字
    const selectedText = window.getSelection().toString();
    
    if (selectedText && selectedText.length > 0) {
      // 生成等長度的亂碼文字
      const scrambledText = generateScrambledText(selectedText.length);
      
      // 將亂碼文字放入剪貼簿
      e.clipboardData.setData('text/plain', scrambledText);
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
      
      mutations.forEach(mutation => {
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
  }
  
  // 檢查是否為文本元素
  function isTextElement(node) {
    const tagName = node.tagName && node.tagName.toLowerCase();
    return tagName === 'p' || tagName === 'h1' || tagName === 'h2' || 
           tagName === 'h3' || tagName === 'h4' || tagName === 'h5' || 
           tagName === 'h6' || tagName === 'blockquote';
  }
  
  // 處理單個元素 (簡化版本，只保留真實內容和必要的容器)
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
    
    // 創建原始內容元素
    const realContent = document.createElement('span');
    realContent.className = 'real-content';
    realContent.innerHTML = element.innerHTML;
    
    // 只在打印模式下需要的亂碼元素
    const fakePrint = document.createElement('span');
    fakePrint.className = 'fake-content';
    fakePrint.textContent = generateScrambledText(textContent.length);
    
    // 組裝元素
    container.appendChild(realContent);
    container.appendChild(fakePrint);
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
  
  // 增強印刷保護 - 與複製保護分離
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
      realContents[i].style.visibility = 'hidden';
    }
    
    for (let i = 0; i < fakeLength; i++) {
      const fake = fakeContents[i];
      fake.style.position = 'static';
      fake.style.display = 'inline';
      fake.style.opacity = '1';
      fake.style.height = 'auto';
      fake.style.color = 'rgba(0,0,0,0.9)';
      fake.style.zIndex = '9999';
    }
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
