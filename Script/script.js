/* ===================================================================
   WELLFRAME — GLOBAL SCRIPT
   Shared by every page in this project. Keep logic generic/reusable:
   any DOM lookups are guarded so pages that don't include an element
   (e.g. a page without the rhythm ring) never throw console errors.
   =================================================================== */

(function () {
  "use strict";

  var MOBILE_BREAKPOINT = 860;
  var STORAGE_KEY = "wellframe:sidebarCollapsed";

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    initSidebarToggle();
    initMobileDrawer();
    initDateDisplay();
    initRhythmRing();
    initFooterYear();
    initGreeting();
  }

  /* -----------------------------------------------------------------
     Sidebar collapse / expand (desktop)
     ----------------------------------------------------------------- */
  function initSidebarToggle() {
    var toggleBtn = document.getElementById("sidebarToggle");
    if (!toggleBtn) return;

    var body = document.body;

    // Restore persisted preference, guarded against storage errors
    // (e.g. privacy mode) so it never breaks page load.
    var stored = safeGetItem(STORAGE_KEY);
    if (stored === "true") {
      body.setAttribute("data-sidebar-collapsed", "true");
      toggleBtn.setAttribute("aria-expanded", "false");
    }

    toggleBtn.addEventListener("click", function () {
      var isCollapsed = body.getAttribute("data-sidebar-collapsed") === "true";
      var next = !isCollapsed;

      body.setAttribute("data-sidebar-collapsed", String(next));
      toggleBtn.setAttribute("aria-expanded", String(!next));
      toggleBtn.setAttribute(
        "aria-label",
        next ? "Expand navigation sidebar" : "Collapse navigation sidebar"
      );

      safeSetItem(STORAGE_KEY, String(next));
    });
  }

  /* -----------------------------------------------------------------
     Mobile navigation drawer
     ----------------------------------------------------------------- */
  function initMobileDrawer() {
    var menuBtn = document.getElementById("mobileMenuToggle");
    var overlay = document.getElementById("sidebarOverlay");
    var sidebar = document.getElementById("sidebar");
    var body = document.body;

    if (!menuBtn || !sidebar) return;

    function openDrawer() {
      body.setAttribute("data-mobile-nav-open", "true");
      menuBtn.setAttribute("aria-expanded", "true");
      if (overlay) overlay.hidden = false;
    }

    function closeDrawer() {
      body.setAttribute("data-mobile-nav-open", "false");
      menuBtn.setAttribute("aria-expanded", "false");
      if (overlay) overlay.hidden = true;
    }

    menuBtn.addEventListener("click", function () {
      var isOpen = body.getAttribute("data-mobile-nav-open") === "true";
      if (isOpen) {
        closeDrawer();
      } else {
        openDrawer();
      }
    });

    if (overlay) {
      overlay.addEventListener("click", closeDrawer);
    }

    // Close drawer after choosing a nav link (better mobile UX)
    var navLinks = sidebar.querySelectorAll(".nav-link");
    navLinks.forEach(function (link) {
      link.addEventListener("click", function () {
        if (window.innerWidth <= MOBILE_BREAKPOINT) {
          closeDrawer();
        }
      });
    });

    // Close drawer with Escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && body.getAttribute("data-mobile-nav-open") === "true") {
        closeDrawer();
        menuBtn.focus();
      }
    });

    // Reset drawer state if the viewport grows back to desktop size
    window.addEventListener("resize", function () {
      if (window.innerWidth > MOBILE_BREAKPOINT) {
        closeDrawer();
      }
    });
  }

  /* -----------------------------------------------------------------
     Current date display (header)
     ----------------------------------------------------------------- */
  function initDateDisplay() {
    var dateEl = document.getElementById("currentDate");
    if (!dateEl) return;

    var now = new Date();
    var formatted = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric",
    });

    dateEl.textContent = formatted;
    dateEl.setAttribute("datetime", now.toISOString().slice(0, 10));
  }

  /* -----------------------------------------------------------------
     Greeting text — swaps by time of day. User name is a placeholder;
     replace the value below once real auth/profile data exists.
     ----------------------------------------------------------------- */
  function initGreeting() {
    var titleEl = document.getElementById("greetingTitle");
    var eyebrowEl = document.getElementById("greetingEyebrow");
    if (!titleEl && !eyebrowEl) return;

    var userName = "Riya"; // TODO: replace with real user data source
    var hour = new Date().getHours();
    var greeting = "Good Morning";

    if (hour >= 12 && hour < 17) {
      greeting = "Good Afternoon";
    } else if (hour >= 17 || hour < 5) {
      greeting = "Good Evening";
    }

    if (titleEl) titleEl.textContent = greeting + ", " + userName;
    if (eyebrowEl) eyebrowEl.textContent = greeting;
  }

  /* -----------------------------------------------------------------
     Daily Rhythm Ring — animates the circular wellness score on load
     ----------------------------------------------------------------- */
  function initRhythmRing() {
    var ring = document.querySelector("[data-ring-progress]");
    if (!ring) return;

    var percent = parseFloat(ring.getAttribute("data-ring-progress"));
    if (isNaN(percent)) return;

    var radius = ring.r ? ring.r.baseVal.value : 86;
    var circumference = 2 * Math.PI * radius;
    var offset = circumference - (percent / 100) * circumference;

    ring.style.strokeDasharray = String(circumference);
    ring.style.strokeDashoffset = String(circumference);

    // Animate on next frame so the transition is visible
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        ring.style.strokeDashoffset = String(offset);
      });
    });
  }

  /* -----------------------------------------------------------------
     Footer year
     ----------------------------------------------------------------- */
  function initFooterYear() {
    var yearEl = document.getElementById("footerYear");
    if (!yearEl) return;
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* -----------------------------------------------------------------
     Storage helpers (guarded against privacy-mode / quota errors)
     ----------------------------------------------------------------- */
  function safeGetItem(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (err) {
      return null;
    }
  }

  function safeSetItem(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      /* no-op — persistence is a nice-to-have, not required */
    }
  }
})();
