/* Employee dashboard UI only — no extra API calls. */
(function(){
'use strict';
const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
const stateEl=document.getElementById('uploadState');
const uploadBtn=document.getElementById('uploadBtn');
const uploadCard=document.getElementById('uploadCard');
const successCard=document.getElementById('successCard');
const reportsTable=document.getElementById('reportsTable');
function sync(){
 const items=reportsTable?reportsTable.querySelectorAll('.report-item'):[];
 set('totalReports',items.length);
 const firstDate=items[0]?.querySelector('.report-date')?.textContent?.trim();
 set('lastUpload',firstDate||'لا يوجد');
 const uploaded=!!(successCard&&getComputedStyle(successCard).display!=='none');
 const closed=!!(uploadBtn&&uploadBtn.disabled);
 if(uploaded){
   set('weeklyStatus','تم الرفع');
   if(stateEl){stateEl.innerHTML='<i class="fa-solid fa-circle-check"></i> تم رفع التقرير';stateEl.className='upload-state uploaded';}
 }else if(closed){
   set('weeklyStatus','غير متاح الآن');
   if(stateEl){stateEl.innerHTML='<i class="fa-solid fa-lock"></i> غير متاح الآن';stateEl.className='upload-state closed';}
 }else{
   set('weeklyStatus','بانتظار الرفع');
   if(stateEl){stateEl.innerHTML='<i class="fa-solid fa-cloud-arrow-up"></i> بانتظار الرفع';stateEl.className='upload-state available';}
 }
}
setTimeout(sync,250);
const observer=new MutationObserver(sync);
[uploadBtn,uploadCard,successCard,reportsTable].forEach(el=>{if(el)observer.observe(el,{attributes:true,childList:true,subtree:true});});
})();
