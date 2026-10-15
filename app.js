/* =========================================================
   MAIN APPLICATION, GOD MODE, INTERACTIVE RESIZE/ROTATE,
   EASTER EGGS, AUDIO ENGINE & GOOGLE DRIVE AUTO-SYNC (app.js)
   ========================================================= */

/*__VAULT_DATA_START__*/
const BAKED_VAULT_DATA = {
  gdriveClientId: "",
  notice: "Welcome to the official bee yeass cee (el.zavianzz) Class Memory Vault!",
  bio: "Every lecture, cultural fest, trip, and unforgettable moment of our class preserved in high definition.",
  sections: ["Main Wall", "Class Memories", "Culturals & Events", "Trips & IV", "Video Edits", "Audio Vault"],
  items: [
    {
      id: 1,
      title: "bee yeass cee — Official Class Frame",
      date: "Batch Genesis",
      url: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=1400&q=85",
      section: "Class Memories",
      shape: "shape-giant",
      skin: "skin-poster",
      kind: "PHOTO",
      effect: "DRAGON_SLASH",
      scale: 1,
      rotate: 0
    },
    {
      id: 2,
      title: "Cultural Fest Stage Energy",
      date: "Culturals",
      url: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=900&q=85",
      section: "Culturals & Events",
      shape: "shape-poster",
      skin: "skin-neon",
      kind: "PHOTO",
      effect: "FIRE_BURST",
      scale: 1,
      rotate: 0
    },
    {
      id: 3,
      title: "Class IV & Golden Memories",
      date: "Trips & IV",
      url: "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=900&q=85",
      section: "Trips & IV",
      shape: "shape-poster",
      skin: "skin-poster",
      kind: "PHOTO",
      effect: "NONE",
      scale: 1,
      rotate: 0
    },
    {
      id: 4,
      title: "After-Class Campus Chronicles",
      date: "Unforgettable",
      url: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1100&q=85",
      section: "Class Memories",
      shape: "shape-wide",
      skin: "skin-polaroid",
      kind: "PHOTO",
      effect: "NONE",
      scale: 1,
      rotate: 0
    }
  ],
  roster: [
    {
      id: 201,
      name: "Class Advisor",
      role: "Faculty Mentor",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      quote: "Guiding the bee yeass cee batch toward excellence."
    },
    {
      id: 202,
      name: "el.zavianzz Squad",
      role: "Batch Creators",
      avatar: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80",
      quote: "One class, endless memories."
    }
  ],
  milestones: [
    {
      id: 301,
      category: "TIMELINE",
      title: "Chapter 01: First Day of College",
      date: "Semester 01",
      desc: "Where strangers walked into the classroom and became the bee yeass cee family."
    },
    {
      id: 302,
      category: "LORE",
      title: "Most Iconic Batch Emblem",
      date: "el.zavianzz",
      desc: "Forged under the crimson sword and dragon crest."
    }
  ],
  easterEggs: [
    {
      id: 501,
      trigger: "LOGO_TAP_5",
      code: "zavianzz",
      rewardUrl: "",
      message: "🐉 Secret Dragon Vault Unlocked! Long live bee yeass cee (el.zavianzz)!"
    }
  ]
};
/*__VAULT_DATA_END__*/

let state = JSON.parse(localStorage.getItem('byc_vault_state_v12')) || BAKED_VAULT_DATA;
if (!state.easterEggs) state.easterEggs = [];

let currentSection = "Main Wall";
let currentMediaFilter = "ALL";

function saveState(autoSyncDrive = true) {
  localStorage.setItem('byc_vault_state_v12', JSON.stringify(state));
  if (autoSyncDrive && gdriveAccessToken) {
    autoBackupToGoogleDrive();
  }
}

/* =========================================================
   1. UNIVERSAL LINK PARSER (VIDEO, PHOTO, AUDIO, GOOGLE DRIVE)
   ========================================================= */
