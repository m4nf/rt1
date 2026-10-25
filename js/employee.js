/* ==========================================
   Weekly Reports System
   Employee Page
========================================== */

/* ==========================
   Current User
========================== */

const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);

/* ==========================
   Protection
========================== */

if (!currentUser) {

    location.href = "index.html";

    throw new Error("No current user");

}

if (
    String(currentUser.role || "")
        .trim()
        .toLowerCase() !== "employee"
) {

    location.href = "index.html";

    throw new Error("Unauthorized");

}

/* ==========================
   Elements
========================== */

const employeeName =
    document.getElementById("employeeName");

const employeeDepartment =
    document.getElementById("employeeDepartment");

const todayDate =
    document.getElementById("todayDate");

const weekNumber =
    document.getElementById("weekNumber");

const pdfFile =
    document.getElementById("pdfFile");

const selectedFile =
    document.getElementById("selectedFile");

const uploadBtn =
    document.getElementById("uploadBtn");

const uploadText =
    document.getElementById("uploadText");

const reportsTable =
    document.getElementById("reportsTable");

const uploadNotice =
    document.getElementById("uploadNotice");

const successCard =
    document.getElementById("successCard");

const dashboardGrid =
    document.querySelector(".dashboard-grid");

const uploadCard =
    document.getElementById("uploadCard");

const logoutBtn =
    document.getElementById("logoutBtn");

/* ==========================
   Employee Information
========================== */

employeeName.textContent =
    currentUser.name || "الموظف";

employeeDepartment.textContent =
    currentUser.department || "غير محدد";

/* ==========================
   Today Date
========================== */

const today = new Date();

todayDate.textContent =
    today.toLocaleDateString("ar-EG");

/* ==========================
   Week Number
========================== */

function getMonthWeek(date) {

    const months = [

        "يناير",
        "فبراير",
        "مارس",
        "أبريل",
        "مايو",
        "يونيو",
        "يوليو",
        "أغسطس",
        "سبتمبر",
        "أكتوبر",
        "نوفمبر",
        "ديسمبر"

    ];

    const weekNames = [

        "الأول",
        "الثاني",
        "الثالث",
        "الرابع",
        "الخامس"

    ];

    const week =
        Math.ceil(date.getDate() / 7);

    return `الأسبوع ${weekNames[week - 1]} - ${months[date.getMonth()]}`;

}

weekNumber.textContent =
    getMonthWeek(today);

/* ==========================
   Dialog Helpers
========================== */

async function employeeAlert(
    message,
    type = "warning",
    title = ""
) {

    if (type === "success" &&
        typeof showSuccess === "function") {

        return showSuccess(
            message,
            title || "تمت العملية بنجاح"
        );

    }

    if (type === "error" &&
        typeof showError === "function") {

        return showError(
            message,
            title || "حدث خطأ"
        );

    }

    if (typeof showWarning === "function") {

        return showWarning(
            message,
            title || "تنبيه"
        );

    }

    alert(message);

}

/* ==========================
   Logout
========================== */

logoutBtn.addEventListener(
    "click",
    async () => {

        let confirmed = true;

        if (typeof showConfirm === "function") {

            confirmed = await showConfirm(
                "هل تريد تسجيل الخروج؟",
                "تسجيل الخروج"
            );

        } else {

            confirmed =
                confirm("هل تريد تسجيل الخروج؟");

        }

        if (!confirmed) return;

        localStorage.removeItem(
            "currentUser"
        );

        location.href = "index.html";

    }
);

/* ==========================
   File Picker
========================== */

pdfFile.addEventListener(
    "change",
    () => {

        if (!pdfFile.files.length) {

            selectedFile.innerHTML =
                "لم يتم اختيار أي ملف";

            return;

        }

        const file =
            pdfFile.files[0];

        if (
            file.type !== "application/pdf" &&
            !file.name.toLowerCase().endsWith(".pdf")
        ) {

            pdfFile.value = "";

            selectedFile.innerHTML =
                "لم يتم اختيار أي ملف";

            employeeAlert(
                "يسمح فقط بملفات PDF.",
                "error",
                "نوع الملف غير صحيح"
            );

            return;

        }

        selectedFile.innerHTML =

            `<strong>${escapeHtml(file.name)}</strong>
             <br>
             ${(
                 file.size / 1024 / 1024
             ).toFixed(2)} MB`;

    }
);

