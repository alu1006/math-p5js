// ── 流場背景粒子（淺色系）──────────────────
const bgSketch = (p) => {
  const NUM   = 600;
  const SCALE = 0.0025;   // 噪音縮放（越小越平滑）
  const SPEED = 1.4;

  let pts = [];

  class Pt {
    constructor() { this.reset(); }
    reset() {
      this.x  = p.random(p.width);
      this.y  = p.random(p.height);
      this.px = this.x;
      this.py = this.y;
      this.vx = 0;
      this.vy = 0;
      // 淺色系：藍紫、青綠、薰衣草
      this.hue = p.random([
        p.random(190, 230),  // 天藍
        p.random(250, 290),  // 薰衣草紫
        p.random(160, 185),  // 青綠
      ]);
    }
    update() {
      this.px = this.x;
      this.py = this.y;
      const angle = p.noise(this.x * SCALE, this.y * SCALE) * p.TWO_PI * 4;
      this.vx += Math.cos(angle) * 0.4;
      this.vy += Math.sin(angle) * 0.4;
      const spd = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (spd > SPEED) { this.vx *= SPEED / spd; this.vy *= SPEED / spd; }
      this.x += this.vx;
      this.y += this.vy;
      this.hue += 0.08;
      if (this.hue > 360) this.hue = 0;
      if (this.x < 0 || this.x > p.width || this.y < 0 || this.y > p.height) this.reset();
    }
    draw() {
      p.stroke(this.hue, 35, 72, 7);  // 飽和度低、亮度高、透明度低 → 淡雅
      p.strokeWeight(1);
      p.line(this.x, this.y, this.px, this.py);
    }
  }

  p.setup = () => {
    const cnv = p.createCanvas(p.windowWidth, p.windowHeight);
    cnv.parent('bg-canvas');
    cnv.style('display', 'block');
    p.colorMode(p.HSB, 360, 100, 100, 100);
    p.background(210, 18, 97);  // 非常淡的藍灰白
    for (let i = 0; i < NUM; i++) pts.push(new Pt());
  };

  p.draw = () => {
    // 極淡的背景疊層，讓舊軌跡慢慢消退
    p.background(210, 18, 97, 6);
    for (const pt of pts) { pt.update(); pt.draw(); }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.background(210, 18, 97);
  };
};

new p5(bgSketch);
