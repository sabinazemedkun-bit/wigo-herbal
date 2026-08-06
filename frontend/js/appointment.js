/**
 * WIGO Herbal — Appointment Form
 * Submits to live backend: POST /api/appointments
 */

/**
 * API Base URL — resolves automatically for every environment:
 *   Local dev    → http://localhost:5000/api
 *   Render.com   → https://wigo-herbal.onrender.com/api
 *   Custom domain → https://wigoherbal.com/api
 */
const API_BASE = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', () => {
  const form      = document.getElementById('appointmentForm');
  const submitBtn = document.getElementById('submitBtn');
  const resetBtn  = document.getElementById('resetFormBtn');
  const successMsg = document.getElementById('successMsg');
  const errorMsg   = document.getElementById('errorMsg');

  if (!form) return;

  // Set minimum date to today
  const today = new Date().toISOString().split('T')[0];
  const dateField = document.getElementById('appointmentDate');
  if (dateField) dateField.min = today;

  /* ── Field validation ──────────────────────────────────── */
  function validateField(field) {
    const value    = field.value.trim();
    const name     = field.name;
    const errorEl  = document.getElementById(field.id + 'Error');
    let   isValid  = true;
    let   message  = '';

    if (field.hasAttribute('required') && !value) {
      isValid = false;
      message = 'This field is required';
    }

    if (value) {
      if (name === 'phone' && !/^[0-9+\s\-()+]{7,20}$/.test(value)) {
        isValid = false; message = 'Enter a valid phone number';
      }
      if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        isValid = false; message = 'Enter a valid email address';
      }
      if (name === 'age') {
        const n = parseInt(value, 10);
        if (isNaN(n) || n < 1 || n > 120) { isValid = false; message = 'Enter a valid age (1–120)'; }
      }
    }

    if (errorEl) errorEl.textContent = message;
    field.classList.toggle('invalid', !isValid);
    return isValid;
  }

  /* ── Real-time validation ──────────────────────────────── */
  form.querySelectorAll('input, select, textarea').forEach(input => {
    input.addEventListener('blur',  () => validateField(input));
    input.addEventListener('input', () => { if (input.classList.contains('invalid')) validateField(input); });
  });

  /* ── Submit ────────────────────────────────────────────── */
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    successMsg.style.display = 'none';
    errorMsg.style.display   = 'none';

    // Validate all required fields
    let valid = true;
    form.querySelectorAll('[required]').forEach(f => { if (!validateField(f)) valid = false; });
    if (!valid) {
      errorMsg.style.display = 'flex';
      errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    // Build payload — field names must match what the backend expects
    const payload = {
      full_name        : document.getElementById('fullName').value.trim(),
      gender           : document.getElementById('gender').value,
      age              : document.getElementById('age').value,
      phone            : document.getElementById('phone').value.trim(),
      email            : document.getElementById('email').value.trim() || undefined,
      address          : document.getElementById('patientAddress').value.trim() || undefined,
      language         : document.getElementById('language').value || 'en',
      service          : document.getElementById('service').value,
      appointment_date : document.getElementById('appointmentDate').value,
      appointment_time : document.getElementById('appointmentTime').value,
      symptoms         : document.getElementById('symptoms').value.trim(),
      notes            : document.getElementById('notes').value.trim() || undefined
    };

    // Loading state
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Booking…</span>';

    try {
      const res = await fetch(API_BASE + '/appointments', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        successMsg.style.display = 'flex';
        successMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        form.reset();
        setTimeout(() => { successMsg.style.display = 'none'; }, 5000);
      } else {
        // Show server-side validation errors if any
        const msg = data.errors
          ? data.errors.join(' | ')
          : (data.message || 'Booking failed. Please try again.');
        showInlineError(msg);
      }

    } catch (err) {
      console.error('Appointment error:', err);
      showInlineError('Could not connect to the server. Please check your connection and try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-calendar-check"></i> <span data-en="Book Appointment" data-am="ቀጠሮ ይያዙ">Book Appointment</span>';
      if (window.WigoLang) window.WigoLang.updateContent();
    }
  });

  function showInlineError(msg) {
    const el = document.getElementById('errorMsgText') || errorMsg;
    if (el && el !== errorMsg) el.textContent = msg;
    errorMsg.style.display = 'flex';
    errorMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  /* ── Reset ─────────────────────────────────────────────── */
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset the form?')) {
        form.reset();
        successMsg.style.display = 'none';
        errorMsg.style.display   = 'none';
        document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
        document.querySelectorAll('.invalid').forEach(el => el.classList.remove('invalid'));
      }
    });
  }
});
