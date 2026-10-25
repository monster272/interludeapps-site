// Website visit counts, through PostHog's EU region (the same project as the app).
// Cookieless by construction: the library keeps its state in memory only, so it
// writes no cookie and nothing to the visitor's storage, and every page load is a
// new anonymous visit. No profiles, no autocapture, no session replay, no IP
// location (and "Discard client IP data" is on in the project). Addresses are sent
// without their query string, except a ?ref= or utm_ tag, so a link that carries a
// token can never leak one. A browser asking not to be tracked (Do Not Track or
// Global Privacy Control) loads nothing at all. What is sent is described in
// privacy.html#website; change both together.
(function () {
  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" || navigator.globalPrivacyControl) return;
  var KEY = "phc_tfyy9bHi68p98kY5VXhSutZJxKxpsMvh9Hdv2wjoYKT9";
  var KEEP = /^(ref|utm_[a-z]+)$/;
  function clean(v) {
    if (typeof v !== "string" || !/^https?:\/\//.test(v)) return v;
    try {
      var u = new URL(v), q = new URLSearchParams();
      u.searchParams.forEach(function (val, k) { if (KEEP.test(k)) q.set(k, val.slice(0, 40)); });
      u.search = q.toString(); u.hash = "";
      return u.toString();
    } catch (e) { return null; }
  }
  // PostHog's own loader snippet: a stub that queues calls until array.js arrives.
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister opt_out_capturing has_opted_out_capturing opt_in_capturing reset".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init(KEY, {
    api_host: "https://eu.i.posthog.com",
    persistence: "memory",
    person_profiles: "never",
    autocapture: false,
    capture_pageview: true,
    capture_pageleave: true,
    capture_dead_clicks: false,
    capture_heatmaps: false,
    capture_performance: false,
    disable_session_recording: true,
    disable_surveys: true,
    advanced_disable_feature_flags: true,
    disable_external_dependency_loading: true,
    before_send: function (ev) {
      var p = ev && ev.properties;
      if (p) for (var k in p) if (typeof p[k] === "string") p[k] = clean(p[k]);
      var s = ev && ev.$set_once;
      if (s) for (var j in s) if (typeof s[j] === "string") s[j] = clean(s[j]);
      return ev;
    }
  });
  posthog.register({ $geoip_disable: true, site: location.host });
})();

// The page's own moments, sent only if the script above loaded. Never an email.
window.calkeyStat = function (name, props) {
  try { if (window.posthog && window.posthog.capture) window.posthog.capture(name, props || {}); } catch (e) {}
};
