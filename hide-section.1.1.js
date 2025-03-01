/**
 * 隱藏 Ghost Blog 中特定區塊的腳本
 * 此腳本會隱藏 "Latest" 和 "Read more" 區塊，以及訂閱電子報區塊
 */

// 等待 DOM 完全加載
document.addEventListener('DOMContentLoaded', function() {
  // 隱藏 "Latest" 區塊
  hideContainerByTitle('section.gh-container.is-list', 'Latest');
  
  // 隱藏 "Read more" 區塊
  hideContainerByTitle('section.gh-container.is-grid', 'Read more');
  
  // 隱藏訂閱電子報區塊
  removeElements('section.gh-cta.gh-outer');
});

/**
 * 根據標題文字隱藏指定的容器元素
 * @param {string} containerSelector - 容器的 CSS 選擇器
 * @param {string} titleText - 要匹配的標題文字
 */
function hideContainerByTitle(containerSelector, titleText) {
  const sections = document.querySelectorAll(containerSelector);
  sections.forEach(function(section) {
    const titleElement = section.querySelector('.gh-container-title');
    if (titleElement && titleElement.textContent.trim() === titleText) {
      section.style.display = 'none';
    }
  });
}

/**
 * 移除符合選擇器的所有元素
 * @param {string} selector - 要移除元素的 CSS 選擇器
 */
function removeElements(selector) {
  const elements = document.querySelectorAll(selector);
  if (elements.length > 0) {
    elements.forEach(element => {
      element.parentNode.removeChild(element);
    });
  }
}
