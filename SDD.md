# 彈幕拼圖工坊 — Software Design Document

**檔案**：`danmaku.html`（單檔，~1314 行）
**版本**：1.0
**技術棧**：HTML5 Canvas · Vanilla JS · CSS Flexbox

---

## 1. 系統概覽

### 目的
互動式數學教育工具。使用者透過拼湊四個「方塊」（Emitter→Path→Modifier→Effect）組合出彈幕彈道，右側即時顯示對應的數學方程式與可執行的 p5.js 程式碼。

### 核心設計決策

| 決策 | 理由 |
|------|------|
| 單一 HTML 檔案 | 零依賴、直接開啟、易分享 |
| Canvas 2D（非 p5.js） | 完全掌控渲染管線，不引入外部框架 |
| 資料驅動方塊（BLOCKS） | 新增/移除方塊只需在物件中加一筆資料，不改邏輯 |
| 組合槽模型（4-slot） | 強迫使用者思考函數組合順序（乘法結合律） |
| 局部→全域旋轉 | 數學正確：路徑函數在局部座標定義，再用旋轉矩陣轉至發射角 |

---

## 2. 整體架構

```
┌─────────────────────────────────────────────────────────────────────┐
│  danmaku.html                                                       │
│                                                                     │
│  ┌──────────────────┐  ┌────────────────────────────────────────┐  │
│  │  畫布區           │  │  右側面板                              │  │
│  │  Canvas 2D       │  │  ┌──────────────┬───────────────────┐  │  │
│  │                  │  │  │  📐 數學式   │  💻 p5.js 程式碼  │  │  │
│  │  drawAxes()      │  │  │  updateMath  │  generateP5Code   │  │  │
│  │  drawPreview()   │  │  │  Panel()     │  updateCodePanel   │  │  │
│  │  drawLauncher()  │  │  └──────────────┴───────────────────┘  │  │
│  │  bullet.draw()   │  └────────────────────────────────────────┘  │
│  └──────────────────┘                                               │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  底部控制區                                                    │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │   │
│  │  │ EMITTER  │→ │  PATH    │→ │ MODIFIER │→ │ EFFECT   │   │   │
│  │  │ 組合槽   │  │ 組合槽   │  │ 組合槽   │  │ 組合槽   │   │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │   │
│  │  [PRESET 按鈕列]                             [▶ FIRE]       │   │
│  │  [方塊調色盤  ←  拖曳或點擊選取  →  放入槽位]               │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. 核心資料結構

### 3.1 BLOCKS — 方塊定義庫

所有可組合的方塊集中定義在一個 `const BLOCKS` 物件，分四個類別。

```
BLOCKS
├── emitter  [8 種]   →  如何產生子彈（位置、角度、頻率）
├── path     [9 種]   →  子彈的基礎軌跡函數
├── mod      [7 種]   →  對速度向量的修飾函數
└── effect   [6 種]   →  視覺特效與行為副作用
```

#### Emitter 欄位

```javascript
{
  id:          string,                    // 唯一鍵，對應 assembly[0]
  name:        string,                    // 顯示名稱
  icon:        string,                    // emoji 圖示
  bg:          string,                    // 背景色（hex）
  rate:        number,                    // 發射間隔（毫秒）
  desc:        string,                    // 簡短描述
  math:        { spawn, angles, n },      // 舊版相容欄（可移除，數學已移至 MATH_DATA）
  spawnCode:   string,                    // p5.js 程式碼片段
  spawns():    [{ x, y, a }, ...]         // 每次發射產生的子彈清單
}
```

> ⚠️ **注意**：`spiral` emitter 在 `spawns()` 中有 `this._a` 內部狀態，
> 呼叫 `spawns()` 時會改變此值（副作用）。

#### Path 欄位

```javascript
{
  id, name, icon, bg, desc,
  math:      { eq: [string], type: string },  // 舊版相容
  p5code:    string,                          // p5.js 程式碼片段（含中文注釋）
  fn(t):     { vx: number, vy: number }       // 局部座標速度函數
}
```

`fn(t)` 只在**局部座標**（以原點為起點、水平向右為 x 軸）計算速度向量，
旋轉到全域方向由 `Bullet.update()` 負責。

#### Modifier 欄位

```javascript
{
  id, name, icon, bg, desc,
  math:      { eq: string, effect: string },
  p5code:    string,
  fn(vx, vy, bullet): { vx: number, vy: number }
}
```

`fn` 可讀寫 `bullet` 物件的狀態（例如 `gravity` 修改 `bullet._gv`）。

#### Effect 欄位

```javascript
{
  id, name, icon, bg, desc,
  math:       { color: string, special: string },
  colorCode:  string,                         // p5.js 顏色程式碼
  extraCode:  string,                         // p5.js 特效程式碼
  color_fn(bullet): string,                   // 回傳 CSS 顏色字串
  extra(bullet, newBulletsArray): void        // 副作用（分裂、反彈）
}
```

### 3.2 assembly — 組合狀態

```javascript
let assembly = [null, null, null, null];
//              [0]   [1]   [2]   [3]
//           emitter path  mod  effect
```

每個槽儲存對應方塊的 `id` 字串或 `null`。
所有顯示邏輯（槽位渲染、數學式、程式碼）都以此陣列為唯一來源。

### 3.3 MATH_DATA — 純數學方程式資料庫

```javascript
MATH_DATA
├── emitter[id]  →  { eqs: [html_string], params: [[symbol, def], ...] }
├── path[id]     →  { type, eqs, params, note? }
├── mod[id]      →  { eqs, params, note? }
└── effect[id]   →  { eqs, params }
```

`eqs` 使用 HTML span 標記顏色（見 §5.1），不含任何程式語法。
此物件與 `BLOCKS` 完全分離，可獨立維護。

### 3.4 全域參數

```javascript
let SPD  = 3.5;  // 基礎速度（每幀像素）
let AMP  = 2.2;  // 振幅係數
let FREQ = 1.0;  // 頻率係數
```

所有 `BLOCKS.path.fn(t)` 和 `BLOCKS.mod.fn()` 直接讀這三個全域值。

---

## 4. 核心類別：Bullet

### 4.1 建構子

```javascript
new Bullet({ x, y, angle, pathId, modId, effectId, baseColor, _split })
```

| 欄位 | 說明 |
|------|------|
| `baseAngle` | `angle`（度）→ 弧度 |
| `trail` | `{x,y}[]`，上限 60 點 |
| `_gv` | 重力累積速度（供 gravity modifier 使用） |
| `_vxSign / _vySign` | 反彈符號（供 bounce effect 使用） |
| `_split` | 防止分裂後無限再分裂 |

### 4.2 update(newBullets) — 物理更新流程

```
1. age++

