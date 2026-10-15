/* =========================================================
   DRAGON ENGINE, SPECIAL FX & NETWORK LOADER (dragon-engine.js)
   - Uses Dragon #2 (202378.jpg: Serpentine Ribbed-Belly Dragon with Claws & Wavy Tongue)
     to revolve in 3D around the words "el.zavianzz".
   - Locks into Dragon #1 (202327.jpg: Red Tribal Crest) above "ianzz".
   - Powers the 202327.jpg Network Loading Spinner & Video Opening Special FX.
   ========================================================= */

const backCanvas = document.getElementById('dragon-canvas-back');
const frontCanvas = document.getElementById('dragon-canvas-front');
const backCtx = backCanvas ? backCanvas.getContext('2d') : null;
const frontCtx = frontCanvas ? frontCanvas.getContext('2d') : null;

let orbitAnimId = null;
let orbitStartTime = 0;
const spineTrail = [];
const emberList = [];
const MAX_SPINE_NODES = 46;

let sfxActive = true;
let audioCtx = null;
let portalTimer = null;

/* =========================================================
   1. NETWORK & MEDIA LOADER CONTROLLER (USES 202327.JPG LOGO)
   ========================================================= */
function showNetworkLoader(message = "Syncing Vault...") {
  const loader = document.getElementById('network-dragon-loader');
  const textEl = document.getElementById('loader-caption-text');
  if (textEl) textEl.textContent = message;
  if (loader) loader.classList.remove('hidden');
}

function hideNetworkLoader(delay = 350) {
  setTimeout(() => {
    const loader = document.getElementById('network-dragon-loader');
    if (loader) loader.classList.add('hidden');
  }, delay);
}

/* =========================================================
   2. SYNTHESIZED WEB AUDIO SOUND ENGINE
   ========================================================= */
function initAudioEngine() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!audioCtx && AudioContext) audioCtx = new AudioContext();
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
}

function playVaultSFX(type = 'impact') {
  if (!sfxActive) return;
  try {
    initAudioEngine();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    if (type === 'swoosh') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(60, now);
      osc.frequency.exponentialRampToValueAtTime(138, now + 1.45);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.55);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 1.55);
    } else if (type === 'slash') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(520, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.35);
      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.38);
    } else if (type === 'thunder') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, now);
      osc.frequency.exponentialRampToValueAtTime(22, now + 0.75);
      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.8);
    } else {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(28, now + 0.6);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.65);
    }
  } catch (e) {}
}

function toggleAudioSFX() {
  sfxActive = !sfxActive;
  const label = document.getElementById('sfx-menu-label');
  if (label) label.textContent = sfxActive ? '🔊 Sound Effects: ON' : '🔇 Sound Effects: OFF';
}

/* =========================================================
   3. SERPENTINE DRAGON #2 (202378.JPG) 3D ORBIT ENGINE
      Draws the ribbed belly scales, dorsal flame spikes,
      4-toed dragon claws, horned head & wavy tongue revolving
      around the words "el.zavianzz"
   ========================================================= */
function spawnOrbitEmber(x, y, vx, vy) {
  emberList.push({
    x, y,
    vx: vx + (Math.random() - 0.5) * 1.2,
    vy: vy + (Math.random() - 0.5) * 1.2,
    r: 1.4 + Math.random() * 2.2,
    alpha: 0.9,
    color: Math.random() > 0.25 ? '#e50914' : '#ff3b1f'
  });
}

