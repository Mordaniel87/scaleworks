/* Cookie-consent gate for Scaleworks: GA4 + Meta Pixel only load after opt-in. */
(function () {
  var GA_ID = 'G-WL4EHB4MFZ';
  var FB_ID = '199890867889488';

  function loadAnalytics() {
    if (window.__gaLoaded) return;
    window.__gaLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { dataLayer.push(arguments); };
    gtag('js', new Date());
    gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'assets/analytics.js';           // locally vendored gtag.js for G-WL4EHB4MFZ
    document.head.appendChild(s);
  }

  function loadMarketing() {
    if (window.__fbLoaded) return;
    window.__fbLoaded = true;
    !function (f, b, e, v, n, t, s) {
      if (f.fbq) return; n = f.fbq = function () {
        n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments)
      }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
      n.queue = []; t = b.createElement(e); t.async = !0; t.src = v;
      s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s)
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', FB_ID);
    fbq('track', 'PageView');
  }

  window.CookieConsent.run({
    guiOptions: {
      consentModal: { layout: 'box', position: 'bottom right', flipButtons: true },
      preferencesModal: { layout: 'box' }
    },
    categories: {
      necessary: { readOnly: true },
      analytics: {},
      marketing: {}
    },
    onFirstConsent: function (data) { apply(data.cookie.categories); },
    onConsent: function (data) { apply(data.cookie.categories); },
    onChange: function (data) { apply(data.cookie.categories); },
    language: {
      default: 'en',
      translations: {
        en: {
          consentModal: {
            title: 'We use cookies',
            description: 'We use analytics and advertising cookies to understand traffic and measure ad performance. See our <a href="legal.html#cookies">Cookie Policy</a>.',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject non-essential',
            showPreferencesBtn: 'Manage preferences'
          },
          preferencesModal: {
            title: 'Cookie preferences',
            acceptAllBtn: 'Accept all',
            acceptNecessaryBtn: 'Reject non-essential',
            savePreferencesBtn: 'Save preferences',
            closeIconLabel: 'Close',
            sections: [
              { title: 'Necessary', description: 'Required for the site to work.', linkedCategory: 'necessary' },
              { title: 'Analytics', description: 'Google Analytics — site usage measurement.', linkedCategory: 'analytics' },
              { title: 'Marketing', description: 'Meta Pixel — ad performance measurement.', linkedCategory: 'marketing' }
            ]
          }
        }
      }
    }
  });

  function apply(categories) {
    categories = categories || [];
    if (categories.indexOf('analytics') !== -1) loadAnalytics();
    if (categories.indexOf('marketing') !== -1) loadMarketing();
  }
})();
