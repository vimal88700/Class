/* =========================================================
   PIXEL-EXACT 202398.JPG LAYER SEPARATOR & SMOOTH PARAMETRIC
   DRAGON ORBIT ENGINE (dragon-engine.js)
   ========================================================= */

const backCanvas = document.getElementById('dragon-canvas-back');
const frontCanvas = document.getElementById('dragon-canvas-front');
const backCtx = backCanvas ? backCanvas.getContext('2d') : null;
const frontCtx = frontCanvas ? frontCanvas.getContext('2d') : null;

let orbitAnimId = null;
let orbitStartTime = 0;
const emberList = [];
const NUM_SEGMENTS = 44;
const SEG_SPACING = 0.0095;

let sfxActive = true;
let audioCtx = null;
let portalTimer = null;

/* =========================================================
   1. AUTOMATIC PIXEL-LEVEL LAYER SPLITTER FOR logo.jpg (202398.jpg)
      Splits 202398.jpg into 3 independent transparent layers:
      - Words ("el.zavianzz")
      - Sword (drops from top behind "v")
      - Dragon (locks in at top-right after orbit)
   ========================================================= */
function initExactLogoLayers() {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = "logo.jpg"; // Upload 202398.jpg as logo.jpg in GitHub root

  img.onload = () => {
    const W = 1000;
    const H = 1000;

    const srcCanvas = document.createElement('canvas');
    srcCanvas.width = W;
    srcCanvas.height = H;
    const sCtx = srcCanvas.getContext('2d');
    sCtx.drawImage(img, 0, 0, W, H);
    const srcData = sCtx.getImageData(0, 0, W, H);
    const d = srcData.data;

    const wordsData = sCtx.createImageData(W, H);
    const swordData = sCtx.createImageData(W, H);
    const dragonData = sCtx.createImageData(W, H);

    const wPx = wordsData.data;
    const sPx = swordData.data;
    const dPx = dragonData.data;

    for (let y = 0; y < H; y++) {
      const ny = y / H;
      for (let x = 0; x < W; x++) {
        const nx = x / W;
        const i = (y * W + x) * 4;
        const r = d[i];
        const g = d[i + 1];
        const b = d[i + 2];

        // Convert pure black background (#000000) to transparent
        const maxC = Math.max(r, g, b);
        if (maxC < 18) continue;
        const alpha = Math.min(255, Math.round((maxC - 15) * 2.2));

        // 1. DRAGON REGION (Top-right quadrant above "ianzz")
        const isDragon =
          (nx > 0.64 && ny > 0.30 && ny < 0.518) ||
          (nx > 0.912 && ny >= 0.518 && ny < 0.565);

        // 2. SWORD REGION (Upper hilt/crossguard above "av" + lower blade tip below "v")
        const isUpperSword = (nx > 0.34 && nx < 0.51 && ny > 0.28 && ny < 0.532);
        const isLowerSword = (nx > 0.475 && nx < 0.565 && ny > 0.638 && ny < 0.77);

        if (isDragon) {
          dPx[i] = r; dPx[i + 1] = g; dPx[i + 2] = b; dPx[i + 3] = alpha;
        } else if (isUpperSword || isLowerSword) {
          sPx[i] = r; sPx[i + 1] = g; sPx[i + 2] = b; sPx[i + 3] = alpha;
        } else {
          wPx[i] = r; wPx[i + 1] = g; wPx[i + 2] = b; wPx[i + 3] = alpha;
        }
      }
    }

    // Bridge the middle of the sword blade behind the "v" so the falling sword is 100% continuous
    const cWords = document.getElementById('exact-words-canvas');
    const cSword = document.getElementById('exact-sword-canvas');
    const cDragon = document.getElementById('exact-dragon-canvas');

    if (cWords && cSword && cDragon) {
      cWords.getContext('2d').putImageData(wordsData, 0, 0);

      const swCtx = cSword.getContext('2d');
      swCtx.putImageData(swordData, 0, 0);
      swCtx.save();
      swCtx.strokeStyle = '#b8040c';
      swCtx.lineWidth = 14;
      swCtx.beginPath();
      swCtx.moveTo(458, 525);
      swCtx.lineTo(498, 645);
      swCtx.stroke();
      swCtx.restore();

      cDragon.getContext('2d').putImageData(dragonData, 0, 0);

      // Switch stage from fallback SVG to exact pixel layers
      const stage = document.getElementById('emblem-stage-box');
      if (stage) stage.classList.add('exact-image-loaded');
    }
  };
}