function extractDriveId(url) {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

function extractYouTubeId(url) {
  if (url.includes('/shorts/')) return url.split('/shorts/')[1].split(/[?&/]/)[0];
  if (url.includes('youtu.be/')) return url.split('youtu.be/')[1].split(/[?&/]/)[0];
  if (url.includes('watch?v=')) return url.split('watch?v=')[1].split('&')[0];
  if (url.includes('/embed/')) return url.split('/embed/')[1].split(/[?&/]/)[0];
  return null;
}

function detectMediaKind(url, explicitKind) {
  if (explicitKind && explicitKind !== 'AUTO') return explicitKind;
  const u = (url || '').toLowerCase();
  if (/\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(u) || u.startsWith('data:audio/')) {
    return 'AUDIO';
  }
  if (
    u.includes('youtube.com') ||
    u.includes('youtu.be') ||
    u.includes('instagram.com/reel') ||
    u.includes('vimeo.com') ||
    u.includes('streamable.com') ||
    /\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(u) ||
    u.startsWith('data:video/')
  ) {
    return 'VIDEO';
  }
  return 'PHOTO';
}

function normalizeImageURL(rawUrl) {
  const url = (rawUrl || '').trim();
  if (url.includes('drive.google.com')) {
    const id = extractDriveId(url);
    if (id) return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
  }
  return url;
}

// Dragon 202327 Loading Shimmer HTML (Disappears smoothly once media finishes loading)
function getDragonShimmerHTML() {
  return `
    <div class="media-loading-shimmer">
      <svg viewBox="0 0 500 500"><use href="#dragon-crest-202327"></use></svg>
    </div>
  `;
}

function renderWallPreviewHTML(item) {
  const url = (item.url || '').trim();
  const kind = detectMediaKind(url, item.kind);

  // 1. AUDIO CARD
  if (kind === 'AUDIO') {
    return `
      <div style="width:100%;height:100%;background:radial-gradient(circle,#2b0205,#060609);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;cursor:pointer;" onclick="playAudioItem(${item.id})">
        <svg viewBox="0 0 500 500" width="64" height="64" style="filter:drop-shadow(0 0 12px #e50914);"><use href="#dragon-crest-202327"></use></svg>
        <div class="play-orb" style="width:42px;height:42px;font-size:0.95rem;">🎵</div>
      </div>
    `;
  }

  // 2. YOUTUBE / SHORTS
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `
      ${getDragonShimmerHTML()}
      <img src="https://i.ytimg.com/vi/${ytId}/hqdefault.jpg" alt="${item.title}" loading="lazy" onload="this.previousElementSibling.style.opacity=0" />
      <div class="video-play-overlay" onclick="openItemWithEffect(${item.id})">
        <div class="play-orb">▶</div>
      </div>
    `;
  }

  // 3. DIRECT VIDEO
  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url) || url.startsWith('data:video/')) {
    return `
      ${getDragonShimmerHTML()}
      <video src="${url}#t=0.5" muted playsinline preload="metadata" onloadeddata="this.previousElementSibling.style.opacity=0"></video>
      <div class="video-play-overlay" onclick="openItemWithEffect(${item.id})">
        <div class="play-orb">▶</div>
      </div>
    `;
  }

  // 4. GOOGLE DRIVE VIDEO OR INSTAGRAM REEL
  if (kind === 'VIDEO') {
    const driveId = extractDriveId(url);
    const thumb = driveId
      ? `https://drive.google.com/thumbnail?id=${driveId}&sz=w1200`
      : `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=800&q=80`;
    return `
      ${getDragonShimmerHTML()}
      <img src="${thumb}" alt="${item.title}" loading="lazy" onload="this.previousElementSibling.style.opacity=0" />
      <div class="video-play-overlay" onclick="openItemWithEffect(${item.id})">
        <div class="play-orb">▶</div>
      </div>
    `;
  }

  // 5. HIGH-RES WALL POSTER PHOTO
  return `
    ${getDragonShimmerHTML()}
    <img src="${normalizeImageURL(url)}" alt="${item.title}" loading="lazy" onload="this.previousElementSibling.style.opacity=0" onclick="openItemWithEffect(${item.id})" style="cursor:pointer;" />
  `;
}

function renderFullPlayableHTML(item) {
  const url = (item.url || '').trim();
  const kind = detectMediaKind(url, item.kind);

  if (kind === 'AUDIO') {
    return `
      <div style="width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:20px;background:#07070c;padding:24px;">
        <svg viewBox="0 0 500 500" width="120" height="120" style="filter:drop-shadow(0 0 20px #e50914);"><use href="#dragon-crest-202327"></use></svg>
        <h3 style="color:#fff;">${item.title}</h3>
        <audio src="${url}" controls autoplay style="width:min(420px,90%);"></audio>
      </div>
    `;
  }

  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `<iframe src="https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&hd=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>`;
  }
  if (url.includes('drive.google.com') && kind === 'VIDEO') {
    const id = extractDriveId(url);
    return `<iframe src="https://drive.google.com/file/d/${id}/preview" allow="autoplay; fullscreen" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>`;
  }
  if (url.includes('instagram.com/reel/') || url.includes('instagram.com/p/')) {
    const cleanIg = url.split('?')[0].replace(/\/$/, '');
    return `<iframe src="${cleanIg}/embed" allowfullscreen style="width:100%;height:100%;border:0;"></iframe>`;
  }
  if (kind === 'VIDEO') {
    return `<video src="${url}" controls autoplay playsinline style="width:100%;height:100%;object-fit:contain;"></video>`;
  }
  return `<img src="${normalizeImageURL(url)}" style="width:100%;height:100%;object-fit:contain;" />`;
}

/* =========================================================
   2. FLOATING AUDIO DECK CONTROLLER
   ========================================================= */
function playAudioItem(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  if (item.effect && item.effect !== 'NONE') {
    triggerSpecialEffect(item.effect);
  }
  const deck = document.getElementById('floating-audio-deck');
  const player = document.getElementById('global-audio-player');
  const titleEl = document.getElementById('audio-track-title');

  let audioUrl = item.url.trim();
  if (audioUrl.includes('drive.google.com')) {
    const idMatch = extractDriveId(audioUrl);
    if (idMatch) audioUrl = `https://docs.google.com/uc?export=download&id=${idMatch}`;
  }

  titleEl.textContent = `🎵 ${item.title} (${item.date})`;
  player.src = audioUrl;
  deck.classList.remove('hidden');
  player.play().catch(() => {});
}

function closeAudioDeck() {
  const deck = document.getElementById('floating-audio-deck');
  const player = document.getElementById('global-audio-player');
  player.pause();
  player.src = '';
  deck.classList.add('hidden');
}

/* =========================================================
   3. RENDER ALL CLASS WEBSITE MODULES & GOD MANAGERS
   ========================================================= */