2. pathFn(age)  →  局部速度 {vx, vy}

3. 旋轉矩陣（baseAngle = θ）：
   rx = vx·cos(θ) − vy·sin(θ)
   ry = vx·sin(θ) + vy·cos(θ)

4. modFn(rx, ry, this)  →  修飾後的速度

5. rx *= _vxSign
   ry *= _vySign

6. x += rx,  y += ry

7. effectFn.extra(this, newBullets)  →  分裂/反彈副作用

8. trail.push({x, y})   （超過 60 點則移除最舊）

9. 出界檢查（±120px 外）→ alive = false
```

### 4.3 draw() — 渲染流程

```
for each trail segment [i-1 → i]:
  alpha = (i / trail.length) × 0.6
  若 ghost effect：alpha ×= |sin(0.25·age + i·0.1)|
  lineWidth = alpha × (glow ? 2.5 : 1.8)
  繪製線段

if alive:
  繪製外光暈（radial gradient）
  繪製白色核心圓
  繪製顏色核心圓
```

---

## 5. 渲染管線

```
requestAnimationFrame → loop(ts)
  │
  ├─ drawAxes()          白底 + 格線 + x/y 軸 + 刻度
  ├─ drawPreview()       虛線預覽（最多 5 條）
  ├─ drawLauncher()      原點光暈 + 發射器名稱
  │
  ├─ for (bullet of bullets):
  │    bullet.update(newBullets)
  │    bullet.draw()
  │
  ├─ bullets.push(...newBullets)   加入分裂產生的子彈
  └─ bullets = bullets.filter(b => b.alive)