/* =========================================================
   2. NETWORK & MEDIA LOADER CONTROLLER
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
   3. SYNTHESIZED WEB AUDIO SOUND ENGINE
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
   4. BUG-FREE PARAMETRIC 3D DRAGON ORBIT ENGINE
      - Evaluates every segment mathematically along u in [0, 1]
      - Never bunches up or snaps angle at the end!
      - Tail smoothly slithers into the perched dragon crest!
   ========================================================= */
function spawnOrbitEmber(x, y, vx, vy, burst = false) {
  const count = burst ? 10 : 1;
  for (let i = 0; i < count; i++) {
    emberList.push({
      x: x + (Math.random() - 0.5) * (burst ? 18 : 6),
      y: y + (Math.random() - 0.5) * (burst ? 18 : 6),
      vx: vx + (Math.random() - 0.5) * (burst ? 3.5 : 1.2),
      vy: vy + (Math.random() - 0.5) * (burst ? 3.5 : 1.2),
      r: (burst ? 2.2 : 1.3) + Math.random() * 2.2,
      alpha: 0.95,
      color: Math.random() > 0.25 ? '#e50914' : '#ff3b1f'
    });
  }
}

// Continuous 3D Parametric Curve for u in [0, 1.0]
function evaluateDragonCurve(u) {
  const clamped = Math.max(0, Math.min(1, u));
  // 1.45 revolutions around "el.zavianzz", approaching top-right from the right-arch so it faces down-left!
  const theta = -Math.PI * 0.65 + clamped * (Math.PI * 2.85);
  const slither = Math.sin(clamped * Math.PI * 6) * 6 * (1 - clamped);

  const orbitX = 230 + Math.cos(theta) * 135;
  const orbitY = 238 + Math.sin(theta) * 46 - Math.cos(theta) * 20 + slither;
  const orbitZ = Math.sin(theta);

  // Final perch coordinates right over "ianzz", curving down-left to match 202398.jpg dragon head angle
  const p0x = 345, p0y = 215;
  const p1x = 325, p1y = 165;
  const p2x = 278, p2y = 188;

  const b = Math.max(0, (clamped - 0.68) / 0.32);
  const sb = b * b * (3 - 2 * b);

  // Quadratic curve for the final approach so tangent at u=1 points down-left (toward "ianzz")
  const landX = (1 - sb) * (1 - sb) * p0x + 2 * (1 - sb) * sb * p1x + sb * sb * p2x;
  const landY = (1 - sb) * (1 - sb) * p0y + 2 * (1 - sb) * sb * p1y + sb * sb * p2y;

  return {
    x: orbitX * (1 - sb) + landX * sb,
    y: orbitY * (1 - sb) + landY * sb,
    z: orbitZ * (1 - sb) + 1 * sb
  };
}

// Analytical tangent angle so the head NEVER snaps to 0deg when reaching the end
function evaluateDragonTangent(u) {
  const eps = 0.004;
  const u1 = Math.max(0, Math.min(0.996, u - eps));
  const u2 = Math.min(1.0, u1 + eps * 2);
  const p1 = evaluateDragonCurve(u1);
  const p2 = evaluateDragonCurve(u2);
  return Math.atan2(p2.y - p1.y, p2.x - p1.x);
}

