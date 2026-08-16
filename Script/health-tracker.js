/* ===================================================================
   WELLFRAME — HEALTH TRACKER SCRIPT
   Page-specific logic for the Health Tracker page.
   All data is stored in localStorage for persistence.
   =================================================================== */

(function () {
  "use strict";

  var STORAGE_KEYS = {
    heartRate: "wellframe:healthTracker:heartRate",
    steps: "wellframe:healthTracker:steps",
    water: "wellframe:healthTracker:water",
    sleep: "wellframe:healthTracker:sleep",
    activities: "wellframe:healthTracker:activities"
  };

  var appState = {};

  document.addEventListener("DOMContentLoaded", init);

  function init() {
    // Initialize shared global functionality
    initDateDisplay();
    initFooterYear();

    // Initialize Health Tracker specific functionality
    initTabSystem();
    loadAllData();
    renderOverview();
    initHeartRateTab();
    initStepsTab();
    initWaterTab();
    initSleepTab();
    initActivityTab();
  }

  /* -----------------------------------------------------------------
     TAB SYSTEM
     ----------------------------------------------------------------- */
  function initTabSystem() {
    var tabButtons = document.querySelectorAll(".ht-tab-btn");
    var tabPanels = document.querySelectorAll(".ht-tab-panel");

    tabButtons.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var tabName = btn.getAttribute("data-tab");
        switchTab(tabName);
      });
    });

    function switchTab(tabName) {
      // Deactivate all tabs and panels
      tabButtons.forEach(function (btn) {
        btn.classList.remove("is-active");
        btn.setAttribute("aria-selected", "false");
      });
      tabPanels.forEach(function (panel) {
        panel.classList.remove("is-active");
      });

      // Activate selected tab and panel
      var activeBtn = document.querySelector('[data-tab="' + tabName + '"]');
      var activePanel = document.getElementById("tab-" + tabName);

      if (activeBtn) {
        activeBtn.classList.add("is-active");
        activeBtn.setAttribute("aria-selected", "true");
      }

      if (activePanel) {
        activePanel.classList.add("is-active");
      }
    }
  }

  /* -----------------------------------------------------------------
     DATA LOADING / SAVING
     ----------------------------------------------------------------- */
  function loadAllData() {
    appState.heartRate = safeGetJSON(STORAGE_KEYS.heartRate) || {
      measurements: []
    };
    appState.steps = safeGetJSON(STORAGE_KEYS.steps) || {
      goal: 8000,
      history: generateDefaultStepsHistory()
    };
    appState.water = safeGetJSON(STORAGE_KEYS.water) || {
      goal: 8,
      current: 0
    };
    appState.sleep = safeGetJSON(STORAGE_KEYS.sleep) || {
      history: generateDefaultSleepHistory()
    };
    appState.activities = safeGetJSON(STORAGE_KEYS.activities) || [];
  }

  function saveData(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.error("Failed to save data:", err);
    }
  }

  function safeGetJSON(key) {
    try {
      var val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      console.error("Failed to parse stored data:", err);
      return null;
    }
  }

  /* -----------------------------------------------------------------
     SHARED: DATE & FOOTER
     ----------------------------------------------------------------- */
  function initDateDisplay() {
    var dateEl = document.getElementById("currentDate");
    if (!dateEl) return;

    var now = new Date();
    var formatted = now.toLocaleDateString(undefined, {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

    dateEl.textContent = formatted;
    dateEl.setAttribute("datetime", now.toISOString().slice(0, 10));
  }

  function initFooterYear() {
    var yearEl = document.getElementById("footerYear");
    if (!yearEl) return;
    yearEl.textContent = String(new Date().getFullYear());
  }

  /* -----------------------------------------------------------------
     OVERVIEW: Display summary cards
     ----------------------------------------------------------------- */
  function renderOverview() {
    var grid = document.getElementById("overviewGrid");
    if (!grid) return;

    var todayStr = getTodayDateString();

    var heartRateData = getLatestHeartRate();
    var stepsData = getTodaySteps();
    var waterData = appState.water;
    var sleepData = getTodaySleep();
    var activityData = getTodayActivity();

    var html = "";

    // Heart Rate Card
    var hrValue = heartRateData ? heartRateData.bpm : "—";
    var hrStatus = heartRateData ? classifyHeartRate(heartRateData.bpm) : "No data";
    html += '<article class="metric-card" data-metric="heart-rate">';
    html += '  <div class="metric-card__top">';
    html += '    <span class="metric-card__icon metric-card__icon--danger"><i class="fa-solid fa-heart-pulse" aria-hidden="true"></i></span>';
    html += '    <span class="metric-card__label">Heart Rate</span>';
    html += '  </div>';
    html += '  <p class="metric-card__value">';
    html += '    <span class="metric-card__number">' + hrValue + '</span>';
    html += '    <span class="metric-card__unit">BPM</span>';
    html += '  </p>';
    html += '  <span class="status-chip status-chip--success">' + hrStatus + '</span>';
    html += '  <p class="metric-card__foot metric-card__foot--muted">Latest measurement</p>';
    html += '</article>';

    // Steps Card
    var stepsPercent = Math.min(100, Math.round((stepsData.count / appState.steps.goal) * 100));
    html += '<article class="metric-card" data-metric="steps">';
    html += '  <div class="metric-card__top">';
    html += '    <span class="metric-card__icon metric-card__icon--primary"><i class="fa-solid fa-shoe-prints" aria-hidden="true"></i></span>';
    html += '    <span class="metric-card__label">Steps</span>';
    html += '  </div>';
    html += '  <p class="metric-card__value">';
    html += '    <span class="metric-card__number">' + formatNumber(stepsData.count) + '</span>';
    html += '    <span class="metric-card__unit">/ ' + formatNumber(appState.steps.goal) + '</span>';
    html += '  </p>';
    html += '  <div class="progress-track" role="progressbar" aria-label="Steps progress" aria-valuemin="0" aria-valuemax="' + appState.steps.goal + '" aria-valuenow="' + stepsData.count + '">';
    html += '    <div class="progress-fill" style="width:' + stepsPercent + '%;"></div>';
    html += '  </div>';
    html += '  <p class="metric-card__foot">' + stepsPercent + '% of daily goal</p>';
    html += '</article>';

    // Water Card
    var waterPercent = Math.min(100, Math.round((waterData.current / waterData.goal) * 100));
    var waterStatus = getWaterStatus(waterData.current, waterData.goal);
    html += '<article class="metric-card" data-metric="water">';
    html += '  <div class="metric-card__top">';
    html += '    <span class="metric-card__icon metric-card__icon--info"><i class="fa-solid fa-droplet" aria-hidden="true"></i></span>';
    html += '    <span class="metric-card__label">Water</span>';
    html += '  </div>';
    html += '  <p class="metric-card__value">';
    html += '    <span class="metric-card__number">' + waterData.current + '</span>';
    html += '    <span class="metric-card__unit">/ ' + waterData.goal + ' glasses</span>';
    html += '  </p>';
    html += '  <div class="progress-track" role="progressbar" aria-label="Water intake progress" aria-valuemin="0" aria-valuemax="' + waterData.goal + '" aria-valuenow="' + waterData.current + '">';
    html += '    <div class="progress-fill progress-fill--info" style="width:' + waterPercent + '%;"></div>';
    html += '  </div>';
    html += '  <p class="metric-card__foot">' + waterStatus + '</p>';
    html += '</article>';

    // Sleep Card
    var sleepDuration = sleepData.duration ? formatSleepDuration(sleepData.duration) : "—";
    html += '<article class="metric-card" data-metric="sleep">';
    html += '  <div class="metric-card__top">';
    html += '    <span class="metric-card__icon metric-card__icon--accent"><i class="fa-solid fa-moon" aria-hidden="true"></i></span>';
    html += '    <span class="metric-card__label">Sleep</span>';
    html += '  </div>';
    html += '  <p class="metric-card__value">';
    html += '    <span class="metric-card__number">' + sleepDuration + '</span>';
    html += '  </p>';
    html += '  <p class="metric-card__foot">Last night\'s sleep</p>';
    html += '</article>';

    // Physical Activity Card
    var activityTotal = activityData.totalMinutes;
    html += '<article class="metric-card" data-metric="exercise">';
    html += '  <div class="metric-card__top">';
    html += '    <span class="metric-card__icon metric-card__icon--success"><i class="fa-solid fa-person-running" aria-hidden="true"></i></span>';
    html += '    <span class="metric-card__label">Physical Activity</span>';
    html += '  </div>';
    html += '  <p class="metric-card__value">';
    html += '    <span class="metric-card__number">' + activityTotal + '</span>';
    html += '    <span class="metric-card__unit">min</span>';
    html += '  </p>';
    html += '  <p class="metric-card__foot">Today\'s total active time</p>';
    html += '</article>';

    grid.innerHTML = html;
  }

  /* -----------------------------------------------------------------
     HEART RATE TAB
     ----------------------------------------------------------------- */
  function initHeartRateTab() {
    var form = document.getElementById("heartRateForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var hrInput = document.getElementById("hrInput");
      var bpm = parseInt(hrInput.value, 10);

      if (isNaN(bpm) || bpm < 40 || bpm > 200) {
        alert("Please enter a valid heart rate between 40 and 200 BPM.");
        return;
      }

      // Add measurement
      var measurement = {
        bpm: bpm,
        timestamp: new Date().toISOString(),
        status: classifyHeartRate(bpm)
      };

      appState.heartRate.measurements.push(measurement);
      saveData(STORAGE_KEYS.heartRate, appState.heartRate);

      // Update display
      renderHeartRateHistory();
      renderHeartRateStatus(measurement);
      renderOverview();

      // Clear input
      hrInput.value = "";
    });

    renderHeartRateHistory();
  }

  function renderHeartRateHistory() {
    var historyEl = document.getElementById("hrHistory");
    if (!historyEl) return;

    var measurements = appState.heartRate.measurements.slice().reverse().slice(0, 2);

    if (measurements.length === 0) {
      historyEl.innerHTML = '<p class="text-muted">No measurements yet</p>';
      return;
    }

    var html = "";
    measurements.forEach(function (m) {
      var date = new Date(m.timestamp);
      var dateStr = date.toLocaleDateString();
      var timeStr = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      html += '<div class="ht-history-item">';
      html += '  <div class="ht-history-item__main">';
      html += '    <p class="ht-history-item__value">' + m.bpm + ' <span class="ht-history-item__unit">BPM</span></p>';
      html += '    <p class="ht-history-item__meta">' + dateStr + ' at ' + timeStr + '</p>';
      html += '  </div>';
      html += '  <span class="status-chip status-chip--success">' + m.status + '</span>';
      html += '</div>';
    });

    historyEl.innerHTML = html;
  }

  function renderHeartRateStatus(measurement) {
    var statusEl = document.getElementById("hrStatus");
    var statusText = document.getElementById("hrStatusText");

    if (statusEl && statusText) {
      statusText.textContent = measurement.status;
      statusEl.style.display = "block";
    }
  }

  function classifyHeartRate(bpm) {
    if (bpm < 60) return "Low";
    if (bpm <= 100) return "Normal";
    return "High";
  }

  function getLatestHeartRate() {
    var measurements = appState.heartRate.measurements;
    if (measurements.length === 0) return null;
    return measurements[measurements.length - 1];
  }

  /* -----------------------------------------------------------------
     STEPS TAB
     ----------------------------------------------------------------- */
  function initStepsTab() {
    var updateGoalBtn = document.getElementById("updateStepsGoalBtn");
    if (updateGoalBtn) {
      updateGoalBtn.addEventListener("click", function () {
        var input = document.getElementById("stepsGoalInput");
        var newGoal = parseInt(input.value, 10);

        if (isNaN(newGoal) || newGoal < 1000) {
          alert("Please enter a valid daily goal (at least 1000 steps).");
          return;
        }

        appState.steps.goal = newGoal;
        saveData(STORAGE_KEYS.steps, appState.steps);
        renderStepsDisplay();
        renderOverview();
      });
    }

    renderStepsDisplay();
    renderStepsChart();
  }

  function renderStepsDisplay() {
    var todaySteps = getTodaySteps();
    var stepsCount = document.getElementById("stepsCount");
    var stepsGoal = document.getElementById("stepsGoal");
    var stepsProgress = document.getElementById("stepsProgress");
    var stepsPercent = document.getElementById("stepsPercent");
    var stepsAchievement = document.getElementById("stepsAchievement");

    var percent = Math.min(100, Math.round((todaySteps.count / appState.steps.goal) * 100));

    if (stepsCount) stepsCount.textContent = formatNumber(todaySteps.count);
    if (stepsGoal) stepsGoal.textContent = formatNumber(appState.steps.goal);
    if (stepsProgress) {
      stepsProgress.querySelector(".progress-fill").style.width = percent + "%";
      stepsProgress.setAttribute("aria-valuenow", todaySteps.count);
      stepsProgress.setAttribute("aria-valuemax", appState.steps.goal);
    }
    if (stepsPercent) stepsPercent.textContent = percent;
    if (stepsAchievement) stepsAchievement.textContent = getStepsAchievement(todaySteps.count, appState.steps.goal);

    var goalInput = document.getElementById("stepsGoalInput");
    if (goalInput) goalInput.value = appState.steps.goal;
  }

  function renderStepsChart() {
    var chartEl = document.getElementById("stepsChart");
    if (!chartEl) return;

    var history = appState.steps.history;
    var maxSteps = Math.max.apply(null, history.map(function (d) { return d.steps; }));

    var html = '<div class="ht-bar-chart">';
    history.forEach(function (day) {
      var percent = maxSteps > 0 ? (day.steps / maxSteps) * 100 : 0;
      html += '<div class="ht-bar-chart__item">';
      html += '  <div class="ht-bar-chart__bar" style="height:' + percent + '%;" title="' + day.steps + ' steps"></div>';
      html += '  <p class="ht-bar-chart__label">' + day.day.substring(0, 3) + '</p>';
      html += '  <p class="ht-bar-chart__value">' + formatNumber(day.steps) + '</p>';
      html += '</div>';
    });
    html += '</div>';

    chartEl.innerHTML = html;

    // Update insights
    var maxDay = history.reduce(function (max, current) {
      return current.steps > max.steps ? current : max;
    });
    var minDay = history.reduce(function (min, current) {
      return current.steps < min.steps ? current : min;
    });

    var maxEl = document.getElementById("stepsMax");
    var minEl = document.getElementById("stepsMin");

    if (maxEl) maxEl.textContent = maxDay.day + " (" + formatNumber(maxDay.steps) + " steps)";
    if (minEl) minEl.textContent = minDay.day + " (" + formatNumber(minDay.steps) + " steps)";
  }

  function getTodaySteps() {
    var todayStr = getTodayDateString();
    var todayEntry = appState.steps.history.find(function (d) {
      return d.date === todayStr;
    });

    return todayEntry || { date: todayStr, steps: 0, day: getDayName(new Date()) };
  }

  function getStepsAchievement(steps, goal) {
    var percent = (steps / goal) * 100;
    if (percent >= 100) return "Step Champion";
    if (percent >= 80) return "Fitness Explorer";
    if (percent >= 50) return "Active Walker";
    return "Beginner";
  }

  function generateDefaultStepsHistory() {
    var history = [];
    var today = new Date();

    for (var i = 6; i >= 0; i--) {
      var date = new Date(today);
      date.setDate(date.getDate() - i);

      var stepsValue = Math.floor(Math.random() * 12000) + 2000; // 2000-14000

      history.push({
        date: getDateString(date),
        day: getDayName(date),
        steps: stepsValue
      });
    }

    // Update today with a more realistic value
    history[6].steps = 6242;

    return history;
  }

  /* -----------------------------------------------------------------
     WATER TAB
     ----------------------------------------------------------------- */
  function initWaterTab() {
    var addBtn = document.getElementById("addWaterBtn");
    var removeBtn = document.getElementById("removeWaterBtn");
    var updateGoalBtn = document.getElementById("updateWaterGoalBtn");

    if (addBtn) {
      addBtn.addEventListener("click", function () {
        if (appState.water.current < appState.water.goal) {
          appState.water.current++;
          saveData(STORAGE_KEYS.water, appState.water);
          renderWaterDisplay();
          renderOverview();
        }
      });
    }

    if (removeBtn) {
      removeBtn.addEventListener("click", function () {
        if (appState.water.current > 0) {
          appState.water.current--;
          saveData(STORAGE_KEYS.water, appState.water);
          renderWaterDisplay();
          renderOverview();
        }
      });
    }

    if (updateGoalBtn) {
      updateGoalBtn.addEventListener("click", function () {
        var input = document.getElementById("waterGoalInput");
        var newGoal = parseInt(input.value, 10);

        if (isNaN(newGoal) || newGoal < 1 || newGoal > 20) {
          alert("Please enter a valid daily goal (1-20 glasses).");
          return;
        }

        appState.water.goal = newGoal;
        saveData(STORAGE_KEYS.water, appState.water);
        renderWaterDisplay();
        renderOverview();
      });
    }

    renderWaterDisplay();
  }

  function renderWaterDisplay() {
    var glassesEl = document.getElementById("waterGlasses");
    var currentEl = document.getElementById("waterCurrent");
    var goalEl = document.getElementById("waterGoal");
    var progressEl = document.getElementById("waterProgress");
    var percentEl = document.getElementById("waterPercent");
    var statusEl = document.getElementById("waterStatus");
    var goalInput = document.getElementById("waterGoalInput");

    var current = appState.water.current;
    var goal = appState.water.goal;
    var percent = Math.min(100, Math.round((current / goal) * 100));

    // Render glasses
    var glassesHtml = '<div class="ht-glasses-display">';
    for (var i = 0; i < goal; i++) {
      if (i < current) {
        glassesHtml += '<span class="ht-glass ht-glass--full" aria-label="Filled glass">💧</span>';
      } else {
        glassesHtml += '<span class="ht-glass" aria-label="Empty glass">◯</span>';
      }
    }
    glassesHtml += '</div>';

    if (glassesEl) glassesEl.innerHTML = glassesHtml;
    if (currentEl) currentEl.textContent = current;
    if (goalEl) goalEl.textContent = goal;
    if (progressEl) {
      progressEl.querySelector(".progress-fill").style.width = percent + "%";
      progressEl.setAttribute("aria-valuenow", current);
      progressEl.setAttribute("aria-valuemax", goal);
    }
    if (percentEl) percentEl.textContent = percent;
    if (statusEl) statusEl.textContent = getWaterStatus(current, goal);
    if (goalInput) goalInput.value = goal;
  }

  function getWaterStatus(current, goal) {
    if (current >= goal) return "Goal completed!";
    var percent = (current / goal) * 100;
    if (percent >= 75) return "Almost there!";
    if (percent >= 50) return "Good progress";
    return "Below daily goal";
  }

  /* -----------------------------------------------------------------
     SLEEP TAB
     ----------------------------------------------------------------- */
  function initSleepTab() {
    var form = document.getElementById("sleepForm");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var bedtimeInput = document.getElementById("bedtimeInput");
      var wakeupInput = document.getElementById("wakeupInput");

      var bedtimeStr = bedtimeInput.value;
      var wakeupStr = wakeupInput.value;

      if (!bedtimeStr || !wakeupStr) {
        alert("Please enter both bedtime and wake-up time.");
        return;
      }

      var duration = calculateSleepDuration(bedtimeStr, wakeupStr);

      if (duration <= 0) {
        alert("Wake-up time must be after bedtime.");
        return;
      }

      var entry = {
        date: getTodayDateString(),
        bedtime: bedtimeStr,
        wakeup: wakeupStr,
        durationMinutes: duration
      };

      appState.sleep.history[appState.sleep.history.length - 1] = entry;
      saveData(STORAGE_KEYS.sleep, appState.sleep);

      renderSleepDisplay();
      renderSleepChart();
      renderOverview();

      bedtimeInput.value = "";
      wakeupInput.value = "";
    });

    renderSleepDisplay();
    renderSleepChart();
  }

  function renderSleepDisplay() {
    var todaySleep = getTodaySleep();
    var durationEl = document.getElementById("sleepDuration");
    var durationText = document.getElementById("sleepDurationText");

    if (todaySleep.duration) {
      if (durationEl) durationEl.style.display = "block";
      if (durationText) durationText.textContent = formatSleepDuration(todaySleep.duration);
    }

    var bedtimeInput = document.getElementById("bedtimeInput");
    var wakeupInput = document.getElementById("wakeupInput");

    if (todaySleep.bedtime && bedtimeInput) bedtimeInput.value = todaySleep.bedtime;
    if (todaySleep.wakeup && wakeupInput) wakeupInput.value = todaySleep.wakeup;

    renderSleepInsights();
  }

  function renderSleepInsights() {
    var history = appState.sleep.history;
    var validEntries = history.filter(function (e) { return e.durationMinutes; });

    var avgDuration = 0;
    var avgBedtime = null;
    var avgWakeup = null;

    if (validEntries.length > 0) {
      var totalMinutes = validEntries.reduce(function (sum, e) { return sum + e.durationMinutes; }, 0);
      avgDuration = totalMinutes / validEntries.length;

      // Calculate average bedtime and wakeup
      var bedtimeTotal = 0;
      var wakeupTotal = 0;
      validEntries.forEach(function (e) {
        bedtimeTotal += timeStringToMinutes(e.bedtime);
        wakeupTotal += timeStringToMinutes(e.wakeup);
      });
      avgBedtime = minutesToTimeString(bedtimeTotal / validEntries.length);
      avgWakeup = minutesToTimeString(wakeupTotal / validEntries.length);
    }

    var avgEl = document.getElementById("sleepAvg");
    var bedtimeAvgEl = document.getElementById("sleepBedtimeAvg");
    var wakeupAvgEl = document.getElementById("sleepWakeupAvg");
    var consistencyEl = document.getElementById("sleepConsistency");

    if (avgEl) avgEl.textContent = avgDuration > 0 ? formatSleepDuration(avgDuration) : "—";
    if (bedtimeAvgEl) bedtimeAvgEl.textContent = avgBedtime || "—";
    if (wakeupAvgEl) wakeupAvgEl.textContent = avgWakeup || "—";

    var consistency = "Track more data to see insights.";
    if (validEntries.length >= 3) {
      consistency = avgDuration >= 420 ? "Good consistency!" : "Try to maintain a consistent sleep schedule.";
    }

    if (consistencyEl) consistencyEl.textContent = consistency;
  }

  function renderSleepChart() {
    var chartEl = document.getElementById("sleepChart");
    if (!chartEl) return;

    var history = appState.sleep.history;
    var maxDuration = Math.max.apply(null, history.map(function (d) { return d.durationMinutes || 0; }));

    var html = '<div class="ht-bar-chart">';
    history.forEach(function (day) {
      var percent = maxDuration > 0 ? ((day.durationMinutes || 0) / maxDuration) * 100 : 0;
      var label = day.durationMinutes ? formatSleepDuration(day.durationMinutes) : "No data";
      html += '<div class="ht-bar-chart__item">';
      html += '  <div class="ht-bar-chart__bar" style="height:' + percent + '%;" title="' + label + '"></div>';
      html += '  <p class="ht-bar-chart__label">' + day.date.substring(5) + '</p>';
      html += '  <p class="ht-bar-chart__value">' + label + '</p>';
      html += '</div>';
    });
    html += '</div>';

    chartEl.innerHTML = html;
  }

  function getTodaySleep() {
    var history = appState.sleep.history;
    return history[history.length - 1] || { date: getTodayDateString(), durationMinutes: 0 };
  }

  function generateDefaultSleepHistory() {
    var history = [];
    var today = new Date();

    for (var i = 6; i >= 0; i--) {
      var date = new Date(today);
      date.setDate(date.getDate() - i);

      var duration = Math.floor(Math.random() * 120) + 360; // 6-8 hours
      var bedtimeHour = Math.floor(Math.random() * 3) + 22; // 22:00-01:00
      var bedtimeMin = Math.floor(Math.random() * 60);

      history.push({
        date: getDateString(date),
        bedtime: pad(bedtimeHour % 24) + ":" + pad(bedtimeMin),
        wakeup: pad((bedtimeHour + Math.floor(duration / 60)) % 24) + ":" + pad(Math.floor(duration % 60)),
        durationMinutes: i < 6 ? duration : 0
      });
    }

    // Set today's data
    history[6].bedtime = "23:30";
    history[6].wakeup = "07:15";
    history[6].durationMinutes = 465; // 7h 45m

    return history;
  }

  function calculateSleepDuration(bedtimeStr, wakeupStr) {
    var bedtimeMinutes = timeStringToMinutes(bedtimeStr);
    var wakeupMinutes = timeStringToMinutes(wakeupStr);

    if (wakeupMinutes >= bedtimeMinutes) {
      return wakeupMinutes - bedtimeMinutes;
    } else {
      // Sleep crosses midnight
      return (1440 - bedtimeMinutes) + wakeupMinutes;
    }
  }

  function timeStringToMinutes(timeStr) {
    var parts = timeStr.split(":");
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function minutesToTimeString(minutes) {
    var hours = Math.floor(minutes / 60) % 24;
    var mins = Math.floor(minutes % 60);
    return pad(hours) + ":" + pad(mins);
  }

  /* -----------------------------------------------------------------
     PHYSICAL ACTIVITY TAB
     ----------------------------------------------------------------- */
  function initActivityTab() {
    var form = document.getElementById("activityForm");
    if (!form) return;

    var todayDate = new Date();
    var dateInput = document.getElementById("activityDate");
    if (dateInput) {
      dateInput.value = getDateString(todayDate);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var type = document.getElementById("activityType").value;
      var duration = parseInt(document.getElementById("activityDuration").value, 10);
      var speed = document.getElementById("activitySpeed").value;
      var date = document.getElementById("activityDate").value;

      if (!type || !duration) {
        alert("Please fill in all required fields.");
        return;
      }

      var activity = {
        type: type,
        duration: duration,
        speed: speed ? parseFloat(speed) : null,
        date: date,
        timestamp: new Date().toISOString()
      };

      appState.activities.push(activity);
      saveData(STORAGE_KEYS.activities, appState.activities);

      renderActivityHistory();
      renderActivitySummary();
      renderOverview();

      form.reset();
      if (dateInput) dateInput.value = getDateString(new Date());
    });

    renderActivityHistory();
    renderActivitySummary();
  }

  function renderActivityHistory() {
    var historyEl = document.getElementById("activityHistory");
    if (!historyEl) return;

    var activities = appState.activities.slice().reverse();

    if (activities.length === 0) {
      historyEl.innerHTML = '<p class="text-muted">No activities logged yet</p>';
      return;
    }

    var html = '<ul class="activity-list">';
    activities.forEach(function (activity) {
      var icon = getActivityIcon(activity.type);
      var dateObj = new Date(activity.timestamp);
      var dateStr = dateObj.toLocaleDateString();
      var timeStr = dateObj.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      var speedStr = activity.speed ? " @ " + activity.speed + " km/h" : "";

      html += '<li class="activity-item">';
      html += '  <span class="activity-item__icon activity-item__icon--success"><i class="' + icon + '" aria-hidden="true"></i></span>';
      html += '  <span class="activity-item__body">';
      html += '    <span class="activity-item__title">' + activity.duration + ' min ' + activity.type + speedStr + '</span>';
      html += '    <span class="activity-item__time">' + dateStr + ' • ' + timeStr + '</span>';
      html += '  </span>';
      html += '</li>';
    });
    html += '</ul>';

    historyEl.innerHTML = html;
  }

  function renderActivitySummary() {
    var todayStr = getTodayDateString();
    var todayActivities = appState.activities.filter(function (a) { return a.date === todayStr; });

    var totalMinutes = todayActivities.reduce(function (sum, a) { return sum + a.duration; }, 0);

    var typeCounts = {};
    todayActivities.forEach(function (a) {
      typeCounts[a.type] = (typeCounts[a.type] || 0) + 1;
    });

    var mostFrequent = Object.keys(typeCounts).length > 0
      ? Object.keys(typeCounts).reduce(function (a, b) { return typeCounts[a] > typeCounts[b] ? a : b; })
      : "—";

    // Most active day overall
    var dateCounts = {};
    appState.activities.forEach(function (a) {
      dateCounts[a.date] = (dateCounts[a.date] || 0) + a.duration;
    });

    var mostActiveDay = Object.keys(dateCounts).length > 0
      ? Object.keys(dateCounts).reduce(function (a, b) { return dateCounts[a] > dateCounts[b] ? a : b; })
      : "—";

    var totalEl = document.getElementById("activityTodayTotal");
    var frequentEl = document.getElementById("activityMostFrequent");
    var activeDayEl = document.getElementById("activityMostActive");

    if (totalEl) totalEl.textContent = totalMinutes;
    if (frequentEl) frequentEl.textContent = mostFrequent;
    if (activeDayEl) activeDayEl.textContent = mostActiveDay !== "—" ? mostActiveDay : "—";
  }

  function getTodayActivity() {
    var todayStr = getTodayDateString();
    var todayActivities = appState.activities.filter(function (a) { return a.date === todayStr; });
    var totalMinutes = todayActivities.reduce(function (sum, a) { return sum + a.duration; }, 0);
    return { totalMinutes: totalMinutes, activities: todayActivities };
  }

  function getActivityIcon(type) {
    switch (type) {
      case "Walking": return "fa-solid fa-person-walking";
      case "Running": return "fa-solid fa-person-running";
      case "Cycling": return "fa-solid fa-person-biking";
      case "Sports": return "fa-solid fa-basketball";
      default: return "fa-solid fa-dumbbell";
    }
  }

  /* -----------------------------------------------------------------
     UTILITY FUNCTIONS
     ----------------------------------------------------------------- */
  function getTodayDateString() {
    return getDateString(new Date());
  }

  function getDateString(date) {
    var year = date.getFullYear();
    var month = pad(date.getMonth() + 1);
    var day = pad(date.getDate());
    return year + "-" + month + "-" + day;
  }

  function getDayName(date) {
    return date.toLocaleDateString(undefined, { weekday: "long" });
  }

  function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }

  function formatSleepDuration(minutes) {
    var hours = Math.floor(minutes / 60);
    var mins = minutes % 60;
    return hours + "h " + mins + "m";
  }

  function pad(num) {
    return num < 10 ? "0" + num : String(num);
  }

})();