```

### 5.1 數學式 HTML 語義標記

| 類別 | CSS class | 顏色 | 範例 |
|------|-----------|------|------|
| 變數 | `.mv` | 藍 `#1d4ed8` | A, ω, v, r |
| 函數名 | `.mf` | 綠 `#065f46` | sin, cos, sgn, U |
| 常數 | `.mk` | 棕 `#92400e` | 2, π, 0.45 |
| 希臘字母 | `.mg` | 紫 `#6d28d9` | θ, ω, ε, φ |
| 時間變數 | `.mt` | 深灰斜體 | t |

---

## 6. p5.js 程式碼生成

`generateP5Code()` 從 assembly 取出四個方塊，組裝一份完整的 p5.js sketch。

### 組裝邏輯

```
spawnFrames   = Math.round(emitter.rate / 16.67)   // ms → 幀數
spawnCode     = emitter.spawnCode
pathCode      = path.p5code
modCode       = mod.p5code
extraCode     = effect.extraCode
colorCode     = effect.colorCode
```

### 生成的 sketch 結構

```javascript
// 常數宣告（SPEED, AMP, FREQ, SPAWN_EVERY）
// let bullets = [], timer = 0
// let spiralAngle = 0  （僅 spiral emitter）

setup()      // createCanvas(800, 600), 設定 ox, oy
draw()       // background → drawAxes → spawn → update → show
drawAxes()   // 座標軸（與主程式邏輯一致）
spawnBullets()  // ← emitter.spawnCode
class Bullet {
  constructor(x, y, angleDeg)
  update()    // ← path.p5code + mod.p5code + effect.extraCode
  show()      // ← effect.colorCode
}
```

---

## 7. 事件流

```
使用者操作                  JS 處理                   副作用
─────────────────────────────────────────────────────────────────
拖曳方塊到槽位   →  assembly[i] = id         applyAssembly()
                                              ├ 渲染槽位 DOM
                                              ├ updateMathPanel()
                                              └ updateCodePanel()

點擊方塊        →  assembly[i] = id         （同上）

點擊 ✕ 移除    →  assembly[i] = null        （同上）

點擊 FIRE      →  startFire()              firing = true
                   setInterval(spawn, rate)  持續產生子彈

點擊 STOP      →  stopFire()               clearInterval
                                             firing = false

點擊 PRESET    →  assembly = [...]          applyAssembly()
                   setTimeout(startFire, 80)

Space 鍵       →  toggle startFire/stopFire

R 鍵           →  stopFire + 清空 bullets

Tab 切換       →  side-panel.active 切換

複製程式碼      →  generateP5Code()
                   navigator.clipboard.writeText()
```

---

## 8. 擴充指南

### 8.1 新增一個 Path 方塊

在 `BLOCKS.path` 陣列中加入新物件：

