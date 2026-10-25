/* W1 - In-app Arabic dialogs */
(() => {
  let active = null;
  const icons = {confirm:'fa-right-from-bracket',success:'fa-circle-check',error:'fa-circle-xmark',warning:'fa-triangle-exclamation',info:'fa-circle-info'};
  const titles = {confirm:'تأكيد العملية',success:'تمت العملية بنجاح',error:'حدث خطأ',warning:'تنبيه',info:'معلومة'};

  function close(result=false){
    if(!active) return;
    const {overlay,resolve}=active;
    overlay.classList.remove('w1-dialog-show');
    setTimeout(()=>overlay.remove(),220);
    active=null;
    resolve(result);
  }

  function dialog(message, type='info', title=''){
    return new Promise(resolve=>{
      if(active) close(false);
      const overlay=document.createElement('div');
      overlay.className='w1-dialog-overlay';
      overlay.setAttribute('role','dialog');
      overlay.setAttribute('aria-modal','true');
      const icon=icons[type]||icons.info;
      const heading=title||titles[type]||titles.info;
      const isConfirm=type==='confirm';
      overlay.innerHTML=`<div class="w1-dialog-card" tabindex="-1">
        <button class="w1-dialog-close" type="button" aria-label="إغلاق"><i class="fa-solid fa-xmark"></i></button>
        <div class="w1-dialog-icon ${type}"><i class="fa-solid ${icon}"></i></div>
        <div class="w1-dialog-body"><span class="w1-dialog-kicker">نظام التقارير الأسبوعية</span><h3>${escapeText(heading)}</h3><p>${escapeText(message)}</p></div>
        <div class="w1-dialog-actions">
          ${isConfirm?'<button class="w1-dialog-btn secondary" data-result="false">إلغاء</button>':''}
          <button class="w1-dialog-btn ${isConfirm?'danger':'primary'}" data-result="true">${isConfirm?'تسجيل الخروج':'حسنًا'}</button>
        </div>
      </div>`;
      document.body.appendChild(overlay);
      active={overlay,resolve};
      requestAnimationFrame(()=>{overlay.classList.add('w1-dialog-show');overlay.querySelector('.w1-dialog-card').focus();});
      overlay.addEventListener('click',e=>{if(e.target===overlay||e.target.closest('.w1-dialog-close'))close(false);const b=e.target.closest('[data-result]');if(b)close(b.dataset.result==='true');});
      overlay.querySelector('.w1-dialog-card').addEventListener('keydown',e=>{if(e.key==='Escape')close(false);if(e.key==='Enter'&&!e.target.matches('button'))close(true);});
    });
  }
  function escapeText(v){const d=document.createElement('div');d.textContent=String(v??'');return d.innerHTML;}
  window.showConfirm=(message,title='تسجيل الخروج')=>dialog(message,'confirm',title);
  window.showSuccess=(message,title='تمت العملية بنجاح')=>dialog(message,'success',title);
  window.showError=(message,title='حدث خطأ')=>dialog(message,'error',title);
  window.showWarning=(message,title='تنبيه')=>dialog(message,'warning',title);
  window.showInfo=(message,title='معلومة')=>dialog(message,'info',title);
})();
