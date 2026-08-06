/**
 * WIGO Herbal — Contact Form
 * Submits to live backend: POST /api/contact
 */

/**
 * API Base URL — resolves automatically for every environment:
 *   Local dev    → http://localhost:5000/api
 *   Render.com   → https://wigo-herbal.onrender.com/api
 *   Custom domain → https://wigoherbal.com/api
 */
const API_BASE = window.location.origin + '/api';

document.addEventListener('DOMContentLoaded', () => {
  const form        = document.getElementById('contactForm');
  const formSuccess = document.getElementById('formSuccess');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name    = document.getElementById('contactName').value.trim();
    const phone   = document.getElementById('contactPhone').value.trim();
    const subject = document.getElementById('contactSubject').value.trim();
    const message = document.getElementById('contactMessage').value.trim();

    // Basic validation
    if (!name || !phone || !subject || !message) {
      showMsg('Please fill all required fields.', 'error');
      return;
    }
    if (!/^[0-9+\s\-()+]{7,20}$/.test(phone)) {
      showMsg('Please enter a valid phone number.', 'error');
      return;
    }

    const submitBtn = form.querySelector('[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Sending…</span>';

    try {
      const res = await fetch(API_BASE + '/contact', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ name, phone, subject, message })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        if (formSuccess) {
          formSuccess.style.display = 'flex';
          setTimeout(() => { formSuccess.style.display = 'none'; }, 5000);
        } else {
          showMsg('Message sent successfully!', 'success');
        }
        form.reset();
      } else {
        const msg = data.errors
          ? data.errors.join(' | ')
          : (data.message || 'Failed to send message. Please try again.');
        showMsg(msg, 'error');
      }

    } catch (err) {
      console.error('Contact error:', err);
      showMsg('Could not connect to the server. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span data-en="Send Message" data-am="መልዕክት ላክ">Send Message</span>';
      if (window.WigoLang) window.WigoLang.updateContent();
    }
  });

  function showMsg(message, type) {
    if (window.WigoUtils) {
      window.WigoUtils.showMessage(message, type);
    } else {
      alert(message);
    }
  }
});