/* ==========================
   Upload Report
========================== */

uploadBtn.addEventListener(
    "click",
    uploadReport
);

async function uploadReport() {

    if (!pdfFile.files.length) {

        await employeeAlert(
            "اختر ملف PDF أولاً.",
            "warning",
            "لم يتم اختيار ملف"
        );

        return;

    }

    uploadBtn.disabled = true;

    uploadText.innerHTML =

        '<i class="fa-solid fa-spinner fa-spin"></i> جارٍ رفع التقرير...';

    const file =
        pdfFile.files[0];

    const reader =
        new FileReader();

    reader.onload = async () => {

        try {

            const base64 =
                reader.result.split(",")[1];

            const result =
                await api(
                    "uploadReport",
                    {

                        employeeId:
                            currentUser.id,

                        employeeName:
                            currentUser.name,

                        department:
                            currentUser.department,

                        week:
                            getMonthWeek(
                                new Date()
                            ),

                        fileName:
                            file.name,

                        mimeType:
                            file.type,

                        fileData:
                            base64

                    }
                );

            if (result.success) {

                pdfFile.value = "";

                selectedFile.innerHTML =
                    "لم يتم اختيار أي ملف";

                uploadCard.style.display =
                    "none";

                successCard.style.display =
                    "flex";

                dashboardGrid.classList.add(
                    "report-uploaded"
                );

                await loadReports();

            } else {

                await employeeAlert(
                    result.message ||
                    "تعذر رفع التقرير.",
                    "error",
                    "تعذر رفع التقرير"
                );

            }

        } catch (error) {

            await employeeAlert(
                "حدث خطأ أثناء رفع التقرير.",
                "error",
                "حدث خطأ"
            );

        } finally {

            uploadBtn.disabled = false;

            uploadText.innerHTML =

                '<i class="fa-solid fa-cloud-arrow-up"></i> رفع التقرير';

        }

    };

    reader.onerror = async () => {

        uploadBtn.disabled = false;

        uploadText.innerHTML =

            '<i class="fa-solid fa-cloud-arrow-up"></i> رفع التقرير';

        await employeeAlert(
            "تعذر قراءة الملف.",
            "error",
            "حدث خطأ"
        );

    };

    reader.readAsDataURL(file);

}

/* ==========================
   Start
========================== */

checkWeeklyReport();
checkUploadPermission();
loadReports();

/* ==========================
   Weekly Report Check
========================== */

async function checkWeeklyReport() {

    const result =
        await api(
            "checkWeeklyReport",
            {

                employeeId:
                    currentUser.id,

                week:
                    getMonthWeek(
                        new Date()
                    )

            }
        );

    if (!result.success) return;

    if (result.uploaded) {

        uploadCard.style.display =
            "none";

        successCard.style.display =
            "flex";

        dashboardGrid.classList.add(
            "report-uploaded"
        );

    } else {

        uploadCard.style.display =
            "block";

        successCard.style.display =
            "none";

        dashboardGrid.classList.remove(
            "report-uploaded"
        );

    }

}

/* ==========================
   Upload Permission
========================== */

