/* ==========================================
   Employee PDF Viewer
   Same in-app preview approach as manager.js
========================================== */

(function () {
    "use strict";

    function previewUrl(url) {
        const value = String(url || "");
        const fileMatch = value.match(/\/file\/d\/([^/]+)/);
        if (fileMatch) return `https://drive.google.com/file/d/${fileMatch[1]}/preview`;

        const idMatch = value.match(/[?&]id=([^&]+)/);
        if (idMatch) return `https://drive.google.com/file/d/${idMatch[1]}/preview`;

        return value;
    }

    function openPdf(url, title) {
        const modal = document.getElementById("employeePdfModal");
        const frame = document.getElementById("employeePdfFrame");
        const titleEl = document.getElementById("employeePdfTitle");

        if (!modal || !frame) {
            window.open(url, "_blank", "noopener,noreferrer");
            return;
        }

        if (titleEl) titleEl.textContent = title || "عرض التقرير";
        frame.src = previewUrl(url);
        modal.classList.add("show");
        modal.setAttribute("aria-hidden", "false");
        document.body.classList.add("pdf-viewer-open");
    }

    function closePdf() {
        const modal = document.getElementById("employeePdfModal");
        const frame = document.getElementById("employeePdfFrame");
        if (!modal) return;

        modal.classList.remove("show");
        modal.setAttribute("aria-hidden", "true");
        if (frame) frame.src = "about:blank";
        document.body.classList.remove("pdf-viewer-open");
    }

    window.openEmployeePdf = openPdf;
    window.closeEmployeePdf = closePdf;

    // loadReports() creates these links dynamically, so use event delegation.
    document.addEventListener("click", function (event) {
        const button = event.target.closest(".reports-list .view-btn");
        if (!button) return;

        event.preventDefault();
        event.stopImmediatePropagation();

        const url = button.getAttribute("href") || "";
        const title = button.getAttribute("data-pdf-title") || "عرض التقرير";
        openPdf(url, title);
    }, true);

    document.addEventListener("click", function (event) {
        if (event.target.closest("#employeePdfClose") || event.target.id === "employeePdfModal") {
            closePdf();
        }
    });

    document.addEventListener("keydown", function (event) {
        if (event.key === "Escape") closePdf();
    });
})();
