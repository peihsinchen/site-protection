/**
 * 文章內容亂碼保護
 * 專門處理文章內容的亂碼生成與替換功能
 */
(function() {
  // 中文常用文字作為亂碼
  const SCRAMBLE_CHARS = '我你他她它們的地得和是不在有個人這那些為什麼誰來去做要能會可能好很真的太過於又還但因所以如果就算雖然因為可是只有一些都沒有多少許多幾乎差不多經常總是從來未曾已經正在將要即將快要台灣';
  const MIN_TEXT_LENGTH = 5; // 最小處理文本長度
  
  // 在DOM加載後初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 添加亂碼保護
    setupScrambleProtection();
    
    // 導出防護增強函數到全局作用域，供全站防護使用
    window.enhanceCopyProtection = enhanceCopyProtection;
  });
  
  // 設置亂碼保護
  function setupScrambleProtection() {
    // 延遲執行，確保頁面完全載入
    setTimeout(function() {
      // 獲取文章內容容器
      const contentContainers = document.querySelectorAll('.post-content, .gh-content, article.post, .post-full-content, .post-content-body');
      
      if (contentContainers.length > 0) {
        contentContainers.forEach(function(container) {
          // 處理文章內容元素
          processContentElements(container);
          
          // 添加動態內容觀察器
          observeDynamicContent(container);
        });
      }
    }, 500);
    
    // 處理印刷、保存和頁面離開事件
    window.addEventListener('beforeprint', enhanceCopyProtection);
    window.addEventListener('beforeunload', enhanceCopyProtection);
  }
  
  // 處理內容區域中的所有文本元素
  function processContentElements(container) {
    // 選擇文章內容元素
    const textElements = container.querySelectorAll(
      'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, .post-text, .post-excerpt, ' + 
      'span:not(.protection-container):not(.real-content):not(.fake-content):not(.meta):not(.author):not(.date)'
    );
    
    // 排除導航、頁腳和連結元素
    const toProcess = Array.from(textElements).filter(function(el) {
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
    return Array.from({length}, function() {
      return SCRAMBLE_CHARS.charAt(Math.floor(Math.random() * SCRAMBLE_CHARS.length));
    }).join('');
  }
  
  // 增強複製保護 - 使亂碼在被擷取工具抓取時變得可見
  function enhanceCopyProtection() {
    // 獲取所有亂碼內容和實際內容
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
    setTimeout(function() {
      for (let i = 0; i < realContents.length; i++) {
        realContents[i].style.visibility = '';
      }
      
      for (let i = 0; i < fakeContents.length; i++) {
        fakeContents[i].style.position = '';
        fakeContents[i].style.opacity = '';
        fakeContents[i].style.height = '';
        fakeContents[i].style.color = '';
        fakeContents[i].style.zIndex = '';
      }
    }, 500);
  }
  
  // 觀察動態添加的內容
  function observeDynamicContent(container) {
    // 使用 MutationObserver 監視 DOM 變化
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            // 只處理元素節點
            if (node.nodeType === 1) {
              if (node.textContent.trim().length >= MIN_TEXT_LENGTH && !node.closest('a')) {
                processElement(node);
              }
              
              // 處理新添加元素的子元素
              const childElements = node.querySelectorAll(
                'p, h1, h2, h3, h4, h5, h6, li, blockquote, td, .post-text, .post-excerpt, ' + 
                'span:not(.protection-container):not(.real-content):not(.fake-content):not(.meta):not(.author):not(.date)'
              );
              Array.from(childElements)
                .filter(function(el) { 
                  return el.textContent.trim().length >= MIN_TEXT_LENGTH && !el.closest('a');
                })
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
})();