// Draws the Fierce Horned Dragon Head matching 202327.jpg / 202398.jpg
function drawOrbitDragonHead(ctx, x, y, angle, scale, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);
  ctx.globalAlpha = alpha;

  ctx.shadowBlur = 12;
  ctx.shadowColor = '#e50914';
  ctx.fillStyle = '#e50914';

  // Sleek Reptilian Snout, Hooked Beak & Swept Crown Horns
  ctx.beginPath();
  ctx.moveTo(24, 1);
  ctx.lineTo(14, -4);
  ctx.lineTo(16, -8);
  ctx.lineTo(6, -6);
  ctx.lineTo(-6, -11);
  ctx.quadraticCurveTo(-22, -19, -40, -24); // Swept Horn 1
  ctx.quadraticCurveTo(-24, -13, -14, -8);
  ctx.quadraticCurveTo(-28, -12, -42, -13); // Swept Horn 2
  ctx.quadraticCurveTo(-22, -5, -12, -1);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.fill();

  // Open Roaring Lower Jaw
  ctx.beginPath();
  ctx.moveTo(-6, 1);
  ctx.lineTo(17, 7);
  ctx.lineTo(11, 10);
  ctx.lineTo(-12, 4);
  ctx.lineTo(-22, 9);
  ctx.closePath();
  ctx.fill();

  // Slanted Black Eye Cutout
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(8, -4);
  ctx.lineTo(0, -7);
  ctx.lineTo(-2, -3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
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
    p.alpha -= 0.025;
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

  // Flight Timeline:
  // 1150ms -> 3450ms: uHead advances smoothly from 0.0 to 1.42.
  // As each segment passes u = 1.0, it seamlessly enters the perched dragon crest!
  const flightStart = 1150;
  const flightSpan = 2250;

  if (elapsed >= flightStart && elapsed <= flightStart + flightSpan) {
    const progress = (elapsed - flightStart) / flightSpan; // 0.0 -> 1.0
    const uHead = progress * 1.42; // Head reaches u=1.0 at ~70% of span, then tail slithers in from u=1.0 to 1.42!

    // Draw segments from tail to head
    for (let i = NUM_SEGMENTS - 1; i >= 1; i--) {
      const uSeg = uHead - i * SEG_SPACING;
      // Only draw segments that have launched (uSeg >= 0) and haven't absorbed into the crest yet (uSeg <= 1.0)
      if (uSeg < 0 || uSeg > 1.0) continue;

      const curr = evaluateDragonCurve(uSeg);
      const angle = evaluateDragonTangent(uSeg);
      const bodyRatio = 1 - i / NUM_SEGMENTS;

      // Smooth fade as segment approaches u = 1.0 (absorbs into the crest)
      const absorbFade = uSeg > 0.88 ? (1.0 - uSeg) / 0.12 : 1.0;
      const launchFade = Math.min(1, uHead * 4);
      const segAlpha = absorbFade * launchFade * (0.25 + bodyRatio * 0.75);

      const depthScale = 0.74 + (curr.z + 1) * 0.22;
      const ctx = curr.z >= 0 ? frontCtx : backCtx;

      ctx.save();
      ctx.translate(curr.x, curr.y);
      ctx.rotate(angle);
      ctx.globalAlpha = segAlpha;

      const halfW = (1.1 + Math.sin(bodyRatio * Math.PI) * 4.4) * depthScale;

      // Upper Crimson Spine
      ctx.fillStyle = curr.z >= 0 ? '#e50914' : '#7a0005';
      ctx.beginPath();
      ctx.moveTo(halfW * 1.7, 0);
      ctx.lineTo(-halfW, -halfW);
      ctx.lineTo(-halfW * 0.4, 0);
      ctx.lineTo(-halfW, halfW);
      ctx.closePath();
      ctx.fill();

      // Ribbed Belly Scale Line (From 202378.jpg / 202398.jpg)
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 1.3 * depthScale;
      ctx.beginPath();
      ctx.moveTo(0, -halfW * 0.8);
      ctx.lineTo(-halfW * 0.7, halfW * 0.8);
      ctx.stroke();

      // Swept Dorsal Scythe Spikes Along Back
      if (i % 2 === 0 && i > 2 && i < NUM_SEGMENTS - 4) {
        ctx.fillStyle = '#ff1e27';
        ctx.beginPath();
        ctx.moveTo(2, -halfW * 0.8);
        ctx.quadraticCurveTo(-8 * depthScale, -halfW * 3.4, -19 * depthScale, -halfW * 4.0);
        ctx.quadraticCurveTo(-9 * depthScale, -halfW * 1.8, -3, -halfW * 0.7);
        ctx.closePath();
        ctx.fill();
      }

      ctx.restore();
    }

    // Draw Head while uHead <= 1.02
    if (uHead > 0 && uHead <= 1.02) {
      const hPos = evaluateDragonCurve(Math.min(1.0, uHead));
      const hAngle = evaluateDragonTangent(Math.min(1.0, uHead));
      const hScale = 0.82 + (hPos.z + 1) * 0.2;
      const hAlpha = uHead > 0.92 ? Math.max(0, (1.02 - uHead) / 0.1) : Math.min(1, uHead * 4);
      const hCtx = hPos.z >= 0 ? frontCtx : backCtx;

      drawOrbitDragonHead(hCtx, hPos.x, hPos.y, hAngle, hScale, hAlpha);

      if (Math.random() < 0.6) {
        spawnOrbitEmber(
          hPos.x + Math.cos(hAngle) * 14,
          hPos.y + Math.sin(hAngle) * 14,
          Math.cos(hAngle) * 1.4,
          Math.sin(hAngle) * 1.4,
          false
        );
      }

      // Burst of embers right as the head merges into the perched crest
      if (uHead > 0.96 && uHead < 1.0) {
        spawnOrbitEmber(hPos.x, hPos.y, 0, -1, true);
      }
    }
  }

  const portalEl = document.getElementById('vault-portal');
  if (portalEl && !portalEl.classList.contains('portal-open')) {
    orbitAnimId = requestAnimationFrame(animateSerpentOrbit);
  }
}

/* =========================================================
   5. INTRO & OUTRO PORTAL CONTROLLERS
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
   6. SPECIAL EFFECTS ENGINE WHEN OPENING VIDEOS / EASTER EGGS
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

window.addEventListener('DOMContentLoaded', initExactLogoLayers);