function toggleMenuDrawer(open) {
  document.getElementById('drawer-overlay').classList.toggle('open', open);
}

function switchHubModule(modName) {
  document.querySelectorAll('.module-section').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.hub-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#drawer-overlay .drawer-item').forEach(d => d.classList.remove('active'));

  document.getElementById(`mod-${modName}`)?.classList.add('active');
  document.getElementById(`tab-${modName}`)?.classList.add('active');
  document.getElementById(`nav-mod-${modName}`)?.classList.add('active');
  toggleMenuDrawer(false);
}

function renderAll() {
  document.getElementById('notice-text').textContent = state.notice;
  document.getElementById('hero-subtitle-text').textContent = state.bio;

  // 1. Render Sections List in Drawer & Studio Select
  const secList = document.getElementById('drawer-sec-list');
  const secSelect = document.getElementById('m-section');
  secList.innerHTML = '';
  secSelect.innerHTML = '';

  state.sections.forEach((sec, idx) => {
    const div = document.createElement('div');
    div.className = `drawer-item ${sec === currentSection ? 'active' : ''}`;
    div.onclick = () => {
      currentSection = sec;
      document.getElementById('active-sec-indicator').textContent = sec;
      switchHubModule('wall');
      renderAll();
    };
    div.innerHTML = `<span>${sec === 'Main Wall' ? '🏠 ' : '📁 '}${sec}</span>`;

    if (sec !== 'Main Wall') {
      const btnWrap = document.createElement('div');
      btnWrap.style.display = 'flex';

      const topBtn = document.createElement('button');
      topBtn.className = 'del-badge-mini';
      topBtn.title = 'Move Section to Top';
      topBtn.textContent = '🔝';
      topBtn.onclick = (e) => {
        e.stopPropagation();
        moveSectionToFirst(idx);
      };

      const delBtn = document.createElement('button');
      delBtn.className = 'del-badge-mini';
      delBtn.title = 'Delete Section';
      delBtn.textContent = '✕';
      delBtn.onclick = (e) => {
        e.stopPropagation();
        deleteSection(sec);
      };

      btnWrap.appendChild(topBtn);
      btnWrap.appendChild(delBtn);
      div.appendChild(btnWrap);
    }
    secList.appendChild(div);

    const opt = document.createElement('option');
    opt.value = sec;
    opt.textContent = sec;
    secSelect.appendChild(opt);
  });

  // 2. Render Bento Poster Wall
  const wallGrid = document.getElementById('bento-wall-grid');
  wallGrid.innerHTML = '';
  const query = (document.getElementById('wall-search-input')?.value || '').toLowerCase().trim();

  // Check if search input matches a Secret Word Easter Egg!
  if (query) {
    checkSecretWordEasterEgg(query);
  }

  const visibleItems = state.items.filter(it => {
    const secMatch = currentSection === 'Main Wall' ? true : it.section === currentSection;
    if (!secMatch) return false;
    if (query && !it.title.toLowerCase().includes(query) && !it.section.toLowerCase().includes(query) && !it.date.toLowerCase().includes(query)) {
      return false;
    }
    if (currentMediaFilter === 'ALL') return true;
    return detectMediaKind(it.url, it.kind) === currentMediaFilter;
  });

  visibleItems.forEach(item => {
    const card = document.createElement('article');
    card.className = `bento-card ${item.shape || 'shape-poster'} ${item.skin || 'skin-poster'}`;
    card.dataset.id = item.id;

    const sc = item.scale || 1;
    const rot = item.rotate || 0;
    if (sc !== 1 || rot !== 0) {
      card.style.transform = `scale(${sc}) rotate(${rot}deg)`;
    }

    const fxBadge = item.effect && item.effect !== 'NONE'
      ? `<span class="fx-badge-tag">✨ ${item.effect.replace('_', ' ')}</span>`
      : '';

    card.innerHTML = `
      ${fxBadge}
      <div class="bento-tools">
        <button class="mini-tool-btn" onclick="openItemWithEffect(${item.id})" title="Open">⛶</button>
        <button class="mini-tool-btn god-only" onclick="pinItemToFirst(${item.id})" title="Move to #1 First Spot">🔝</button>
        <button class="mini-tool-btn god-only" onclick="cycleShape(${item.id})" title="Change Wall Shape">📐</button>
        <button class="mini-tool-btn god-only" onclick="editMediaItem(${item.id})" title="Edit / Resize / FX">✎</button>
        <button class="mini-tool-btn god-only" onclick="deleteMediaItem(${item.id})" title="Delete">✕</button>
      </div>
      <div class="bento-media">
        ${renderWallPreviewHTML(item)}
      </div>
      <div class="bento-caption">
        <span class="bento-sec-tag">${item.section} • ${item.date}</span>
        <div class="bento-title">${item.title}</div>
      </div>
      <div class="resize-rotate-handle" title="Drag to Resize & Rotate">⤡</div>
    `;

    attachInteractiveResizeRotate(card, item);
    wallGrid.appendChild(card);
  });

  // 3. Render Class Roster
  const rosterGrid = document.getElementById('roster-grid');
  rosterGrid.innerHTML = '';
  state.roster.forEach(st => {
    const card = document.createElement('div');
    card.className = 'student-card';
    card.innerHTML = `
      <button class="mini-tool-btn god-only" style="position:absolute;top:10px;right:10px;" onclick="deleteStudent(${st.id})">✕</button>
      <img class="student-avatar" src="${normalizeImageURL(st.avatar)}" alt="${st.name}" loading="lazy" />
      <div><span class="student-role-pill">${st.role}</span></div>
      <h4 style="font-size:1.05rem; margin-bottom:6px;">${st.name}</h4>
      <p style="font-size:0.8rem; color:var(--text-muted);">${st.quote || ''}</p>
    `;
    rosterGrid.appendChild(card);
  });

  // 4. Render Timeline & Lore
  const tlList = document.getElementById('timeline-list');
  const loreGrid = document.getElementById('lore-grid');
  tlList.innerHTML = '';
  loreGrid.innerHTML = '';

  state.milestones.forEach(ms => {
    if (ms.category === 'TIMELINE') {
      const el = document.createElement('div');
      el.className = 'timeline-card';
      el.innerHTML = `
        <button class="mini-tool-btn god-only" style="position:absolute;top:12px;right:12px;" onclick="deleteMilestone(${ms.id})">✕</button>
        <span class="student-role-pill">${ms.date}</span>
        <h4 style="font-size:1.1rem; margin:4px 0 6px;">${ms.title}</h4>
        <p style="font-size:0.86rem; color:var(--text-muted);">${ms.desc}</p>
      `;
      tlList.appendChild(el);
    } else {
      const el = document.createElement('div');
      el.className = 'student-card';
      el.innerHTML = `
        <button class="mini-tool-btn god-only" style="position:absolute;top:10px;right:10px;" onclick="deleteMilestone(${ms.id})">✕</button>
        <div style="font-size:2rem; margin-bottom:8px;">🏆</div>
        <span class="student-role-pill">${ms.date}</span>
        <h4 style="font-size:1.05rem; margin:6px 0;">${ms.title}</h4>
        <p style="font-size:0.82rem; color:var(--text-muted);">${ms.desc}</p>
      `;
      loreGrid.appendChild(el);
    }
  });

  renderStudioManagers();
  renderFloatingEasterEggOrb();
}

