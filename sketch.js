// sketch.js — p5.js Wi-Fi nebula, driven by window.Signal

new p5((p) => {
  const PARTICLE_COUNT = 140;
  const particles = [];
  const rings = [];
  let lastPulse = 0;
  let uiTimer = 0;

  // ── Particle class ───────────────────────────────────────────────────
  class Particle {
    constructor() { this.reset(true); }

    reset(randomLife = false) {
      this.angle  = p.random(p.TWO_PI);
      this.radius = p.random(30, p.min(p.width, p.height) * 0.38);
      this.x      = p.width  / 2 + p.cos(this.angle) * this.radius;
      this.y      = p.height / 2 + p.sin(this.angle) * this.radius;
      this.vx     = p.random(-0.4, 0.4);
      this.vy     = p.random(-0.4, 0.4);
      this.size   = p.random(1.5, 5);
      this.maxLife = p.random(0.5, 1.0);
      this.life   = randomLife ? p.random(this.maxLife) : this.maxLife;
      this.drift  = p.random(0.0015, 0.006);
      this.dir    = p.random() > 0.5 ? 1 : -1;
      this.hueOff = p.random(40);
    }

    update(s) {
      this.angle += this.drift * this.dir * (0.4 + s * 1.8);
      const pull = 0.004 * (1 + s * 1.2);
      const cx = p.width / 2, cy = p.height / 2;
      this.vx += (cx - this.x) * pull;
      this.vy += (cy - this.y) * pull;
      this.x  += this.vx;
      this.y  += this.vy;
      this.vx *= 0.97;
      this.vy *= 0.97;
      this.life -= 0.003 + s * 0.004;
      if (this.life <= 0) this.reset();
    }

    draw(s, frameCount) {
      const ratio = this.life / this.maxLife;
      const alpha = ratio * (0.35 + s * 0.65);
      const hue   = (175 + s * 80 + this.hueOff + p.sin(frameCount * 0.008 + this.angle) * 25) % 360;
      p.noStroke();
      p.fill(hue, 75, 80, alpha);
      p.ellipse(this.x, this.y, this.size * ratio * 2);
    }
  }

  // ── Ring class ───────────────────────────────────────────────────────
  class Ring {
    constructor(s) {
      this.r     = 0;
      this.alpha = 0.65;
      this.maxR  = p.min(p.width, p.height) * (0.28 + s * 0.18);
      this.hue   = 175 + s * 80;
      this.speed = 1.4 + s * 1.8;
    }
    update() {
      this.r     += this.speed;
      this.alpha -= 0.007;
    }
    draw() {
      if (this.alpha <= 0) return;
      p.noFill();
      p.stroke(this.hue, 70, 75, this.alpha);
      p.strokeWeight(1.2);
      p.ellipse(p.width / 2, p.height / 2, this.r * 2);
    }
    dead() { return this.alpha <= 0 || this.r > this.maxR; }
  }

  // ── p5 lifecycle ─────────────────────────────────────────────────────
  p.setup = () => {
    const wrap = document.getElementById('canvas-wrap');
    const size = wrap.offsetWidth;
    const cnv  = p.createCanvas(size, size);
    cnv.parent('canvas-wrap');
    p.colorMode(p.HSB, 360, 100, 100, 1);
    p.noStroke();
    for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle());
  };

  p.draw = () => {
    const s = window.Signal.strength;
    window.Signal.tick();

    // Update UI every 20 frames
    uiTimer++;
    if (uiTimer % 20 === 0) window.Signal.updateUI();

    // Trail
    p.background(225, 60, 4, 0.18);

    const cx = p.width / 2, cy = p.height / 2;

    // Pulse rings — frequency scales with signal
    const interval = Math.round(130 - s * 85);
    if (p.frameCount - lastPulse > interval) {
      rings.push(new Ring(s));
      lastPulse = p.frameCount;
    }
    for (let i = rings.length - 1; i >= 0; i--) {
      rings[i].update();
      rings[i].draw();
      if (rings[i].dead()) rings.splice(i, 1);
    }

    // Core glow
    const glowR = p.min(p.width, p.height) * (0.08 + s * 0.16);
    const hue   = 180 + s * 75;
    for (let r = glowR; r > 0; r -= 2) {
      const a = (1 - r / glowR) * (0.18 + s * 0.45) * (r / glowR);
      p.fill(hue, 70, 95, a);
      p.ellipse(cx, cy, r * 2);
    }

    // Particles
    for (const pt of particles) {
      pt.update(s);
      pt.draw(s, p.frameCount);
    }

    // Outer haze
    const hazeR = p.min(p.width, p.height) * 0.46;
    for (let r = hazeR; r > hazeR * 0.55; r -= 3) {
      const a = (1 - (r - hazeR * 0.55) / (hazeR * 0.45)) * (0.025 + s * 0.04);
      p.fill(hue - 10, 55, 75, a * 0.6);
      p.ellipse(cx, cy, r * 2);
    }
  };

  p.windowResized = () => {
    const wrap = document.getElementById('canvas-wrap');
    p.resizeCanvas(wrap.offsetWidth, wrap.offsetWidth);
  };
}, document.body);