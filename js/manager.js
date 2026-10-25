/* ==========================================
   Weekly Reports System
   Department Manager
   Stable Version
========================================== */

const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");

function normalizeRole(value){
    return String(value ?? "").normalize("NFKC").replace(/[\u064B-\u065F\u0670]/g,"").replace(/ـ/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/\s+/g," ").trim().toLowerCase();
}

function isManagerRole(value){
    const r=normalizeRole(value);
    return r==="manager" || r==="مدير قسم" || r==="مديرالقسم";
}

if(!currentUser){
    location.replace("index.html");
    throw new Error("No current user");
}

if(!isManagerRole(currentUser.role)){
    location.replace("index.html");
    throw new Error("Not a department manager");
}

const content=document.getElementById("content");
const departmentName=document.getElementById("departmentName");
const logoutBtn=document.getElementById("logoutBtn");

function esc(value){return String(value??"").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));}
function normalize(value){return String(value??"").normalize("NFKC").replace(/[\u064B-\u065F\u0670]/g,"").replace(/ـ/g,"").replace(/[أإآ]/g,"ا").replace(/ى/g,"ي").replace(/ة/g,"ه").replace(/\s+/g," ").trim().toLowerCase();}
function sameDepartment(a,b){return normalize(a)===normalize(b);}
function isReportingEmployee(employee){
    if(!employee || normalizeRole(employee.role)!=="employee") return false;
    const status=normalize(employee.status);
    return !["inactive","موقوف","غير نشط","غيرنشط","متوقف","مفصول","محذوف"].includes(status);
}
function employeeIdKey(value){return String(value??"").trim();}
function getCurrentWeek(){const d=new Date(),m=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"],w=["الأول","الثاني","الثالث","الرابع","الخامس"];return `الأسبوع ${w[Math.ceil(d.getDate()/7)-1]} - ${m[d.getMonth()]}`;}
function formatDate(v){const d=new Date(v);return Number.isNaN(d.getTime())?"—":d.toLocaleString("ar-EG",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true});}
function previewUrl(url){const v=String(url||"");const m=v.match(/\/file\/d\/([^/]+)/);if(m)return `https://drive.google.com/file/d/${m[1]}/preview`;const q=v.match(/[?&]id=([^&]+)/);if(q)return `https://drive.google.com/file/d/${q[1]}/preview`;return v;}
function openPdf(url,title="عرض التقرير"){const modal=document.getElementById("pdfModal"),frame=document.getElementById("pdfFrame"),titleEl=document.getElementById("pdfModalTitle");if(!modal||!frame){window.open(url,"_blank");return;}if(titleEl)titleEl.textContent=title;frame.src=previewUrl(url);modal.classList.add("show");modal.setAttribute("aria-hidden","false");}
function closePdf(){const modal=document.getElementById("pdfModal"),frame=document.getElementById("pdfFrame");if(!modal)return;modal.classList.remove("show");modal.setAttribute("aria-hidden","true");if(frame)frame.src="about:blank";}
window.openPdf=openPdf;

if(departmentName) departmentName.textContent=`قسم ${currentUser.department||""}`;
const managerName=document.getElementById("managerName") || document.getElementById("employeeName") || document.getElementById("userName");
if(managerName) managerName.textContent=currentUser.name||"";

function updateClock(){const now=new Date(),t=document.getElementById("currentTime"),d=document.getElementById("currentDate");if(t)t.textContent=now.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});if(d)d.textContent=now.toLocaleDateString("ar-SA");}
updateClock();setInterval(updateClock,1000);

logoutBtn?.addEventListener("click",()=>{if(!confirm("هل تريد تسجيل الخروج؟"))return;localStorage.removeItem("currentUser");location.replace("index.html");});

document.addEventListener("click",e=>{if(e.target.closest("#pdfClose")){closePdf();return;}if(e.target.id==="pdfModal")closePdf();});
document.addEventListener("keydown",e=>{if(e.key==="Escape")closePdf();});

const menuCards=document.querySelectorAll(".menu-card");
menuCards.forEach(card=>card.addEventListener("click",()=>{menuCards.forEach(x=>x.classList.remove("active"));card.classList.add("active");loadPage(card.dataset.page);}));

function loadPage(page){switch(page){case "employees":return employeesPage();case "reports":return window.renderManagerReportsHome?window.renderManagerReportsHome():reportsPage();default:return dashboardPage();}}