function filterWallMedia(type, btn) {
  currentMediaFilter = type;
  document.querySelectorAll('.wall-filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderAll();
}

/* =========================================================
   4. INTERACTIVE LONG-PRESS & CORNER DRAG TO RESIZE / ROTATE
   ========================================================= */
function attachInteractiveResizeRotate(cardEl, item) {
  const handle = cardEl.querySelector('.resize-rotate-handle');
  let pressTimer = null;

  // Long-press on mobile in God Mode opens quick transform mode
  cardEl.addEventListener('touchstart', () => {
    if (!document.body.classList.contains('god-mode')) return;
    pressTimer = setTimeout(() => {
      cardEl.classList.toggle('transform-mode');
    }, 550);
  }, { passive: true });

  cardEl.addEventListener('touchend', () => clearTimeout(pressTimer));
  cardEl.addEventListener('touchmove', () => clearTimeout(pressTimer));

  if (!handle) return;

  let startX = 0;
  let startY = 0;
  let initScale = item.scale || 1;
  let initRot = item.rotate || 0;

  function onPointerMove(e) {
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const dx = clientX - startX;
    const dy = clientY - startY;

    // Vertical drag adjusts Scale (0.7x to 1.35x), Horizontal drag adjusts Rotation (-18deg to +18deg)
    const newScale = Math.min(1.35, Math.max(0.7, Number((initScale + dy * 0.003).toFixed(2))));
    const newRot = Math.min(18, Math.max(-18, Math.round(initRot + dx * 0.12)));

    item.scale = newScale;
    item.rotate = newRot;
    cardEl.style.transform = `scale(${newScale}) rotate(${newRot}deg)`;
  }

  function onPointerUp() {
    cardEl.classList.remove('transform-mode');
    window.removeEventListener('mousemove', onPointerMove);
    window.removeEventListener('mouseup', onPointerUp);
    window.removeEventListener('touchmove', onPointerMove);
    window.removeEventListener('touchend', onPointerUp);
    saveState();
  }

  function onPointerDown(e) {
    if (!document.body.classList.contains('god-mode')) return;
    e.stopPropagation();
    e.preventDefault();
    cardEl.classList.add('transform-mode');
    startX = e.touches ? e.touches[0].clientX : e.clientX;
    startY = e.touches ? e.touches[0].clientY : e.clientY;
    initScale = item.scale || 1;
    initRot = item.rotate || 0;

    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    window.addEventListener('touchmove', onPointerMove, { passive: false });
    window.addEventListener('touchend', onPointerUp);
  }

  handle.addEventListener('mousedown', onPointerDown);
  handle.addEventListener('touchstart', onPointerDown, { passive: false });
}

function pinItemToFirst(id) {
  const idx = state.items.findIndex(x => x.id === id);
  if (idx > 0) {
    const [item] = state.items.splice(idx, 1);
    state.items.unshift(item);
    saveState();
    renderAll();
  }
}

function moveSectionToFirst(idx) {
  if (idx <= 1) return;
  const [sec] = state.sections.splice(idx, 1);
  state.sections.splice(1, 0, sec); // Put right after "Main Wall"
  saveState();
  renderAll();
}

/* =========================================================
   5. OWNER GOD MODE LOGIN / LOGOUT & STUDIO CONTROLLERS
   ========================================================= */
const OWNER_PIN = "7777";

function authenticateOwner() {
  if (document.body.classList.contains('god-mode')) {
    openGodStudio();
    return;
  }
  const pin = prompt("Enter Owner God Mode PIN:");
  if (pin === OWNER_PIN) {
    document.body.classList.add('god-mode');
    document.getElementById('stealth-owner-btn').textContent = "⚡ God Studio (Active)";
    localStorage.setItem('byc_god_logged_in', 'true');
  } else if (pin !== null) {
    alert("Invalid PIN.");
  }
}

function logoutOwner() {
  document.body.classList.remove('god-mode');
  document.getElementById('stealth-owner-btn').textContent = "🔒 Owner Login";
  localStorage.removeItem('byc_god_logged_in');
  closeGodStudio();
  toggleMenuDrawer(false);
}

// Restore God Mode session if owner was previously logged in
if (localStorage.getItem('byc_god_logged_in') === 'true') {
  document.body.classList.add('god-mode');
  const btn = document.getElementById('stealth-owner-btn');
  if (btn) btn.textContent = "⚡ God Studio (Active)";
}

function openGodStudio() {
  toggleMenuDrawer(false);
  document.getElementById('set-notice').value = state.notice;
  document.getElementById('set-bio').value = state.bio;
  document.getElementById('gdrive-client-id').value = state.gdriveClientId || localStorage.getItem('byc_gdrive_client_id') || '';
  renderStudioManagers();
  document.getElementById('god-studio-modal').classList.add('open');
}

function closeGodStudio() {
  document.getElementById('god-studio-modal').classList.remove('open');
}

function switchStudioTab(paneId, btn) {
  document.querySelectorAll('.studio-pane').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.studio-tab').forEach(t => t.classList.remove('active'));
  document.getElementById(paneId)?.classList.add('active');
  if (btn) btn.classList.add('active');
}

function addSectionFromDrawer() {
  const inp = document.getElementById('new-sec-name');
  const val = inp.value.trim();
  if (val && !state.sections.includes(val)) {
    state.sections.push(val);
    saveState();
    renderAll();
  }
  inp.value = '';
}

function deleteSection(sec) {
  if (!confirm(`Delete section "${sec}"?`)) return;
  state.sections = state.sections.filter(s => s !== sec);
  if (currentSection === sec) currentSection = 'Main Wall';
  saveState();
  renderAll();
}

function submitMediaForm(e) {
  e.preventDefault();
  const fileInput = document.getElementById('m-file');
  const urlVal = document.getElementById('m-url').value.trim();

  if (fileInput.files && fileInput.files[0]) {
    showNetworkLoader("Processing Local File...");
    const reader = new FileReader();
    reader.onload = (evt) => {
      finalizeMediaSave(evt.target.result);
      hideNetworkLoader();
    };
    reader.readAsDataURL(fileInput.files[0]);
  } else if (urlVal) {
    finalizeMediaSave(urlVal);
  } else {
    alert("Please paste a link or choose a file to upload.");
  }
}

function finalizeMediaSave(finalUrl) {
  const editId = document.getElementById('edit-media-id').value;
  const pinFirst = document.getElementById('m-pin-first').checked;

  const obj = {
    id: editId ? Number(editId) : Date.now(),
    url: finalUrl,
    title: document.getElementById('m-title').value.trim(),
    date: document.getElementById('m-date').value.trim(),
    section: document.getElementById('m-section').value,
    kind: document.getElementById('m-kind').value,
    shape: document.getElementById('m-shape').value,
    skin: "skin-poster",
    effect: document.getElementById('m-effect').value,
    scale: Number(document.getElementById('m-scale').value) || 1,
    rotate: Number(document.getElementById('m-rotate').value) || 0
  };

  if (editId) {
    const idx = state.items.findIndex(x => x.id === Number(editId));
    if (idx > -1) state.items[idx] = obj;
    if (pinFirst && idx > 0) {
      state.items.splice(idx, 1);
      state.items.unshift(obj);
    }
  } else {
    if (pinFirst) state.items.unshift(obj);
    else state.items.push(obj);
  }

  document.getElementById('edit-media-id').value = '';
  document.querySelector('#pane-media form').reset();
  document.getElementById('scale-val').textContent = '1.0';
  document.getElementById('rot-val').textContent = '0';

  saveState();
  renderAll();
  closeGodStudio();
}

function editMediaItem(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  document.getElementById('edit-media-id').value = item.id;
  document.getElementById('m-url').value = item.url;
  document.getElementById('m-title').value = item.title;
  document.getElementById('m-date').value = item.date;
  document.getElementById('m-section').value = item.section;
  document.getElementById('m-kind').value = item.kind || 'AUTO';
  document.getElementById('m-shape').value = item.shape || 'shape-poster';
  document.getElementById('m-effect').value = item.effect || 'NONE';
  document.getElementById('m-scale').value = item.scale || 1;
  document.getElementById('m-rotate').value = item.rotate || 0;
  document.getElementById('scale-val').textContent = item.scale || 1;
  document.getElementById('rot-val').textContent = item.rotate || 0;

  openGodStudio();
  switchStudioTab('pane-media', document.querySelector('.studio-tab'));
}

function deleteMediaItem(id) {
  if (confirm("Delete this item from the vault?")) {
    state.items = state.items.filter(x => x.id !== id);
    saveState();
    renderAll();
  }
}

function cycleShape(id) {
  const shapes = ['shape-poster', 'shape-giant', 'shape-wide', 'shape-square', 'shape-banner'];
  const item = state.items.find(x => x.id === id);
  if (item) {
    item.shape = shapes[(shapes.indexOf(item.shape) + 1) % shapes.length];
    saveState();
    renderAll();
  }
}

/* =========================================================
   6. SPECIAL EFFECTS & REMOVABLE EASTER EGGS MANAGER
   ========================================================= */
function renderStudioManagers() {
  // 1. Special Effects List (Change or Remove Effects Anytime)
  const fxList = document.getElementById('effects-manager-list');
  if (fxList) {
    fxList.innerHTML = '';
    state.items.forEach(it => {
      const row = document.createElement('div');
      row.className = 'manager-item';
      row.innerHTML = `
        <div style="flex:1; min-width:0;">
          <strong style="display:block; color:#fff; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${it.title}</strong>
          <span style="color:var(--text-muted); font-size:0.72rem;">Current Effect: ${it.effect || 'NONE'}</span>
        </div>
        <select class="f-select" style="width:auto; margin:0; padding:6px 10px;" onchange="updateItemEffect(${it.id}, this.value)">
          <option value="NONE" ${(!it.effect || it.effect==='NONE')?'selected':''}>None (Remove FX)</option>
          <option value="DRAGON_SLASH" ${it.effect==='DRAGON_SLASH'?'selected':''}>🐉 Dragon Slash</option>
          <option value="FIRE_BURST" ${it.effect==='FIRE_BURST'?'selected':''}>🔥 Fire Burst</option>
          <option value="LIGHTNING" ${it.effect==='LIGHTNING'?'selected':''}>⚡ Lightning</option>
          <option value="EARTHQUAKE" ${it.effect==='EARTHQUAKE'?'selected':''}>🌋 Earthquake</option>
          <option value="GLITCH" ${it.effect==='GLITCH'?'selected':''}>👾 Cyber Glitch</option>
        </select>
      `;
      fxList.appendChild(row);
    });
  }

  // 2. Easter Eggs List (Remove Any Easter Egg Anytime)
  const eggList = document.getElementById('easter-eggs-list');
  if (eggList) {
    eggList.innerHTML = '';
    state.easterEggs.forEach(egg => {
      const row = document.createElement('div');
      row.className = 'manager-item';
      row.innerHTML = `
        <div>
          <strong style="color:#ff8086;">[${egg.trigger}] ${egg.code ? `"${egg.code}"` : ''}</strong>
          <div style="color:#ccc; font-size:0.75rem;">${egg.message}</div>
        </div>
        <button class="btn-dark" style="color:#ff6b72; border-color:#e50914;" onclick="removeEasterEgg(${egg.id})">✕ Remove</button>
      `;
      eggList.appendChild(row);
    });
  }
}

function updateItemEffect(id, newEffect) {
  const item = state.items.find(x => x.id === id);
  if (item) {
    item.effect = newEffect;
    saveState();
    renderAll();
    triggerSpecialEffect(newEffect);
  }
}

function submitEasterEgg(e) {
  e.preventDefault();
  const trigger = document.getElementById('egg-trigger').value;
  const code = document.getElementById('egg-code').value.trim().toLowerCase();
  const rewardUrl = document.getElementById('egg-reward-url').value.trim();
  const message = document.getElementById('egg-message').value.trim();

  state.easterEggs.push({
    id: Date.now(),
    trigger,
    code,
    rewardUrl,
    message
  });

  e.target.reset();
  saveState();
  renderAll();
}

function removeEasterEgg(id) {
  state.easterEggs = state.easterEggs.filter(e => e.id !== id);
  saveState();
  renderAll();
}

function fireEasterEggReward(egg) {
  triggerSpecialEffect('DRAGON_SLASH');
  if (egg.rewardUrl) {
    document.getElementById('cinema-title').textContent = `🥚 Easter Egg Unlocked: ${egg.message}`;
    document.getElementById('cinema-stage').innerHTML = renderFullPlayableHTML({
      title: egg.message,
      url: egg.rewardUrl,
      kind: 'AUTO'
    });
    document.getElementById('cinema-modal').classList.add('open');
  } else {
    alert(`🥚 EASTER EGG UNLOCKED!\n\n${egg.message}`);
  }
}

// Easter Egg Trigger 1: Tap Top-Left Logo 5 Times Quickly (or 1x to Replay Intro)
let brandTapCount = 0;
let brandTapTimer = null;

function handleBrandClick() {
  brandTapCount++;
  clearTimeout(brandTapTimer);
  const tapEgg = state.easterEggs.find(e => e.trigger === 'LOGO_TAP_5');

  if (brandTapCount >= 5 && tapEgg) {
    brandTapCount = 0;
    fireEasterEggReward(tapEgg);
    return;
  }

  brandTapTimer = setTimeout(() => {
    if (brandTapCount === 1) {
      replayIntro();
    }
    brandTapCount = 0;
  }, 380);
}

// Easter Egg Trigger 2: Secret Word Typed on Keyboard or Search Box
let keyBuffer = "";
window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.key.length === 1) {
    keyBuffer = (keyBuffer + e.key.toLowerCase()).slice(-20);
    checkSecretWordEasterEgg(keyBuffer);
  }
});

