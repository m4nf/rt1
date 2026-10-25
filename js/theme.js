/* ==========================================
   Weekly Reports System
   Theme Switcher + Refresh Button
========================================== */
(function(){
    const STORAGE_KEY = "weeklyReportsTheme";

    function getSavedTheme(){
        const saved = localStorage.getItem(STORAGE_KEY);
        if(saved === "dark" || saved === "light") return saved;
        return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }

    function applyTheme(theme){
        document.body.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;

        const btn = document.getElementById("themeBtn");
        if(!btn) return;

        const icon = btn.querySelector("i");
        if(icon) icon.className = theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon";
        btn.setAttribute("aria-label", theme === "dark" ? "تفعيل الوضع الفاتح" : "تفعيل الوضع الداكن");
        btn.setAttribute("title", theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن");
    }

    function setupRefreshButton(){
        const btn = document.getElementById("homeBtn");
        if(!btn) return;
        const icon = btn.querySelector("i");
        if(icon) icon.className = "fa-solid fa-rotate";
        btn.setAttribute("aria-label", "تحديث البيانات");
        btn.setAttribute("title", "تحديث البيانات");
    }

    const initialTheme = getSavedTheme();
    applyTheme(initialTheme);
    setupRefreshButton();

    document.addEventListener("click", function(event){
        const themeBtn = event.target.closest("#themeBtn");
        if(themeBtn){
            const nextTheme = document.body.classList.contains("dark") ? "light" : "dark";
            localStorage.setItem(STORAGE_KEY, nextTheme);
            applyTheme(nextTheme);
            return;
        }

        const refreshBtn = event.target.closest("#homeBtn");
        if(!refreshBtn) return;
        if(refreshBtn.dataset.refreshing === "1") return;

        const icon = refreshBtn.querySelector("i");
        refreshBtn.dataset.refreshing = "1";
        refreshBtn.disabled = true;
        refreshBtn.classList.add("is-refreshing");
        refreshBtn.setAttribute("aria-label", "جاري التحديث");
        refreshBtn.setAttribute("title", "جاري التحديث");
        if(icon) icon.className = "fa-solid fa-rotate fa-spin";

        const activeCard = document.querySelector(".menu-card.active");
        const page = activeCard?.dataset.page || "dashboard";

        if(typeof loadPage === "function") loadPage(page);

        setTimeout(()=>{
            refreshBtn.dataset.refreshing = "0";
            refreshBtn.disabled = false;
            refreshBtn.classList.remove("is-refreshing");
            if(icon) icon.className = "fa-solid fa-rotate";
            refreshBtn.setAttribute("aria-label", "تحديث البيانات");
            refreshBtn.setAttribute("title", "تحديث البيانات");
        }, 900);
    });

    window.addEventListener("storage", function(event){
        if(event.key === STORAGE_KEY && (event.newValue === "dark" || event.newValue === "light")){
            applyTheme(event.newValue);
        }
    });
})();
