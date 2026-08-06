/**
 * WIGO Herbal — Gallery v3
 * 16 plants, bilingual EN/AM, search, filter, lightbox
 */
(function () {
  'use strict';

  function plantImg(name) {
    return './assets/images/plants/' + name + '.svg';
  }

  var PLANTS = [
    {
      id: 1, img: plantImg('black-pepper'), category: 'medicinal',
      en: { name: 'Black Pepper', amharic_name: 'ቅንዶ በርበሬ', sci: 'Piper nigrum',
            use: 'Digestive aid, antimicrobial, circulation stimulant',
            disease: 'Digestive disorders, joint pain, respiratory infections' },
      am: { name: 'ቅንዶ በርበሬ', sci: 'Piper nigrum',
            use: 'ለምግብ መፈጨት ድጋፍ፣ ፀረ-ተህዋሲያን፣ የደም ዝውውርን ያበረታታል',
            disease: 'የምግብ መፈጨት ችግሮች፣ የመገጣጠሚያ ህመም፣ የመተንፈሻ ኢንፌክሽኖች' }
    },
    {
      id: 2, img: plantImg('koseret'), category: 'medicinal',
      en: { name: 'Koseret', amharic_name: 'ኮሰረት', sci: 'Lippia abyssinica',
            use: 'Antimicrobial, digestive aid, flavoring herb',
            disease: 'Stomach problems, fever, respiratory infections, skin conditions' },
      am: { name: 'ኮሰረት', sci: 'Lippia abyssinica',
            use: 'ፀረ-ተህዋሲያን፣ ምግብ ይፈጫል፣ ለምግብ ጣዕም',
            disease: 'የሆድ ችግሮች፣ ትኩሳት፣ የመተንፈሻ ኢንፌክሽኖች፣ የቆዳ ሁኔታዎች' }
    },
    {
      id: 3, img: plantImg('kessie'), category: 'medicinal',
      en: { name: 'Kessie', amharic_name: 'ከሲ', sci: 'Lippia adoensis',
            use: 'Antimicrobial, antifungal, flavoring, digestive tonic',
            disease: 'Stomach ache, malaria, cold & flu, skin infections' },
      am: { name: 'ከሲ', sci: 'Lippia adoensis',
            use: 'ፀረ-ተህዋሲያን፣ ፀረ-ፈንገስ፣ ለምግብ ጣዕም፣ ለምግብ መፈጨት',
            disease: 'የሆድ ቁርጠት፣ ወባ፣ ጉንፋን፣ የቆዳ ኢንፌክሽኖች' }
    },
    {
      id: 4, img: plantImg('carissa-edulis'), category: 'medicinal',
      en: { name: 'Carissa edulis', amharic_name: 'አጋም', sci: 'Carissa edulis',
            use: 'Antifungal, antimicrobial, fever reduction',
            disease: 'Fever, skin infections, sexually transmitted diseases' },
      am: { name: 'አጋም', sci: 'Carissa edulis',
            use: 'ፀረ-ፈንገስ፣ ፀረ-ተህዋሲያን፣ ትኩሳትን ያቀዘቅዛል',
            disease: 'ትኩሳት፣ የቆዳ ኢንፌክሽኖች፣ የግብረ-ሥጋ ጠባቂ በሽታዎች' }
    },
    {
      id: 5, img: plantImg('shameplant'), category: 'medicinal',
      en: { name: 'Shameplant', amharic_name: 'የሰዉ ነገር', sci: 'Mimosa pudica',
            use: 'Antibacterial, antivenom, anticonvulsant, wound healing',
            disease: 'Urogenital disorders, piles, dysentery, sinus, wounds' },
      am: { name: 'የሰዉ ነገር', sci: 'Mimosa pudica',
            use: 'ፀረ-ባክቴሪያ፣ ፀረ-መርዝ፣ ፀረ-ቁርጠት፣ የቁስለት ፈውስ',
            disease: 'የሽንት ችግሮች፣ ኢሄሞሮይድ፣ ተቅማጥ፣ ሳይነስ፣ ቁስሎች' }
    },
    {
      id: 6, img: plantImg('gallant-soldier'), category: 'medicinal',
      en: { name: 'Gallant Soldier', amharic_name: 'የሽዋ አረም', sci: 'Galinsoga parviflora',
            use: 'Anti-inflammatory, wound healing, antimicrobial',
            disease: 'Wounds, skin inflammation, digestive issues, fever' },
      am: { name: 'የሽዋ አረም', sci: 'Galinsoga parviflora',
            use: 'ፀረ-ማቃጠያ፣ የቁስለት ፈውስ፣ ፀረ-ተህዋሲያን',
            disease: 'ቁስሎች፣ የቆዳ ማቃጠያ፣ የምግብ መፈጨት ችግሮች፣ ትኩሳት' }
    },
    {
      id: 7, img: plantImg('amaranthus-caudatus'), category: 'nutritional',
      en: { name: 'Love Lies Bleeding', amharic_name: 'የባሀር ጤፍ', sci: 'Amaranthus caudatus',
            use: 'Nutritional supplement, antioxidant, anti-inflammatory',
            disease: 'Anemia, malnutrition, inflammation, cholesterol' },
      am: { name: 'የባሀር ጤፍ', sci: 'Amaranthus caudatus',
            use: 'የምግብ ማሟያ፣ አንቲኦክሲደንት፣ ፀረ-ማቃጠያ',
            disease: 'ደም ማነስ፣ ምግብ እጥረት፣ ማቃጠያ፣ ኮሌስትሮል' }
    },
    {
      id: 8, img: plantImg('toothache-plant'), category: 'medicinal',
      en: { name: 'Toothache Plant', amharic_name: 'የምድር በርበሬ', sci: 'Acmella oleracea',
            use: 'Local anesthetic, analgesic, anti-inflammatory, antimicrobial',
            disease: 'Toothache, gum disease, throat infections, fever, headache' },
      am: { name: 'የምድር በርበሬ', sci: 'Acmella oleracea',
            use: 'የአካባቢ ማደንዘዣ፣ ህመም ማስታገሻ፣ ፀረ-ማቃጠያ፣ ፀረ-ተህዋሲያን',
            disease: 'የጥርስ ህመም፣ የድዳ በሽታ፣ የጉሮሮ ኢንፌክሽን፣ ትኩሳት፣ ራስ ምታት' }
    },
    {
      id: 9, img: plantImg('solanum-nigrum'), category: 'medicinal',
      en: { name: 'European Black Nightshade', amharic_name: 'የአይጥ አውጥ', sci: 'Solanum nigrum',
            use: 'Anti-inflammatory, analgesic, antipyretic, antioxidant',
            disease: 'Fever, inflammation, skin diseases, liver conditions, pain relief' },
      am: { name: 'የአይጥ አውጥ', sci: 'Solanum nigrum',
            use: 'ፀረ-ማቃጠያ፣ ህመም ማስታገሻ፣ ትኩሳት ማስወገጃ፣ አንቲኦክሲደንት',
            disease: 'ትኩሳት፣ ማቃጠያ፣ የቆዳ በሽታዎች፣ የጉበት ሁኔታዎች፣ ህመም ማስታገሻ' }
    },
    {
      id: 10, img: plantImg('artichoke'), category: 'digestive',
      en: { name: 'Globe Artichoke', amharic_name: 'ቀንጫሌ', sci: 'Cynara scolymus',
            use: 'Liver tonic, digestive aid, cholesterol reduction, antioxidant',
            disease: 'Liver disease, high cholesterol, digestive disorders, diabetes' },
      am: { name: 'ቀንጫሌ', sci: 'Cynara scolymus',
            use: 'ለጉበት ማጠንከሪያ፣ ምግብ ይፈጫል፣ ኮሌስትሮልን ይቀንሳል፣ አንቲኦክሲደንት',
            disease: 'የጉበት በሽታ፣ ከፍተኛ ኮሌስትሮል፣ የምግብ መፈጨት ችግሮች፣ ስኳር በሽታ' }
    },
    {
      id: 11, img: plantImg('solanum-americanum'), category: 'medicinal',
      en: { name: 'American Black Nightshade', amharic_name: 'የአይጥ አውጥ', sci: 'Solanum americanum',
            use: 'Anti-inflammatory, analgesic, antimicrobial, antifungal',
            disease: 'Fever, skin diseases, urinary infections, inflammation, pain' },
      am: { name: 'የአይጥ አውጥ', sci: 'Solanum americanum',
            use: 'ፀረ-ማቃጠያ፣ ህመም ማስታገሻ፣ ፀረ-ተህዋሲያን፣ ፀረ-ፈንገስ',
            disease: 'ትኩሳት፣ የቆዳ በሽታዎች፣ የሽንት ኢንፌክሽኖች፣ ማቃጠያ፣ ህመም' }
    },
    {
      id: 12, img: plantImg('verbena'), category: 'medicinal',
      en: { name: 'Common Verbena / Vervain', amharic_name: 'አቱች', sci: 'Verbena officinalis',
            use: 'Anti-inflammatory, analgesic, nervine tonic, antimicrobial',
            disease: 'Headache, nervousness, fever, kidney stones, liver problems' },
      am: { name: 'አቱች', sci: 'Verbena officinalis',
            use: 'ፀረ-ማቃጠያ፣ ህመም ማስታገሻ፣ ለነርቭ ማጠናከሪያ፣ ፀረ-ተህዋሲያን',
            disease: 'ራስ ምታት፣ ጭንቀት፣ ትኩሳት፣ የኩላሊት ድንጋይ፣ የጉበት ችግሮች' }
    },
    {
      id: 13, img: plantImg('myrtle'), category: 'skin',
      en: { name: 'Myrtle', amharic_name: 'አደስ (ዕፀ ሰርሲን)', sci: 'Myrtus communis',
            use: 'Antiseptic, astringent, skin care, antifungal, antioxidant',
            disease: 'Skin diseases, fungal infections, respiratory conditions, wounds' },
      am: { name: 'አደስ (ዕፀ ሰርሲን)', sci: 'Myrtus communis',
            use: 'ፀረ-ተህዋሲ፣ አስትሪንጀንት፣ የቆዳ እንክብካቤ፣ ፀረ-ፈንገስ፣ አንቲኦክሲደንት',
            disease: 'የቆዳ በሽታዎች፣ የፈንገስ ኢንፌክሽኖች፣ የመተንፈሻ ሁኔታዎች፣ ቁስሎች' }
    },
    {
      id: 14, img: plantImg('garden-cress'), category: 'nutritional',
      en: { name: 'Garden Cress', amharic_name: 'ፉሞ', sci: 'Lepidium sativum',
            use: 'Diuretic, bone strengthening, respiratory support, nutritional',
            disease: 'Bone weakness, kidney problems, anemia, asthma, constipation' },
      am: { name: 'ፉሞ', sci: 'Lepidium sativum',
            use: 'ሽንትን ይጨምራል፣ አጥንትን ያጠናክራል፣ ለመተንፈሻ ድጋፍ፣ ምግብ ነክ',
            disease: 'የአጥንት ድካም፣ የኩላሊት ችግሮች፣ ደም ማነስ፣ አስም፣ ሰኮና' }
    },
    {
      id: 15, img: plantImg('ginger'), category: 'digestive',
      en: { name: 'Ginger', amharic_name: 'ዝንጅብል', sci: 'Zingiber officinale',
            use: 'Anti-nausea, digestive aid, anti-inflammatory, circulation stimulant',
            disease: 'Nausea, digestive disorders, arthritis, cold & flu, muscle pain' },
      am: { name: 'ዝንጅብል', sci: 'Zingiber officinale',
            use: 'ማቅለሽለሽን ያቆማል፣ ምግብ ይፈጫል፣ ፀረ-ማቃጠያ፣ ደምን ያንቀሳቅሳል',
            disease: 'ማቅለሽለሽ፣ የምግብ መፈጨት ችግሮች፣ ሪህ፣ ጉንፋን፣ የጡንቻ ህመም' }
    },
    {
      id: 16, img: plantImg('fennel'), category: 'digestive',
      en: { name: 'Fennel', amharic_name: 'እንስላል', sci: 'Foeniculum vulgare',
            use: 'Digestive aid, anti-spasmodic, carminative, anti-inflammatory',
            disease: 'Bloating, gas, irritable bowel, colic, indigestion, menstrual pain' },
      am: { name: 'እንስላል', sci: 'Foeniculum vulgare',
            use: 'ምግብ ይፈጫል፣ ፀረ-ቁርጠት፣ ጋዝን ያወጣል፣ ፀረ-ማቃጠያ',
            disease: 'ሆድ መነፋት፣ ጋዝ፣ የሆድ ቁርጠት፣ ቅድመ-ወሊድ ህመም፣ ምግብ አለ-መፈጨት' }
    }
  ];

  /* ─── State ─────────────────────────────────────────────────── */
  var currentLang    = 'en';
  var activeCategory = 'all';
  var searchQuery    = '';
  var filteredPlants = PLANTS.slice();
  var lightboxIndex  = 0;
  var touchStartX    = 0;
  var touchStartY    = 0;

  /* ─── DOM refs ──────────────────────────────────────────────── */
  var grid, searchInput, clearBtn, noResults;
  var lightbox, lbImg, lbClose, lbPrev, lbNext, lbCounter;
  var lbName, lbAm, lbSci, lbUse, lbDis;

  /* ─── Init ──────────────────────────────────────────────────── */
  function init() {
    grid        = document.getElementById('galleryGrid');
    searchInput = document.getElementById('gallerySearch');
    clearBtn    = document.getElementById('galleryClear');
    noResults   = document.getElementById('noResults');
    lightbox    = document.getElementById('lightbox');
    lbImg       = document.getElementById('lbImg');
    lbClose     = document.getElementById('lbClose');
    lbPrev      = document.getElementById('lbPrev');
    lbNext      = document.getElementById('lbNext');
    lbCounter   = document.getElementById('lbCounter');
    lbName      = document.getElementById('lbName');
    lbAm        = document.getElementById('lbAm');
    lbSci       = document.getElementById('lbSci');
    lbUse       = document.getElementById('lbUse');
    lbDis       = document.getElementById('lbDis');

    if (!grid) return;
    renderCards();
    bindFilters();
    bindLightbox();
    bindSearch();
    syncLang();

    document.addEventListener('langChanged', function (e) {
      currentLang = (e.detail && e.detail.lang) ? e.detail.lang : currentLang;
      renderCards();
    });
    document.querySelectorAll('.lang-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setTimeout(function () {
          var a = document.querySelector('.lang-btn.active');
          if (a) currentLang = a.dataset.lang || 'en';
          renderCards();
        }, 50);
      });
    });
  }

  function syncLang() {
    var a = document.querySelector('.lang-btn.active');
    if (a) currentLang = a.dataset.lang || 'en';
  }

  /* ─── Render cards ──────────────────────────────────────────── */
  function renderCards() {
    syncLang();
    applyFilter();
    if (!grid) return;
    grid.innerHTML = '';

    var els = [document.getElementById('resultCount'), document.getElementById('resultCount2')];
    els.forEach(function (el) { if (el) el.textContent = filteredPlants.length; });

    if (filteredPlants.length === 0) {
      if (noResults) noResults.style.display = 'block';
      return;
    }
    if (noResults) noResults.style.display = 'none';

    filteredPlants.forEach(function (plant, idx) {
      var d    = currentLang === 'am' ? plant.am : plant.en;
      var card = document.createElement('div');
      card.className = 'gallery-card';
      card.setAttribute('data-aos', 'fade-up');
      card.setAttribute('data-aos-delay', String(Math.min(idx * 80, 400)));
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-label', d.name);

      var badge = getCategoryLabel(plant.category, currentLang);

      card.innerHTML =
        '<div class="gc-img-wrap">' +
          '<img src="' + plant.img + '" alt="' + esc(d.name) + '" loading="lazy"' +
          ' onerror="this.onerror=null;this.closest(\'.gc-img-wrap\').classList.add(\'img-error\')">' +
          '<div class="gc-overlay"><i class="fas fa-search-plus"></i></div>' +
          '<span class="gc-badge">' + esc(badge) + '</span>' +
        '</div>' +
        '<div class="gc-info">' +
          '<h3 class="gc-name">' + esc(d.name) + '</h3>' +
          (currentLang === 'en' && plant.en.amharic_name
            ? '<p class="gc-am">' + esc(plant.en.amharic_name) + '</p>' : '') +
          '<p class="gc-sci"><em>' + esc(d.sci) + '</em></p>' +
          '<div class="gc-meta"><span><i class="fas fa-leaf"></i> ' + esc(trunc(d.use, 60)) + '</span></div>' +
        '</div>';

      card.addEventListener('click',   function ()  { openLightbox(plant); });
      card.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openLightbox(plant); }
      });
      grid.appendChild(card);
    });

    if (window.AOS) AOS.refresh();
  }

  /* ─── Filter ────────────────────────────────────────────────── */
  function applyFilter() {
    filteredPlants = PLANTS.filter(function (p) {
      var d = currentLang === 'am' ? p.am : p.en;
      var inCat = activeCategory === 'all' || p.category === activeCategory;
      var q = searchQuery.toLowerCase();
      var inSrc = !q ||
        (d.name    && d.name.toLowerCase().includes(q)) ||
        (d.sci     && d.sci.toLowerCase().includes(q))  ||
        (d.use     && d.use.toLowerCase().includes(q))  ||
        (d.disease && d.disease.toLowerCase().includes(q)) ||
        (p.en.amharic_name && p.en.amharic_name.toLowerCase().includes(q));
      return inCat && inSrc;
    });
  }

  function bindFilters() {
    document.querySelectorAll('.gallery-filter-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.gallery-filter-btn').forEach(function (b) {
          b.classList.remove('active'); b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true');
        activeCategory = btn.dataset.filter || 'all';
        renderCards();
      });
    });
  }

  function bindSearch() {
    if (!searchInput) return;
    searchInput.addEventListener('input', function () {
      searchQuery = searchInput.value.trim();
      if (clearBtn) clearBtn.style.display = searchQuery ? 'flex' : 'none';
      renderCards();
    });
    if (clearBtn) clearBtn.addEventListener('click', function () {
      searchInput.value = ''; searchQuery = '';
      clearBtn.style.display = 'none';
      renderCards(); searchInput.focus();
    });
  }

  /* ─── Lightbox ──────────────────────────────────────────────── */
  function openLightbox(plant) {
    lightboxIndex = filteredPlants.findIndex(function (p) { return p.id === plant.id; });
    showLightboxSlide();
    lightbox.classList.add('active');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    if (lbClose) lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  function showLightboxSlide() {
    var p = filteredPlants[lightboxIndex];
    if (!p) return;
    var d = currentLang === 'am' ? p.am : p.en;
    lbImg.src = p.img;  lbImg.alt = d.name;
    if (lbCounter) lbCounter.textContent = (lightboxIndex + 1) + ' / ' + filteredPlants.length;
    if (lbName) lbName.textContent = d.name;
    if (lbAm)   lbAm.textContent   = (currentLang === 'en' && p.en.amharic_name) ? p.en.amharic_name : '';
    if (lbSci)  lbSci.textContent   = d.sci;
    if (lbUse)  lbUse.textContent   = d.use;
    if (lbDis)  lbDis.textContent   = currentLang === 'am' ? p.am.disease : p.en.disease;
    if (lbPrev) lbPrev.style.display = filteredPlants.length > 1 ? 'flex' : 'none';
    if (lbNext) lbNext.style.display = filteredPlants.length > 1 ? 'flex' : 'none';
  }

  function bindLightbox() {
    if (!lightbox) return;
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', function () {
      lightboxIndex = (lightboxIndex - 1 + filteredPlants.length) % filteredPlants.length;
      showLightboxSlide();
    });
    lbNext.addEventListener('click', function () {
      lightboxIndex = (lightboxIndex + 1) % filteredPlants.length;
      showLightboxSlide();
    });
    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', function (e) {
      if (!lightbox.classList.contains('active')) return;
      if (e.key === 'Escape')     closeLightbox();
      if (e.key === 'ArrowLeft')  { lightboxIndex = (lightboxIndex - 1 + filteredPlants.length) % filteredPlants.length; showLightboxSlide(); }
      if (e.key === 'ArrowRight') { lightboxIndex = (lightboxIndex + 1) % filteredPlants.length; showLightboxSlide(); }
    });
    lbImg.addEventListener('touchstart', function (e) {
      touchStartX = e.changedTouches[0].clientX; touchStartY = e.changedTouches[0].clientY;
    }, { passive: true });
    lbImg.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 40) {
        lightboxIndex = dx < 0
          ? (lightboxIndex + 1) % filteredPlants.length
          : (lightboxIndex - 1 + filteredPlants.length) % filteredPlants.length;
        showLightboxSlide();
      }
    }, { passive: true });
  }

  /* ─── Helpers ───────────────────────────────────────────────── */
  function esc(s) {
    return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  function trunc(s, n) { return s && s.length > n ? s.slice(0, n) + '…' : (s || ''); }
  function getCategoryLabel(cat, lang) {
    var m = { all:{en:'All',am:'ሁሉም'}, medicinal:{en:'Medicinal',am:'መድኃኒታዊ'},
              digestive:{en:'Digestive',am:'ምግብ መፈጨት'}, respiratory:{en:'Respiratory',am:'መተንፈሻ'},
              skin:{en:'Skin Care',am:'የቆዳ እንክብካቤ'}, nutritional:{en:'Nutritional',am:'አመጋገብ'} };
    return ((m[cat] || m.medicinal)[lang]) || (m[cat] || m.medicinal).en;
  }

  /* ─── Boot ──────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

}());
