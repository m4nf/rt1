/* ==========================================
   Admin Settings - In-App Feedback
   Replaces browser alert() after saving settings.
========================================== */
(function(){
    function ensureModal(){
        let modal=document.getElementById("settingsFeedbackModal");
        if(modal) return modal;
        modal=document.createElement("div");
        modal.id="settingsFeedbackModal";
        modal.className="settings-feedback-modal";
        modal.setAttribute("aria-hidden","true");
        modal.innerHTML=`
            <div class="settings-feedback-card" role="dialog" aria-modal="true" aria-labelledby="settingsFeedbackTitle">
                <button type="button" class="settings-feedback-close" id="settingsFeedbackClose" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
                <div class="settings-feedback-icon" id="settingsFeedbackIcon"><i class="fa-solid fa-circle-check"></i></div>
                <h3 id="settingsFeedbackTitle">تم حفظ الإعدادات</h3>
                <p id="settingsFeedbackMessage">تم تحديث موعد رفع التقارير الأسبوعية بنجاح.</p>
                <button type="button" class="settings-feedback-btn" id="settingsFeedbackOk">حسنًا</button>
            </div>`;
        document.body.appendChild(modal);
        const close=()=>{modal.classList.remove("show");modal.setAttribute("aria-hidden","true");};
        document.getElementById("settingsFeedbackClose").onclick=close;
        document.getElementById("settingsFeedbackOk").onclick=close;
        modal.addEventListener("click",e=>{if(e.target===modal)close();});
        document.addEventListener("keydown",e=>{if(e.key==="Escape"&&modal.classList.contains("show"))close();});
        return modal;
    }

    function showFeedback(success,message){
        const modal=ensureModal();
        const icon=document.getElementById("settingsFeedbackIcon");
        const title=document.getElementById("settingsFeedbackTitle");
        const text=document.getElementById("settingsFeedbackMessage");
        if(icon) icon.innerHTML=success?'<i class="fa-solid fa-circle-check"></i>':'<i class="fa-solid fa-triangle-exclamation"></i>';
        if(icon) icon.classList.toggle("error",!success);
        if(title) title.textContent=success?"تم حفظ الإعدادات":"تعذر حفظ الإعدادات";
        if(text) text.textContent=message;
        modal.classList.add("show");
        modal.setAttribute("aria-hidden","false");
    }

    window.saveSettings=async function(){
        const btn=document.getElementById("saveSettingsBtn");
        const uploadDay=document.getElementById("uploadDay")?.value||"";
        const startTime=document.getElementById("startTime")?.value||"";
        const endTime=document.getElementById("endTime")?.value||"";

        if(!uploadDay||!startTime||!endTime){
            showFeedback(false,"يرجى تحديد يوم الرفع ووقت البداية ووقت النهاية قبل الحفظ.");
            return;
        }
        if(startTime>=endTime){
            showFeedback(false,"وقت النهاية يجب أن يكون بعد وقت البداية.");
            return;
        }

        if(btn){
            btn.disabled=true;
            btn.dataset.oldHtml=btn.innerHTML;
            btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الحفظ...';
        }

        try{
            const result=await api("saveSettings",{uploadDay,startTime,endTime});
            if(result&&result.success){
                if(typeof invalidateApiCache==="function") invalidateApiCache();
                showFeedback(true,"تم تحديث موعد رفع التقارير الأسبوعية وحفظ الإعدادات بنجاح.");
            }else{
                showFeedback(false,result?.message||"تعذر حفظ الإعدادات، حاول مرة أخرى.");
            }
        }catch(error){
            console.error(error);
            showFeedback(false,"حدث خطأ أثناء الحفظ. يرجى المحاولة مرة أخرى.");
        }finally{
            if(btn){btn.disabled=false;if(btn.dataset.oldHtml)btn.innerHTML=btn.dataset.oldHtml;}
        }
    };
})();
