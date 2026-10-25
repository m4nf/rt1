/* ==========================================
   Weekly Reports System
   Admin Dashboard - Stable Version
========================================== */

const content = document.getElementById("content");
let employeesData = [];
let reportsData = [];
let editingEmployeeId = null;

/* ==========================
   Helpers
========================== */
function esc(value){
    return String(value ?? "").replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]));
}

function normalizeText(value){
    return String(value ?? "")
        .normalize("NFKC")
        .replace(/[\u064B-\u065F\u0670]/g,"")
        .replace(/ـ/g,"")
        .replace(/[أإآ]/g,"ا")
        .replace(/ى/g,"ي")
        .replace(/ة/g,"ه")
        .replace(/\s+/g," ")
        .trim()
        .toLowerCase();
}

function normalizeDepartment(value){
    return normalizeText(value);
}

/* الأقسام الرسمية للنظام — لا يظهر القسم في لوحة المدير العام إلا عند وجود موظف به. */
const OFFICIAL_DEPARTMENTS = [
    "الإدارية",
    "العلمية",
    "الإعلام",
    "قسم الدعوة",
    "الجاليات",
    "القسم الإنساني",
    "مركز غيم"
];

const DEPARTMENT_ALIASES = new Map([
    [normalizeDepartment("الادارية"), "الإدارية"],
    [normalizeDepartment("الإدارية"), "الإدارية"],
    [normalizeDepartment("العلميه"), "العلمية"],
    [normalizeDepartment("العلمية"), "العلمية"],
    [normalizeDepartment("الاعلام"), "الإعلام"],
    [normalizeDepartment("الإعلام"), "الإعلام"],
    [normalizeDepartment("قسم الدعوه"), "قسم الدعوة"],
    [normalizeDepartment("قسم الدعوة"), "قسم الدعوة"],
    [normalizeDepartment("القسم الانسانى"), "القسم الإنساني"],
    [normalizeDepartment("القسم الإنساني"), "القسم الإنساني"],
    [normalizeDepartment("مركز غيم"), "مركز غيم"],
    [normalizeDepartment("الجاليات"), "الجاليات"]
]);

function canonicalDepartment(value){
    const raw=String(value??"").trim();
    if(!raw) return "";
    return DEPARTMENT_ALIASES.get(normalizeDepartment(raw)) || raw;
}

function normalizeRole(value){
    const r=normalizeText(value);
    if(["admin","مدير عام","مدير النظام","مديرالنظام"].includes(r)) return "admin";
    if(["manager","مدير قسم","مديرالقسم"].includes(r)) return "manager";
    return "employee";
}

function isActive(value){
    const s=normalizeText(value);
    return ["active","نشط","فعال","مفعل","مفعّل","فعال"].includes(s);
}

function isReportingEmployee(employee){
    if(!employee || normalizeRole(employee.role)!=="employee") return false;
    const status=normalizeText(employee.status);
    /* لا نستبعد الموظف إذا كانت خانة الحالة فارغة/غير معروفة؛ نستبعد فقط
       الحالات التي تعني صراحة أنه موقوف/غير نشط. */
    return !["inactive","موقوف","غير نشط","غيرنشط","متوقف","متوقفه","مفصول","محذوف"].includes(status);
}

function employeeIdKey(value){
    return String(value ?? "").trim();
}

function getCurrentWeek(){
    const date=new Date();
    const months=["يناير","فبراير","مارس","أبريل","مايو","يونيو","يوليو","أغسطس","سبتمبر","أكتوبر","نوفمبر","ديسمبر"];
    const names=["الأول","الثاني","الثالث","الرابع","الخامس"];
    const n=Math.ceil(date.getDate()/7);
    return `الأسبوع ${names[n-1]} - ${months[date.getMonth()]}`;
}

function sameWeek(a,b){
    return normalizeText(a)===normalizeText(b);
}

