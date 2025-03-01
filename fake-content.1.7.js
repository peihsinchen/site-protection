// 文章頁面保護（僅亂碼）- 高效能優化版
(function() {
  // 使用閉包變量而非全域變數，避免污染全域命名空間
  const protectionState = {
    readingModeActive: false,
    protectionApplied: false,
    intervalId: null,
    isSelecting: false,
    lastSelectionTime: 0,
    processingInProgress: false,
    lastScrollTime: 0,
    scrollDebounceTimer: null
  };
  
  // 自動插入CSS - 效能優化
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
  
  /* "Read more" 區塊特殊處理 */
  .read-more, 
  .readmore, 
  [id*="read-more"], 
  [class*="read-more"],
  [id*="readmore"],
  [class*="readmore"],
  [data-read-more="true"] {
    position: relative;
    z-index: 2;
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
  
  // 中文常用文字作為亂碼 - 調整為更短，減少內存使用
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做能會可好很真';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  
  // Read more 相關選擇器 - 用於排除保護
  const READ_MORE_SELECTORS = [
    '.read-more', 
    '.readmore', 
    '[id*="read-more"]', 
    '[class*="read-more"]',
    '[id*="readmore"]',
    '[class*="readmore"]',
    '[data-read-more="true"]',
    'a[href*="#more"]',
    '.more-link'
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
  
  // 檢查元素是否在可視區域內 - 用於懶加載優化
  function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
      rect.top <= (window.innerHeight || document.documentElement.clientHeight) + 300 && // 增加300px的預加載
      rect.bottom >= -300 && // 上方預留300px
      rect.left <= (window.innerWidth || document.documentElement.clientWidth) + 100 &&
      rect.right >= -100
    );
  }
  
  // 在DOM開始載入就預先攔截閱讀模式
  function setupEarlyReadingModeDetection() {
    // 監聽閱讀模式快捷鍵
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey && e.altKey && e.key === 'r') || 
          (e.altKey && e.key === 'r') || 
          (e.ctrlKey && e.key === 'e')) {
        protectionState.readingModeActive = true;
        setTimeout(applyProtectionToReadingMode, 300);
      }
    }, { capture: true, passive: true });
    
    // 監聽閱讀模式按鈕
    document.addEventListener('click', function(e) {
      const target = e.target;
      const isReadingModeButton = 
        target.closest('[aria-label*="reading"], [title*="reading"], [class*="reading-mode"], [id*="reading-mode"]') ||
        (target.textContent && /reading mode/i.test(target.textContent));
      
      if (isReadingModeButton) {
        protectionState.readingModeActive = true;
        setTimeout(applyProtectionToReadingMode, 300);
      }
    }, { passive: true });
  }
  
  // 初始化主要保護功能
  function initializeProtection() {
    if (!isPostPage()) return;
    
    console.log("文章保護初始化");
    
    // 設置閱讀模式檢測
    setupEarlyReadingModeDetection();
    
    // 延遲應用保護以改善頁面載入速度和手機瀏覽體驗
    setTimeout(function() {
      // 應用保護到可視區域內的元素 - 懶加載優化
      applyProtectionToVisibleContent();
      
      // 設置複製保護
      setupCopyProtection();
      
      // 設置高效的滾動檢測 - 針對手機優化
      setupOptimizedScrollHandler();
      
      // 設置簡化版的內容變化監聽 - 減少資源佔用
      setupLightweightContentObserver();
    }, 300); // 延遲300ms，讓頁面有時間渲染核心內容
  }
  
  // 設置簡化版的內容變化監聽
  function setupLightweightContentObserver() {
    // 只監聽主要內容區域的變化
    const contentAreas = document.querySelectorAll('.gh-content, .post-content, .post-full-content');
    
    if (contentAreas.length > 0) {
      const observer = new MutationObserver(function(mutations) {
        if (protectionState.processingInProgress) return;
        
        let hasNewContent = false;
        for (let i = 0; i < mutations.length; i++) {
          if (mutations[i].type === 'childList' && mutations[i].addedNodes.length > 0) {
            hasNewContent = true;
            break;
          }
        }
        
        if (hasNewContent) {
          // 只在有新增內容時處理
          applyProtectionToVisibleContent();
        }
      });
      
      // 使用更輕量級的配置
      contentAreas.forEach(function(area) {
        observer.observe(area, {
          childList: true,
          subtree: true,
          attributes: false,
          characterData: false
        });
      });
    }
  }
  
  // 優化的滾動處理
  function setupOptimizedScrollHandler() {
    // 使用防抖動技術減少滾動處理頻率，對手機瀏覽特別重要
    window.addEventListener('scroll', function() {
      const now = Date.now();
      
      // 不要在300ms內重複處理滾動
      if (now - protectionState.lastScrollTime < 300) {
        // 如果已有計時器，清除它
        if (protectionState.scrollDebounceTimer) {
          clearTimeout(protectionState.scrollDebounceTimer);
        }
        
        // 設置新的防抖動計時器
        protectionState.scrollDebounceTimer = setTimeout(function() {
          if (!protectionState.processingInProgress) {
            applyProtectionToVisibleContent();
          }
          protectionState.lastScrollTime = Date.now();
        }, 200); // 200ms防抖動
        
        return;
      }
      
      // 直接處理這次滾動
      if (!protectionState.processingInProgress) {
        requestAnimationFrame(function() {
          applyProtectionToVisibleContent();
        });
      }
      
      protectionState.lastScrollTime = now;
    }, { passive: true });
    
    // 專門針對手機優化的觸摸結束事件
    document.addEventListener('touchend', function() {
      // 觸摸結束時檢查可視內容
      if (!protectionState.processingInProgress) {
        setTimeout(function() {
          applyProtectionToVisibleContent();
        }, 100);
      }
    }, { passive: true });
  }
  
  // 設置複製保護
  function setupCopyProtection() {
    // 處理複製事件 - 重要核心功能
    document.addEventListener('copy', function(e) {
      if (!isPostPage()) return;
      
      const selection = window.getSelection();
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) return;
      
      // 獲取所有亂碼內容和真實內容
      const fakeContents = document.querySelectorAll('.fake-content');
      const realContents = document.querySelectorAll('.real-content');
      
      // 臨時顯示亂碼內容
      for (let i = 0; i < realContents.length; i++) {
        realContents[i].style.visibility = 'hidden';
      }
      
      for (let i = 0; i < fakeContents.length; i++) {
        const fake = fakeContents[i];
        fake.style.position = 'static';
        fake.style.display = 'inline';
        fake.style.opacity = '1';
        fake.style.height = 'auto';
        fake.style.color = 'rgba(0,0,0,0.9)';
        fake.style.zIndex = '9999';
      }
      
      // 獲取選中文本並生成相應長度的亂碼
      const selectedText = selection.toString();
      if (selectedText.length > 0) {
        const scrambledText = generateScrambledText(selectedText.length);
        
        // 將亂碼寫入剪貼板
        e.clipboardData.setData('text/plain', scrambledText);
        e.preventDefault();
      }
      
      // 延遲恢復正常顯示
      setTimeout(function() {
        for (let i = 0; i < realContents.length; i++) {
          realContents[i].style.visibility = '';
        }
        
        for (let i = 0; i < fakeContents.length; i++) {
          const fake = fakeContents[i];
          fake.style.position = '';
          fake.style.display = '';
          fake.style.opacity = '';
          fake.style.height = '';
          fake.style.color = '';
          fake.style.zIndex = '';
        }
      }, 200);
    }, { capture: true });
    
    // 處理打印事件
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
    
    // 監聽Ctrl+A全選
    document.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'a' && isPostPage()) {
        // 在全選後準備亂碼
        setTimeout(function() {
          const fakeContents = document.querySelectorAll('.fake-content');
          const realContents = document.querySelectorAll('.real-content');
          
          for (let i = 0; i < realContents.length; i++) {
            realContents[i].style.visibility = 'hidden';
          }
          
          for (let i = 0; i < fakeContents.length; i++) {
            const fake = fakeContents[i];
            fake.style.position = 'static';
            fake.style.display = 'inline';
            fake.style.opacity = '1';
            fake.style.height = 'auto';
            fake.style.color = 'rgba(0,0,0,0.9)';
            fake.style.zIndex = '9999';
          }
          
          // 1秒後恢復正常顯示
          setTimeout(function() {
            for (let i = 0; i < realContents.length; i++) {
              realContents[i].style.visibility = '';
            }
            
            for (let i = 0; i < fakeContents.length; i++) {
              const fake = fakeContents[i];
              fake.style.position = '';
              fake.style.display = '';
              fake.style.opacity = '';
              fake.style.height = '';
              fake.style.color = '';
              fake.style.zIndex = '';
            }
          }, 1000);
        }, 10);
      }
    }, { passive: true });
  }
  
  // 應用保護到可視區域內的內容 - 懶加載優化
  function applyProtectionToVisibleContent() {
    if (!isPostPage() || protectionState.processingInProgress) return;
    
    protectionState.processingInProgress = true;
    
    try {
      // 主要處理文章內容區域
      const contentAreas = document.querySelectorAll('.gh-content, .post-content, .post-full-content');
      
      if (contentAreas.length > 0) {
        contentAreas.forEach(function(container) {
          // 只處理可視區域內的文本元素
          processVisibleElements(container);
        });
      } else if (isReadingModeActive()) {
        // 閱讀模式處理
        const readingContainers = document.querySelectorAll(
          '.reader-view-content, .reader-article-content, ' + 
          '[data-ghost-reading-mode] .gh-article, .gh-article-reading-mode'
        );
        
        if (readingContainers.length > 0) {
          readingContainers.forEach(function(container) {
            processVisibleElements(container);
          });
        }
      }
    } finally {
      // 確保處理標記被重置
      protectionState.processingInProgress = false;
    }
  }
  
  // 閱讀模式保護
  function applyProtectionToReadingMode() {
    if (!isReadingModeActive()) return;
    
    // 尋找閱讀模式容器
    const readingContainers = document.querySelectorAll(
      '.reader-view-content, .reader-article-content, ' + 
      '[data-ghost-reading-mode] .gh-article, .gh-article-reading-mode'
    );
    
    if (readingContainers.length > 0) {
      readingContainers.forEach(function(container) {
        processVisibleElements(container);
      });
    } else {
      // 後備方案
      const article = document.querySelector('article, main');
      if (article) processVisibleElements(article);
    }
  }
  
  // 只處理可視區域內的元素 - 減少不必要的處理
  function processVisibleElements(container) {
    // 找出所有未處理的文本元素
    const textElements = container.querySelectorAll('p:not([data-protected]), h1:not([data-protected]), h2:not([data-protected]), h3:not([data-protected]), h4:not([data-protected]), h5:not([data-protected]), h6:not([data-protected]), blockquote:not([data-protected])');
    
    // 篩選出需要處理的元素
    const elementsToProcess = Array.from(textElements).filter(el => {
      // 排除"Read more"相關元素
      if (el.matches(READ_MORE_SELECTORS) || el.closest(READ_MORE_SELECTORS)) {
        // 標記為"Read more"以便其他腳本偵測
        el.setAttribute('data-read-more', 'true');
        return false;
      }
      
      // 排除頁眉頁腳和導航等
      if (el.closest('nav, footer, header, .sidebar, .widget, .site-header, .site-footer')) {
        return false;
      }
      
      // 排除太短的文本
      if (el.textContent.trim().length < MIN_TEXT_LENGTH) {
        return false;
      }
      
      // 只處理可視區域內的元素 - 懶加載優化
      return isInViewport(el);
    });
    
    // 分批處理元素，避免阻塞主線程
    if (elementsToProcess.length > 0) {
      // 如果元素太多，分批處理
      if (elementsToProcess.length > 20) {
        // 處理前20個
        processElementsBatch(elementsToProcess.slice(0, 20));
        
        // 延遲處理剩餘元素
        setTimeout(function() {
          if (!protectionState.processingInProgress) {
            processElementsBatch(elementsToProcess.slice(20));
          }
        }, 50);
      } else {
        // 元素數量合理，一次處理
        processElementsBatch(elementsToProcess);
      }
    }
  }
  
  // 批量處理元素 - 避免長時間占用主線程
  function processElementsBatch(elements) {
    if (!elements.length) return;
    
    // 使用requestAnimationFrame確保不阻塞UI
    requestAnimationFrame(function() {
      const batchSize = 10; // 每批處理10個元素
      const processBatch = function(startIndex) {
        const endIndex = Math.min(startIndex + batchSize, elements.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          processElement(elements[i]);
        }
        
        // 如果還有元素未處理，安排下一批
        if (endIndex < elements.length) {
          setTimeout(function() {
            processBatch(endIndex);
          }, 10); // 短暫延遲，讓主線程有機會執行其他任務
        }
      };
      
      // 開始處理第一批
      processBatch(0);
    });
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
      // 創建保護容器
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
      
      // 清空原元素並插入保護容器
      element.innerHTML = '';
      element.appendChild(container);
    } catch (error) {
      console.error('處理元素時發生錯誤:', error);
      // 發生錯誤時恢復元素
      element.dataset.protected = 'false';
    }
  }
  
  // 高效率生成亂碼文本
  function generateScrambledText(length) {
    if (length <= 0) return '';
    
    // 對非常長的文本進行優化
    if (length > 200) {
      // 創建一個較短的亂碼，然後重複使用
      const baseLength = Math.min(50, length / 4);
      const baseScramble = generateScrambledText(baseLength);
      const repeats = Math.floor(length / baseLength);
      const remainder = length % baseLength;
      
      let result = '';
      for (let i = 0; i < repeats; i++) {
        result += baseScramble;
      }
      
      if (remainder > 0) {
        result += baseScramble.substring(0, remainder);
      }
      
      return result;
    }
    
    // 標準亂碼生成 - 高效版
    let result = '';
    const charsLength = SCRAMBLE_CHARS.length;
    
    for (let i = 0; i < length; i++) {
      result += SCRAMBLE_CHARS.charAt((Math.random() * charsLength) | 0);
    }
    
    return result;
  }
  
  // 初始化
  try {
    setupEarlyReadingModeDetection();
  } catch (e) {
    console.error('預先攔截閱讀模式失敗:', e);
  }
  
  // 延遲初始化主保護功能，讓頁面有時間加載
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(initializeProtection, 300);
    });
  } else {
    setTimeout(initializeProtection, 300);
  }
  
  // 頁面完全載入後再次檢查
  window.addEventListener('load', function() {
    if (isPostPage()) {
      // 延遲執行以避免干擾頁面載入
      setTimeout(function() {
        applyProtectionToVisibleContent();
      }, 500);
    }
  }, { passive: true });
})();
