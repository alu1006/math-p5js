'use strict';

// ══════════════════════════════════════════════
// 方塊定義
// ══════════════════════════════════════════════
const BLOCKS = {
  emitter: [
    { id:'single',  name:'Single',   icon:'•',   bg:'#e74c3c', rate:380,
      desc:'單發直射',
      math: { spawn:'(x₀, y₀) = (O)', angles:'θ = 0°', n:'1 發/次' },
      spawnCode: `  bullets.push(new Bullet(ox, oy, 0));`,
      spawns(){ return [{x:OX,y:OY,a:0}]; } },

    { id:'fan3',    name:'Fan ×3',   icon:'⟨›⟩', bg:'#e67e22', rate:520,
      desc:'3向展開',
      math: { spawn:'(x₀, y₀) = (O)', angles:'θₖ = −22° + k·22°,  k = 0,1,2', n:'3 發/次' },
      spawnCode: `  for (let k = 0; k < 3; k++) {
    bullets.push(new Bullet(ox, oy, -22 + k * 22));
  }`,
      spawns(){ return [-22,0,22].map(a=>({x:OX,y:OY,a})); } },

    { id:'fan5',    name:'Fan ×5',   icon:'✦',   bg:'#f39c12', rate:620,
      desc:'5向扇形',
      math: { spawn:'(x₀, y₀) = (O)', angles:'θₖ = −44° + k·22°,  k = 0,...,4', n:'5 發/次' },
      spawnCode: `  for (let k = 0; k < 5; k++) {
    bullets.push(new Bullet(ox, oy, -44 + k * 22));
  }`,
      spawns(){ return [-44,-22,0,22,44].map(a=>({x:OX,y:OY,a})); } },

    { id:'ring8',   name:'Ring ×8',  icon:'⊙',   bg:'#9b59b6', rate:950,
      desc:'8方環形',
      math: { spawn:'(x₀, y₀) = (O)', angles:'θₖ = k · 45°,  k = 0,...,7', n:'8 發/次' },
      spawnCode: `  for (let k = 0; k < 8; k++) {
    bullets.push(new Bullet(ox, oy, k * 45));
  }`,
      spawns(){ return Array.from({length:8},(_,i)=>({x:OX,y:OY,a:i*45})); } },

    { id:'ring16',  name:'Ring ×16', icon:'⊛',   bg:'#8e44ad', rate:1300,
      desc:'16方包圍',
      math: { spawn:'(x₀, y₀) = (O)', angles:'θₖ = k · 22.5°,  k = 0,...,15', n:'16 發/次' },
      spawnCode: `  for (let k = 0; k < 16; k++) {
    bullets.push(new Bullet(ox, oy, k * 22.5));
  }`,
      spawns(){ return Array.from({length:16},(_,i)=>({x:OX,y:OY,a:i*22.5})); } },

    { id:'spiral',  name:'Spiral',   icon:'🌀',  bg:'#2980b9', rate:65,
      desc:'旋轉發射',
      math: { spawn:'(x₀, y₀) = (O)', angles:'θₙ = 13n (mod 360°)', n:'1 發/幀，持續旋轉' },
      spawnCode: `  spiralAngle = (spiralAngle + 13) % 360;
  bullets.push(new Bullet(ox, oy, spiralAngle));`,
      _a:0,
      spawns(){ this._a=(this._a+13)%360; return [{x:OX,y:OY,a:this._a}]; } },

    { id:'twin',    name:'Twin',     icon:'‖',   bg:'#1abc9c', rate:420,
      desc:'平行雙發',
      math: { spawn:'(x₀, y₀) = (O ± 16)', angles:'θ = ∓5°', n:'2 發/次，上下各一' },
      spawnCode: `  bullets.push(new Bullet(ox, oy - 16, -5));
  bullets.push(new Bullet(ox, oy + 16,  5));`,
      spawns(){ return [{x:OX,y:OY-16,a:-5},{x:OX,y:OY+16,a:5}]; } },

    { id:'rain',    name:'Rain ×6',  icon:'🌧',  bg:'#2471a3', rate:360,
      desc:'天降彈幕',
      math: { spawn:'x₀ ~ U(−L/2, L/2),  y₀ = 頂端', angles:'θ ~ U(75°, 105°)', n:'6 發/次' },
      spawnCode: `  for (let i = 0; i < 6; i++) {
    let rx = random(-width * 0.35, width * 0.35);
    bullets.push(new Bullet(ox + rx, -10, 90 + random(-15, 15)));
  }`,
      spawns(){ return Array.from({length:6},()=>({x:OX+(Math.random()-.5)*CW*.7,y:-10,a:90+(Math.random()-.5)*30})); } },
  ],

  path: [
    { id:'straight',  name:'Straight',    icon:'→',  bg:'#2e86c1', desc:'直線',
      math: { eq:['x(t) = v · t', 'y(t) = 0'], type:'直線（水平）' },
      p5code:`    // 直線
    let vx = SPEED;
    let vy = 0;`,
      fn(t){ return {vx:SPD,vy:0}; } },

    { id:'sine',      name:'Sine Wave',   icon:'∿',  bg:'#27ae60', desc:'正弦波浪',
      math: { eq:['x(t) = v · t', 'y(t) = A · sin(ω · t)'], type:'正弦波' },
      p5code:`    // 正弦波
    let vx = SPEED;
    let vy = AMP * cos(FREQ * this.t * 0.1) * 0.6; // dy/dt`,
      fn(t){ return {vx:SPD,vy:AMP*Math.cos(FREQ*t*0.1)*0.6}; } },

    { id:'cosine',    name:'Cosine',      icon:'∾',  bg:'#17a589', desc:'餘弦偏移',
      math: { eq:['x(t) = v · t', 'y(t) = A · cos(ω · t)'], type:'餘弦波' },
      p5code:`    // 餘弦波
    let vx = SPEED;
    let vy = -AMP * sin(FREQ * this.t * 0.1) * 0.6;`,
      fn(t){ return {vx:SPD,vy:-AMP*Math.sin(FREQ*t*0.1)*0.6}; } },

    { id:'zigzag',    name:'Zigzag',      icon:'⟋',  bg:'#ca6f1e', desc:'鋸齒折線',
      math: { eq:['x(t) = v · t', 'y(t) = A · sgn(sin(ω · t))'], type:'方波（鋸齒）' },
      p5code:`    // 鋸齒（方波）
    let phase = FREQ * this.t * 0.08;
    let dir   = (floor(phase / PI) % 2 === 0) ? 1 : -1;
    let vx = SPEED;
    let vy = dir * AMP * 0.7;`,
      fn(t){ const ph=FREQ*t*0.08; const d=((Math.floor(ph/Math.PI)%2)===0)?1:-1; return {vx:SPD,vy:d*AMP*0.7}; } },

    { id:'parabola',  name:'Parabola',    icon:'∪',  bg:'#d4ac0d', desc:'向下彎曲',
      math: { eq:['x(t) = v · t', 'y(t) = ½ · A · t²'], type:'拋物線' },
      p5code:`    // 拋物線：y = ½At²
    let vx = SPEED;
    let vy = this.t * 0.012 * AMP; // dy/dt = At`,
      fn(t){ return {vx:SPD,vy:t*0.012*AMP}; } },

    { id:'circle',    name:'Circle',      icon:'○',  bg:'#a569bd', desc:'圓形軌跡',
      math: { eq:['x(t) = r · cos(ω · t)', 'y(t) = r · sin(ω · t)'], type:'圓（極座標: r = const）' },
      p5code:`    // 圓形軌跡
    let s  = FREQ * this.t * 0.06;
    let vx = SPEED * cos(s);
    let vy = SPEED * sin(s) * AMP * 0.5;`,
      fn(t){ const s=FREQ*t*0.06; return {vx:SPD*Math.cos(s),vy:SPD*Math.sin(s)*AMP*0.5}; } },

    { id:'spiral_p',  name:'Spiral Out',  icon:'🌀', bg:'#7d3c98', desc:'螺旋外擴',
      math: { eq:['極座標: r(t) = A · t,  θ(t) = ω · t', 'x(t) = r·cos(θ),  y(t) = r·sin(θ)'], type:'阿基米德螺線' },
      p5code:`    // 阿基米德螺線: r = At
    let theta = FREQ * this.t * 0.08;
    let r     = this.t * 0.015 * AMP;
    let vx    = SPEED * (cos(theta) - r * sin(theta) * 0.06);
    let vy    = SPEED * (sin(theta) + r * cos(theta) * 0.06);`,
      fn(t){ const th=FREQ*t*0.08,r=t*0.015*AMP; return {vx:SPD*(Math.cos(th)-r*Math.sin(th)*0.06),vy:SPD*(Math.sin(th)+r*Math.cos(th)*0.06)}; } },

    { id:'damped',    name:'Damped Wave', icon:'≋',  bg:'#e59866', desc:'衰減震盪',
      math: { eq:['x(t) = v · t', 'y(t) = A · e^{−k·t} · sin(ω · t)'], type:'阻尼振盪' },
      p5code:`    // 阻尼振盪: y = A·e^{-kt}·sin(ωt)
    let x  = this.t * 0.025;
    let vx = SPEED;
    let vy = AMP * exp(-x * 0.3) * cos(FREQ * x * 4) * 0.8;`,
      fn(t){ const x=t*0.025; return {vx:SPD,vy:AMP*Math.exp(-x*0.3)*Math.cos(FREQ*x*4)*0.8}; } },

    { id:'lissajous', name:'Lissajous',   icon:'∞',  bg:'#9b59b6', desc:'利薩如曲線',
      math: { eq:['x(t) = cos(t)', 'y(t) = A · cos(2t + φ)'], type:'利薩如圖形（比例 1:2）' },
      p5code:`    // 利薩如曲線 (1:2)
    let s  = FREQ * this.t * 0.04;
    let vx = SPEED * cos(s);
    let vy = AMP * cos(2 * s + 0.5) * 0.8;`,
      fn(t){ const s=FREQ*t*0.04; return {vx:SPD*Math.cos(s),vy:AMP*Math.cos(2*s+0.5)*0.8}; } },
  ],

  mod: [
    { id:'none',    name:'None',       icon:'○',  bg:'#95a5a6', desc:'無修飾',
      math:{ eq:'(vₓ, vᵧ) → (vₓ, vᵧ)  （恆等）', effect:'不改變速度向量' },
      p5code:`    // 無修飾：保持原速度`,
      fn(vx,vy,b){ return {vx,vy}; } },

    { id:'gravity', name:'+Gravity',   icon:'↓',  bg:'#1f618d', desc:'重力加速',
      math:{ eq:'vᵧ(t) = vᵧ₀ + g · t', effect:'y 方向持續加速（模擬重力）' },
      p5code:`    // 重力：vᵧ 持續增加
    this.gv += 0.04 * AMP;
    ry += this.gv;`,
      fn(vx,vy,b){ b._gv=(b._gv||0)+0.04*AMP; return {vx,vy:vy+b._gv}; } },

    { id:'accel',   name:'Accelerate', icon:'▶▶', bg:'#b7770d', desc:'持續加速',
      math:{ eq:'v(t) = v₀ · (1 + k · t)', effect:'速度隨時間線性增加' },
      p5code:`    // 加速：速度 × (1 + kt)
    let factor = 1 + this.t * 0.003;
    rx *= factor;
    ry *= factor;`,
      fn(vx,vy,b){ const f=1+b.age*0.003; return {vx:vx*f,vy:vy*f}; } },

    { id:'wobble',  name:'+Wobble',    icon:'≈',  bg:'#2e86c1', desc:'加入微震',
      math:{ eq:'vₓ += ε·sin(αt),  vᵧ += ε·cos(βt)', effect:'小幅隨機震動' },
      p5code:`    // 微震：加入小幅正弦擾動
    rx += sin(this.t * 0.3) * 0.4 * AMP;
    ry += cos(this.t * 0.4) * 0.4 * AMP;`,
      fn(vx,vy,b){ return {vx:vx+Math.sin(b.age*0.3)*0.4*AMP,vy:vy+Math.cos(b.age*0.4)*0.4*AMP}; } },

    { id:'mirror',  name:'Mirror',     icon:'↕',  bg:'#a569bd', desc:'交替鏡像',
      math:{ eq:'vᵧ(t) = vᵧ₀ · (−1)^{⌊t/T⌋}', effect:'y 分量每 T 幀翻轉一次' },
      p5code:`    // 鏡像：每 30 幀翻轉 y 方向
    let sign = (floor(this.t / 30) % 2 === 0) ? 1 : -1;
    ry *= sign;`,
      fn(vx,vy,b){ return {vx,vy:vy*(((Math.floor(b.age/30)%2)===0)?1:-1)}; } },

    { id:'shrink',  name:'Shrink',     icon:'◁',  bg:'#d35400', desc:'速度遞減',
      math:{ eq:'v(t) = v₀ · e^{−k·t}', effect:'速度指數衰減（緩停）' },
      p5code:`    // 衰減：速度 × e^{-kt}
    let decay = max(0.1, 1 - this.t * 0.004);
    rx *= decay;
    ry *= decay;`,
      fn(vx,vy,b){ const f=Math.max(0.1,1-b.age*0.004); return {vx:vx*f,vy:vy*f}; } },

    { id:'spin',    name:'Spin Path',  icon:'↻',  bg:'#148f77', desc:'路徑旋轉',
      math:{ eq:'(vₓ,vᵧ) → R(ωt)·(vₓ,vᵧ)', effect:'速度向量以 ω 角速度持續旋轉' },
      p5code:`    // 旋轉速度向量：R(ωt)·v
    let spinA = this.t * 0.02 * FREQ;
    let sr = rx * cos(spinA) - ry * sin(spinA);
    ry    = rx * sin(spinA) + ry * cos(spinA);
    rx    = sr;`,
      fn(vx,vy,b){ const a=b.age*0.02*FREQ,c=Math.cos(a),s=Math.sin(a); return {vx:vx*c-vy*s,vy:vx*s+vy*c}; } },
  ],

  effect: [
    { id:'standard', name:'Standard',   icon:'•',  bg:'#95a5a6', desc:'普通子彈',
      math:{ color:'固定顏色（依軌跡色）', special:'無' },
      colorCode:`      stroke(this.baseColor); strokeWeight(a * 1.8);`,
      extraCode:``,
      color_fn(b){ return b.baseColor; }, extra(b,arr){} },

    { id:'rainbow',  name:'Rainbow',    icon:'🌈', bg:'#e67e22', desc:'彩虹變色',
      math:{ color:'H(t) = (4t) mod 360（HSL 色相循環）', special:'顏色隨時間旋轉' },
      colorCode:`      stroke(\`hsl(\${(this.t*4)%360},80%,40%)\`);
      strokeWeight(a * 1.8);`,
      extraCode:``,
      color_fn(b){ return `hsl(${(b.age*4)%360},80%,45%)`; }, extra(b,arr){} },

    { id:'split',    name:'Split ×2',   icon:'✂',  bg:'#1abc9c', desc:'分裂子彈',
      math:{ color:'固定顏色', special:'t = 45 時分裂成兩顆，角度 ±0.45 rad (≈26°)' },
      colorCode:`      stroke(this.baseColor); strokeWeight(a * 1.8);`,
      extraCode:`    // 分裂：t=45 時生成兩顆子彈
    if (this.t === 45 && !this.didSplit) {
      this.didSplit = true;
      for (let da of [-0.45, 0.45]) {
        bullets.push(new Bullet(this.x, this.y,
          degrees(this.angle + da),
          this.pathFn, this.modFn, this.baseColor, true));
      }
    }`,
      color_fn(b){ return b.baseColor; },
      extra(b,arr){
        if(b.age===45&&!b._split){ b._split=true;
          for(const da of[-0.45,0.45]) arr.push(new Bullet({x:b.x,y:b.y,angle:b.baseAngle+da,pathId:b.pathId,modId:b.modId,effectId:b.effectId,baseColor:b.baseColor,_split:true}));
        }
      } },

    { id:'bounce',   name:'Bounce',     icon:'⟳',  bg:'#9b59b6', desc:'反彈牆壁',
      math:{ color:'固定顏色', special:'碰到邊界時速度分量取反：vₓ → −vₓ 或 vᵧ → −vᵧ' },
      colorCode:`      stroke(this.baseColor); strokeWeight(a * 1.8);`,
      extraCode:`    // 反彈：碰壁翻轉速度
    if (this.x < 10 || this.x > width  - 10) this.vxSign *= -1;
    if (this.y < 10 || this.y > height - 10) this.vySign *= -1;`,
      color_fn(b){ return b.baseColor; },
      extra(b,arr){ if(b.x<10||b.x>CW-10)b._vxSign*=-1; if(b.y<10||b.y>CH-10)b._vySign*=-1; } },

    { id:'ghost',    name:'Ghost',      icon:'👻', bg:'#5dade2', desc:'閃爍穿越',
      math:{ color:'透明度 α(t) = |sin(0.25t)|', special:'子彈不會在邊界消失' },
      colorCode:`      let ga = abs(sin(this.t * 0.25 + i * 0.1));
      stroke(this.baseColor);
      strokeWeight(a * 1.8);
      drawingContext.globalAlpha = a * ga * 0.6;`,
      extraCode:``,
      color_fn(b){ return b.baseColor; }, extra(b,arr){} },

    { id:'glow',     name:'Hyper Glow', icon:'✦',  bg:'#f4d03f', desc:'強光爆閃',
      math:{ color:'固定顏色', special:'繪製時加入 shadowBlur 光暈效果' },
      colorCode:`      drawingContext.shadowBlur = 12;
      drawingContext.shadowColor = this.baseColor;
      stroke(this.baseColor); strokeWeight(a * 2.5);`,
      extraCode:``,
      color_fn(b){ return b.baseColor; }, extra(b,arr){} },
  ],
};