async function getDepartmentData(){
    const [er,rr]=await Promise.all([
        api("getEmployees"),
        api("getReports",{role:"manager",department:currentUser.department})
    ]);
    if(!er.success)throw new Error(er.message||"تعذر تحميل الموظفين");
    if(!rr.success)throw new Error(rr.message||"تعذر تحميل التقارير");

    /* مدير القسم يرى موظفي قسمه فقط، والتقارير من نفس القسم فقط.
       مدير القسم نفسه مستبعد لأنه role=manager. */
    const employees=(er.employees||[]).filter(e=>
        sameDepartment(e.department,currentUser.department) &&
        isReportingEmployee(e)
    );
    const employeeIds=new Set(employees.map(e=>employeeIdKey(e.id)).filter(Boolean));
    const reports=(rr.reports||[]).filter(r=>
        sameDepartment(r.department,currentUser.department) &&
        employeeIds.has(employeeIdKey(r.employeeId))
    );
    return {employees,reports};
}

async function dashboardPage(){
    content.innerHTML=`<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i><span>جارٍ تحميل لوحة القسم...</span></div>`;
    try{
        const {employees,reports}=await getDepartmentData();
        const week=getCurrentWeek();
        const weekReports=reports.filter(r=>normalize(r.week)===normalize(week));
        const uploadedIds=new Set(weekReports.map(r=>String(r.employeeId??"").trim()).filter(Boolean));
        const uploaded=employees.filter(e=>uploadedIds.has(String(e.id??"").trim()));
        const missing=employees.filter(e=>!uploadedIds.has(String(e.id??"").trim()));
        const pct=employees.length?Math.round(uploaded.length/employees.length*100):0;

        content.innerHTML=`
        <div class="dashboard-intro"><div><span>متابعة القسم</span><h1>${esc(currentUser.name||"مدير القسم")}</h1><p>${esc(currentUser.department||"")} — متابعة تقارير الموظفين فقط.</p></div><div class="intro-date"><i class="fa-regular fa-calendar"></i><span>${new Date().toLocaleDateString("ar-SA")}</span></div></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-users"></i></div><div><span>إجمالي موظفي القسم</span><strong>${employees.length}</strong></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-file-circle-check"></i></div><div><span>رفعوا هذا الأسبوع</span><strong>${uploaded.length}</strong></div></div>
            <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-clock"></i></div><div><span>لم يرفعوا</span><strong>${missing.length}</strong></div></div>
            <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-chart-pie"></i></div><div><span>نسبة الإنجاز</span><strong>${pct}%</strong></div></div>
        </div>
        <div class="dashboard-panels">
            <section class="panel-card department-status-panel"><div class="panel-head"><div><span>هذا الأسبوع</span><h2>حالة تقارير القسم</h2></div><i class="fa-solid fa-chart-column"></i></div>
            <div class="dept-list"><div class="dept-row"><div class="dept-info"><strong>${esc(currentUser.department||"القسم")}</strong><span>إجمالي ${employees.length} موظف</span></div><div class="dept-progress-wrap"><div class="progress"><span style="width:${pct}%"></span></div><div class="dept-counts"><span class="uploaded-count">رفع: ${uploaded.length}</span><span class="missing-count">لم يرفع: ${missing.length}</span></div></div><b>${pct}%</b></div></div></section>
            <section class="panel-card quick-actions"><div class="panel-head"><div><span>إجراءات سريعة</span><h2>الوصول السريع</h2></div><i class="fa-solid fa-bolt"></i></div>
            <button onclick="loadPage('reports')"><i class="fa-solid fa-file-pdf"></i><span>تقارير القسم</span><small>عرض تقارير موظفي القسم</small></button>
            <button onclick="loadPage('employees')"><i class="fa-solid fa-users"></i><span>موظفو القسم</span><small>عرض الموظفين دون تعديل</small></button></section>
        </div>
        <section class="missing-panel"><div class="missing-panel-head"><div><span>المتابعة</span><h2>الموظفون الذين لم يرفعوا</h2><p>مدير القسم لا يظهر في هذه القائمة لأنه لا يرفع تقارير.</p></div><div class="missing-total"><strong>${missing.length}</strong><span>موظف</span></div></div><div class="missing-list">${missing.length?missing.map((e,i)=>`<div class="missing-employee"><div class="missing-number">${i+1}</div><div class="missing-person"><strong>${esc(e.name)}</strong><span>${esc(e.department||"")}</span></div><span class="missing-badge">لم يرفع</span></div>`).join(""):`<div class="no-missing"><i class="fa-solid fa-circle-check"></i><div><strong>جميع موظفي القسم رفعوا تقاريرهم</strong><span>لا يوجد متأخرون هذا الأسبوع.</span></div></div>`}</div></section>`;
    }catch(err){console.error(err);content.innerHTML=`<div class="empty-card"><h3>تعذر تحميل لوحة القسم</h3><p>${esc(err.message||err)}</p></div>`;}
}