// Draws the 4-Clawed Tribal Dragon Leg (From 202378.jpg)
function drawSerpentClawLimb(ctx, x, y, bodyAngle, scale, alpha, side = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(bodyAngle);
  ctx.scale(scale, scale * side);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#e50914';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.2;

  // Muscular bent limb + 4 curved talons
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.quadraticCurveTo(-8, 16, -2, 24);
  ctx.lineTo(10, 22);
  // Talon 1
  ctx.quadraticCurveTo(18, 26, 15, 34);
  ctx.quadraticCurveTo(12, 28, 7, 26);
  // Talon 2
  ctx.quadraticCurveTo(13, 32, 9, 39);
  ctx.quadraticCurveTo(7, 32, 3, 28);
  // Talon 3
  ctx.quadraticCurveTo(7, 34, 2, 40);
  ctx.quadraticCurveTo(1, 33, -2, 28);
  // Rear dewclaw
  ctx.quadraticCurveTo(-8, 32, -12, 26);
  ctx.quadraticCurveTo(-14, 16, -6, 4);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

// Draws the Horned Tribal Head, Fangs & Long Wavy S-Tongue of 202378.jpg
function drawSerpentHead202378(ctx, x, y, angle, scale, alpha, wavePhase) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.shadowBlur = 12;
  ctx.shadowColor = '#e50914';

  // Long Wavy Forked Tongue (Signature detail of 202378.jpg)
  const tongueWave = Math.sin(wavePhase) * 4;
  ctx.strokeStyle = '#ff1e27';
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14, 4);
  ctx.bezierCurveTo(26, 4 + tongueWave, 32, -4 - tongueWave, 44, 2 + tongueWave * 0.5);
  ctx.stroke();

  // Upper & Lower Roaring Tribal Jaws + Swept Horns
  ctx.fillStyle = '#e50914';
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 1.3;
  ctx.beginPath();
  ctx.moveTo(26, -3);                        // Upturned snout tip
  ctx.lineTo(29, -8);                        // Nasal horn
  ctx.lineTo(18, -7);
  ctx.quadraticCurveTo(8, -12, -4, -13);     // Brow ridge
  ctx.quadraticCurveTo(-22, -20, -44, -26);  // Long S-curved horn 1
  ctx.quadraticCurveTo(-26, -13, -14, -9);
  ctx.quadraticCurveTo(-30, -12, -46, -13);  // Horn 2
  ctx.quadraticCurveTo(-24, -5, -14, -1);
  ctx.lineTo(-10, 6);                        // Jaw hinge
  ctx.quadraticCurveTo(-2, 13, 16, 14);      // Open lower jaw
  ctx.lineTo(20, 9);                         // Lower fang tip
  ctx.lineTo(15, 11);
  ctx.quadraticCurveTo(4, 9, 0, 2);          // Mouth interior
  ctx.lineTo(16, 1);
  ctx.lineTo(19, 6);                         // Upper fang 1
  ctx.lineTo(22, 0);
  ctx.lineTo(24, 5);                         // Upper fang 2
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Slanted Black Eye Cutout (Matches 202378.jpg)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(10, -5);
  ctx.lineTo(1, -8);
  ctx.lineTo(-1, -4);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Draws the Flame-Tufted Tail Tip of 202378.jpg
