/* ==========================================
   Weekly Reports System
   Authentication
========================================== */

const loginBtn = document.getElementById("loginBtn");
const loginText = document.getElementById("loginText");
const username = document.getElementById("username");
const password = document.getElementById("password");

loginBtn.addEventListener("click", login);
username.addEventListener("keydown", e => { if (e.key === "Enter") login(); });
password.addEventListener("keydown", e => { if (e.key === "Enter") login(); });

async function login() {
    if (!username.value.trim() || !password.value.trim()) {
        if (typeof showWarning === "function") await showWarning("يرجى إدخال اسم المستخدم وكلمة المرور", "بيانات الدخول ناقصة");
        else alert("يرجى إدخال اسم المستخدم وكلمة المرور");
        return;
    }

    loginBtn.disabled = true;
    loginText.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i>&nbsp; جارٍ تسجيل الدخول...`;

    try {
        const result = await api("login", {username: username.value.trim(), password: password.value.trim()});
        if (!result.success) {
            loginBtn.disabled = false;
            loginText.textContent = "تسجيل الدخول";
            if (typeof showError === "function") await showError(result.message || "بيانات الدخول غير صحيحة", "تعذر تسجيل الدخول");
            else alert(result.message);
            return;
        }
        localStorage.setItem("currentUser", JSON.stringify(result.user));
        if (result.user.role === "admin") location.href = "admin.html";
        else if (result.user.role === "manager") location.href = "manager.html";
        else location.href = "employee.html";
    } catch (error) {
        loginBtn.disabled = false;
        loginText.textContent = "تسجيل الدخول";
        if (typeof showError === "function") await showError("تعذر الاتصال بالخادم. حاول مرة أخرى.", "تعذر الاتصال");
        else alert("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    }
}