const PRESETS = {
  dragon:    ['spiral', 'sine',      'gravity','rainbow'],
  sakura:    ['ring8',  'parabola',  'wobble', 'rainbow'],
  lightning: ['fan5',   'zigzag',    'accel',  'glow'],
  galaxy:    ['spiral', 'spiral_p',  'spin',   'ghost'],
  chaos:     ['ring16', 'lissajous', 'mirror', 'split'],
  rain:      ['rain',   'damped',    'gravity','bounce'],
};

// ══════════════════════════════════════════════
// 狀態
// ══════════════════════════════════════════════
const canvas = document.getElementById('cv');
const ctx    = canvas.getContext('2d');
let CW=800, CH=500, OX, OY, UNIT=40;
let SPD=3.5, AMP=2.2, FREQ=1.0;
let assembly=[null,null,null,null];
let bullets=[], fired=0, firing=false, fireInterval=null;
let fps=0, frameCount=0, fpsTimer=0, lastTs=0;

function resize(){
  const wrap=document.getElementById('canvas-wrap');
  CW=canvas.width=wrap.clientWidth;
  CH=canvas.height=wrap.clientHeight;
  OX=Math.round(CW*.18); OY=Math.round(CH*.5);
  UNIT=Math.round(CH/11);
}

// ══════════════════════════════════════════════
// Bullet
// ══════════════════════════════════════════════
class Bullet{
  constructor({x,y,angle,pathId,modId,effectId,baseColor,_split=false}){
    this.x=x; this.y=y;
    this.baseAngle=(angle||0)*Math.PI/180;
    this.pathId=pathId; this.modId=modId; this.effectId=effectId;
    this.baseColor=baseColor;
    this.age=0; this.trail=[]; this.alive=true;
    this._split=_split; this._gv=0; this._vxSign=1; this._vySign=1;
  }
  update(newB){
    if(!this.alive) return;
    this.age++;
    const pb=BLOCKS.path.find(b=>b.id===this.pathId);
    const mb=BLOCKS.mod.find(b=>b.id===this.modId);
    const eb=BLOCKS.effect.find(b=>b.id===this.effectId);
    let {vx,vy}=pb?pb.fn(this.age):{vx:SPD,vy:0};
    const cos=Math.cos(this.baseAngle),sin=Math.sin(this.baseAngle);
    let rx=vx*cos-vy*sin, ry=vx*sin+vy*cos;
    if(mb){const r=mb.fn(rx,ry,this);rx=r.vx;ry=r.vy;}
    rx*=this._vxSign; ry*=this._vySign;
    this.x+=rx; this.y+=ry;
    if(eb) eb.extra(this,newB);
    this.trail.push({x:this.x,y:this.y});
    if(this.trail.length>60) this.trail.shift();
    if(this.x>CW+120||this.x<-120||this.y>CH+120||this.y<-120) this.alive=false;
  }
  draw(){
    if(this.trail.length<2) return;
    const eb=BLOCKS.effect.find(b=>b.id===this.effectId);
    const col=eb?eb.color_fn(this):this.baseColor;
    const isGhost=this.effectId==='ghost';
    const isGlow=this.effectId==='glow';
    ctx.save(); ctx.lineCap='round'; ctx.lineJoin='round';
    for(let i=1;i<this.trail.length;i++){
      const a=i/this.trail.length;
      if(isGhost) ctx.globalAlpha=a*0.4*(Math.abs(Math.sin(this.age*0.25+i*0.1)));
      else        ctx.globalAlpha=a*0.6;
      ctx.strokeStyle=col;
      ctx.lineWidth=a*(isGlow?2.5:1.8);
      if(isGlow){ctx.shadowBlur=10;ctx.shadowColor=col;}
      ctx.beginPath();
      ctx.moveTo(this.trail[i-1].x,this.trail[i-1].y);
      ctx.lineTo(this.trail[i].x,  this.trail[i].y);
      ctx.stroke();
    }
    if(this.alive){
      ctx.shadowBlur=0;
      ctx.globalAlpha=isGhost?0.6:1;
      if(isGlow){ctx.shadowBlur=18;ctx.shadowColor=col;}
      const gr=ctx.createRadialGradient(this.x,this.y,0,this.x,this.y,isGlow?11:7);
      gr.addColorStop(0,col+'88'); gr.addColorStop(1,'transparent');
      ctx.fillStyle=gr; ctx.beginPath(); ctx.arc(this.x,this.y,isGlow?11:7,0,Math.PI*2); ctx.fill();
      ctx.fillStyle='rgba(255,255,255,.9)';
      ctx.beginPath(); ctx.arc(this.x,this.y,2.5,0,Math.PI*2); ctx.fill();
      ctx.fillStyle=col;
      ctx.beginPath(); ctx.arc(this.x,this.y,1.8,0,Math.PI*2); ctx.fill();
    }
    ctx.restore();
  }
}

