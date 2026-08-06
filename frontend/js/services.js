/**
 * WIGO Herbal — Services Page
 * Fetches services from live backend: GET /api/services
 * Falls back to hardcoded data if API is unreachable.
 */

/**
 * API Base URL — resolves automatically for every environment:
 *   Local dev    → http://localhost:5000/api
 *   Render.com   → https://wigo-herbal.onrender.com/api
 *   Custom domain → https://wigoherbal.com/api
 */
const API_BASE = window.location.origin + '/api';

const servicesData = [
    {
        id: 1,
        en: { title: "Waist Pain Treatment", description: "Traditional herbal remedies for lower back and waist pain relief." },
        am: { title: "ለወገብ ህመም", description: "ለወገብና የታችኛው ጀርባ ህመም ማስታገሻ ባህላዊ የእፅዋት መድኃኒቶች።" },
        icon: "fas fa-procedures",
        iconClass: "icon-pain"
    },
    {
        id: 2,
        en: { title: "Hip Pain Treatment", description: "Natural treatments for hip joint pain and mobility issues." },
        am: { title: "ለበጀድ ህመም", description: "ለበጀድ መገጣጠሚያ ህመም እና የእንቅስቃሴ ችግሮች ተፈጥራዊ ሕክምናዎች።" },
        icon: "fas fa-walking",
        iconClass: "icon-pain"
    },
    {
        id: 3,
        en: { title: "Shoulder, Back & Arm Pain", description: "Comprehensive herbal therapy for upper body pain management." },
        am: { title: "ለትከሻ፣ ለጀርባ እና ለእጅ ህመም", description: "ለላይኛው የሰውነት ክፍል ህመም አጠቃላይ የእፅዋት ሕክምና።" },
        icon: "fas fa-hand-paper",
        iconClass: "icon-pain"
    },
    {
        id: 4,
        en: { title: "Leg Pain Treatment", description: "Effective herbal solutions for leg pain and discomfort." },
        am: { title: "ለእግር ህመም", description: "ለእግር ህመም እና ምቾት ውጤታማ የእፅዋት መፍትሄዎች።" },
        icon: "fas fa-shoe-prints",
        iconClass: "icon-pain"
    },
    {
        id: 5,
        en: { title: "Kidney Problems", description: "Traditional remedies for kidney health and function." },
        am: { title: "ለኩላሊት ህመም", description: "ለኩላሊት ጤና እና ተግባር ባህላዊ መድኃኒቶች።" },
        icon: "fas fa-tint",
        iconClass: "icon-kidney"
    },
    {
        id: 6,
        en: { title: "Stomach & Intestinal Ulcer", description: "Natural healing for digestive system ulcers and disorders." },
        am: { title: "ለሆድ ህመም (ጭጓራ እና አንጀት ቁስለት)", description: "ለምግብ መፈጨት ሥርዓት ቁስለቶች እና ችግሮች ተፈጥራዊ ፈውስ።" },
        icon: "fas fa-seedling",
        iconClass: "icon-stomach"
    },
    {
        id: 7,
        en: { title: "Nerve Disorders", description: "Herbal treatments for nervous system conditions." },
        am: { title: "ለነርቭ መታወክ", description: "ለነርቭ ስርዓት ሁኔታዎች የእፅዋት ሕክምናዎች።" },
        icon: "fas fa-brain",
        iconClass: "icon-nerve"
    },
    {
        id: 8,
        en: { title: "Uterus Problems", description: "Women's health treatments for uterine conditions." },
        am: { title: "ለማህጸን ችግሮች", description: "ለማህጸን ሁኔታዎች የሴቶች ጤና ሕክምናዎች።" },
        icon: "fas fa-female",
        iconClass: "icon-uterus"
    },
    {
        id: 9,
        en: { title: "Rheumatism", description: "Traditional remedies for rheumatic conditions and joint pain." },
        am: { title: "ለሪህ ህመም", description: "ለሪህ ሁኔታዎች እና የመገጣጠሚያ ህመም ባህላዊ መድኃኒቶች።" },
        icon: "fas fa-joint",
        iconClass: "icon-pain"
    },
    {
        id: 10,
        en: { title: "Respiratory Problems", description: "Herbal solutions for breathing and lung health." },
        am: { title: "ለመተንፈሻ ችግሮች", description: "ለመተንፈስ እና ለሳንባ ጤና የእፅዋት መፍትሄዎች።" },
        icon: "fas fa-lungs",
        iconClass: "icon-respiratory"
    },
    {
        id: 11,
        en: { title: "Skin Diseases", description: "Natural treatments for various skin conditions." },
        am: { title: "ለቆዳ ህመም", description: "ለተለያዩ የቆዳ ሁኔታዎች ተፈጥራዊ ሕክምናዎች።" },
        icon: "fas fa-allergies",
        iconClass: "icon-skin"
    },
    {
        id: 12,
        en: { title: "Hemorrhoids", description: "Effective herbal remedies for hemorrhoid relief." },
        am: { title: "ለኪንታሮት", description: "ለኪንታሮት ማስታገሻ ውጤታማ የእፅዋት መድኃኒቶች።" },
        icon: "fas fa-band-aid",
        iconClass: "icon-stomach"
    },
    {
        id: 13,
        en: { title: "Eye Problems", description: "Traditional eye care and vision health treatments." },
        am: { title: "ለአይን ህመም", description: "ባህላዊ የዓይን እንክብካቤ እና የዕይታ ጤና ሕክምናዎች።" },
        icon: "fas fa-eye",
        iconClass: "icon-eye"
    },
    {
        id: 14,
        en: { title: "Brain Problems", description: "Herbal support for neurological health." },
        am: { title: "ለአእምሮ ህመም", description: "ለነርቭ ጤና የእፅዋት ድጋፍ።" },
        icon: "fas fa-brain",
        iconClass: "icon-brain"
    },
    {
        id: 15,
        en: { title: "Prostate & Urinary Problems", description: "Men's health treatments for prostate and urinary conditions." },
        am: { title: "ለፕሮስቴት እና ለሽንት ችግሮች", description: "ለፕሮስቴት እና ለሽንት ሁኔታዎች የወንዶች ጤና ሕክምናዎች።" },
        icon: "fas fa-male",
        iconClass: "icon-kidney"
    },
    {
        id: 16,
        en: { title: "Body Pain & Weakness", description: "Comprehensive treatment for general body pain and fatigue." },
        am: { title: "ለሰውነት ቁርጥማት እና ማቃተል", description: "ለአጠቃላይ የሰውነት ህመም እና ድካም አጠቃላይ ሕክምና።" },
        icon: "fas fa-running",
        iconClass: "icon-pain"
    },
    {
        id: 17,
        en: { title: "Epilepsy", description: "Traditional herbal management for epileptic conditions." },
        am: { title: "ለሚጥል በሽታ", description: "ለሚጥል ሁኔታዎች ባህላዊ የእፅዋት አስተዳደር።" },
        icon: "fas fa-bolt",
        iconClass: "icon-nerve"
    },
    {
        id: 18,
        en: { title: "Bone & Joint Pain", description: "Natural remedies for skeletal and joint health." },
        am: { title: "ለአጥንት እና መገጣጠሚያ ህመም", description: "ለአጥንት እና መገጣጠሚያ ጤና ተፈጥራዊ መድኃኒቶች።" },
        icon: "fas fa-bone",
        iconClass: "icon-bone"
    },
    {
        id: 19,
        en: { title: "Other Health Problems", description: "Consultation for various other health conditions." },
        am: { title: "ለቁራኛ እና ሌሎች", description: "ለተለያዩ ሌሎች የጤና ሁኔታዎች ምክክር።" },
        icon: "fas fa-stethoscope",
        iconClass: "icon-other"
    }
];