function formatDate(value){
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString("ar-EG",{year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",hour12:true});
}

function dateKey(value){
    const d=new Date(value);
    if(Number.isNaN(d.getTime())) return "";
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
}

function roleLabel(role){
    const r=normalizeRole(role);
    return r==="admin"?"مدير عام":r==="manager"?"مدير قسم":"موظف";
}

function previewUrl(url){
    const v=String(url||"");
    const m=v.match(/\/file\/d\/([^/]+)/);
    if(m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    const q=v.match(/[?&]id=([^&]+)/);
    if(q) return `https://drive.google.com/file/d/${q[1]}/preview`;
    return v;
}

function openPdf(url,title="عرض التقرير"){
    const modal=document.getElementById("pdfModal");
    const frame=document.getElementById("pdfFrame");
    const titleEl=document.getElementById("pdfModalTitle");
    if(!modal||!frame){ window.open(url,"_blank"); return; }
    if(titleEl) titleEl.textContent=title;
    frame.src=previewUrl(url);
    modal.classList.add("show");
    modal.setAttribute("aria-hidden","false");
}

function closePdf(){
    const modal=document.getElementById("pdfModal");
    const frame=document.getElementById("pdfFrame");
    if(!modal) return;
    modal.classList.remove("show");
    modal.setAttribute("aria-hidden","true");
    if(frame) frame.src="about:blank";
}
window.openPdf=openPdf;

/* ==========================
   Navigation
========================== */
document.querySelectorAll(".menu-card").forEach(card=>{
    card.addEventListener("click",()=>{
        document.querySelectorAll(".menu-card").forEach(x=>x.classList.remove("active"));
        card.classList.add("active");
        loadPage(card.dataset.page);
    });
});

function loadPage(page){
    switch(page){
        case "dashboard": dashboardPage(); break;
        case "reports": reportsPage(); break;
        case "employees": employeesPage(); break;
        case "settings": settingsPage(); break;
    }
}

/* ==========================
   PDF Modal Events
========================== */
document.addEventListener("click",e=>{
    if(e.target.closest("#pdfClose")){ closePdf(); return; }
    if(e.target.id==="pdfModal") closePdf();
});
document.addEventListener("keydown",e=>{ if(e.key==="Escape") closePdf(); });

/* ==========================
   Dashboard
========================== */
async function dashboardPage(){
    content.innerHTML=`<div class="loading-state"><i class="fa-solid fa-spinner fa-spin"></i><span>جارٍ تحميل لوحة التحكم...</span></div>`;

    try{
        const [er,rr]=await Promise.all([api("getEmployees"),api("getReports")]);
        if(!er.success) throw new Error(er.message||"تعذر تحميل الموظفين");
        if(!rr.success) throw new Error(rr.message||"تعذر تحميل التقارير");

        employeesData=Array.isArray(er.employees)?er.employees:[];
        reportsData=Array.isArray(rr.reports)?rr.reports:[];

        const week=getCurrentWeek();
        const weekReports=reportsData.filter(r=>sameWeek(r.week,week));

        /* الموظفون المطالبون بالرفع: موظف فقط وحالته ليست موقوفة. */
        const reportingEmployees=employeesData
            .filter(isReportingEmployee)
            .map(e=>({...e,department:canonicalDepartment(e.department)}));

        const managers=employeesData.filter(e=>
            normalizeRole(e.role)==="manager" &&
            !["inactive","موقوف","غير نشط","غيرنشط","متوقف","متوقفه","مفصول","محذوف"].includes(normalizeText(e.status))
        );

        /*
         * تسجيل الرفع يتم للموظف نفسه وليس لمجرد وجود ID مشابه.
         * عندما يرسل الباك إند اسم الموظف مع التقرير نطابق الاسم أيضًا،
         * وهذا يمنع حالة تكرار ID من جعل موظف جديد يظهر وكأنه رفع.
         */
        const uploadedEmployeeKeys=new Set();
        reportingEmployees.forEach(employee=>{
            const empId=employeeIdKey(employee.id);
            const empName=normalizeText(employee.name);
            if(!empId) return;

            const hasReport=weekReports.some(report=>{
                if(employeeIdKey(report.employeeId)!==empId) return false;
                const reportName=normalizeText(report.employeeName);
                if(reportName && empName && reportName!==empName) return false;
                const reportDepartment=normalizeDepartment(report.department);
                const empDepartment=normalizeDepartment(employee.department);
                if(reportDepartment && empDepartment && reportDepartment!==empDepartment) return false;
                return true;
            });

            if(hasReport) uploadedEmployeeKeys.add(`${empId}::${empName}`);
        });

        const employeeUploaded=employee=>uploadedEmployeeKeys.has(
            `${employeeIdKey(employee.id)}::${normalizeText(employee.name)}`
        );

        const uploaded=reportingEmployees.filter(employeeUploaded);
        const missing=reportingEmployees.filter(e=>!employeeUploaded(e));

        /* الأقسام الرسمية فقط، لكن لا نعرض القسم إلا إذا كان به موظف فعليًا. */
        const departments=new Map();
        reportingEmployees.forEach(e=>{
            const name=canonicalDepartment(e.department);
            if(!name) return;
            const key=normalizeDepartment(name);
            if(!departments.has(key)) departments.set(key,{name,employees:[]});
            departments.get(key).employees.push(e);
        });

        const deptRows=[...departments.values()].map(dept=>{
            const total=dept.employees.length;
            const up=dept.employees.filter(employeeUploaded).length;
            const miss=total-up;
            const pct=total?Math.round(up/total*100):0;
            return `<div class="dept-row">
                <div class="dept-info"><strong>${esc(dept.name)}</strong><span>إجمالي ${total} موظف</span></div>
                <div class="dept-progress-wrap"><div class="progress"><span style="width:${pct}%"></span></div><div class="dept-counts"><span class="uploaded-count">رفع: ${up}</span><span class="missing-count">لم يرفع: ${miss}</span></div></div>
                <b>${pct}%</b>
            </div>`;
        }).join("");

        const missingRows=missing.length?missing.map((e,i)=>`<div class="missing-employee"><div class="missing-number">${i+1}</div><div class="missing-person"><strong>${esc(e.name)}</strong><span>${esc(e.department||"بدون قسم")}</span></div><span class="missing-badge">لم يرفع</span></div>`).join(""):
            `<div class="no-missing"><i class="fa-solid fa-circle-check"></i><div><strong>ممتاز! جميع الموظفين رفعوا التقارير</strong><span>لا يوجد موظفون متأخرون لهذا الأسبوع.</span></div></div>`;

        content.innerHTML=`
        <div class="dashboard-intro"><div><span>نظرة عامة</span><h1>لوحة التحكم</h1><p>متابعة الموظفين والتقارير الأسبوعية من مكان واحد.</p></div><div class="intro-date"><i class="fa-regular fa-calendar"></i><span>${new Date().toLocaleDateString("ar-SA")}</span></div></div>
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-icon blue"><i class="fa-solid fa-users"></i></div><div><span>إجمالي الموظفين</span><strong>${reportingEmployees.length}</strong></div></div>
            <div class="stat-card"><div class="stat-icon purple"><i class="fa-solid fa-user-tie"></i></div><div><span>مديرو الأقسام</span><strong>${managers.length}</strong></div></div>
            <div class="stat-card"><div class="stat-icon green"><i class="fa-solid fa-file-circle-check"></i></div><div><span>رفعوا هذا الأسبوع</span><strong>${uploaded.length}</strong></div></div>
            <div class="stat-card"><div class="stat-icon orange"><i class="fa-solid fa-clock"></i></div><div><span>لم يرفعوا</span><strong>${missing.length}</strong></div></div>
        </div>
        <div class="dashboard-panels">
            <section class="panel-card department-status-panel"><div class="panel-head"><div><span>متابعة الأقسام</span><h2>حالة التقارير هذا الأسبوع</h2></div><i class="fa-solid fa-chart-column"></i></div><div class="dept-list">${deptRows||'<div class="empty-card">لا يوجد موظفون مطالبون بالتقرير.</div>'}</div></section>
            <section class="panel-card quick-actions"><div class="panel-head"><div><span>إجراءات سريعة</span><h2>الوصول السريع</h2></div><i class="fa-solid fa-bolt"></i></div>
            <button onclick="loadPage('reports')"><i class="fa-solid fa-file-pdf"></i><span>عرض التقارير</span><small>بحث وفلترة التقارير</small></button>
            <button onclick="loadPage('employees')"><i class="fa-solid fa-users"></i><span>إدارة الموظفين</span><small>إضافة وتعديل الموظفين</small></button>
            <button class="missing-toggle" id="missingToggleBtn" type="button"><i class="fa-solid fa-user-clock"></i><span>الموظفون الذين لم يرفعوا</span><small>${missing.length} موظف لم يرفع تقرير هذا الأسبوع</small></button></section>
        </div>
        <section class="missing-panel" id="missingPanel" hidden><div class="missing-panel-head"><div><span>المتابعة</span><h2>الموظفون الذين لم يرفعوا التقرير</h2><p>مديرو الأقسام لا يدخلون في هذه القائمة لأنهم لا يرفعون تقارير.</p></div><div class="missing-total"><strong>${missing.length}</strong><span>موظف</span></div></div><div class="missing-list">${missingRows}</div></section>`;

        const btn=document.getElementById("missingToggleBtn"),panel=document.getElementById("missingPanel");
        btn?.addEventListener("click",()=>{ const show=panel.hidden; panel.hidden=!show; btn.classList.toggle("active",show); });
    }catch(err){
        console.error(err);
        content.innerHTML=`<div class="empty-card"><i class="fa-solid fa-triangle-exclamation"></i><h3>تعذر تحميل لوحة التحكم</h3><p>${esc(err.message||err)}</p></div>`;
    }
}

/* ==========================
   Employees
========================== */
async function employeesPage(){
    const result=await api("getEmployees");
    if(!result.success){ content.innerHTML=`<div class="empty-card">تعذر تحميل الموظفين</div>`; return; }
    employeesData=Array.isArray(result.employees)?result.employees:[];
    const departments=[...new Map(employeesData.map(e=>[normalizeDepartment(e.department),String(e.department||"").trim()]).filter(x=>x[0])).values()];

    content.innerHTML=`<div class="section-title"><div><span class="eyebrow">إدارة النظام</span><h2><i class="fa-solid fa-users"></i> الموظفون</h2><p>إدارة الموظفين والصلاحيات والحالات.</p></div><button class="primary-btn" id="addEmployeeBtn"><i class="fa-solid fa-plus"></i> إضافة موظف</button></div>
    <div class="toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="employeeSearch" placeholder="بحث باسم الموظف أو اسم المستخدم أو القسم"></div><select id="employeeDepartment"><option value="">كل الأقسام</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("")}</select><select id="employeeRole"><option value="">كل الصلاحيات</option><option value="employee">موظف</option><option value="manager">مدير قسم</option><option value="admin">مدير عام</option></select></div>
    <div class="table-container"><table><thead><tr><th>#</th><th>الاسم</th><th>القسم</th><th>اسم المستخدم</th><th>الصلاحية</th><th>الحالة</th><th>الإجراءات</th></tr></thead><tbody id="employeesBody"></tbody></table></div>`;

    document.getElementById("addEmployeeBtn").onclick=()=>openEmployeeModal();
    const render=()=>{
        const q=normalizeText(document.getElementById("employeeSearch").value);
        const dept=normalizeDepartment(document.getElementById("employeeDepartment").value);
        const role=document.getElementById("employeeRole").value;
        const list=employeesData.filter(e=>{
            const text=normalizeText(`${e.name||""} ${e.username||""} ${e.department||""}`);
            return (!q||text.includes(q)) && (!dept||normalizeDepartment(e.department)===dept) && (!role||normalizeRole(e.role)===role);
        });
        document.getElementById("employeesBody").innerHTML=list.length?list.map(e=>`<tr><td>${esc(e.id)}</td><td><strong>${esc(e.name)}</strong></td><td>${esc(e.department)}</td><td dir="ltr">${esc(e.username)}</td><td><span class="role-badge ${normalizeRole(e.role)}">${roleLabel(e.role)}</span></td><td><span class="status ${isActive(e.status)?"active":"stop"}">${isActive(e.status)?"نشط":"موقوف"}</span></td><td><div class="actions"><button class="icon-btn edit-btn" onclick="editEmployee(${JSON.stringify(e.id)})"><i class="fa-solid fa-pen"></i></button><button class="icon-btn delete-btn" onclick="deleteEmployee(${JSON.stringify(e.id)})"><i class="fa-solid fa-trash"></i></button></div></td></tr>`).join(""):`<tr><td colspan="7"><div class="table-empty">لا توجد نتائج مطابقة</div></td></tr>`;
    };
    document.getElementById("employeeSearch").addEventListener("input",render);
    document.getElementById("employeeDepartment").addEventListener("change",render);
    document.getElementById("employeeRole").addEventListener("change",render);
    render(); setupEmployeeModal();
}

function openEmployeeModal(){
    editingEmployeeId=null;
    const modal=document.getElementById("employeeModal");
    if(!modal) return;
    const title=document.querySelector(".modal-title"); if(title) title.textContent="إضافة موظف";
    ["empName","empUsername","empPassword"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
    modal.classList.add("show");
}

/* ==========================
   Reports
========================== */
async function reportsPage(){
    const result=await api("getReports",{role:"admin"});
    if(!result.success){ content.innerHTML=`<div class="empty-card">تعذر تحميل التقارير</div>`; return; }
    reportsData=Array.isArray(result.reports)?result.reports:[];
    const departments=[...new Map(reportsData.map(r=>[normalizeDepartment(r.department),String(r.department||"").trim()]).filter(x=>x[0])).values()];
    content.innerHTML=`<div class="section-title"><div><span class="eyebrow">المتابعة</span><h2><i class="fa-solid fa-file-pdf"></i> التقارير</h2><p>المدير العام يرى جميع التقارير.</p></div><div class="result-count" id="reportCount"></div></div>
    <div class="toolbar reports-toolbar"><div class="search-box"><i class="fa-solid fa-magnifying-glass"></i><input id="searchName" placeholder="البحث باسم الموظف أو الملف"></div><select id="searchDepartment"><option value="">كل الأقسام</option>${departments.map(d=>`<option value="${esc(d)}">${esc(d)}</option>`).join("")}</select><input id="searchWeek" placeholder="الأسبوع"><input type="date" id="searchDate"><button class="secondary-btn" id="clearReportFilters"><i class="fa-solid fa-rotate-left"></i> مسح</button></div>
    <div class="table-container"><table><thead><tr><th>الموظف</th><th>القسم</th><th>الأسبوع</th><th>تاريخ الرفع</th><th>الحالة</th><th>عرض</th><th>حذف</th></tr></thead><tbody id="reportsBody"></tbody></table></div>`;
    const render=()=>{
        const q=normalizeText(document.getElementById("searchName").value),dept=normalizeDepartment(document.getElementById("searchDepartment").value),week=normalizeText(document.getElementById("searchWeek").value),date=document.getElementById("searchDate").value;
        const list=reportsData.filter(r=>(!q||normalizeText(`${r.employeeName||""} ${r.fileName||""}`).includes(q))&&(!dept||normalizeDepartment(r.department)===dept)&&(!week||normalizeText(r.week).includes(week))&&(!date||dateKey(r.uploadDate)===date));
        document.getElementById("reportCount").textContent=`${list.length} تقرير`;
        document.getElementById("reportsBody").innerHTML=list.length?list.map(r=>`<tr><td><strong>${esc(r.employeeName)}</strong></td><td>${esc(r.department)}</td><td>${esc(r.week)}</td><td>${formatDate(r.uploadDate)}</td><td><span class="report-status">${esc(r.status||"تم الرفع")}</span></td><td><button class="view-btn" onclick='openPdf(${JSON.stringify(String(r.url||""))},${JSON.stringify("تقرير "+String(r.employeeName||""))})'><i class="fa-solid fa-eye"></i> عرض</button></td><td><button class="icon-btn delete-btn" onclick="deleteReport(${JSON.stringify(r.id)})"><i class="fa-solid fa-trash"></i></button></td></tr>`).join(""):`<tr><td colspan="7"><div class="table-empty">لا توجد تقارير مطابقة</div></td></tr>`;
    };
    ["searchName","searchWeek"].forEach(id=>document.getElementById(id).addEventListener("input",render));
    ["searchDepartment","searchDate"].forEach(id=>document.getElementById(id).addEventListener("change",render));
    document.getElementById("clearReportFilters").onclick=()=>{["searchName","searchWeek","searchDate"].forEach(id=>document.getElementById(id).value="");document.getElementById("searchDepartment").value="";render();};
    render();
}

/* ==========================
   Settings
========================== */
async function settingsPage(){
    const result=await api("getSettings");
    if(!result.success){content.innerHTML=`<div class="empty-card">تعذر تحميل الإعدادات</div>`;return;}
    const s=result.settings||{};
    content.innerHTML=`<div class="section-title"><div><span class="eyebrow">النظام</span><h2><i class="fa-solid fa-gear"></i> الإعدادات</h2><p>تحديد موعد رفع التقارير الأسبوعية.</p></div></div><div class="settings-grid"><div class="setting-card"><label>يوم رفع التقارير</label><select id="uploadDay"><option value="0">الأحد</option><option value="1">الإثنين</option><option value="2">الثلاثاء</option><option value="3">الأربعاء</option><option value="4">الخميس</option><option value="5">الجمعة</option><option value="6">السبت</option></select></div><div class="setting-card"><label>وقت البداية</label><input id="startTime" type="time"></div><div class="setting-card"><label>وقت النهاية</label><input id="endTime" type="time"></div></div><button id="saveSettingsBtn" class="primary-btn save-settings"><i class="fa-solid fa-floppy-disk"></i> حفظ الإعدادات</button>`;
    document.getElementById("uploadDay").value=s.uploadDay??"";document.getElementById("startTime").value=s.startTime??"";document.getElementById("endTime").value=s.endTime??"";document.getElementById("saveSettingsBtn").onclick=saveSettings;
}

/* ==========================
   Employee Modal / Save
========================== */
function setupEmployeeModal(){
    const modal=document.getElementById("employeeModal"),close=document.getElementById("closeModal");
    if(!modal) return;
    if(close) close.onclick=()=>modal.classList.remove("show");
    modal.onclick=e=>{if(e.target===modal)modal.classList.remove("show");};
}

document.addEventListener("click",e=>{
    const btn=e.target.closest("#saveEmployee");
    if(btn){e.preventDefault();saveEmployee();}
});

async function saveEmployee(){
    const get=id=>document.getElementById(id);
    const name=get("empName")?.value.trim()||"", username=get("empUsername")?.value.trim()||"", password=get("empPassword")?.value.trim()||"", department=get("empDepartment")?.value||"", role=get("empRole")?.value||"employee";
    if(!name||!username||!password){alert("يرجى إدخال جميع البيانات");return;}
    const btn=get("saveEmployee");
    if(btn){btn.disabled=true;btn.dataset.old=btn.innerHTML;btn.innerHTML='<i class="fa-solid fa-spinner fa-spin"></i> جارٍ الحفظ...';}
    try{
        const action=editingEmployeeId!==null?"updateEmployee":"addEmployee";
        const result=await api(action,{id:editingEmployeeId,name,username,password,department,role});
        if(!result.success){alert(result.message||"تعذر حفظ الموظف");return;}
        get("employeeModal")?.classList.remove("show");
        editingEmployeeId=null;
        await employeesPage();
        alert(action==="addEmployee"?"تمت إضافة الموظف بنجاح":"تم تحديث الموظف بنجاح");
    }catch(err){console.error(err);alert("حدث خطأ أثناء حفظ الموظف: "+(err.message||err));}
    finally{if(btn){btn.disabled=false;if(btn.dataset.old)btn.innerHTML=btn.dataset.old;}}
}

function editEmployee(id){
    const employee=employeesData.find(e=>String(e.id)===String(id));
    if(!employee)return;
    editingEmployeeId=employee.id;
    const set=(id,v)=>{const el=document.getElementById(id);if(el)el.value=v??"";};
    set("empName",employee.name);set("empUsername",employee.username);set("empPassword",employee.password);set("empDepartment",employee.department);set("empRole",normalizeRole(employee.role));
    const title=document.querySelector(".modal-title");if(title)title.textContent="تعديل الموظف";
    document.getElementById("employeeModal")?.classList.add("show");
}
window.editEmployee=editEmployee;

async function deleteEmployee(id){
    if(!confirm("هل تريد حذف هذا الموظف؟"))return;
    const result=await api("deleteEmployee",{id});
    if(result.success){await employeesPage();alert("تم حذف الموظف بنجاح");}else alert(result.message||"تعذر حذف الموظف");
}
window.deleteEmployee=deleteEmployee;

async function deleteReport(id){
    if(!confirm("هل تريد حذف هذا التقرير؟"))return;
    const result=await api("deleteReport",{id});
    if(result.success){await reportsPage();alert("تم حذف التقرير");}else alert(result.message||"تعذر حذف التقرير");
}
window.deleteReport=deleteReport;

async function saveSettings(){
    const result=await api("saveSettings",{uploadDay:document.getElementById("uploadDay").value,startTime:document.getElementById("startTime").value,endTime:document.getElementById("endTime").value});
    alert(result.success?"تم حفظ الإعدادات بنجاح":(result.message||"تعذر حفظ الإعدادات"));
}

/* ==========================
   Clock / Start
========================== */
function updateClock(){
    const now=new Date();
    const t=document.getElementById("currentTime"),d=document.getElementById("currentDate");
    if(t)t.textContent=now.toLocaleTimeString("ar-SA",{hour:"2-digit",minute:"2-digit"});
    if(d)d.textContent=now.toLocaleDateString("ar-SA");
}
updateClock();setInterval(updateClock,1000);

document.getElementById("logoutBtn")?.addEventListener("click",()=>{if(!confirm("هل تريد تسجيل الخروج؟"))return;localStorage.removeItem("currentUser");location.replace("index.html");});

document.querySelectorAll(".menu-card").forEach(x=>x.classList.remove("active"));
document.querySelector('[data-page="dashboard"]')?.classList.add("active");
dashboardPage();
