/* ==========================================
   Weekly Reports System
   API Service
   Performance optimized
========================================== */

const apiInFlight = new Map();
let apiSettingsCache = null;
let apiSettingsCacheAt = 0;
const API_SETTINGS_TTL = 30000;

async function api(action, data = {}) {
    const payload = data || {};
    const key = action + "::" + JSON.stringify(payload);
    const now = Date.now();

    // Settings change infrequently, so keep them briefly in memory.
    if (
        action === "getSettings" &&
        apiSettingsCache &&
        now - apiSettingsCacheAt < API_SETTINGS_TTL
    ) {
        return apiSettingsCache;
    }

    // If the same request is already running, share its Promise.
    // This removes duplicate simultaneous calls without changing data behavior.
    if (apiInFlight.has(key)) {
        return apiInFlight.get(key);
    }

    const request = fetch(CONFIG.API_URL, {
        method: "POST",
        body: JSON.stringify({
            action,
            ...payload
        })
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            return response.json();
        })
        .then(result => {
            if (action === "getSettings" && result && result.success) {
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

function invalidateApiCache() {
    apiSettingsCache = null;
    apiSettingsCacheAt = 0;
}