```javascript
{
  id: 'my_path',
  name: '我的函數',
  icon: '✦',
  bg: '#2563eb',           // 方塊背景色
  desc: '一句話描述',
  math: { eq: ['x(t) = ...', 'y(t) = ...'], type: '函數類型' },
  p5code: `    // 我的函數\n    let vx = SPEED;\n    let vy = ...;`,
  fn(t) { return { vx: SPD, vy: /* 計算 */ }; }
}
```

同步在 `MATH_DATA.path` 加入數學顯示資料：

```javascript
my_path: {
  type: '函數類型描述',
  eqs: ['<span class="mv">x</span>(<span class="mt">t</span>) = ...'],
  params: [['v', '速度'], ['A', '振幅']],
  note: '選填：補充說明'
}
```

無需修改其他任何程式碼。

### 8.2 新增一個 Emitter 方塊

```javascript
{
  id: 'cross',
  name: 'Cross ×4',
  icon: '✚',
  bg: '#dc2626',
  rate: 700,
  desc: '十字四向',
  spawnCode: `  for (let a of [0, 90, 180, 270]) {\n    bullets.push(new Bullet(ox, oy, a));\n  }`,
  spawns() { return [0, 90, 180, 270].map(a => ({ x: OX, y: OY, a })); }
}
```

### 8.3 新增一個 Effect 方塊

`extra()` 用來實作運行時副作用（需要修改 bullet 或產生新子彈）：

```javascript
{
  id: 'trail_dots',
  name: 'Dot Trail',
  icon: '·',
  bg: '#7c3aed',
  desc: '留下殘點',
  colorCode: `      stroke(this.baseColor); strokeWeight(a * 2);`,
  extraCode: `    // 每 10 幀留下一個殘影點`,
  color_fn(b) { return b.baseColor; },
  extra(b, arr) {
    if (b.age % 10 === 0) {
      // 產生靜止殘影（可用一個特殊輕量物件代替完整 Bullet）
    }
  }
}
```

### 8.4 新增 Preset

```javascript
PRESETS.mypreset = ['fan5', 'damped', 'wobble', 'rainbow'];
```

HTML 加按鈕：

```html
<button class="preset-btn" data-preset="mypreset">🎆 我的組合</button>
```

### 8.5 增加可調參數（SPD / AMP / FREQ）

目前 `SPD`、`AMP`、`FREQ` 為固定全域常數。
若要加滑桿，只需在 HTML 加入 `<input type="range">`，並在 `input` 事件中更新：

```javascript
document.getElementById('slider-spd').addEventListener('input', e => {
  SPD = parseFloat(e.target.value);
});
```

---

## 9. 已知限制與技術債

| 項目 | 說明 | 建議改法 |
|------|------|----------|
| **SPD/AMP/FREQ 為全域值** | 所有子彈共用同一組參數，無法每顆子彈不同 | 在 Bullet 建構子加入 `spd, amp, freq` 欄位 |
| **BLOCKS 重複欄位** | `math` 欄位是舊版遺留，與 `MATH_DATA` 重複 | 移除 BLOCKS 中的 `math` 欄位 |
| **spiral emitter 有副作用** | `spawns()` 修改 `this._a`，多次呼叫結果不同 | 改為傳入 frame 參數，由外部管理角度狀態 |
| **路徑預覽重新模擬** | `drawPreview()` 每幀重跑完整物理模擬 | 快取預覽路徑，assembly 改變才重算 |
| **p5code / extraCode 為字串** | 程式碼生成靠字串拼接，難以型別檢查 | 改為模板函數，或用 AST 生成 |
| **單一 HTML 檔案** | 超過 1300 行，難以分模組測試 | 拆分為 `blocks.js`、`bullet.js`、`renderer.js`、`ui.js` |
| **無法儲存自訂組合** | 關閉分頁後狀態消失 | 用 `localStorage` 序列化 `assembly` 和 `PRESETS` |

---

## 10. 檔案結構速查

```
danmaku.html
│
├── <style>  (L1–237)
│     ├── 佈局：#top / #bottom / #side / canvas-wrap
│     ├── 組合槽：.block-slot / clip-path 箭頭形狀
│     ├── 調色盤：.pal-block
│     └── 數學卡片：.mcard / .eq-block / .mv .mf .mk .mg .mt / .matrix-wrap
│
├── <body>  (L238–313)
│     ├── #top → #canvas-wrap + #side（數學/程式碼 tab）
│     └── #bottom → assembly-row + preset-row + palette-area
│
└── <script>  (L314–1314)
      ├── BLOCKS          (L315–578)   方塊定義庫
      ├── PRESETS         (L579–585)   預設組合
      ├── 全域狀態         (L577–591)
      ├── resize()        (L592–598)
      ├── class Bullet    (L603–662)
      ├── drawAxes()      (L667–713)
      ├── drawPreview()   (L715–740)
      ├── drawLauncher()  (L742–756)
      ├── loop()          (L758–770)   主動畫循環
      ├── spawn/fire      (L775–803)   發射控制
      ├── applyAssembly() (L808–842)   槽位渲染
      ├── MATH_DATA       (L848–959)   純數學資料
      ├── updateMathPanel (L961–1026)  數學面板渲染
      ├── generateP5Code  (L1031–1211) 程式碼生成
      ├── updateCodePanel (L1213–1229) 程式碼面板渲染
      └── UI 事件綁定      (L1232–1314) drag-drop / presets / tabs
```

---

## 11. 快速參考：新增方塊 Checklist

```
□ 在 BLOCKS.<category> 陣列加入新物件（含 id / fn / p5code）
□ 在 MATH_DATA.<category> 加入對應的 eqs / params
□ 若是 emitter：確認 spawns() 回傳 {x, y, a} 格式
□ 若是 path：fn(t) 只回傳局部座標速度 {vx, vy}
□ 若是 mod：fn(vx, vy, bullet) 回傳修改後的 {vx, vy}
□ 若是 effect：extra() 負責副作用，color_fn() 負責顏色
□ 確認 bg 顏色在白色背景下有足夠對比
□ 無需修改其他任何函數
```
