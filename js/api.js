/* ==========================================
   Weekly Reports System
   API Service
   School database connection
========================================== */

const apiInFlight = new Map();
let apiSettingsCache = null;
let apiSettingsCacheAt = 0;
const API_SETTINGS_TTL = 30000;

/**
 * تحديد رابط API الخاص بقاعدة بيانات المدرسة.
 * يُفضّل رابط المدرسة على الرابط القديم.
 */
function getApiEndpoint() {
    return (
        (typeof CONFIG !== "undefined" &&
            CONFIG.SCHOOL_DATABASE_API_URL) ||
        (typeof CONFIG !== "undefined" &&
            CONFIG.API_URL) ||
        ""
    );
}

/**
 * استخراج رمز جلسة المستخدم الحالي.
 */
function getSessionToken() {
    try {
        const user = JSON.parse(
            localStorage.getItem("currentUser") || "null"
        );

        return user && (user.sessionToken || user.token)
            ? (user.sessionToken || user.token)
            : "";
    } catch (error) {
        return "";
    }
}

/**
 * إرسال طلب إلى واجهة برمجة التطبيقات.
 */
async function api(action, data = {}) {
    const payload = data || {};
    const key = action + "::" + JSON.stringify(payload);
    const now = Date.now();

    // الاحتفاظ بالإعدادات مؤقتًا لتقليل الطلبات المتكررة.
    if (
        action === "getSettings" &&
        apiSettingsCache &&
        now - apiSettingsCacheAt < API_SETTINGS_TTL
    ) {
        return apiSettingsCache;
    }

    // مشاركة الطلب الجاري إذا كان الطلب نفسه قيد التنفيذ.
    if (apiInFlight.has(key)) {
        return apiInFlight.get(key);
    }

    const endpoint = getApiEndpoint();

    if (!endpoint) {
        throw new Error(
            "رابط قاعدة البيانات غير مضبوط في CONFIG."
        );
    }

    const token = getSessionToken();

    const request = fetch(endpoint, {
        method: "POST",

        // نترك Content-Type دون تحديد لتجنب طلب CORS تمهيدي
        // غير ضروري مع Google Apps Script في الحالات المعتادة.
        body: JSON.stringify({
            action,
            ...payload,
            ...(token ? { token } : {})
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return response.json();
        })
        .then(result => {
            if (
                action === "getSettings" &&
                result &&
                result.success
            ) {
                apiSettingsCache = result;
                apiSettingsCacheAt = Date.now();
            }

            return result;
        })
        .finally(() => {
            apiInFlight.delete(key);
        });

    apiInFlight.set(key, request);

    return request;
}

/**
 * إلغاء التخزين المؤقت للإعدادات.
 */
function invalidateApiCache() {
    apiSettingsCache = null;
    apiSettingsCacheAt = 0;
}
