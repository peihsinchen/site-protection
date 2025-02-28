// 禁止選取文字、複製、拖曳和右鍵功能的JavaScript代碼
(function() {
    // 禁止文字選取
    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.body.style.msUserSelect = 'none';
    document.body.style.mozUserSelect = 'none';
    
    // 禁止複製功能
    document.addEventListener('copy', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁止剪切功能
    document.addEventListener('cut', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁止拖曳
    document.addEventListener('dragstart', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁止右鍵菜單
    document.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        return false;
    });
    
    // 禁止觸摸長按選單（移動設備）
    document.addEventListener('touchstart', function(e) {
        // 防止長按選單
        e.target.style.webkitTouchCallout = 'none';
    }, { passive: false });
    
    // 阻止F12開發者工具（可選）
    document.addEventListener('keydown', function(e) {
        // F12鍵
        if (e.keyCode === 123) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+I
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+C
        if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+Shift+J
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            return false;
        }
        
        // Ctrl+U (查看源代碼)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            return false;
        }
    });
    
    console.log('內容保護已啟用');
})();