// ══════════════════════════════════════════════
// 畫面繪製
// ══════════════════════════════════════════════
function drawAxes(){
  ctx.fillStyle='#fff'; ctx.fillRect(0,0,CW,CH);

  // 格線
  ctx.strokeStyle='#ebebeb'; ctx.lineWidth=1;
  for(let x=OX%UNIT;x<CW;x+=UNIT){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke();}
  for(let y=OY%UNIT;y<CH;y+=UNIT){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();}

  // 軸線
  ctx.strokeStyle='#bbb'; ctx.lineWidth=1.5;
  ctx.beginPath();ctx.moveTo(0,OY);ctx.lineTo(CW,OY);ctx.stroke();
  ctx.beginPath();ctx.moveTo(OX,CH);ctx.lineTo(OX,0);ctx.stroke();

  // 箭頭
  ctx.fillStyle='#bbb';
  ctx.beginPath();ctx.moveTo(CW-8,OY-5);ctx.lineTo(CW,OY);ctx.lineTo(CW-8,OY+5);ctx.fill();
  ctx.beginPath();ctx.moveTo(OX-5,8);ctx.lineTo(OX,0);ctx.lineTo(OX+5,8);ctx.fill();

  // 軸標籤
  ctx.fillStyle='#999'; ctx.font='bold 13px Courier New'; ctx.textAlign='left';
  ctx.fillText('x',CW-16,OY-10);
  ctx.fillText('y',OX+9,16);
  ctx.fillText('O',OX+4,OY+15);

  // 刻度
  ctx.fillStyle='#ccc'; ctx.font='9px Courier New'; ctx.textAlign='center';
  for(let i=1;OX+i*UNIT<CW-20;i++){
    ctx.strokeStyle='#ddd'; ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(OX+i*UNIT,OY-3);ctx.lineTo(OX+i*UNIT,OY+3);ctx.stroke();
    ctx.fillStyle='#bbb';ctx.fillText(i,OX+i*UNIT,OY+13);
    if(OX-i*UNIT>10){
      ctx.beginPath();ctx.moveTo(OX-i*UNIT,OY-3);ctx.lineTo(OX-i*UNIT,OY+3);ctx.stroke();
      ctx.fillText(-i,OX-i*UNIT,OY+13);
    }
  }
  ctx.textAlign='right';
  for(let i=1;OY-i*UNIT>10;i++){
    ctx.strokeStyle='#ddd'; ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(OX-3,OY-i*UNIT);ctx.lineTo(OX+3,OY-i*UNIT);ctx.stroke();
    ctx.fillStyle='#bbb';ctx.fillText(i,OX-6,OY-i*UNIT+4);
    if(OY+i*UNIT<CH-10){
      ctx.beginPath();ctx.moveTo(OX-3,OY+i*UNIT);ctx.lineTo(OX+3,OY+i*UNIT);ctx.stroke();
      ctx.fillText(-i,OX-6,OY+i*UNIT+4);
    }
  }
  ctx.textAlign='left';
}