async function employeesPage(){
    try{
        const {employees}=await getDepartmentData();
        const rows=employees.map(e=>`<tr><td>${esc(e.id)}</td><td><strong>${esc(e.name)}</strong></td><td>${esc(e.department)}</td><td dir="ltr">${esc(e.username)}</td><td><span class="status active">نشط</span></td></tr>`).join("");
        content.innerHTML=`<div class="section-title"><div><span class="eyebrow">القسم</span><h2><i class="fa-solid fa-users"></i> موظفو القسم</h2><p>عرض موظفي قسمك فقط.</p></div></div><div class="table-container"><table><thead><tr><th>#</th><th>الاسم</th><th>القسم</th><th>اسم المستخدم</th><th>الحالة</th></tr></thead><tbody>${rows||`<tr><td colspan="5">لا يوجد موظفون في القسم.</td></tr>`}</tbody></table></div>`;
    }catch(err){content.innerHTML=`<div class="empty-card">${esc(err.message||err)}</div>`;}
}

async function reportsPage(){
    try{
        const {reports}=await getDepartmentData();
        const departments=[...new Set(reports.map(r=>String(r.department||"").trim()).filter(Boolean))];
        content.innerHTML=`<div class="section-title"><div><span class="eyebrow">المتابعة</span><h2><i class="fa-solid fa-file-pdf"></i> تقارير القسم</h2><p>يمكنك مشاهدة تقارير موظفي قسمك فقط.</p></div><div class="result-count" id="managerReportCount"></div></div><div class="toolbar reports-toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="mSearch" placeholder="البحث باسم الموظف أو الملف"></div><input id="mWeek" placeholder="الأسبوع"><input id="mDate" type="date"><button id="mClear" class="secondary-btn"><i class="fa-solid fa-rotate-left"></i> مسح</button></div><div class="table-container"><table><thead><tr><th>الموظف</th><th>القسم</th><th>الأسبوع</th><th>تاريخ الرفع</th><th>عرض</th></tr></thead><tbody id="managerReportsBody"></tbody></table></div>`;
        const render=()=>{
            const q=normalize(document.getElementById("mSearch").value),w=normalize(document.getElementById("mWeek").value),date=document.getElementById("mDate").value;
            const list=reports.filter(r=>(!q||normalize(`${r.employeeName||""} ${r.fileName||""}`).includes(q))&&(!w||normalize(r.week).includes(w))&&(!date||new Date(r.uploadDate).toISOString().slice(0,10)===date));
            document.getElementById("managerReportCount").textContent=`${list.length} تقرير`;
            document.getElementById("managerReportsBody").innerHTML=list.length?list.map(r=>`<tr><td><strong>${esc(r.employeeName)}</strong></td><td>${esc(r.department)}</td><td>${esc(r.week)}</td><td>${formatDate(r.uploadDate)}</td><td><button class="view-btn" onclick='openPdf(${JSON.stringify(String(r.url||""))},${JSON.stringify("تقرير "+String(r.employeeName||""))})'><i class="fa-solid fa-eye"></i> عرض</button></td></tr>`).join(""):`<tr><td colspan="5">لا توجد تقارير مطابقة.</td></tr>`;
        };
        document.getElementById("mSearch").addEventListener("input",render);document.getElementById("mWeek").addEventListener("input",render);document.getElementById("mDate").addEventListener("change",render);document.getElementById("mClear").onclick=()=>{document.getElementById("mSearch").value="";document.getElementById("mWeek").value="";document.getElementById("mDate").value="";render();};render();
    }catch(err){content.innerHTML=`<div class="empty-card">${esc(err.message||err)}</div>`;}
}

menuCards.forEach(x=>x.classList.remove("active"));
document.querySelector('[data-page="dashboard"]')?.classList.add("active");
dashboardPage();
