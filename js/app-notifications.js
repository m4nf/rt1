/* ==========================================
   Weekly Reports System
   In-App Notifications / Dialogs
========================================== */
(function(){
    const nativeAlert = window.alert.bind(window);

    function ensureLayer(){
        let layer=document.getElementById("appNotificationLayer");
        if(layer) return layer;
        layer=document.createElement("div");
        layer.id="appNotificationLayer";
        layer.className="app-notification-layer";
        layer.setAttribute("aria-live","assertive");
        layer.setAttribute("aria-atomic","true");
        layer.innerHTML=`
            <div class="app-notification" role="dialog" aria-modal="true" aria-labelledby="appNotificationTitle" aria-describedby="appNotificationMessage">
                <button type="button" class="app-notification-close" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                <div class="app-notification-icon"><i class="fa-solid fa-circle-check"></i></div>
                <div class="app-notification-content">
                    <span class="app-notification-title" id="appNotificationTitle">تم بنجاح</span>
                    <span class="app-notification-message" id="appNotificationMessage"></span>
                </div>
                <button type="button" class="app-notification-ok">حسنًا</button>
            </div>`;
        document.body.appendChild(layer);
        const close=()=>hide();
        layer.querySelector(".app-notification-close").onclick=close;
        layer.querySelector(".app-notification-ok").onclick=close;
        layer.addEventListener("click",e=>{if(e.target===layer)close();});
        document.addEventListener("keydown",e=>{if(e.key==="Escape"&&layer.classList.contains("show"))close();});
        return layer;

        function hide(){
            layer.classList.remove("show");
            layer.setAttribute("aria-hidden","true");
        }
    }

    function showNotification(message){
        const layer=ensureLayer();
        const dialog=layer.querySelector(".app-notification");
        const text=layer.querySelector("#appNotificationMessage");
        const title=layer.querySelector("#appNotificationTitle");
        const icon=layer.querySelector(".app-notification-icon");
        const value=String(message||"");
        const success=!/(تعذر|خطأ|فشل|غير صالح|يرجى)/.test(value);

        title.textContent=success?"تم بنجاح":"تنبيه";
        text.textContent=value;
        icon.classList.toggle("error",!success);
        icon.innerHTML=success?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-triangle-exclamation"></i>';
        layer.classList.add("show");
        layer.setAttribute("aria-hidden","false");
        requestAnimationFrame(()=>dialog.classList.add("show"));
        setTimeout(()=>layer.querySelector(".app-notification-ok")?.focus(),50);
    }

    window.alert=function(message){
        showNotification(message);
    };
    window.nativeAlert=nativeAlert;
})();
