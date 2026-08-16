/* My Account functionality.
   This is a frontend prototype only; localStorage is not suitable
   for production authentication or real medical data. */

(function () {
  "use strict";

  var ACCOUNT_KEY = "wellframe:account";
  var SESSION_KEY = "wellframe:accountLoggedIn";

  document.addEventListener("DOMContentLoaded", init);

  function $(id) {
    return document.getElementById(id);
  }

  function getAccount() {
    try {
      var raw = localStorage.getItem(ACCOUNT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveAccount(account) {
    try {
      localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
      return true;
    } catch (error) {
      return false;
    }
  }

  function isLoggedIn() {
    try {
      return localStorage.getItem(SESSION_KEY) === "true";
    } catch (error) {
      return false;
    }
  }

  function setLoggedIn(value) {
    try {
      if (value) {
        localStorage.setItem(SESSION_KEY, "true");
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch (error) {}
  }

  function clearErrors(form) {
    form.querySelectorAll(".field-error").forEach(function (el) {
      el.textContent = "";
    });
    var message = form.querySelector(".form-message");
    if (message) {
      message.textContent = "";
      message.classList.remove("success");
    }
  }

  function setError(id, message) {
    var el = document.querySelector('[data-error-for="' + id + '"]');
    if (el) el.textContent = message;
  }

  function setMessage(id, message, success) {
    var el = $(id);
    if (!el) return;
    el.textContent = message;
    el.classList.toggle("success", Boolean(success));
  }

  function validEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function validateRegistration() {
    var valid = true;
    var name = $("registerName").value.trim();
    var email = $("registerEmail").value.trim();
    var age = Number($("registerAge").value);
    var username = $("registerUsername").value.trim();
    var password = $("registerPassword").value;
    var confirm = $("registerConfirm").value;

    if (!name) {
      setError("registerName", "Full name is required.");
      valid = false;
    }
    if (!validEmail(email)) {
      setError("registerEmail", "Enter a valid email address.");
      valid = false;
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("registerAge", "Enter a valid age.");
      valid = false;
    }
    if (!username) {
      setError("registerUsername", "Username is required.");
      valid = false;
    }
    if (!password) {
      setError("registerPassword", "Password is required.");
      valid = false;
    }
    if (password !== confirm) {
      setError("registerConfirm", "Passwords do not match.");
      valid = false;
    }

    return valid;
  }

  function validateSettings() {
    var valid = true;
    var name = $("settingsName").value.trim();
    var email = $("settingsEmail").value.trim();
    var age = Number($("settingsAge").value);
    var username = $("settingsUsername").value.trim();

    if (!name) {
      setError("settingsName", "Full name is required.");
      valid = false;
    }
    if (!validEmail(email)) {
      setError("settingsEmail", "Enter a valid email address.");
      valid = false;
    }
    if (!Number.isInteger(age) || age < 1 || age > 120) {
      setError("settingsAge", "Enter a valid age.");
      valid = false;
    }
    if (!username) {
      setError("settingsUsername", "Username is required.");
      valid = false;
    }

    return valid;
  }

  function showAuthTab(tab) {
    var loginForm = $("loginForm");
    var registerForm = $("registerForm");

    document.querySelectorAll("[data-auth-tab]").forEach(function (button) {
      button.classList.toggle("is-active", button.getAttribute("data-auth-tab") === tab);
    });

    loginForm.hidden = tab !== "login";
    registerForm.hidden = tab !== "register";
    clearErrors(tab === "login" ? loginForm : registerForm);
  }

  function initials(name) {
    return name.trim().split(/\s+/).slice(0, 2).map(function (part) {
      return part.charAt(0).toUpperCase();
    }).join("");
  }

  function renderDashboard(account) {
    $("authView").hidden = true;
    $("dashboardView").hidden = false;

    $("profileName").textContent = account.name;
    $("profileFullName").textContent = account.name;
    $("profileEmail").textContent = account.email;
    $("profileAge").textContent = String(account.age);
    $("profileUsername").textContent = account.username;
    $("profileInitials").textContent = initials(account.name) || "U";

    $("settingsName").value = account.name;
    $("settingsEmail").value = account.email;
    $("settingsAge").value = account.age;
    $("settingsUsername").value = account.username;
  }

  function renderLogin() {
    $("authView").hidden = false;
    $("dashboardView").hidden = true;
    showAuthTab("login");
    $("loginForm").reset();
  }

  function init() {
    var authView = $("authView");
    if (!authView) return;

    document.querySelectorAll("[data-auth-tab]").forEach(function (button) {
      button.addEventListener("click", function () {
        showAuthTab(button.getAttribute("data-auth-tab"));
      });
    });

    $("registerForm").addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors(this);
      setMessage("registerMessage", "");

      if (!validateRegistration()) return;

      var existing = getAccount();
      var username = $("registerUsername").value.trim();

      if (existing && existing.username.toLowerCase() === username.toLowerCase()) {
        setMessage("registerMessage", "That username is already registered.");
        return;
      }

      var account = {
        name: $("registerName").value.trim(),
        email: $("registerEmail").value.trim(),
        age: Number($("registerAge").value),
        username: username,
        password: $("registerPassword").value
      };

      if (!saveAccount(account)) {
        setMessage("registerMessage", "Unable to save the account in this browser.");
        return;
      }

      $("registerForm").reset();
      showAuthTab("login");
      $("loginUsername").value = account.username;
      setMessage("loginMessage", "Account created. You can now log in.", true);
    });

    $("loginForm").addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors(this);
      setMessage("loginMessage", "");

      var username = $("loginUsername").value.trim();
      var password = $("loginPassword").value;
      var account = getAccount();

      if (!username) {
        setError("loginUsername", "Username is required.");
        return;
      }
      if (!password) {
        setError("loginPassword", "Password is required.");
        return;
      }

      if (!account || account.username !== username || account.password !== password) {
        setMessage("loginMessage", "Invalid username or password.");
        return;
      }

      setLoggedIn(true);
      renderDashboard(account);
    });

    $("settingsButton").addEventListener("click", function () {
      $("settingsCard").hidden = false;
      $("settingsName").focus();
    });

    $("cancelSettings").addEventListener("click", function () {
      $("settingsCard").hidden = true;
      clearErrors($("settingsForm"));
    });

    $("settingsForm").addEventListener("submit", function (event) {
      event.preventDefault();
      clearErrors(this);
      setMessage("settingsMessage", "");

      if (!validateSettings()) return;

      var account = getAccount();
      if (!account) {
        setLoggedIn(false);
        renderLogin();
        return;
      }

      var newUsername = $("settingsUsername").value.trim();
      if (account.username.toLowerCase() !== newUsername.toLowerCase()) {
        var other = getAccount();
        if (other && other.username.toLowerCase() !== account.username.toLowerCase()) {
          setMessage("settingsMessage", "Unable to change username in this single-account prototype.");
          return;
        }
      }

      account.name = $("settingsName").value.trim();
      account.email = $("settingsEmail").value.trim();
      account.age = Number($("settingsAge").value);
      account.username = newUsername;

      if (!saveAccount(account)) {
        setMessage("settingsMessage", "Unable to save your changes.");
        return;
      }

      setMessage("settingsMessage", "Account updated successfully.", true);
      renderDashboard(account);
      $("settingsCard").hidden = false;
    });

    $("logoutButton").addEventListener("click", function () {
      setLoggedIn(false);
      $("settingsCard").hidden = true;
      renderLogin();
    });

    if (isLoggedIn() && getAccount()) {
      renderDashboard(getAccount());
    } else {
      renderLogin();
    }
  }
})();