function checkSecretWordEasterEgg(str) {
  const found = state.easterEggs.find(e => e.trigger === 'SECRET_CODE' && e.code && str.endsWith(e.code));
  if (found) {
    keyBuffer = "";
    const searchInp = document.getElementById('wall-search-input');
    if (searchInp && searchInp.value.toLowerCase().trim() === found.code) {
      searchInp.value = '';
    }
    fireEasterEggReward(found);
  }
}

// Easter Egg Trigger 3: Hidden Floating Orb in Bottom-Left Corner
function renderFloatingEasterEggOrb() {
  let existing = document.getElementById('easter-egg-floating-orb');
  const orbEgg = state.easterEggs.find(e => e.trigger === 'HIDDEN_ORB');

  if (!orbEgg) {
    if (existing) existing.remove();
    return;
  }

  if (!existing) {
    existing = document.createElement('div');
    existing.id = 'easter-egg-floating-orb';
    existing.className = 'hidden-egg-orb';
    existing.title = '???';
    document.body.appendChild(existing);
  }
  existing.onclick = () => fireEasterEggReward(orbEgg);
}

/* =========================================================
   7. CLASSMATES, TIMELINE & GLOBAL TEXTS
   ========================================================= */
function submitStudentForm(e) {
  e.preventDefault();
  state.roster.push({
    id: Date.now(),
    name: document.getElementById('s-name').value.trim(),
    role: document.getElementById('s-role').value.trim(),
    avatar: document.getElementById('s-avatar').value.trim(),
    quote: document.getElementById('s-quote').value.trim()
  });
  e.target.reset();
  saveState();
  renderAll();
  closeGodStudio();
  switchHubModule('roster');
}