function drawSerpentFlameTail(ctx, x, y, angle, scale, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.fillStyle = '#e50914';
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.quadraticCurveTo(-8, -10, -24, -14);
  ctx.quadraticCurveTo(-14, -4, -28, 0);
  ctx.quadraticCurveTo(-14, 4, -22, 12);
  ctx.quadraticCurveTo(-8, 8, 4, 0);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

// Computes the 3D S-curving orbital path around "el.zavianzz", ending at top-right perch (282, 162)
function getSerpentOrbitPoint(t) {
  const theta = -Math.PI * 0.8 + t * (Math.PI * 3.1);
  // Serpentine slither wave superimposed on the 3D ellipse
  const slitherWave = Math.sin(t * Math.PI * 7) * 8 * (1 - t * 0.7);

  const orbitX = 230 + Math.cos(theta) * 136;
  const orbitY = 238 + Math.sin(theta) * 48 - Math.cos(theta) * 24 + slitherWave;
  const orbitZ = Math.sin(theta); // > 0 in front of words, < 0 behind words

  // Final perch right over "ianzz" where 202327.jpg crest locks in
  const perchX = 284;
  const perchY = 158;

  const settle = Math.max(0, (t - 0.74) / 0.26);
  const smoothSettle = settle * settle * (3 - 2 * settle);

  return {
    x: orbitX * (1 - smoothSettle) + perchX * smoothSettle,
    y: orbitY * (1 - smoothSettle) + perchY * smoothSettle,
    z: orbitZ * (1 - smoothSettle) + 1 * smoothSettle
  };
}

function animateSerpentOrbit(ts) {
  if (!backCtx || !frontCtx) return;
  if (!orbitStartTime) orbitStartTime = ts;
  const elapsed = ts - orbitStartTime;

  backCtx.clearRect(0, 0, 460, 460);
  frontCtx.clearRect(0, 0, 460, 460);

  // Render floating crimson embers
  for (let i = emberList.length - 1; i >= 0; i--) {
    const p = emberList[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha -= 0.024;
    if (p.alpha <= 0) {
      emberList.splice(i, 1);
      continue;
    }
    frontCtx.save();
    frontCtx.globalAlpha = p.alpha;
    frontCtx.fillStyle = p.color;
    frontCtx.shadowBlur = 8;
    frontCtx.shadowColor = '#e50914';
    frontCtx.beginPath();
    frontCtx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    frontCtx.fill();
    frontCtx.restore();
  }

  // Orbit flight window: 1180ms to 3150ms
  const flightStart = 1180;
  const flightDur = 1940;

  if (elapsed >= flightStart && elapsed <= flightStart + flightDur + 200) {
    const t = Math.min(1, (elapsed - flightStart) / flightDur);
    const fadeOut = elapsed > flightStart + flightDur
      ? Math.max(0, 1 - (elapsed - (flightStart + flightDur)) / 200)
      : Math.min(1, t * 5);

    const pt = getSerpentOrbitPoint(t);
    spineTrail.unshift(pt);
    if (spineTrail.length > MAX_SPINE_NODES) spineTrail.pop();

    // Draw Serpentine Body with Ribbed Belly Scales, Dorsal Flame Spikes & 4 Clawed Limbs (202378.jpg)
    for (let i = spineTrail.length - 1; i >= 1; i--) {
      const curr = spineTrail[i];
      const prev = spineTrail[i - 1];
      const ratio = 1 - i / spineTrail.length;
      const angle = Math.atan2(prev.y - curr.y, prev.x - curr.x);

      const depthScale = 0.72 + (curr.z + 1) * 0.22;
      const ctx = curr.z >= 0 ? frontCtx : backCtx;
      const segAlpha = fadeOut * (0.25 + ratio * 0.75);

      // Draw 4-Clawed Limbs at Front Shoulders (i === 9) and Hind Hips (i === 25)
      if (i === 9 || i === 25) {
        drawSerpentClawLimb(ctx, curr.x, curr.y, angle, depthScale * 0.85, segAlpha, 1);
      }

      ctx.save();
      ctx.translate(curr.x, curr.y);
      ctx.rotate(angle);
      ctx.globalAlpha = segAlpha;

      // Slender serpentine body radius (tapers at neck and tail)
      const r = (1.6 + Math.sin(ratio * Math.PI) * 5.2) * depthScale;

      // 1. Solid Crimson Dorsal Back (Upper Half of Serpent)
      ctx.fillStyle = curr.z >= 0 ? '#e50914' : '#800006';
      ctx.beginPath();
      ctx.rect(-r * 0.9, -r, r * 1.8, r);
      ctx.fill();

      // 2. Ribbed Belly Scale Segment (Lower Half of Serpent — Signature Ladder Look of 202378.jpg!)
      ctx.fillStyle = curr.z >= 0 ? '#ff2a32' : '#9e0209';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.4 * depthScale;
      ctx.beginPath();
      ctx.rect(-r * 0.8, 0, r * 1.6, r * 0.95);
      ctx.fill();
      ctx.stroke();

      // 3. Swept-Back Dorsal Flame Spikes Along Spine (Matches 202378.jpg)
      if (i % 2 === 0 && i > 2 && i < spineTrail.length - 4) {
        ctx.fillStyle = '#e50914';
        ctx.beginPath();
        ctx.moveTo(r * 0.6, -r * 0.9);
        ctx.quadraticCurveTo(-r * 1.2, -r * 2.8, -r * 2.8, -r * 3.1);
        ctx.quadraticCurveTo(-r * 1.4, -r * 1.5, -r * 0.6, -r * 0.9);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();

      // Flame-Tufted Tail Tip
      if (i === spineTrail.length - 1 && spineTrail.length > 16) {
        drawSerpentFlameTail(ctx, curr.x, curr.y, angle, depthScale, segAlpha);
      }
    }

    // Draw Horned Head & Wavy Tongue at Segment 0
    if (spineTrail.length > 1) {
      const h = spineTrail[0];
      const n = spineTrail[1];
      const headAngle = Math.atan2(h.y - n.y, h.x - n.x);
      const headScale = 0.82 + (h.z + 1) * 0.2;
      const headCtx = h.z >= 0 ? frontCtx : backCtx;

      drawSerpentHead202378(headCtx, h.x, h.y, headAngle, headScale, fadeOut, elapsed * 0.025);

      if (Math.random() < 0.5) {
        spawnOrbitEmber(
          h.x + Math.cos(headAngle) * 18,
          h.y + Math.sin(headAngle) * 18,
          Math.cos(headAngle) * 1.5,
          Math.sin(headAngle) * 1.5
        );
      }
    }
  }

  const portalEl = document.getElementById('vault-portal');
  if (portalEl && !portalEl.classList.contains('portal-open')) {
    orbitAnimId = requestAnimationFrame(animateSerpentOrbit);
  }
}

/* =========================================================
   4. INTRO & OUTRO PORTAL CONTROLLERS
   ========================================================= */
function replayIntro() {
  const portalEl = document.getElementById('vault-portal');
  const circleEl = document.getElementById('emblem-circle');
  const statusEl = document.getElementById('portal-status-text');
  if (!portalEl || !circleEl) return;

  clearTimeout(portalTimer);
  cancelAnimationFrame(orbitAnimId);
  portalEl.onclick = null;
  if (statusEl) statusEl.textContent = "Summoning Class Memory Vault...";
  portalEl.classList.remove('portal-open');

  spineTrail.length = 0;
  emberList.length = 0;
  orbitStartTime = 0;

  circleEl.classList.remove('play-seq');
  void circleEl.offsetWidth;
  circleEl.classList.add('play-seq');

  orbitAnimId = requestAnimationFrame(animateSerpentOrbit);

  setTimeout(() => playVaultSFX('impact'), 1280);
  setTimeout(() => playVaultSFX('swoosh'), 1400);

  portalTimer = setTimeout(() => {
    portalEl.classList.add('portal-open');
  }, 4400);
}

function lockVaultOutro() {
  const portalEl = document.getElementById('vault-portal');
  const statusEl = document.getElementById('portal-status-text');
  if (!portalEl) return;

  clearTimeout(portalTimer);
  if (statusEl) statusEl.textContent = "Vault Sealed by el.zavianzz • Tap Anywhere to Enter";
  portalEl.classList.remove('portal-open');
  playVaultSFX('impact');

  setTimeout(() => {
    portalEl.onclick = () => {
      portalEl.onclick = null;
      replayIntro();
    };
  }, 450);
}

/* =========================================================
   5. SPECIAL EFFECTS ENGINE WHEN OPENING VIDEOS / EASTER EGGS
      (DRAGON_SLASH, FIRE_BURST, LIGHTNING, EARTHQUAKE, GLITCH)
   ========================================================= */
const fxCanvas = document.getElementById('special-fx-canvas');
const fxCtx = fxCanvas ? fxCanvas.getContext('2d') : null;

function resizeFxCanvas() {
  if (!fxCanvas) return;
  fxCanvas.width = window.innerWidth;
  fxCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeFxCanvas);
resizeFxCanvas();

function triggerSpecialEffect(effectType) {
  if (!effectType || effectType === 'NONE') return;

  if (effectType === 'EARTHQUAKE') {
    playVaultSFX('thunder');
    document.body.classList.remove('fx-earthquake');
    void document.body.offsetWidth;
    document.body.classList.add('fx-earthquake');
    setTimeout(() => document.body.classList.remove('fx-earthquake'), 650);
    return;
  }

  if (effectType === 'GLITCH') {
    playVaultSFX('slash');
    document.body.classList.remove('fx-glitch');
    void document.body.offsetWidth;
    document.body.classList.add('fx-glitch');
    setTimeout(() => document.body.classList.remove('fx-glitch'), 500);
    return;
  }

  if (!fxCtx) return;
  resizeFxCanvas();

  if (effectType === 'DRAGON_SLASH') {
    playVaultSFX('slash');
    let progress = 0;
    const w = fxCanvas.width;
    const h = fxCanvas.height;

    function drawSlash() {
      progress += 0.08;
      fxCtx.clearRect(0, 0, w, h);

      if (progress < 1) {
        fxCtx.save();
        fxCtx.strokeStyle = '#ff1e27';
        fxCtx.shadowBlur = 25;
        fxCtx.shadowColor = '#e50914';
        fxCtx.lineCap = 'round';

        // 3 Diagonal Dragon Claw Slashes
        [-70, 0, 70].forEach((offset, idx) => {
          const p = Math.min(1, Math.max(0, (progress - idx * 0.1) * 1.4));
          if (p <= 0) return;
          fxCtx.lineWidth = (1 - progress * 0.6) * 10;
          fxCtx.beginPath();
          fxCtx.moveTo(w * 0.15 + offset, h * 0.15);
          fxCtx.lineTo(w * 0.15 + offset + (w * 0.7) * p, h * 0.15 + (h * 0.7) * p);
          fxCtx.stroke();
        });
        fxCtx.restore();
        requestAnimationFrame(drawSlash);
      } else {
        fxCtx.clearRect(0, 0, w, h);
      }
    }
    requestAnimationFrame(drawSlash);
  } else if (effectType === 'FIRE_BURST') {
    playVaultSFX('impact');
    const w = fxCanvas.width;
    const h = fxCanvas.height;
    const bursts = [];
    for (let i = 0; i < 75; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 4 + Math.random() * 14;
      bursts.push({
        x: w / 2,
        y: h / 2,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        r: 3 + Math.random() * 6,
        a: 1,
        c: Math.random() > 0.3 ? '#e50914' : '#ffaa00'
      });
    }

    function stepFire() {
      fxCtx.clearRect(0, 0, w, h);
      let alive = false;
      bursts.forEach(b => {
        b.x += b.vx;
        b.y += b.vy;
        b.a -= 0.028;
        if (b.a > 0) {
          alive = true;
          fxCtx.save();
          fxCtx.globalAlpha = b.a;
          fxCtx.fillStyle = b.c;
          fxCtx.shadowBlur = 14;
          fxCtx.shadowColor = '#ff1e27';
          fxCtx.beginPath();
          fxCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
          fxCtx.fill();
          fxCtx.restore();
        }
      });
      if (alive) requestAnimationFrame(stepFire);
      else fxCtx.clearRect(0, 0, w, h);
    }
    requestAnimationFrame(stepFire);
  } else if (effectType === 'LIGHTNING') {
    playVaultSFX('thunder');
    const w = fxCanvas.width;
    const h = fxCanvas.height;
    let frames = 0;

    function stepBolt() {
      frames++;
      fxCtx.clearRect(0, 0, w, h);
      if (frames < 18) {
        fxCtx.save();
        fxCtx.strokeStyle = frames % 2 === 0 ? '#ffffff' : '#ff1e27';
        fxCtx.lineWidth = 4;
        fxCtx.shadowBlur = 30;
        fxCtx.shadowColor = '#e50914';
        fxCtx.beginPath();
        let cx = w * 0.5;
        let cy = 0;
        fxCtx.moveTo(cx, cy);
        while (cy < h) {
          cx += (Math.random() - 0.5) * 90;
          cy += 35 + Math.random() * 35;
          fxCtx.lineTo(cx, cy);
        }
        fxCtx.stroke();
        fxCtx.restore();
        requestAnimationFrame(stepBolt);
      } else {
        fxCtx.clearRect(0, 0, w, h);
      }
    }
    requestAnimationFrame(stepBolt);
  }
}