// Render all service cards
function renderServices(services) {
    const grid = document.getElementById('servicesGrid');
    const lang = window.WigoLang ? window.WigoLang.getCurrentLang() : 'en';
    
    if (!grid) return;
    
    if (services.length === 0) {
        grid.innerHTML = '';
        document.getElementById('noResults').style.display = 'block';
        return;
    }
    
    document.getElementById('noResults').style.display = 'none';
    
    grid.innerHTML = services.map(service => `
        <div class="service-card" data-aos="fade-up" data-id="${service.id}">
            <div class="service-number">${service.id}</div>

            <div class="service-icon ${service.iconClass}">
                <i class="${service.icon}" style="color:white;font-size:2rem;"></i>
            </div>

            <!-- Bilingual title via data-en/data-am so language.js switches it -->
            <h3 class="service-title"
                data-en="${service.en.title}"
                data-am="${service.am.title}">
                ${lang === 'am' ? service.am.title : service.en.title}
            </h3>

            <p class="service-description"
               data-en="${service.en.description}"
               data-am="${service.am.description}">
                ${lang === 'am' ? service.am.description : service.en.description}
            </p>

            <div class="service-actions">
                <button class="btn btn-outline-sm" onclick="learnMore(${service.id})">
                    <i class="fas fa-info-circle"></i>
                    <span data-en="Learn More" data-am="ተጨማሪ ይወቁ">${lang === 'am' ? 'ተጨማሪ ይወቁ' : 'Learn More'}</span>
                </button>
                <a href="appointment.html" class="btn btn-primary">
                    <i class="fas fa-calendar-plus"></i>
                    <span data-en="Book Now" data-am="ቀጠሮ ይያዙ">${lang === 'am' ? 'ቀጠሮ ይያዙ' : 'Book Now'}</span>
                </a>
            </div>
        </div>
    `).join('');
    
    // Re-initialize AOS for dynamically added elements
    if (typeof AOS !== 'undefined') AOS.refresh();
}