function deleteStudent(id) {
  if (confirm("Remove from Class Directory?")) {
    state.roster = state.roster.filter(x => x.id !== id);
    saveState();
    renderAll();
  }
}

function submitMilestoneForm(e) {
  e.preventDefault();
  const cat = document.getElementById('t-category').value;
  state.milestones.push({
    id: Date.now(),
    category: cat,
    title: document.getElementById('t-title').value.trim(),
    date: document.getElementById('t-date').value.trim(),
    desc: document.getElementById('t-desc').value.trim()
  });
  e.target.reset();
  saveState();
  renderAll();
  closeGodStudio();
  switchHubModule(cat === 'TIMELINE' ? 'timeline' : 'lore');
}

function deleteMilestone(id) {
  if (confirm("Delete this entry?")) {
    state.milestones = state.milestones.filter(x => x.id !== id);
    saveState();
    renderAll();
  }
}

function saveGlobalTexts() {
  state.notice = document.getElementById('set-notice').value.trim() || state.notice;
  state.bio = document.getElementById('set-bio').value.trim() || state.bio;
  saveState();
  renderAll();
  alert("Class Notice & Bio updated!");
}

/* =========================================================
   8. CINEMA THEATER WITH SPECIAL EFFECTS TRIGGER
   ========================================================= */
