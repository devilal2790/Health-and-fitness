/* ===================================================================
   HEALTHCARE.JS — Page-specific logic for pages/health-care.html
   Common sidebar/mobile-drawer/footer-year behaviour already lives in
   Script/script.js (loaded first) and needs no duplication here.
   This file only handles the doctor-discovery flow: category select,
   Find Doctors, validation, dynamic rendering, search, sort, and the
   contact-details modal.
   =================================================================== */

(function () {
  "use strict";

  /* -----------------------------------------------------------------
     1. DEMO DATA
     All doctor records are fictional and generated for prototype
     purposes only. To wire this up to a real API/database later,
     replace `buildDoctorsByCategory()` with a fetch call that returns
     data in the same shape: { [categoryKey]: DoctorRecord[] }.
     ----------------------------------------------------------------- */

  var CATEGORIES = [
    {
      key: "dental",
      label: "Dental Problems",
      icon: "fa-tooth",
      specialty: "Dental Specialist",
      qualification: "BDS, MDS",
      description: "Connect with dental professionals for general dental consultation and oral health concerns."
    },
    {
      key: "eye",
      label: "Eye Problems",
      icon: "fa-eye",
      specialty: "Ophthalmologist",
      qualification: "MBBS, MS (Ophthalmology)",
      description: "Connect with eye care specialists for vision concerns and general ophthalmic consultation."
    },
    {
      key: "skin",
      label: "Skin Problems",
      icon: "fa-allergies",
      specialty: "Dermatologist",
      qualification: "MBBS, MD (Dermatology)",
      description: "Connect with dermatologists for general skin, hair, and nail health concerns."
    },
    {
      key: "cardio",
      label: "Heart & Cardiovascular Problems",
      icon: "fa-heart-pulse",
      specialty: "Cardiologist",
      qualification: "MBBS, DM (Cardiology)",
      description: "Connect with cardiologists for general heart health and cardiovascular concerns."
    },
    {
      key: "ortho",
      label: "Orthopedic / Bone & Joint Problems",
      icon: "fa-bone",
      specialty: "Orthopedic Surgeon",
      qualification: "MBBS, MS (Orthopedics)",
      description: "Connect with orthopedic specialists for bone, joint, and musculoskeletal concerns."
    },
    {
      key: "surgery",
      label: "General Surgery",
      icon: "fa-kit-medical",
      specialty: "General Surgeon",
      qualification: "MBBS, MS (General Surgery)",
      description: "Connect with general surgeons for surgical consultation and pre/post-operative guidance."
    },
    {
      key: "ent",
      label: "ENT Problems",
      icon: "fa-ear-listen",
      specialty: "ENT Specialist",
      qualification: "MBBS, MS (ENT)",
      description: "Connect with ENT specialists for ear, nose, and throat related concerns."
    },
    {
      key: "neuro",
      label: "Neurological Problems",
      icon: "fa-brain",
      specialty: "Neurologist",
      qualification: "MBBS, DM (Neurology)",
      description: "Connect with neurologists for general nervous system and neurological concerns."
    },
    {
      key: "gastro",
      label: "Gastrointestinal / Digestive Problems",
      icon: "fa-notes-medical",
      specialty: "Gastroenterologist",
      qualification: "MBBS, DM (Gastroenterology)",
      description: "Connect with gastroenterologists for digestive system and gastrointestinal concerns."
    },
    {
      key: "mental",
      label: "Mental Wellness / Psychiatry",
      icon: "fa-comment-medical",
      specialty: "Psychiatrist",
      qualification: "MBBS, MD (Psychiatry)",
      description: "Connect with psychiatrists for general mental wellness support and consultation."
    }
  ];

  var FIRST_NAMES = [
    "Aarav", "Vihaan", "Aditi", "Isha", "Rohan", "Kavya", "Arjun", "Meera",
    "Karan", "Ananya", "Nikhil", "Priya", "Rajesh", "Sneha", "Aman", "Divya",
    "Suresh", "Pooja", "Vikram", "Neha"
  ];

  var LAST_NAMES = [
    "Mehta", "Sharma", "Verma", "Iyer", "Nair", "Kapoor", "Reddy", "Gupta",
    "Singh", "Joshi", "Chopra", "Rao", "Malhotra", "Bhat", "Desai", "Kulkarni",
    "Pillai", "Agarwal", "Bose", "Menon"
  ];

  var HOSPITALS = [
    "CityCare Medical Center", "Sunrise Multispecialty Hospital", "Wellness Point Clinic",
    "MedLife Hospital", "Harmony Health Institute", "Prime Care Hospital",
    "Northside General Hospital", "GreenLeaf Clinic", "Unity Health Center",
    "Horizon Medical Institute"
  ];

  var LOCATIONS = [
    "Ahmedabad", "Mumbai", "Bengaluru", "Delhi", "Pune",
    "Hyderabad", "Chennai", "Kolkata", "Jaipur", "Surat"
  ];

  var AVAILABILITY = [
    "Mon\u2013Sat, 9 AM\u20135 PM",
    "Mon\u2013Fri, 10 AM\u20136 PM",
    "Tue\u2013Sun, 11 AM\u20137 PM",
    "Mon, Wed, Fri, 9 AM\u20131 PM",
    "Mon\u2013Sat, 2 PM\u20138 PM"
  ];

  function buildDoctorsByCategory() {
    var result = {};

    CATEGORIES.forEach(function (category, categoryIndex) {
      var doctors = [];

      for (var i = 0; i < 10; i++) {
        var globalIndex = categoryIndex * 10 + i; // 0-99, unique per doctor
        var firstName = FIRST_NAMES[(categoryIndex * 3 + i) % FIRST_NAMES.length];
        var lastName = LAST_NAMES[(categoryIndex * 5 + i * 2) % LAST_NAMES.length];
        var fullName = "Dr. " + firstName + " " + lastName;

        var experience = 3 + ((categoryIndex * 4 + i * 3) % 20); // 3-22 years
        var rating = Math.round((4.2 + ((i * 0.09 + categoryIndex * 0.03) % 0.8)) * 10) / 10; // 4.2-5.0
        var phone = "+91 90000 " + String(globalIndex + 1).padStart(5, "0");
        var email = (firstName + "." + lastName + (globalIndex + 1) + "@example.com").toLowerCase();

        doctors.push({
          id: category.key + "-" + i,
          name: fullName,
          specialty: category.specialty,
          qualification: category.qualification,
          experience: experience + " years experience",
          hospital: HOSPITALS[(categoryIndex + i) % HOSPITALS.length],
          location: LOCATIONS[(categoryIndex * 2 + i) % LOCATIONS.length],
          phone: phone,
          email: email,
          availability: AVAILABILITY[(categoryIndex + i) % AVAILABILITY.length],
          rating: rating
        });
      }

      result[category.key] = doctors;
    });

    return result;
  }

  var doctorsByCategory = buildDoctorsByCategory();

  function getCategoryMeta(key) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].key === key) return CATEGORIES[i];
    }
    return null;
  }

  /* -----------------------------------------------------------------
     2. STATE
     ----------------------------------------------------------------- */
  var state = {
    categoryKey: "",
    baseDoctors: [],   // the 10 doctors for the selected category
    visibleDoctors: [] // after search + sort applied
  };

  /* -----------------------------------------------------------------
     3. DOM REFERENCES (guarded — this file only ever runs on a page
        that includes these elements, but we check anyway to avoid
        console errors if the markup changes later)
     ----------------------------------------------------------------- */
  var els = {};

  document.addEventListener("DOMContentLoaded", function () {
    els.select = document.getElementById("healthProblem");
    els.findBtn = document.getElementById("findDoctorsBtn");
    els.validationMsg = document.getElementById("hcValidationMsg");
    els.loading = document.getElementById("hcLoading");
    els.emptyState = document.getElementById("hcEmptyState");
    els.results = document.getElementById("hcResults");
    els.categoryIcon = document.getElementById("hcCategoryIcon");
    els.resultsHeading = document.getElementById("resultsHeading");
    els.categoryDesc = document.querySelector(".hc-category-summary__desc");
    els.categoryCount = document.querySelector(".hc-category-summary__count");
    els.searchInput = document.getElementById("hcSearchInput");
    els.sortSelect = document.getElementById("hcSortSelect");
    els.resultCount = document.getElementById("hcResultCount");
    els.grid = document.getElementById("hcDoctorGrid");
    els.noResults = document.getElementById("hcNoResults");

    els.modalOverlay = document.getElementById("hcModalOverlay");
    els.modal = document.getElementById("hcModal");
    els.modalClose = document.getElementById("hcModalClose");
    els.modalAvatar = document.getElementById("hcModalAvatar");
    els.modalName = document.getElementById("hcModalName");
    els.modalSpecialty = document.getElementById("hcModalSpecialty");
    els.modalRating = document.getElementById("hcModalRating");
    els.modalQualification = document.getElementById("hcModalQualification");
    els.modalExperience = document.getElementById("hcModalExperience");
    els.modalHospital = document.getElementById("hcModalHospital");
    els.modalLocation = document.getElementById("hcModalLocation");
    els.modalAvailability = document.getElementById("hcModalAvailability");
    els.modalPhone = document.getElementById("hcModalPhone");
    els.modalEmail = document.getElementById("hcModalEmail");

    // Bail out quietly if this script somehow loads on a page without
    // the healthcare markup (keeps script.js's "safe DOM" philosophy).
    if (!els.select || !els.findBtn || !els.grid) return;

    bindEvents();
  });

  /* -----------------------------------------------------------------
     4. EVENT BINDING
     ----------------------------------------------------------------- */
  function bindEvents() {
    els.findBtn.addEventListener("click", handleFindDoctors);

    els.select.addEventListener("change", function () {
      // Selecting a new category clears any stale validation message.
      setValidationMessage("");
    });

    if (els.searchInput) {
      els.searchInput.addEventListener("input", function () {
        applySearchAndSort();
      });
    }

    if (els.sortSelect) {
      els.sortSelect.addEventListener("change", function () {
        applySearchAndSort();
      });
    }

    if (els.modalClose) {
      els.modalClose.addEventListener("click", closeModal);
    }

    if (els.modalOverlay) {
      els.modalOverlay.addEventListener("click", function (event) {
        if (event.target === els.modalOverlay) closeModal();
      });
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !els.modalOverlay.hidden) {
        closeModal();
      }
    });
  }

  /* -----------------------------------------------------------------
     5. FIND DOCTORS FLOW
     ----------------------------------------------------------------- */
  function handleFindDoctors() {
    var categoryKey = els.select.value;

    if (!categoryKey) {
      setValidationMessage("Please select a health problem first.");
      els.select.focus();
      hideResults();
      return;
    }

    setValidationMessage("");
    showLoading();

    // Brief, frontend-only loading effect — no real network request.
    window.setTimeout(function () {
      hideLoading();
      loadCategory(categoryKey);
    }, 350);
  }

  function loadCategory(categoryKey) {
    var meta = getCategoryMeta(categoryKey);
    if (!meta) return;

    state.categoryKey = categoryKey;
    state.baseDoctors = doctorsByCategory[categoryKey] || [];

    renderCategorySummary(meta, state.baseDoctors.length);

    if (els.searchInput) els.searchInput.value = "";
    if (els.sortSelect) els.sortSelect.value = "recommended";

    applySearchAndSort();

    if (els.emptyState) els.emptyState.hidden = true;
    if (els.results) els.results.hidden = false;
  }

  function renderCategorySummary(meta, count) {
    if (els.categoryIcon) {
      els.categoryIcon.innerHTML = '<i class="fa-solid ' + meta.icon + '" aria-hidden="true"></i>';
    }
    if (els.resultsHeading) els.resultsHeading.textContent = meta.label;
    if (els.categoryDesc) els.categoryDesc.textContent = meta.description;
    if (els.categoryCount) els.categoryCount.textContent = count + " doctors available";
  }

  function hideResults() {
    if (els.results) els.results.hidden = true;
    if (els.emptyState) els.emptyState.hidden = false;
  }

  function showLoading() {
    if (els.loading) els.loading.hidden = false;
    if (els.emptyState) els.emptyState.hidden = true;
    if (els.results) els.results.hidden = true;
  }

  function hideLoading() {
    if (els.loading) els.loading.hidden = true;
  }

  function setValidationMessage(message) {
    if (!els.validationMsg) return;
    els.validationMsg.textContent = message;
  }

  /* -----------------------------------------------------------------
     6. SEARCH + SORT (operates only on the current 10 doctors)
     ----------------------------------------------------------------- */
  function applySearchAndSort() {
    var query = els.searchInput ? els.searchInput.value.trim().toLowerCase() : "";
    var sortBy = els.sortSelect ? els.sortSelect.value : "recommended";

    var filtered = state.baseDoctors.filter(function (doc) {
      if (!query) return true;
      return (
        doc.name.toLowerCase().indexOf(query) !== -1 ||
        doc.hospital.toLowerCase().indexOf(query) !== -1
      );
    });

    filtered = sortDoctors(filtered, sortBy);
    state.visibleDoctors = filtered;

    renderDoctorGrid(filtered);
    updateResultCount(filtered.length, state.baseDoctors.length, query);
  }

  function sortDoctors(list, sortBy) {
    var sorted = list.slice();

    switch (sortBy) {
      case "rating-desc":
        sorted.sort(function (a, b) { return b.rating - a.rating; });
        break;
      case "experience-desc":
        sorted.sort(function (a, b) { return parseInt(b.experience, 10) - parseInt(a.experience, 10); });
        break;
      case "name-asc":
        sorted.sort(function (a, b) { return a.name.localeCompare(b.name); });
        break;
      default:
        // "recommended" — keep original demo ordering
        break;
    }

    return sorted;
  }

  function updateResultCount(visibleCount, totalCount, query) {
    if (!els.resultCount) return;

    if (query) {
      els.resultCount.textContent = "Showing " + visibleCount + " of " + totalCount + " doctors";
    } else {
      els.resultCount.textContent = "Showing " + visibleCount + " doctors";
    }
  }

  /* -----------------------------------------------------------------
     7. RENDERING
     ----------------------------------------------------------------- */
  function renderDoctorGrid(doctors) {
    if (!els.grid) return;

    els.grid.innerHTML = "";

    if (doctors.length === 0) {
      if (els.noResults) els.noResults.hidden = false;
      return;
    }

    if (els.noResults) els.noResults.hidden = true;

    var fragment = document.createDocumentFragment();
    doctors.forEach(function (doctor) {
      fragment.appendChild(createDoctorCard(doctor));
    });
    els.grid.appendChild(fragment);
  }

  function createDoctorCard(doctor) {
    var card = document.createElement("article");
    card.className = "hc-doctor-card";

    card.innerHTML =
      '<div class="hc-doctor-card__top">' +
        '<span class="hc-doctor-card__avatar" aria-hidden="true">' + getInitials(doctor.name) + "</span>" +
        "<div>" +
          '<p class="hc-doctor-card__name">' + escapeHtml(doctor.name) + "</p>" +
          '<p class="hc-doctor-card__specialty">' + escapeHtml(doctor.specialty) + "</p>" +
        "</div>" +
      "</div>" +
      '<div class="hc-doctor-card__meta">' +
        '<span><i class="fa-solid fa-graduation-cap" aria-hidden="true"></i>' + escapeHtml(doctor.qualification) + "</span>" +
        '<span><i class="fa-solid fa-briefcase" aria-hidden="true"></i>' + escapeHtml(doctor.experience) + "</span>" +
        '<span><i class="fa-solid fa-hospital" aria-hidden="true"></i>' + escapeHtml(doctor.hospital) + "</span>" +
        '<span><i class="fa-solid fa-location-dot" aria-hidden="true"></i>' + escapeHtml(doctor.location) + "</span>" +
      "</div>" +
      '<div class="hc-doctor-card__foot">' +
        '<span class="hc-doctor-card__rating"><i class="fa-solid fa-star" aria-hidden="true"></i>' + doctor.rating.toFixed(1) + "</span>" +
        '<span class="hc-doctor-card__availability">' + escapeHtml(doctor.availability) + "</span>" +
      "</div>";

    var contactBtn = document.createElement("button");
    contactBtn.type = "button";
    contactBtn.className = "btn btn-secondary hc-doctor-card__contact-btn";
    contactBtn.innerHTML = '<i class="fa-solid fa-address-card" aria-hidden="true"></i> Contact Details';
    contactBtn.setAttribute("aria-label", "View contact details for " + doctor.name);
    contactBtn.addEventListener("click", function () {
      openModal(doctor);
    });

    card.appendChild(contactBtn);
    return card;
  }

  function getInitials(name) {
    return name
      .replace(/^Dr\.\s*/i, "")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map(function (part) { return part.charAt(0).toUpperCase(); })
      .join("");
  }

  function escapeHtml(value) {
    var div = document.createElement("div");
    div.textContent = value;
    return div.innerHTML;
  }

  /* -----------------------------------------------------------------
     8. CONTACT DETAILS MODAL
     ----------------------------------------------------------------- */
  var lastFocusedElement = null;

  function openModal(doctor) {
    if (!els.modalOverlay) return;

    lastFocusedElement = document.activeElement;

    if (els.modalAvatar) els.modalAvatar.textContent = getInitials(doctor.name);
    if (els.modalName) els.modalName.textContent = doctor.name;
    if (els.modalSpecialty) els.modalSpecialty.textContent = doctor.specialty;
    if (els.modalRating) {
      els.modalRating.innerHTML = '<i class="fa-solid fa-star" aria-hidden="true"></i> ' + doctor.rating.toFixed(1) + " rating";
    }
    if (els.modalQualification) els.modalQualification.textContent = doctor.qualification;
    if (els.modalExperience) els.modalExperience.textContent = doctor.experience;
    if (els.modalHospital) els.modalHospital.textContent = doctor.hospital;
    if (els.modalLocation) els.modalLocation.textContent = doctor.location;
    if (els.modalAvailability) els.modalAvailability.textContent = doctor.availability;

    if (els.modalPhone) {
      els.modalPhone.textContent = doctor.phone;
      els.modalPhone.href = "tel:" + doctor.phone.replace(/\s+/g, "");
    }
    if (els.modalEmail) {
      els.modalEmail.textContent = doctor.email;
      els.modalEmail.href = "mailto:" + doctor.email;
    }

    els.modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";

    if (els.modalClose) els.modalClose.focus();
  }

  function closeModal() {
    if (!els.modalOverlay || els.modalOverlay.hidden) return;

    els.modalOverlay.hidden = true;
    document.body.style.overflow = "";

    if (lastFocusedElement && typeof lastFocusedElement.focus === "function") {
      lastFocusedElement.focus();
    }
  }
})();
