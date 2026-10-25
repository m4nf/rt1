(() => {
  const isStandalone = () => window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone()) return;

  let deferredPrompt = null;
  const banner = document.createElement('div');
  banner.id = 'pwaInstallBanner';
  banner.innerHTML = `
    <div class="pwa-install-icon"><img src="assets/logo.png" alt=""></div>
    <div class="pwa-install-content">
      <strong>ثبّت تطبيق التقارير</strong>
      <span id="pwaInstallHint">وصول سريع للنظام من شاشة جهازك</span>
    </div>
    <button id="pwaInstallAction" type="button">تثبيت</button>
    <button id="pwaInstallClose" type="button" aria-label="إغلاق">×</button>`;

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const action = banner.querySelector('#pwaInstallAction');
  const hint = banner.querySelector('#pwaInstallHint');

  const show = () => {
    if (!document.body || isStandalone()) return;
    if (sessionStorage.getItem('pwa-install-dismissed') === '1') return;
    if (!document.getElementById('pwaInstallBanner')) document.body.appendChild(banner);
  };

  // Android/Chrome: show the notice only when the browser confirms that the app can be installed.
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    deferredPrompt = e;
    show();
  });

  // iPhone/iPad Safari has no beforeinstallprompt, so show a small instruction notice.
  if (isIOS && isSafari) {
    hint.textContent = 'من Safari اضغط مشاركة ثم «إضافة إلى الشاشة الرئيسية»';
    action.textContent = 'التعليمات';
    setTimeout(show, 900);
  }

  action.addEventListener('click', async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      banner.remove();
      return;
    }
    if (isIOS) alert('من Safari اضغط زر المشاركة ثم اختر «إضافة إلى الشاشة الرئيسية».');
  });

  banner.querySelector('#pwaInstallClose').addEventListener('click', () => {
    sessionStorage.setItem('pwa-install-dismissed', '1');
    banner.remove();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    banner.remove();
  });
})();