async function checkUploadPermission() {

    const result =
        await api("getSettings");

    if (!result.success) return;

    const weekly =
        await api(
            "checkWeeklyReport",
            {

                employeeId:
                    currentUser.id,

                week:
                    getMonthWeek(
                        new Date()
                    )

            }
        );

    if (
        weekly.success &&
        weekly.uploaded
    ) {

        uploadNotice.style.display =
            "none";

        return;

    }

    const settings =
        result.settings;

    const dayNames = {

        0: "الأحد",
        1: "الإثنين",
        2: "الثلاثاء",
        3: "الأربعاء",
        4: "الخميس",
        5: "الجمعة",
        6: "السبت"

    };

    function formatTime(time) {

        const parts =
            String(time).split(":");

        let hour =
            parseInt(parts[0], 10);

        const minute =
            parts[1] || "00";

        const period =
            hour >= 12 ? "م" : "ص";

        hour =
            hour % 12;

        if (hour === 0) {
            hour = 12;
        }

        return (
            `${String(hour).padStart(2, "0")}:${minute} ${period}`
        );

    }

    const now = new Date();

    const todayName =
        String(now.getDay());

    const currentTime =

        String(now.getHours())
            .padStart(2, "0") +

        ":" +

        String(now.getMinutes())
            .padStart(2, "0");

    const start =
        String(settings.startTime)
            .substring(0, 5);

    const end =
        String(settings.endTime)
            .substring(0, 5);

    const allowed =

        todayName ===
            String(settings.uploadDay) &&

        currentTime >= start &&

        currentTime <= end;

    if (allowed) {

        uploadNotice.style.display =
            "none";

        uploadBtn.disabled = false;

        uploadBtn.innerHTML =

            '<span id="uploadText"><i class="fa-solid fa-cloud-arrow-up"></i> رفع التقرير</span>';

        return;

    }

    uploadBtn.disabled = true;

    uploadBtn.innerHTML =

        '<span id="uploadText"><i class="fa-solid fa-lock"></i> رفع التقارير غير متاح</span>';

    uploadNotice.style.display =
        "block";

    uploadNotice.innerHTML = `

        <h3>
            <i class="fa-solid fa-lock"></i>
            رفع التقارير مغلق حالياً
        </h3>

        <div class="notice-row">

            <span class="notice-label">
                📅 يوم الرفع
            </span>

            <span class="notice-value">
                ${escapeHtml(
                    dayNames[settings.uploadDay] || ""
                )}
            </span>

        </div>

        <div class="notice-row">

            <span class="notice-label">
                🕓 وقت الرفع
            </span>

            <span class="notice-value">
                ${formatTime(start)}
                &nbsp;←&nbsp;
                ${formatTime(end)}
            </span>

        </div>

        <div class="notice-footer">
            سيتم تفعيل رفع التقارير تلقائياً عند بداية الموعد المحدد.
        </div>

    `;

}

/* ==========================
   Previous Reports
========================== */

async function loadReports() {

    const result =
        await api(
            "getReports",
            {
                employeeId:
                    currentUser.id
            }
        );

    if (!result.success) {

        reportsTable.innerHTML = `

            <div class="empty">

                <i class="fa-solid fa-triangle-exclamation"></i>

                <span>تعذر تحميل التقارير</span>

            </div>

        `;

        return;

    }

    if (
        !result.reports ||
        result.reports.length === 0
    ) {

        reportsTable.innerHTML = `

            <div class="empty">

                <i class="fa-regular fa-folder-open"></i>

                <span>لا توجد تقارير حتى الآن</span>

            </div>

        `;

        return;

    }

    let html = "";

    result.reports.forEach(report => {

        const date =
            new Date(report.uploadDate);

        const reportDate =
            date.toLocaleString(
                "ar-EG",
                {

                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true

                }
            );

        html += `

            <div class="report-item">

                <div class="report-main">

                    <span class="report-week">
                        ${escapeHtml(
                            report.week || "تقرير أسبوعي"
                        )}
                    </span>

                    <span class="report-date">
                        ${escapeHtml(reportDate)}
                    </span>

                    <span class="report-file">
                        ${escapeHtml(
                            report.fileName || "ملف PDF"
                        )}
                    </span>

                </div>

                <a
                    href="${escapeAttribute(report.url)}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="view-btn">

                    <i class="fa-solid fa-eye"></i>

                    عرض

                </a>

            </div>

        `;

    });

    reportsTable.innerHTML =
        html;

}

/* ==========================
   Safe Text Helpers
========================== */

function escapeHtml(value) {

    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}

function escapeAttribute(value) {

    return escapeHtml(value);

}
