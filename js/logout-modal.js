(() => {
  function initLogoutModal(){
    const buttons=[...document.querySelectorAll('#logoutBtn')];
    if(!buttons.length) return;
    const modal=document.createElement('div');
    modal.className='app-confirm-modal';
    modal.innerHTML=`<div class="app-confirm-card" role="dialog" aria-modal="true" aria-labelledby="logoutModalTitle"><div class="app-confirm-icon"><i class="fa-solid fa-right-from-bracket"></i></div><h3 id="logoutModalTitle">تسجيل الخروج</h3><p>هل أنت متأكد أنك تريد تسجيل الخروج من النظام؟</p><div class="app-confirm-actions"><button type="button" class="app-confirm-cancel">إلغاء</button><button type="button" class="app-confirm-ok">تسجيل الخروج</button></div></div>`;
    document.body.appendChild(modal);
    const close=()=>modal.classList.remove('show');
    buttons.forEach(btn=>btn.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();modal.classList.add('show');},true));
    modal.querySelector('.app-confirm-cancel').addEventListener('click',close);
    modal.querySelector('.app-confirm-ok').addEventListener('click',()=>{localStorage.removeItem('currentUser');location.href='index.html';});
    modal.addEventListener('click',e=>{if(e.target===modal)close();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initLogoutModal); else initLogoutModal();
})();