function drawPreview(){
  const pb=assembly[1]?BLOCKS.path.find(b=>b.id===assembly[1]):null;
  const mb=assembly[2]?BLOCKS.mod.find(b=>b.id===assembly[2]):null;
  if(!pb) return;
  const eb=assembly[0]?BLOCKS.emitter.find(b=>b.id===assembly[0]):null;
  const angles=(eb?eb.spawns().map(s=>s.a||0):[0]).slice(0,5);
  ctx.save(); ctx.setLineDash([4,5]); ctx.lineWidth=1;
  for(const ang of angles){
    let px=OX, py=OY;
    if(eb&&eb.id==='rain'){px=OX+(Math.random()-.5)*CW*.5;py=0;}
    const rad=ang*Math.PI/180, cos=Math.cos(rad), sin=Math.sin(rad);
    const tmp={age:0,_gv:0};
    ctx.strokeStyle=pb.bg+'66'; ctx.beginPath(); ctx.moveTo(px,py);
    for(let t=0;t<250;t++){
      tmp.age++;
      let {vx,vy}=pb.fn(tmp.age);
      let rx=vx*cos-vy*sin, ry=vx*sin+vy*cos;
      if(mb){const r=mb.fn(rx,ry,tmp);rx=r.vx;ry=r.vy;}
      px+=rx; py+=ry;
      if(px>CW+50||px<-50||py>CH+50||py<-50) break;
      ctx.lineTo(px,py);
    }
    ctx.stroke();
  }
  ctx.setLineDash([]); ctx.restore();
}

