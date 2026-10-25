/* Employee upload status */
(function(){
  const state=document.getElementById('uploadState');
  const notice=document.getElementById('uploadNotice');
  if(!state||!notice)return;
  function closed(){
    state.innerHTML='<i class="fa-solid fa-lock"></i> رفع التقارير مغلق';
    state.classList.add('upload-closed');
  }
  function waiting(){
    state.innerHTML='<i class="fa-solid fa-cloud-arrow-up"></i> بانتظار الرفع';
    state.classList.remove('upload-closed');
  }
  function sync(){
    const text=(notice.textContent||'').replace(/\s+/g,' ');
    if(notice.style.display!=='none' && text.includes('رفع التقارير مغلق')) closed();
    else waiting();
  }
  sync();
  new MutationObserver(sync).observe(notice,{subtree:true,childList:true,attributes:true,attributeFilter:['style']});
})();
