// 文章頁面保護（遮罩和亂碼）- 徹底版
(function() {
  // 使用立即執行函數創建閉包，避免全域污染
  
  // =====================================
  // 核心配置區
  // =====================================
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做要能會可能好很真的太過於又還但因所以如果就算雖然因為可是只有一些都沒有多少許多幾乎差不多經常總是從來未曾已經正在將要即將快要台灣';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  const CONTENT_SELECTORS = '.gh-content, .post-content, .post-full-content, article, .reader-view-content, .reader-article-content, [data-ghost-reading-mode], .gh-article, [class*="reading-mode"]';
  const TEXT_SELECTORS = 'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, .post-text, .post-excerpt, div > span:not(.protection-container):not(.real-content):not(.fake-content)';
  const EXCLUDE_SELECTORS = 'nav, footer, .sidebar, .widget, .site-header, .site-footer, .comment-section, a, style, script, meta, link, .gh-post-upgrade-cta-content, .gh-btn';
  
  // 內部狀態追蹤
  const state = {
    protectionApplied: false,
    readingModeDetected: false,
    originalBodyOverflow: null,
    protectionActive: false
  };
  
  // =====================================
  // 立即執行區 - 在最早時機執行的關鍵操作
  // =====================================
  
  // 立即插入關鍵CSS，確保在載入過程中內容不可見
  injectInitialCSS();
  
  // 立即攔截頁面加載事件
  setupEarlyIntervention();
  
  // 如果用腳本閱讀模式API立即可用，則立即攔截
  if (window.ghost && window.ghost.reading) {
    interceptGhostReadingAPI();
  }
  
  // =====================================
  // CSS插入和初始化區
  // =====================================
  
  // 插入初始保護CSS - 關鍵：在頁面渲染前就進行基本保護
  function injectInitialCSS() {
    const initialCSS = `
      /* 初始保護層 - 立即隱藏所有未處理的內容 */
      .gh-article, [data-ghost-reading-mode] *, .reader-view *, .gh-article-reading-mode * {
        opacity: 0 !important;
        transition: opacity 0.2s ease-in !important;
      }
      
      /* 只顯示已處理的內容 */
      .protection-container, .real-content, .fake-content, .content-protection-overlay {
        opacity: 1 !important;
      }
    `;
    
    const styleEl = document.createElement('style');
    styleEl.id = 'ghost-content-initial-protection';
    styleEl.textContent = initialCSS;
    
    // 確保最先插入
    if (document.head) {
      document.head.insertBefore(styleEl, document.head.firstChild);
    } else {
      // 如果head還未創建，監聽DOM變化並在head可用時插入
      const observer = new MutationObserver(() => {
        if (document.head) {
          document.head.insertBefore(styleEl, document.head.firstChild);
          observer.disconnect();
        }
      });
      
      observer.observe(document.documentElement, { childList: true });
    }
  }
  
  // 插入完整保護CSS
  function injectCompleteCSS() {
    const completeCSS = `
      /* 還原初始保護層應用的隱藏效果 */
      .gh-article, [data-ghost-reading-mode] *, .reader-view *, .gh-article-reading-mode * {
        opacity: 1 !important;
        transition: none !important;
      }
      
      /* 文章內容保護樣式 */
      ${CONTENT_SELECTORS} {
        position: relative !important;
      }
      
      /* 內容區域保護遮罩 */
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
      ${CONTENT_SELECTORS} a {
        position: relative !important;
        z-index: 92 !important;
        pointer-events: auto !important;
      }

      /* 會員訂閱提示元素層級 */
      .gh-post-upgrade-cta {
        z-index: 95 !important;
      }
      
      /* 亂碼保護相關樣式 */
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
    
    const styleEl = document.createElement('style');
    styleEl.id = 'ghost-content-complete-protection';
    styleEl.textContent = completeCSS;
    document.head.appendChild(styleEl);
  }
  
  // =====================================
  // 早期干預區 - 在頁面載入過程中就開始監控
  // =====================================
  
  // 設置早期干預，儘早攔截所有可能的閱讀模式入口
  function setupEarlyIntervention() {
    // 特別處理：監視閱讀模式API的加載
    monitorGhostAPILoading();
    
    // 攔截頁面關鍵事件
    document.addEventListener('DOMContentLoaded', initProtection, { once: true });
    window.addEventListener('load', reinforceProtection, { once: true });
    
    // 1. 監聽閱讀模式按鈕點擊
    document.addEventListener('click', function(e) {
      if (isReadingModeButton(e.target)) {
        state.readingModeDetected = true;
        enforceProtection();
      }
    }, true);
    
    // 2. 監聽閱讀模式快捷鍵
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.altKey && e.key === 'r') || 
          (e.altKey && e.key === 'r') || 
          (e.ctrlKey && e.key === 'e')) {
        state.readingModeDetected = true;
        enforceProtection();
      }
    }, true);
    
    // 3. 使用MutationObserver監視DOM變化
    const earlyObserver = new MutationObserver(function(mutations) {
      // 檢查新增節點是否包含閱讀模式相關元素
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // 元素節點
              if (isReadingModeElement(node)) {
                state.readingModeDetected = true;
                enforceProtection();
                break;
              }
            }
          }
        }
        // 檢查屬性變化
        else if (mutation.type === 'attributes') {
          if (isReadingModeElement(mutation.target)) {
            state.readingModeDetected = true;
            enforceProtection();
          }
        }
      }
    });
    
    // 監視整個文檔
    earlyObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ghost-reading-mode', 'id']
    });
  }
  
  // 監視Ghost API的加載，以便於攔截閱讀模式API
  function monitorGhostAPILoading() {
    if (window.ghost && window.ghost.reading) {
      interceptGhostReadingAPI();
    } else {
      // 使用Object.defineProperty攔截ghost對象的創建或修改
      let ghostObj = window.ghost;
      Object.defineProperty(window, 'ghost', {
        configurable: true,
        enumerable: true,
        get: function() {
          return ghostObj;
        },
        set: function(newValue) {
          ghostObj = newValue;
          
          // 檢查是否有閱讀模式API並攔截
          if (ghostObj && ghostObj.reading) {
            interceptGhostReadingAPI();
          }
          
          return true;
        }
      });
    }
  }
  
  // 攔截Ghost閱讀模式API
  function interceptGhostReadingAPI() {
    try {
      if (window.ghost && window.ghost.reading) {
        // 保存原始函數
        const originalToggle = window.ghost.reading.toggle;
        const originalEnter = window.ghost.reading.enter;
        const originalExit = window.ghost.reading.exit;
        
        // 攔截toggle函數
        window.ghost.reading.toggle = function() {
          console.log("閱讀模式toggle被攔截");
          state.readingModeDetected = true;
          
          // 在進入閱讀模式前應用保護
          enforceProtection();
          
          // 調用原始函數
          const result = originalToggle.apply(this, arguments);
          
          // 確保保護已應用
          setTimeout(reinforceProtection, 50);
          
          return result;
        };
        
        // 攔截enter函數
        if (originalEnter) {
          window.ghost.reading.enter = function() {
            console.log("閱讀模式enter被攔截");
            state.readingModeDetected = true;
            
            // 在進入閱讀模式前應用保護
            enforceProtection();
            
            // 調用原始函數
            const result = originalEnter.apply(this, arguments);
            
            // 確保保護已應用
            setTimeout(reinforceProtection, 50);
            
            return result;
          };
        }
        
        // 監聽exit函數，以便於退出時重置狀態
        if (originalExit) {
          window.ghost.reading.exit = function() {
            console.log("閱讀模式exit被攔截");
            
            // 調用原始函數
            const result = originalExit.apply(this, arguments);
            
            // 重置狀態
            state.readingModeDetected = false;
            
            return result;
          };
        }
        
        console.log("Ghost閱讀模式API攔截成功");
      }
    } catch (e) {
      console.error("攔截Ghost閱讀模式API失敗:", e);
    }
  }
  
  // =====================================
  // 主要初始化與保護邏輯
  // =====================================
  
  // 初始化保護，在DOMContentLoaded時執行
  function initProtection() {
    console.log("初始化保護");
    
    // 注入完整CSS
    injectCompleteCSS();
    
    // 檢查是否為文章頁面
    if (isPostPage()) {
      // 應用保護
      applyProtection();
      
      // 設置持續監控
      setupContinuousMonitoring();
    }
  }
  
  // 加強保護，確保所有元素都已被保護
  function reinforceProtection() {
    console.log("加強保護");
    
    if (!isPostPage()) return;
    
    // 檢查是否已檢測到閱讀模式
    if (document.querySelector('.reader-view, [data-ghost-reading-mode], .gh-article-reading-mode') || state.readingModeDetected) {
      state.readingModeDetected = true;
      
      // 專門處理閱讀模式內容
      protectReadingModeContent();
    } else {
      // 普通文章頁面保護
      applyProtection();
    }
    
    // 清除初始保護樣式
    const initialProtection = document.getElementById('ghost-content-initial-protection');
    if (initialProtection) {
      initialProtection.textContent = `
        /* 還原初始保護層 */
        .gh-article, [data-ghost-reading-mode] *, .reader-view *, .gh-article-reading-mode * {
          opacity: 1 !important;
          transition: opacity 0.2s ease-in !important;
        }
      `;
    }
  }
  
  // 確保保護已應用 - 最激進的方法
  function enforceProtection() {
    if (state.protectionActive) return;
    
    console.log("強制應用保護");
    state.protectionActive = true;
    
    // 1. 立即隱藏所有可能的文本內容
    hideAllContent();
    
    // 2. 立即處理所有文本元素
    protectAllTextContent();
    
    // 3. 設置監控以處理動態添加的內容
    setupAggressiveMonitoring();
    
    // 4. 定期檢查，確保保護持續有效
    setInterval(checkProtectionIntegrity, 500);
  }
  
  // 設置持續監控
  function setupContinuousMonitoring() {
    // 監視DOM變化以處理動態添加的內容
    const contentObserver = new MutationObserver(function(mutations) {
      let shouldProtect = false;
      let readingModeDetected = false;
      
      // 檢查變化
      for (const mutation of mutations) {
        // 處理新添加的節點
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) { // 元素節點
              // 檢查是否為閱讀模式元素
              if (isReadingModeElement(node)) {
                readingModeDetected = true;
              }
              
              // 檢查是否包含需要保護的文本內容
              if (hasTextContent(node)) {
                shouldProtect = true;
              }
            }
          }
        }
        
        // 處理屬性變化
        if (mutation.type === 'attributes') {
          if (isReadingModeElement(mutation.target)) {
            readingModeDetected = true;
          }
        }
      }
      
      // 根據檢查結果應用保護
      if (readingModeDetected) {
        state.readingModeDetected = true;
        protectReadingModeContent();
      } else if (shouldProtect) {
        protectNewContent();
      }
    });
    
    // 設置監控
    contentObserver.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'data-ghost-reading-mode', 'id']
    });
    
    // 監聽複製事件
    document.addEventListener('copy', handleCopyEvent);
    
    // 監聽打印事件
    document.addEventListener('beforeprint', enhanceCopyProtection);
  }
  
  // 設置激進的監控
  function setupAggressiveMonitoring() {
    // 使用更高頻率的檢查
    const interval = setInterval(function() {
      if (state.readingModeDetected) {
        protectReadingModeContent();
      } else {
        protectNewContent();
      }
    }, 100);
    
    // 60秒後降低檢查頻率
    setTimeout(function() {
      clearInterval(interval);
      setInterval(function() {
        if (state.readingModeDetected) {
          protectReadingModeContent();
        } else {
          protectNewContent();
        }
      }, 500);
    }, 60000);
  }
  
  // 檢查保護完整性
  function checkProtectionIntegrity() {
    // 檢查是否有未保護的內容
    const unprotectedElements = findUnprotectedElements();
    
    if (unprotectedElements.length > 0) {
      console.log(`發現${unprotectedElements.length}個未保護元素，應用保護`);
      
      // 處理未保護元素
      unprotectedElements.forEach(processElement);
    }
  }
  
  // =====================================
  // 工具函數區
  // =====================================
  
  // 檢查元素是否為閱讀模式相關元素
  function isReadingModeElement(element) {
    if (!element || element.nodeType !== 1) return false;
    
    return element.classList && 
           (element.classList.contains('reader-view') || 
            element.classList.contains('gh-article-reading-mode') || 
            element.getAttribute('data-ghost-reading-mode') !== null || 
            element.classList.contains('gh-rm-container') || 
            (element.className && typeof element.className === 'string' && element.className.includes('reading-mode')));
  }
  
  // 檢查是否為閱讀模式按鈕
  function isReadingModeButton(element) {
    if (!element || element.nodeType !== 1) return false;
    
    // 檢查自身或父元素
    const targetEl = element.closest('[aria-label*="reading"], [title*="reading"], [class*="reading-mode"], [id*="reading-mode"]');
    
    return Boolean(targetEl) || 
           (element.textContent && /reading mode/i.test(element.textContent));
  }
  
  // 檢查元素是否包含需要保護的文本內容
  function hasTextContent(element) {
    if (!element || element.nodeType !== 1) return false;
    
    // 檢查是否為文本元素
    if (element.matches && element.matches(TEXT_SELECTORS) && 
        !element.closest(EXCLUDE_SELECTORS) && 
        element.textContent.trim().length >= MIN_TEXT_LENGTH) {
      return true;
    }
    
    // 檢查是否包含文本元素
    if (element.querySelector) {
      return Boolean(element.querySelector(TEXT_SELECTORS));
    }
    
    return false;
  }
  
  // 檢查當前頁面是否為文章頁面
  function isPostPage() {
    return document.body.classList.contains('post-template') || 
           document.body.classList.contains('reader-view') ||
           document.querySelector('[data-ghost-reading-mode]') !== null ||
           document.querySelector('.gh-article-reading-mode, .gh-rm-container, [class*="reading-mode"]') !== null ||
           /\/p\/|\/post\/|\/article\//.test(window.location.pathname);
  }
  
  // 查找未保護元素
  function findUnprotectedElements() {
    const allElements = document.querySelectorAll(TEXT_SELECTORS);
    
    return Array.from(allElements).filter(el => {
      return !el.dataset.protected && 
             !el.closest(EXCLUDE_SELECTORS) && 
             el.textContent.trim().length >= MIN_TEXT_LENGTH && 
             isElementVisible(el);
    });
  }
  
  // 檢查元素是否可見
  function isElementVisible(el) {
    if (!el.offsetParent && el.offsetHeight === 0 && el.offsetWidth === 0) return false;
    
    const style = window.getComputedStyle(el);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  }
  
  // 處理複製事件
  function handleCopyEvent() {
    if (!isPostPage()) return;
    
    // 激活亂碼保護
    enhanceCopyProtection();
    
    // 延遲重置
    setTimeout(resetProtection, 500);
  }
  
  // =====================================
  // 內容處理區
  // =====================================
  
  // 隱藏所有可能的內容
  function hideAllContent() {
    // 使用CSS選擇器隱藏所有可能的文本內容
    const style = document.createElement('style');
    style.id = 'temporary-content-blocker';
    style.textContent = `
      ${TEXT_SELECTORS} {
        opacity: 0 !important;
        transition: opacity 0.5s !important;
      }
      
      .protection-container {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    // 稍後移除這個臨時樣式
    setTimeout(function() {
      const blocker = document.getElementById('temporary-content-blocker');
      if (blocker) {
        blocker.textContent = `
          ${TEXT_SELECTORS} {
            opacity: 1 !important;
            transition: opacity 0.5s !important;
          }
        `;
        
        // 完全移除
        setTimeout(function() {
          if (blocker && blocker.parentNode) {
            blocker.parentNode.removeChild(blocker);
          }
        }, 500);
      }
    }, 1000);
  }
  
  // 保護所有文本內容
  function protectAllTextContent() {
    // 查找所有可能包含文本的容器
    const containers = document.querySelectorAll(CONTENT_SELECTORS);
    
    if (containers.length > 0) {
      containers.forEach(container => {
        // 處理容器內的所有文本元素
        const textElements = container.querySelectorAll(TEXT_SELECTORS);
        
        textElements.forEach(el => {
          if (!el.dataset.protected && 
              !el.closest(EXCLUDE_SELECTORS) && 
              el.textContent.trim().length >= MIN_TEXT_LENGTH) {
            processElement(el);
          }
        });
      });
    } else {
      // 找不到容器時，直接處理所有文本元素
      const allTextElements = document.querySelectorAll(TEXT_SELECTORS);
      
      allTextElements.forEach(el => {
        if (!el.dataset.protected && 
            !el.closest(EXCLUDE_SELECTORS) && 
            el.textContent.trim().length >= MIN_TEXT_LENGTH) {
          processElement(el);
        }
      });
    }
  }
  
  // 應用保護
  function applyProtection() {
    if (!isPostPage()) return;
    
    console.log("應用文章保護");
    
    // 添加遮罩
    setupOverlay();
    
    // 保護所有文本內容
    protectAllTextContent();
    
    // 標記保護已應用
    state.protectionApplied = true;
  }
  
  // 專門處理閱讀模式內容
  function protectReadingModeContent() {
    console.log("保護閱讀模式內容");
    
    // 尋找閱讀模式容器
    const readingModeContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode], .gh-article-reading-mode, ' +
      '.gh-rm-container, [class*="reading-mode"]'
    );
    
    if (readingModeContainers.length > 0) {
      console.log(`找到 ${readingModeContainers.length} 個閱讀模式容器`);
      
      // 為每個閱讀模式容器添加保護
      readingModeContainers.forEach(container => {
        // 添加遮罩
        if (!container.querySelector('.content-protection-overlay')) {
          const overlay = document.createElement('div');
          overlay.className = 'content-protection-overlay';
          
          if (container.firstChild) {
            container.insertBefore(overlay, container.firstChild);
          } else {
            container.appendChild(overlay);
          }
        }
        
        // 處理容器內的所有文本元素
        const textElements = container.querySelectorAll(TEXT_SELECTORS);
        
        textElements.forEach(el => {
          if (!el.dataset.protected && 
              !el.closest(EXCLUDE_SELECTORS) && 
              el.textContent.trim().length >= MIN_TEXT_LENGTH) {
            processElement(el);
          }
        });
      });
    } else {
      // 找不到特定容器時，嘗試處理所有文本元素
      protectAllTextContent();
    }
  }
  
  // 設置遮罩層
  function setupOverlay() {
    // 查找所有可能的內容區域
    const contentAreas = document.querySelectorAll(CONTENT_SELECTORS);
    
    contentAreas.forEach(area => {
      // 檢查是否已有遮罩層
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
  
  // 保護新內容
  function protectNewContent() {
    // 查找未保護的元素
    const unprotectedElements = findUnprotectedElements();
    
    if (unprotectedElements.length > 0) {
      unprotectedElements.forEach(processElement);
    }
  }
  
  // 處理單個元素
  function processElement(element) {
    // 已處理元素跳過
    if (element.dataset.protected === 'true') return;
    
    // 標記為已處理
    element.dataset.protected = 'true';
    
    const textContent = element.textContent.trim();
    if (textContent.length < MIN_TEXT_LENGTH) return;
    
    try {
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
    } catch (e) {
      console.error("處理元素時出錯:", e);
      element.dataset.protected = 'false'; // 標記為未處理，以便下次重試
    }
  }
  
  // 生成亂碼文本
  function generateScrambledText(length) {
    if (length <= 0) return '';
    
    let result = '';
    const charsLength = SCRAMBLE_CHARS.length;
    
    for (let i = 0; i < length; i++) {
      result += SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * charsLength));
    }
    
    return result;
  }
  
  // 增強複製保護
  function enhanceCopyProtection() {
    // 如果不是文章頁面，跳過
    if (!isPostPage()) return;
    
    // 獲取所有亂碼內容
    const fakeContents = document.querySelectorAll('.fake-content');
    const realContents = document.querySelectorAll('.real-content');
    
    // 臨時隱藏真實內容並顯示亂碼
    const realLength = realContents.length;
    const fakeLength = fakeContents.length;
    
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
  
  // 重置保護
  function resetProtection() {
    const fakeContents = document.querySelectorAll('.fake-content');
    const realContents = document.querySelectorAll('.real-content');
    
    const realLength = realContents.length;
    const fakeLength = fakeContents.length;
    
    for (let i = 0; i < realLength; i++) {
      realContents[i].style.visibility = '';
    }
    
    for (let i = 0; i < fakeLength; i++) {
      const fake = fakeContents[i];
      fake.style.position = '';
      fake.style.display = '';
      fake.style.opacity = '';
      fake.style.height = '';
      fake.style.color = '';
      fake.style.zIndex = '';
    }
  }
})();