function drawLauncher(){
  const eb=assembly[0]?BLOCKS.emitter.find(b=>b.id===assembly[0]):null;
  ctx.save();
  ctx.strokeStyle=eb?eb.bg:'#bbb'; ctx.lineWidth=2;
  ctx.fillStyle=eb?eb.bg+'22':'#f0f0f0';
  ctx.beginPath();ctx.arc(OX,OY,7,0,Math.PI*2);ctx.fill();ctx.stroke();
  if(eb){
    const gr=ctx.createRadialGradient(OX,OY,0,OX,OY,22);
    gr.addColorStop(0,eb.bg+'44');gr.addColorStop(1,'transparent');
    ctx.fillStyle=gr;ctx.beginPath();ctx.arc(OX,OY,22,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=eb.bg; ctx.font='bold 11px Courier New';
    ctx.fillText('★ '+eb.name,OX+12,OY-10);
  }
  ctx.restore();
}

function loop(ts){
  const dt=ts-lastTs; lastTs=ts;
  frameCount++;fpsTimer+=dt;
  if(fpsTimer>600){fps=Math.round(frameCount*1000/fpsTimer);frameCount=0;fpsTimer=0;}
  drawAxes(); drawPreview(); drawLauncher();
  const nb=[];
  for(const b of bullets){if(b.alive)b.update(nb);b.draw();}
  bullets.push(...nb); bullets=bullets.filter(b=>b.alive);
  document.getElementById('s-bullets').textContent=bullets.length;
  document.getElementById('s-fired').textContent=fired;
  document.getElementById('s-fps').textContent=fps;
  requestAnimationFrame(loop);
}

// ══════════════════════════════════════════════
// 發射
// ══════════════════════════════════════════════
function spawn(){
  const eb=BLOCKS.emitter.find(b=>b.id===assembly[0]); if(!eb)return;
  const pb=assembly[1]?BLOCKS.path.find(b=>b.id===assembly[1]):null;
  const col=pb?pb.bg:eb.bg;
  eb.spawns().forEach(s=>{
    bullets.push(new Bullet({x:s.x,y:s.y,angle:s.a||0,
      pathId:assembly[1]||'straight',modId:assembly[2]||'none',
      effectId:assembly[3]||'standard',baseColor:col}));
    fired++;
  });
}
function startFire(){
  if(firing||!assembly[0])return; firing=true;
  const btn=document.getElementById('btn-fire');
  btn.classList.add('on'); btn.innerHTML='<span class="fi">⏹</span>STOP';
  const eb=BLOCKS.emitter.find(b=>b.id===assembly[0]);
  spawn(); fireInterval=setInterval(()=>{spawn();if(bullets.length>1500)bullets=bullets.slice(-1200);},eb.rate);
}
function stopFire(){
  if(!firing)return; firing=false; clearInterval(fireInterval);
  const btn=document.getElementById('btn-fire');
  btn.classList.remove('on'); btn.innerHTML='<span class="fi">▶</span>FIRE';
}
document.getElementById('btn-fire').addEventListener('click',()=>{
  if(!assembly[0]){document.querySelectorAll('.block-slot')[0].style.outline='3px solid #e74c3c';setTimeout(()=>document.querySelectorAll('.block-slot')[0].style.outline='',500);return;}
  firing?stopFire():startFire();
});
document.getElementById('btn-reset').addEventListener('click',()=>{stopFire();bullets=[];fired=0;});
document.addEventListener('keydown',e=>{if(e.code==='Space'){e.preventDefault();firing?stopFire():startFire();}if(e.code==='KeyR')document.getElementById('btn-reset').click();});

// ══════════════════════════════════════════════
// 組合槽
// ══════════════════════════════════════════════
const catMap  =['emitter','path','mod','effect'];
const catNames=['EMITTER','PATH','MODIFIER','EFFECT'];
const catIcons=['🎯','📐','🌊','⚡'];
const catEmpty=['發射器','軌跡','修飾','特效'];

function applyAssembly(){
  document.querySelectorAll('.block-slot').forEach((sl,i)=>{
    const key=assembly[i];
    const blk=key?BLOCKS[catMap[i]].find(b=>b.id===key):null;
    sl.innerHTML='';
    const inner=document.createElement('div'); inner.className='slot-inner';
    if(blk){
      sl.classList.remove('empty');sl.classList.add('filled');sl.style.background=blk.bg;
      inner.innerHTML=`<div class="slot-cat" style="color:rgba(255,255,255,.7)">${catNames[i]}</div><div class="slot-icon">${blk.icon}</div><div class="slot-name">${blk.name}</div>`;
      const rm=document.createElement('div');rm.className='slot-remove';rm.textContent='✕';
      rm.addEventListener('click',e=>{e.stopPropagation();assembly[i]=null;if(firing)stopFire();applyAssembly();});
      sl.appendChild(inner);sl.appendChild(rm);
    } else {
      sl.classList.add('empty');sl.classList.remove('filled');sl.style.background='';
      inner.innerHTML=`<div class="slot-cat">${catNames[i]}</div><div class="slot-icon" style="opacity:.25">${catIcons[i]}</div><div class="slot-name">${catEmpty[i]}</div>`;
      sl.appendChild(inner);
    }
  });
  updateMathPanel();
  updateCodePanel();
  updateHighlight();
  if(firing){stopFire();startFire();}
}

function updateHighlight(){
  document.querySelectorAll('.pal-block').forEach(el=>{
    const idx=catMap.indexOf(el.dataset.cat);
    el.classList.toggle('in-use',assembly[idx]===el.dataset.id);
  });
}

// ══════════════════════════════════════════════
// 數學式面板
// ══════════════════════════════════════════════
// ── 數學式資料（純數學，無程式語法）──────────
const MATH_DATA = {
  emitter: {
    single:  { eqs:['<span class="mv">θ</span> = 0°'],
               params:[['(x₀,y₀)','發射起點 = 原點 O'],['θ','方向角']] },
    fan3:    { eqs:['<span class="mv">θ</span><sub>k</sub> = (k − 1) · 22°,&ensp; k ∈ {0, 1, 2}'],
               params:[['k','發射索引'],['θₖ','第 k 發的方向角']] },
    fan5:    { eqs:['<span class="mv">θ</span><sub>k</sub> = (k − 2) · 22°,&ensp; k ∈ {0, 1, 2, 3, 4}'],
               params:[['k','發射索引'],['θₖ','第 k 發的方向角'],['範圍','−44° 到 +44°']] },
    ring8:   { eqs:['<span class="mv">θ</span><sub>k</sub> = k · 45°,&ensp; k ∈ {0, 1, …, 7}'],
               params:[['k','發射索引 (0~7)'],['360° / 8','每隔 45° 一發']] },
    ring16:  { eqs:['<span class="mv">θ</span><sub>k</sub> = k · 22.5°,&ensp; k ∈ {0, 1, …, 15}'],
               params:[['k','發射索引 (0~15)'],['360° / 16','每隔 22.5° 一發']] },
    spiral:  { eqs:['<span class="mv">θ</span><sub>n</sub> = 13n &ensp;(mod 360°),&ensp; n = 0, 1, 2, …'],
               params:[['n','第 n 次發射'],['13°','每次旋轉增量'],['mod','取餘數，使角度回繞']] },
    twin:    { eqs:['y₀ = ±16,&ensp; <span class="mv">θ</span> = ∓5°'],
               params:[['y₀','起點垂直偏移'],['θ','方向角，上下各偏 5°']] },
    rain:    { eqs:['x₀ ~ <span class="mf">U</span>(−L/2,&ensp; L/2)',
                    '<span class="mv">θ</span> ~ <span class="mf">U</span>(75°,&ensp; 105°)'],
               params:[['U(a,b)','均勻分布 Uniform Distribution'],['L','畫布寬度'],['θ','偏向正下方±15°']] },
  },
  path: {
    straight:  { type:'線性函數 · 等速直線',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">v</span> · <span class="mt">t</span>',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = 0'],
                 params:[['v','水平速度（常數）'],['t','時間（幀數）']],
                 note:'dy/dt = 0，y 不隨時間改變' },
    sine:      { type:'三角函數 · 正弦波（週期振盪）',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">v</span> · <span class="mt">t</span>',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = <span class="mv">A</span> · <span class="mf">sin</span>(<span class="mg">ω</span> · <span class="mt">t</span>)'],
                 params:[['v','水平速度'],['A','振幅（最大偏移量）'],['ω','角頻率，ω = 2π/T'],['T','振盪週期']],
                 note:'y ∈ [−A, A]，週期 T = 2π / ω' },
    cosine:    { type:'三角函數 · 餘弦波（初始偏移）',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">v</span> · <span class="mt">t</span>',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = <span class="mv">A</span> · <span class="mf">cos</span>(<span class="mg">ω</span> · <span class="mt">t</span>)'],
                 params:[['A','振幅'],['ω','角頻率']],
                 note:'cos(ωt) = sin(ωt + π/2)，即相位超前 90°' },
    zigzag:    { type:'方波函數 · 符號函數合成',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">v</span> · <span class="mt">t</span>',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = <span class="mv">A</span> · <span class="mf">sgn</span>(<span class="mf">sin</span>(<span class="mg">ω</span> · <span class="mt">t</span>))'],
                 params:[['sgn(x)','符號函數：x>0 → +1，x<0 → −1'],['A','偏移幅度'],['ω','切換頻率']],
                 note:'值域 {−A, +A}，在兩值間快速切換（方波）' },
    parabola:  { type:'二次函數 · 拋物線',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">v</span> · <span class="mt">t</span>',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = ½ · <span class="mv">A</span> · <span class="mt">t</span>²'],
                 params:[['v','水平速度'],['A','加速度係數'],['t²','二次項使曲線下彎']],
                 note:'等加速度：dy/dt = A·t（速度線性增加）' },
    circle:    { type:'圓函數 · 參數式圓方程',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">r</span> · <span class="mf">cos</span>(<span class="mg">ω</span><span class="mt">t</span>)',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = <span class="mv">r</span> · <span class="mf">sin</span>(<span class="mg">ω</span><span class="mt">t</span>)'],
                 params:[['r','半徑（AMP 控制）'],['ω','角速度 = 2π / 週期']],
                 note:'x² + y² = r²（圓的隱式方程）' },
    spiral_p:  { type:'極座標函數 · 阿基米德螺線',
                 eqs:['極座標：<span class="mv">r</span>(<span class="mt">t</span>) = <span class="mv">A</span> · <span class="mt">t</span>',
                      '&emsp;&emsp;&emsp;&emsp; <span class="mg">θ</span>(<span class="mt">t</span>) = <span class="mg">ω</span> · <span class="mt">t</span>',
                      '直角座標：<span class="mv">x</span> = <span class="mv">r</span>·<span class="mf">cos</span>(<span class="mg">θ</span>),&ensp; <span class="mv">y</span> = <span class="mv">r</span>·<span class="mf">sin</span>(<span class="mg">θ</span>)'],
                 params:[['r(t)','隨時間線性增長的半徑'],['A','半徑增長率'],['ω','角速度']],
                 note:'r = Aθ/ω，相鄰圈間距恆為 2πA/ω（等距螺線）' },
    damped:    { type:'指數衰減 × 正弦 · 阻尼振盪',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mv">v</span> · <span class="mt">t</span>',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = <span class="mv">A</span> · e<sup>−<span class="mk">k</span><span class="mt">t</span></sup> · <span class="mf">sin</span>(<span class="mg">ω</span><span class="mt">t</span>)'],
                 params:[['A','初始振幅'],['e^{−kt}','指數衰減包絡線'],['ω','振盪角頻率'],['k','衰減係數（k > 0）']],
                 note:'源自二階微分方程：ÿ + 2kẏ + (k² + ω²)y = 0' },
    lissajous: { type:'利薩如圖形 · 頻率比 1:2',
                 eqs:['<span class="mv">x</span>(<span class="mt">t</span>) = <span class="mf">cos</span>(<span class="mt">t</span>)',
                      '<span class="mv">y</span>(<span class="mt">t</span>) = <span class="mv">A</span> · <span class="mf">cos</span>(2<span class="mt">t</span> + <span class="mg">φ</span>)'],
                 params:[['A','y 方向振幅比'],['φ','相位差（≈ 0.5 rad）'],['頻率比','x:y = 1:2 → 8 字形']],
                 note:'頻率比為整數時形成封閉曲線' },
  },
  mod: {
    none:    { eqs:['<span class="mf">f</span>(<span class="mv">v</span>) = <span class="mv">v</span> &ensp;（恆等函數）'],
               params:[] },
    gravity: { eqs:['差分方程：<span class="mv">v</span><sub>y</sub>[n] = <span class="mv">v</span><sub>y</sub>[n−1] + <span class="mv">g</span>',
                    '位移累積：<span class="mv">y</span>(<span class="mt">t</span>) ≈ <span class="mv">y</span>₀ + ½<span class="mv">g</span><span class="mt">t</span>²'],
               params:[['g','重力加速度常數（每幀增量）'],['vᵧ[n]','第 n 幀的 y 速度分量']],
               note:'源自牛頓第二定律：F = mg，即 d²y/dt² = g' },
    accel:   { eqs:['<span class="mv">v</span>(<span class="mt">t</span>) = <span class="mv">v</span>₀ · (1 + <span class="mv">k</span> · <span class="mt">t</span>)'],
               params:[['v₀','初始速度'],['k','線性加速係數'],['t','時間'],['v₀·kt','速度增量（線性）']],
               note:'速度對時間呈線性成長，位移呈二次成長' },
    wobble:  { eqs:['<span class="mv">v</span><sub>x</sub> += <span class="mv">ε</span> · <span class="mf">sin</span>(<span class="mv">α</span><span class="mt">t</span>)',
                    '<span class="mv">v</span><sub>y</sub> += <span class="mv">ε</span> · <span class="mf">cos</span>(<span class="mv">β</span><span class="mt">t</span>)'],
               params:[['ε','擾動振幅'],['α, β','x/y 方向的擾動角頻率']],
               note:'在原路徑上疊加小幅正弦擾動' },
    mirror:  { eqs:['<span class="mv">v</span><sub>y</sub>(<span class="mt">t</span>) = <span class="mv">v</span><sub>y₀</sub> · (−1)<sup>⌊<span class="mt">t</span>/T⌋</sup>'],
               params:[['T','翻轉週期（= 30 幀）'],['⌊·⌋','向下取整 Floor 函數'],['(−1)^n','每 n 個週期翻轉一次符號']],
               note:'⌊t/T⌋ 為整數 → 每 T 幀 y 速度翻轉方向' },
    shrink:  { eqs:['<span class="mv">v</span>(<span class="mt">t</span>) = <span class="mv">v</span>₀ · e<sup>−<span class="mv">c</span><span class="mt">t</span></sup>'],
               params:[['v₀','初始速度'],['c','衰減係數（c > 0）'],['e^{−ct}','指數衰減因子，趨近於 0']],
               note:'半衰期 t₁/₂ = ln2 / c' },
    spin:    { eqs:['<span class="mv">v⃗</span>(<span class="mt">t</span>) = R(<span class="mg">ω</span><span class="mt">t</span>) · <span class="mv">v⃗</span>₀',
                    'R(<span class="mg">θ</span>) = [[<span class="mf">cos</span><span class="mg">θ</span>, −<span class="mf">sin</span><span class="mg">θ</span>], [<span class="mf">sin</span><span class="mg">θ</span>, <span class="mf">cos</span><span class="mg">θ</span>]]'],
               params:[['R(θ)','二維旋轉矩陣'],['ω','旋轉角速度（rad/幀）'],['v⃗₀','初始速度向量']],
               note:'速度向量每幀旋轉 ω 弧度，路徑形成曲線' },
  },
  effect: {
    standard: { eqs:['顏色：固定色相（由軌跡決定）'], params:[] },
    rainbow:  { eqs:['H(<span class="mt">t</span>) = (4<span class="mt">t</span>) <span class="mf">mod</span> 360',
                     '顏色：<span class="mf">hsl</span>(<span class="mv">H</span>, 80%, 45%)'],
                params:[['H(t)','色相 Hue，0° = 紅，120° = 綠，240° = 藍'],['mod 360','使色相循環回繞'],['4t','控制顏色變化速率']] },
    split:    { eqs:['在 <span class="mt">t</span> = 45 時分裂：',
                     '新方向角 = <span class="mg">θ</span> ± 0.45 rad  (≈ ±26°)'],
                params:[['t=45','分裂發生的幀數'],['±0.45 rad','分裂角度偏移（弧度）'],['兩子彈','繼承相同路徑與修飾']] },
    bounce:   { eqs:['碰右/左邊界：<span class="mv">v</span><sub>x</sub> → −<span class="mv">v</span><sub>x</sub>',
                     '碰上/下邊界：<span class="mv">v</span><sub>y</sub> → −<span class="mv">v</span><sub>y</sub>'],
                params:[['反射定律','入射角 = 反射角'],['邊界','畫布四邊']],
                note:'完全彈性碰撞：動能守恆，速度大小不變' },
    ghost:    { eqs:['<span class="mv">α</span>(<span class="mt">t</span>) = |<span class="mf">sin</span>(0.25 · <span class="mt">t</span>)|'],
                params:[['α(t)','透明度，範圍 [0, 1]'],['|sin|','絕對值使透明度非負'],['0.25','控制閃爍頻率']] },
    glow:     { eqs:['視覺效果：shadowBlur = 12px',
                     '發光半徑：<span class="mv">r</span> ∝ 強度'],
                params:[['shadowBlur','CSS 光暈模糊半徑'],['光暈','高斯模糊疊加，模擬光源散射']] },
  },
};

function updateMathPanel(){
  const [emId,pathId,modId,effId]=assembly;
  const em=emId?BLOCKS.emitter.find(b=>b.id===emId):null;
  const pb=pathId?BLOCKS.path.find(b=>b.id===pathId):null;
  const mb=modId?BLOCKS.mod.find(b=>b.id===modId):null;
  const eb=effId?BLOCKS.effect.find(b=>b.id===effId):null;
  const empty=document.getElementById('math-empty');
  const content=document.getElementById('math-content');

  if(!em&&!pb&&!mb&&!eb){ empty.style.display=''; content.style.display='none'; return; }
  empty.style.display='none'; content.style.display='';

  function card(icon, cat, name, color, bodyHtml){
    return `<div class="mcard" style="border-left-color:${color}">
      <div class="mcard-head" style="color:${color}">${icon} ${cat}</div>
      <div class="mcard-name">${name}</div>
      <div class="mcard-body">${bodyHtml}</div>
    </div>`;
  }
  function eqBlock(eqs){ return '<div class="eq-block">'+eqs.map(e=>`<span class="eq">${e}</span>`).join('')+'</div>'; }
  function paramList(params){ if(!params||!params.length) return '';
    return '<div class="param-list">'+params.map(p=>`<div class="p-row"><span class="p-sym">${p[0]}</span><span class="p-sep"> — </span><span class="p-def">${p[1]}</span></div>`).join('')+'</div>'; }

  let html='';

  if(em){
    const d=MATH_DATA.emitter[em.id]||{eqs:[],params:[]};
    html+=card('🎯','EMITTER',em.name,em.bg, eqBlock(d.eqs)+paramList(d.params));
  }
  if(pb){
    const d=MATH_DATA.path[pb.id]||{type:'',eqs:[],params:[]};
    html+=card('📐','PATH',pb.name,pb.bg,
      `<div class="mcard-type">${d.type}</div>`+
      eqBlock(d.eqs)+paramList(d.params)+
      (d.note?`<div class="mcard-note">📎 ${d.note}</div>`:''));
  }
  if(mb&&mb.id!=='none'){
    const d=MATH_DATA.mod[mb.id]||{eqs:[],params:[]};
    html+=card('🌊','MODIFIER',mb.name,mb.bg, eqBlock(d.eqs)+paramList(d.params)+
      (d.note?`<div class="mcard-note">📎 ${d.note}</div>`:''));
  }
  if(eb&&eb.id!=='standard'){
    const d=MATH_DATA.effect[eb.id]||{eqs:[],params:[]};
    html+=card('⚡','EFFECT',eb.name,eb.bg, eqBlock(d.eqs)+paramList(d.params));
  }
  if(em&&pb){
    html+=`<div class="mcard" style="border-left-color:#4488ff">
      <div class="mcard-head" style="color:#4488ff">📎 合成方程式</div>
      <div class="mcard-name">全域座標轉換</div>
      <div class="mcard-body">
        <div class="mcard-type">旋轉矩陣 R(θ) 將局部路徑轉至發射角 θ：</div>
        <div class="matrix-wrap"><div class="matrix-eq">
          <div class="mat-lhs"><div class="mat-bracket">[</div><div class="mat-col"><div>X(t)</div><div>Y(t)</div></div><div class="mat-bracket">]</div></div>
          <div class="mat-eq-sign">=</div>
          <div class="mat-lhs"><div class="mat-bracket">[</div><div class="mat-grid"><div>cos&thinsp;θ</div><div>−sin&thinsp;θ</div><div>sin&thinsp;θ</div><div>cos&thinsp;θ</div></div><div class="mat-bracket">]</div></div>
          <div class="mat-eq-sign">·</div>
          <div class="mat-lhs"><div class="mat-bracket">[</div><div class="mat-col"><div>x(t)</div><div>y(t)</div></div><div class="mat-bracket">]</div></div>
        </div></div>
        ${mb&&mb.id==='gravity'?'<div class="mcard-note">⊕ 重力修飾疊加：Y(t) += ½ · g · t²</div>':''}
        ${mb&&mb.id==='accel'  ?'<div class="mcard-note">⊕ 加速修飾疊加：v(t) = v₀ · (1 + kt)</div>':''}
        ${mb&&mb.id==='spin'   ?'<div class="mcard-note">⊕ 旋轉修飾：速度向量每幀旋轉 ω·t</div>':''}
      </div>
    </div>`;
  }
  content.innerHTML=html;
}

// ══════════════════════════════════════════════
// p5.js 程式碼生成
// ══════════════════════════════════════════════
function generateP5Code(){
  const [emId,pathId,modId,effId]=assembly;
  const em=emId?BLOCKS.emitter.find(b=>b.id===emId):null;
  const pb=pathId?BLOCKS.path.find(b=>b.id===pathId):null;
  const mb=modId?BLOCKS.mod.find(b=>b.id===modId):null;
  const eb=effId?BLOCKS.effect.find(b=>b.id===effId):null;
  if(!em&&!pb) return null;

  const spawnFrames=Math.round((em?.rate||400)/16.67);
  const spawnCode=em?.spawnCode||`  bullets.push(new Bullet(ox, oy, 0));`;
  const pathCode=pb?.p5code||`    let vx = SPEED;\n    let vy = 0;`;
  const modCode=mb&&mb.id!=='none'?mb.p5code:`    // 無修飾`;
  const extraCode=eb?.extraCode||'';
  const colorCode=eb?.colorCode||`      stroke(this.baseColor); strokeWeight(a * 1.8);`;
  const emName=em?.name||'?';
  const pbName=pb?.name||'直線';
  const mbName=mb?.name||'無';
  const ebName=eb?.name||'Standard';
  const spiralInit=emId==='spiral'?'\nlet spiralAngle = 0;':'';

  return `// ╔══════════════════════════════════════════╗
// ║  彈幕拼圖工坊 - 自動生成 p5.js 程式碼   ║
// ║  組合：${emName} → ${pbName} → ${mbName} → ${ebName}
// ╚══════════════════════════════════════════╝
// 使用方法：複製貼入 https://editor.p5js.org

let bullets = [];
let timer   = 0;${spiralInit}

const SPEED = 3.5;  // 基礎速度
const AMP   = 2.2;  // 振幅
const FREQ  = 1.0;  // 頻率
const SPAWN_EVERY = ${spawnFrames}; // 每幾幀發射一次

let ox, oy; // 座標原點（O 點像素位置）

function setup() {
  createCanvas(800, 600);
  ox = width  * 0.20; // 原點 x
  oy = height * 0.50; // 原點 y
}

function draw() {
  background(255);
  drawAxes();

  if (frameCount % SPAWN_EVERY === 0) {
    spawnBullets();
  }

  bullets = bullets.filter(b => b.alive);
  for (let b of bullets) {
    b.update();
    b.show();
  }
}

// ── 座標軸 ──────────────────────────────────
function drawAxes() {
  let unit = height / 11;
  stroke(180); strokeWeight(1.5); noFill();

  line(0,  oy, width, oy);     // X 軸
  line(ox, height, ox, 0);     // Y 軸

  // 箭頭
  fill(180); noStroke();
  triangle(width-10, oy-5, width, oy, width-10, oy+5);
  triangle(ox-5, 10, ox, 0, ox+5, 10);

  // 標籤
  textFont('Courier New'); textSize(12); fill(150); noStroke();
  text('x', width - 18, oy - 8);
  text('y', ox + 8,  14);
  text('O', ox + 4,  oy + 15);

  // 刻度
  stroke(210); strokeWeight(0.8); textSize(9); fill(180);
  for (let i = 1; ox + i*unit < width - 20; i++) {
    line(ox+i*unit, oy-3, ox+i*unit, oy+3);
    noStroke(); text(i,  ox+i*unit-3, oy+14);
    stroke(210); strokeWeight(0.8);
    if (ox - i*unit > 10) {
      line(ox-i*unit, oy-3, ox-i*unit, oy+3);
      noStroke(); text(-i, ox-i*unit-6, oy+14);
      stroke(210); strokeWeight(0.8);
    }
  }
  for (let i = 1; oy - i*unit > 10; i++) {
    line(ox-3, oy-i*unit, ox+3, oy-i*unit);
    noStroke(); text(i,  ox-18, oy-i*unit+4);
    stroke(210); strokeWeight(0.8);
    if (oy + i*unit < height - 10) {
      line(ox-3, oy+i*unit, ox+3, oy+i*unit);
      noStroke(); text(-i, ox-18, oy+i*unit+4);
      stroke(210); strokeWeight(0.8);
    }
  }
}

// ── 發射子彈 ────────────────────────────────
function spawnBullets() {
${spawnCode}
}

// ── 子彈類別 ────────────────────────────────
class Bullet {
  constructor(x, y, angleDeg) {
    this.x       = x;
    this.y       = y;
    this.angle   = radians(angleDeg); // 初始方向角（弧度）
    this.t       = 0;
    this.trail   = [];
    this.alive   = true;
    this.gv      = 0;     // 重力累積速度
    this.vxSign  = 1;     // 反彈符號
    this.vySign  = 1;
    this.didSplit= false;
    this.baseColor = color(${em?Math.round(parseInt(em.bg.slice(1,3),16)*0.8):80},${em?Math.round(parseInt(em.bg.slice(3,5),16)*0.8):120},${em?Math.round(parseInt(em.bg.slice(5,7),16)*0.8):200});
  }

  update() {
    this.t++;

    // ── 📐 軌跡公式 ──
${pathCode}

    // 旋轉到初始方向角 θ
    let cos_a = cos(this.angle);
    let sin_a = sin(this.angle);
    let rx = vx * cos_a - vy * sin_a;
    let ry = vx * sin_a + vy * cos_a;

    // ── 🌊 修飾 ──
${modCode}

    // 套用反彈符號
    rx *= this.vxSign;
    ry *= this.vySign;

    this.x += rx;
    this.y += ry;

    // ── ⚡ 特效 ──
${extraCode||'    // 無額外特效'}

    // 紀錄軌跡
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 60) this.trail.shift();

    // 出界判定
    if (this.x > width+120 || this.x < -120 ||
        this.y > height+120 || this.y < -120) {
      this.alive = false;
    }
  }

  show() {
    // 繪製軌跡
    noFill();
    for (let i = 1; i < this.trail.length; i++) {
      let a = i / this.trail.length;
      drawingContext.globalAlpha = a * 0.6;
${colorCode}
      line(this.trail[i-1].x, this.trail[i-1].y,
           this.trail[i].x,   this.trail[i].y);
    }
    drawingContext.globalAlpha = 1;
    drawingContext.shadowBlur  = 0;

    // 繪製子彈頭
    if (this.alive) {
      noStroke();
      fill(255, 255, 255, 220);
      circle(this.x, this.y, 7);
      fill(this.baseColor);
      circle(this.x, this.y, 5);
    }
  }
}`;
}

function updateCodePanel(){
  const out=document.getElementById('code-output');
  const code=generateP5Code();
  if(!code){
    out.innerHTML='<div class="no-code">先在下方拼裝方塊<br>這裡會生成可直接執行的<br>p5.js 動畫程式碼 💻</div>';
    return;
  }
  // 簡易語法高亮
  const esc=code.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const highlighted=esc
    .replace(/(\/\/[^\n]*)/g,'<span style="color:#6b7280">$1</span>')
    .replace(/\b(function|class|let|const|for|if|new|this|return|of|true|false)\b/g,'<span style="color:#7c3aed">$1</span>')
    .replace(/\b(setup|draw|createCanvas|background|stroke|fill|line|circle|text|triangle|noFill|noStroke|radians|degrees|cos|sin|exp|abs|floor|max|min|random|strokeWeight|drawingContext)\b/g,'<span style="color:#0369a1">$1</span>')
    .replace(/(".*?"|'.*?'|`[^`]*`)/g,'<span style="color:#166534">$1</span>')
    .replace(/\b(\d+\.?\d*)\b/g,'<span style="color:#9a3412">$1</span>');
  out.innerHTML=highlighted;
}

// 複製按鈕
document.getElementById('btn-copy').addEventListener('click',()=>{
  const code=generateP5Code();
  if(!code){alert('請先拼裝方塊！');return;}
  navigator.clipboard.writeText(code).then(()=>{
    const btn=document.getElementById('btn-copy');
    btn.textContent='✅ 已複製！';
    setTimeout(()=>btn.textContent='📋 複製程式碼',2000);
  });
});
document.getElementById('btn-p5-open').addEventListener('click',()=>{
  window.open('https://editor.p5js.org','_blank');
});

// 面板切換
document.querySelectorAll('.side-tab').forEach(tab=>{
  tab.addEventListener('click',()=>{
    document.querySelectorAll('.side-tab').forEach(t=>t.classList.remove('active'));
    document.querySelectorAll('.side-panel').forEach(p=>p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.tab==='math'?'math-panel':'code-panel-wrap').classList.add('active');
  });
});

// ══════════════════════════════════════════════
// Palette + Drag
// ══════════════════════════════════════════════
let dragState=null;
const ghost=document.getElementById('ghost');

function renderPalette(cat){
  document.querySelectorAll('.cat-tab').forEach(t=>{
    t.classList.toggle('active',t.dataset.cat===cat);
    const col={emitter:'#c0392b',path:'#1a5276',mod:'#117a65',effect:'#7d6608'}[t.dataset.cat];
    t.style.borderBottomColor=t.dataset.cat===cat?col:'transparent';
    t.style.color=t.dataset.cat===cat?col:'';
  });
  const container=document.getElementById('block-palette'); container.innerHTML='';
  const catIdx=catMap.indexOf(cat);
  for(const blk of BLOCKS[cat]){
    const el=document.createElement('div');
    el.className='pal-block'; el.dataset.id=blk.id; el.dataset.cat=cat;
    el.draggable=true; el.style.background=blk.bg;
    el.innerHTML=`<div class="pb-icon">${blk.icon}</div><div class="pb-name">${blk.name}</div><div class="pb-desc">${blk.desc}</div>`;
    if(assembly[catIdx]===blk.id) el.classList.add('in-use');
    el.addEventListener('click',()=>{assembly[catIdx]=blk.id;if(firing)stopFire();applyAssembly();});
    el.addEventListener('dragstart',e=>{
      dragState={id:blk.id,cat,catIdx,bg:blk.bg,name:blk.name,icon:blk.icon};
      el.classList.add('dragging');
      ghost.textContent=blk.icon+' '+blk.name; ghost.style.background=blk.bg; ghost.style.display='block';
      e.dataTransfer.effectAllowed='copy';
      e.dataTransfer.setDragImage(document.createElement('div'),0,0);
    });
    el.addEventListener('dragend',()=>{el.classList.remove('dragging');ghost.style.display='none';dragState=null;});
    container.appendChild(el);
  }
}

document.querySelectorAll('.cat-tab').forEach(t=>t.addEventListener('click',()=>renderPalette(t.dataset.cat)));
document.addEventListener('dragover',e=>{e.preventDefault();ghost.style.left=(e.clientX+14)+'px';ghost.style.top=(e.clientY+14)+'px';});
document.querySelectorAll('.block-slot').forEach(sl=>{
  const idx=parseInt(sl.dataset.slot);
  sl.addEventListener('dragover',e=>{e.preventDefault();if(dragState&&dragState.catIdx===idx)sl.classList.add('dragover');});
  sl.addEventListener('dragleave',()=>sl.classList.remove('dragover'));
  sl.addEventListener('drop',e=>{e.preventDefault();sl.classList.remove('dragover');if(dragState&&dragState.catIdx===idx){assembly[idx]=dragState.id;if(firing)stopFire();applyAssembly();}});
});

// Presets
document.querySelectorAll('.preset-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    const c=PRESETS[btn.dataset.preset];if(!c)return;
    stopFire(); assembly=[c[0],c[1],c[2],c[3]];
    applyAssembly(); renderPalette('emitter');
    setTimeout(startFire,80);
  });
});

// ── Loading → 主功能切換 ──
function enterApp(){
  const loading = document.getElementById('loading');
  const app     = document.getElementById('app');
  loading.classList.add('hide');
  app.classList.add('show');
  setTimeout(()=>{ loading.style.display='none'; }, 900);
  // 初始化主功能
  resize();
  window.addEventListener('resize', resize);
  renderPalette('emitter');
  applyAssembly();
  requestAnimationFrame(loop);
}

document.getElementById('loading-enter').addEventListener('click', enterApp);
