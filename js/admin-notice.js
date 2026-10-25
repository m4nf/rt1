/* ==========================================
   General Manager - In-app notice
========================================== */
(function(){
    function ensureNotice(){
        let modal=document.getElementById("appNoticeModal");
        if(modal)return modal;
        modal=document.createElement("div");
        modal.id="appNoticeModal";
        modal.setAttribute("aria-hidden","true");
        modal.innerHTML=`<div class="app-notice-backdrop" data-close-notice><div class="app-notice-card" role="dialog" aria-modal="true" aria-labelledby="appNoticeTitle"><div class="app-notice-icon" id="appNoticeIcon"></div><div class="app-notice-content"><span class="app-notice-label" id="appNoticeLabel">تم الحفظ</span><h3 id="appNoticeTitle">تمت العملية بنجاح</h3><p id="appNoticeMessage"></p></div><button type="button" class="app-notice-close" data-close-notice aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button><button type="button" class="app-notice-ok" data-close-notice>حسنًا</button></div></div>`;
        document.body.appendChild(modal);
        modal.addEventListener("click",function(e){if(e.target.closest("[data-close-notice]"))closeNotice();});
        return modal;
    }

    function closeNotice(){
        const modal=document.getElementById("appNoticeModal");
        if(!modal)return;
        modal.classList.remove("show");
        modal.setAttribute("aria-hidden","true");
        document.body.classList.remove("app-notice-open");
    }

    window.showAppNotice=function(message,type="success"){
        const modal=ensureNotice();
        const success=type!=="error";
        modal.querySelector("#appNoticeIcon").innerHTML=success?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-circle-exclamation"></i>';
        modal.querySelector("#appNoticeLabel").textContent=success?"تم الحفظ":"تنبيه";
        modal.querySelector("#appNoticeTitle").textContent=success?"تمت العملية بنجاح":"تعذر إتمام العملية";
        modal.querySelector("#appNoticeMessage").textContent=message;
        modal.classList.remove("success","error");
        modal.classList.add(success?"success":"error","show");
        modal.setAttribute("aria-hidden","false");
        document.body.classList.add("app-notice-open");
        requestAnimationFrame(()=>modal.querySelector(".app-notice-ok")?.focus());
    };

    window.addEventListener("keydown",function(e){if(e.key==="Escape")closeNotice();});

    /* Replace the browser alert only for the Settings save flow. */
    window.saveSettings=async function(){
        const btn=document.getElementById("saveSettingsBtn");
        if(!btn)return;
        const oldHtml=btn.innerHTML;
        btn.disabled=true;
        btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جارٍ حفظ الإعدادات...';
        try{
            const result=await api("saveSettings",{
                uploadDay:document.getElementById("uploadDay")?.value||"",
                startTime:document.getElementById("startTime")?.value||"",
                endTime:document.getElementById("endTime")?.value||""
            });
            if(result.success){
                if(typeof invalidateApiCache==="function")invalidateApiCache();
                showAppNotice("تم حفظ موعد رفع التقارير بنجاح.");
            }else{
                showAppNotice(result.message||"تعذر حفظ الإعدادات","error");
            }
        }catch(err){
            console.error(err);
            showAppNotice("حدث خطأ أثناء حفظ الإعدادات: "+(err.message||err),"error");
        }finally{
            btn.disabled=false;
            btn.innerHTML=oldHtml;
        }
    };
})();