function openItemWithEffect(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;

  if (item.effect && item.effect !== 'NONE') {
    triggerSpecialEffect(item.effect);
  }

  if (detectMediaKind(item.url, item.kind) === 'AUDIO') {
    playAudioItem(id);
    return;
  }

  openCinemaModal(id);
}

function openCinemaModal(id) {
  const item = state.items.find(x => x.id === id);
  if (!item) return;
  document.getElementById('cinema-title').textContent = `${item.title} • ${item.section}`;
  document.getElementById('cinema-stage').innerHTML = renderFullPlayableHTML(item);
  document.getElementById('cinema-modal').classList.add('open');
}

function closeCinemaModal() {
  document.getElementById('cinema-stage').innerHTML = '';
  document.getElementById('cinema-modal').classList.remove('open');
}

/* =========================================================
   9. GOOGLE DRIVE LOGIN, LOGOUT & AUTO-BACKUP / RESTORE ENGINE
      Stores your entire website data inside your Google Drive
      root folder as "bee_yeass_cee_vault_backup.json"
   ========================================================= */
const GDRIVE_BACKUP_FILENAME = "bee_yeass_cee_vault_backup.json";
let gdriveTokenClient = null;
let gdriveAccessToken = sessionStorage.getItem('byc_gdrive_token') || null;
let gdriveFileId = localStorage.getItem('byc_gdrive_file_id') || null;

function updateDriveStatusUI(msg, connected = false) {
  const statusBox = document.getElementById('gdrive-auth-status');
  const badge = document.getElementById('drive-sync-badge');
  if (statusBox) statusBox.textContent = `Status: ${msg}`;
  if (badge) badge.classList.toggle('hidden', !connected);
}

