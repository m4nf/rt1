/* ==========================================
   General Manager - Settings save flow
   Keeps the confirmation fully inside the app.
========================================== */
(function(){
    document.addEventListener("click",async function(event){
        const btn=event.target.closest("#saveSettingsBtn");
        if(!btn)return;

        /* Intercept admin.js' old browser-alert flow before it runs. */
        event.preventDefault();
        event.stopImmediatePropagation();
        if(btn.dataset.saving==="1")return;

        const oldHtml=btn.innerHTML;
        btn.dataset.saving="1";
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
                alert("تم حفظ موعد رفع التقارير بنجاح.");
            }else{
                alert(result.message||"تعذر حفظ الإعدادات");
            }
        }catch(error){
            console.error(error);
            alert("حدث خطأ أثناء حفظ الإعدادات: "+(error.message||error));
        }finally{
            btn.disabled=false;
            btn.dataset.saving="0";
            btn.innerHTML=oldHtml;
        }
    },true);
})();