// Filter services based on search query
function filterServices(query) {
    if (!query.trim()) {
        renderServices(servicesData);
        return;
    }
    
    const q = query.toLowerCase();
    const filtered = servicesData.filter(service => {
        return service.en.title.toLowerCase().includes(q) ||
               service.am.title.includes(query) ||
               service.en.description.toLowerCase().includes(q) ||
               service.am.description.includes(query);
    });
    
    renderServices(filtered);
}

// Highlight matching text in search results
function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// Learn More (can be expanded later)
function learnMore(id) {
    const service = servicesData.find(s => s.id === id);
    if (!service) return;
    const lang = window.WigoLang ? window.WigoLang.getCurrentLang() : 'en';
    alert(`${service[lang].title}\n\n${service[lang].description}\n\nBook an appointment to learn more.`);
}

// Update service text on language change — delegates to WigoLang data-en/am system
function updateServiceLanguage() {
    const lang = window.WigoLang ? window.WigoLang.getCurrentLang() : 'en';

    // Re-render cards so bilingual text is refreshed
    const query = document.getElementById('serviceSearch') ? document.getElementById('serviceSearch').value : '';
    filterServices(query);

    // Also run the global attribute-based update for any data-en elements in the grid
    if (window.WigoLang && window.WigoLang.updateContent) {
        window.WigoLang.updateContent();
    }
}

// Icon map — maps service title keywords to FontAwesome icons
const iconMap = [
  { match: /waist|back|shoulder|arm|leg|body|pain|rheumat/i, icon: 'fas fa-procedures',  cls: 'icon-pain' },
  { match: /kidney/i,                                         icon: 'fas fa-tint',         cls: 'icon-kidney' },
  { match: /stomach|ulcer|intestin|digestiv/i,               icon: 'fas fa-seedling',     cls: 'icon-stomach' },
  { match: /hemorrhoid/i,                                     icon: 'fas fa-band-aid',     cls: 'icon-stomach' },
  { match: /nerve|epilep/i,                                   icon: 'fas fa-brain',        cls: 'icon-nerve' },
  { match: /uterus|women|female/i,                            icon: 'fas fa-female',       cls: 'icon-uterus' },
  { match: /respirat|lung|breath/i,                           icon: 'fas fa-lungs',        cls: 'icon-respiratory' },
  { match: /skin/i,                                           icon: 'fas fa-allergies',    cls: 'icon-skin' },
  { match: /eye/i,                                            icon: 'fas fa-eye',          cls: 'icon-eye' },
  { match: /brain/i,                                          icon: 'fas fa-brain',        cls: 'icon-brain' },
  { match: /prostat|urinar/i,                                 icon: 'fas fa-male',         cls: 'icon-kidney' },
  { match: /hip/i,                                            icon: 'fas fa-walking',      cls: 'icon-pain' },
  { match: /bone|joint/i,                                     icon: 'fas fa-bone',         cls: 'icon-bone' },
];

function getIcon(title) {
  for (const entry of iconMap) {
    if (entry.match.test(title)) return { icon: entry.icon, cls: entry.cls };
  }
  return { icon: 'fas fa-stethoscope', cls: 'icon-other' };
}

// Convert API response rows into the format renderServices() expects
function normalizeApiServices(rows) {
  return rows.map(row => {
    const { icon, cls } = getIcon(row.title_en);
    return {
      id  : row.id,
      en  : { title: row.title_en, description: row.description_en },
      am  : { title: row.title_am, description: row.description_am },
      icon: icon,
      iconClass: cls
    };
  });
}

// Initialize — try API first, fall back to hardcoded array
document.addEventListener('DOMContentLoaded', async () => {
  let dataSource = servicesData; // default fallback

  try {
    const res = await fetch(API_BASE + '/services');
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        dataSource = normalizeApiServices(json.data);
        // Keep servicesData in sync so filterServices() works
        servicesData.length = 0;
        dataSource.forEach(s => servicesData.push(s));
      }
    }
  } catch (err) {
    console.warn('Could not fetch services from API — using local data:', err.message);
  }

  renderServices(dataSource);

  // Search
  const searchInput = document.getElementById('serviceSearch');
  const clearBtn    = document.getElementById('clearSearch');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      filterServices(query);
      if (clearBtn) clearBtn.style.display = query ? 'block' : 'none';
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      filterServices('');
      clearBtn.style.display = 'none';
      searchInput.focus();
    });
  }
});

// Listen for language changes
document.addEventListener('languageChanged', updateServiceLanguage);