function loginGoogleDrive() {
  const clientIdInput = document.getElementById('gdrive-client-id').value.trim();
  const clientId = clientIdInput || state.gdriveClientId || localStorage.getItem('byc_gdrive_client_id');

  if (!clientId) {
    alert("Please paste your Google OAuth Client ID (from Google Cloud Console -> APIs & Services -> Credentials) to sign in with Google Drive.");
    return;
  }

  state.gdriveClientId = clientId;
  localStorage.setItem('byc_gdrive_client_id', clientId);
  saveState(false);

  if (typeof google === 'undefined' || !google.accounts) {
    alert("Google Identity Services script is still loading. Please check your internet connection and try again.");
    return;
  }

  gdriveTokenClient = google.accounts.oauth2.initTokenClient({
    client_id: clientId,
    scope: 'https://www.googleapis.com/auth/drive.file',
    callback: async (tokenResponse) => {
      if (tokenResponse && tokenResponse.access_token) {
        gdriveAccessToken = tokenResponse.access_token;
        sessionStorage.setItem('byc_gdrive_token', gdriveAccessToken);
        updateDriveStatusUI("Connected to Google Drive! Checking for latest backup...", true);
        await forcePullFromGoogleDrive(true);
      }
    }
  });

  gdriveTokenClient.requestAccessToken({ prompt: 'consent' });
}

function logoutGoogleDrive() {
  if (gdriveAccessToken && typeof google !== 'undefined' && google.accounts) {
    google.accounts.oauth2.revoke(gdriveAccessToken, () => {});
  }
  gdriveAccessToken = null;
  sessionStorage.removeItem('byc_gdrive_token');
  updateDriveStatusUI("Logged out of Google Drive.", false);
}

async function findDriveBackupFileId() {
  if (!gdriveAccessToken) return null;
  const q = encodeURIComponent(`name = '${GDRIVE_BACKUP_FILENAME}' and trashed = false`);
  const res = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,modifiedTime)`, {
    headers: { 'Authorization': `Bearer ${gdriveAccessToken}` }
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (data.files && data.files.length > 0) {
    gdriveFileId = data.files[0].id;
    localStorage.setItem('byc_gdrive_file_id', gdriveFileId);
    return gdriveFileId;
  }
  return null;
}

async function autoBackupToGoogleDrive(showToast = false) {
  if (!gdriveAccessToken) return;
  try {
    showNetworkLoader("Auto-Backing Up to Google Drive...");
    let fileId = gdriveFileId || await findDriveBackupFileId();

    const metadata = {
      name: GDRIVE_BACKUP_FILENAME,
      mimeType: 'application/json'
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' }));

    const url = fileId
      ? `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=multipart`
      : `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`;

    const method = fileId ? 'PATCH' : 'POST';

    const res = await fetch(url, {
      method,
      headers: { 'Authorization': `Bearer ${gdriveAccessToken}` },
      body: form
    });

    if (res.ok) {
      const result = await res.json();
      if (result.id) {
        gdriveFileId = result.id;
        localStorage.setItem('byc_gdrive_file_id', gdriveFileId);
      }
      updateDriveStatusUI(`Synced (${GDRIVE_BACKUP_FILENAME}) @ ${new Date().toLocaleTimeString()}`, true);
      if (showToast) alert("Successfully backed up to your Google Drive!");
    }
  } catch (err) {
    updateDriveStatusUI("Drive Sync Error — check connection.", false);
  } finally {
    hideNetworkLoader();
  }
}

function forcePushToGoogleDrive() {
  if (!gdriveAccessToken) {
    alert("Please click 'Login with Google Drive' first.");
    return;
  }
  autoBackupToGoogleDrive(true);
}

async function forcePullFromGoogleDrive(silentIfMissing = false) {
  if (!gdriveAccessToken) {
    if (!silentIfMissing) alert("Please click 'Login with Google Drive' first.");
    return;
  }
  try {
    showNetworkLoader("Restoring Vault from Google Drive...");
    const fileId = await findDriveBackupFileId();
    if (!fileId) {
      // No backup exists yet in Drive -> create initial backup automatically
      await autoBackupToGoogleDrive(false);
      return;
    }

    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: { 'Authorization': `Bearer ${gdriveAccessToken}` }
    });

    if (res.ok) {
      const cloudData = await res.json();
      if (cloudData && cloudData.sections && cloudData.items) {
        state = cloudData;
        localStorage.setItem('byc_vault_state_v12', JSON.stringify(state));
        renderAll();
        updateDriveStatusUI(`Restored latest backup from Google Drive!`, true);
      }
    }
  } catch (err) {
    if (!silentIfMissing) alert("Could not restore from Google Drive.");
  } finally {
    hideNetworkLoader();
  }
}

/* =========================================================
   10. 1-CLICK SELF-BAKING HTML GENERATOR
   ========================================================= */
function downloadBakedHTML() {
  showNetworkLoader("Generating Clean index.html...");
  const dataBlock = `/*__VAULT_DATA_START__*/\nconst BAKED_VAULT_DATA = ${JSON.stringify(state, null, 2)};\n/*__VAULT_DATA_END__*/`;

  fetch('app.js')
    .then(r => r.text())
    .then(appJsText => {
      const updatedAppJs = appJsText.replace(
        /\/\*__VAULT_DATA_START__\*\/[\s\S]*?\/\*__VAULT_DATA_END__\*\//,
        dataBlock
      );
      const blob = new Blob([updatedAppJs], { type: 'application/javascript' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'app.js';
      a.click();
      hideNetworkLoader();
    })
    .catch(() => {
      hideNetworkLoader();
      alert("Downloaded state backup!");
    });
}

// Initialize App on Load
window.addEventListener('DOMContentLoaded', () => {
  replayIntro();
  renderAll();
  if (gdriveAccessToken) {
    updateDriveStatusUI("Connected to Google Drive", true);
    forcePullFromGoogleDrive(true);
  }
});
