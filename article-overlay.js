/**
 * 文章內容遮罩保護
 * 專門處理文章內容的遮罩層功能
 */
(function() {
  // 在DOM加載後初始化
  document.addEventListener('DOMContentLoaded', function() {
    // 添加遮罩保護
    setupOverlayProtection();
  });
  
  // 設置遮罩保護
  function setupOverlayProtection() {
    // 文章內容區域選擇器
    const contentAreas = document.querySelectorAll('.gh-content, .post-content, .post-full-content, .kg-card, .kg-canvas, .kg-prose');
    
    contentAreas.forEach(function(area) {
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
    
    // 觀察動態添加的內容區域，為新添加的內容區域添加遮罩
    observeContentAreas(document.body);
  }
  
  // 觀察可能動態添加的內容區域
  function observeContentAreas(container) {
    // 使用 MutationObserver 監視 DOM 變化
    const observer = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function(node) {
            // 只處理元素節點
            if (node.nodeType === 1) {
              // 檢查是否是內容區域
              if (
                node.classList && (
                  node.classList.contains('gh-content') || 
                  node.classList.contains('post-content') || 
                  node.classList.contains('post-full-content') || 
                  node.classList.contains('kg-card') || 
                  node.classList.contains('kg-canvas') || 
                  node.classList.contains('kg-prose')
                )
              ) {
                // 為該元素添加遮罩
                if (!node.querySelector('.content-protection-overlay')) {
                  const overlay = document.createElement('div');
                  overlay.className = 'content-protection-overlay';
                  
                  if (node.firstChild) {
                    node.insertBefore(overlay, node.firstChild);
                  } else {
                    node.appendChild(overlay);
                  }
                }
              }
              
              // 檢查子元素中是否有內容區域
              const childContentAreas = node.querySelectorAll('.gh-content, .post-content, .post-full-content, .kg-card, .kg-canvas, .kg-prose');
              childContentAreas.forEach(function(area) {
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