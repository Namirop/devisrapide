// Composite la capture du dashboard (tmp/mockup-shot.png) dans l'ecran du
// laptop (public/mockup-pc.png) → public/final-pc-mockup.webp.
//
// L'ecran du laptop est un TROU TRANSPARENT (alpha 0) borde par le cadre noir
// opaque. On detecte ce trou par flood-fill depuis les bords : tout le
// transparent connecte aux bords = exterieur du laptop ; le transparent
// restant = l'ecran. On place la capture DERRIERE le cadre (le cadre par
// dessus masque proprement les bords + coins arrondis).
//
// Usage : node scripts/composite-mockup.mjs
import sharp from "sharp";

const FRAME = "public/mockup-pc.png";
const SHOT = "tmp/mockup-shot.png";
const OUT = "public/dashboard-mockup.webp";

const { data, info } = await sharp(FRAME)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const { width: W, height: H, channels: C } = info;

const isTransparent = (idx) => data[idx * C + 3] < 50;

// Flood-fill depuis les bords sur les pixels transparents = exterieur.
const outside = new Uint8Array(W * H);
const stack = new Int32Array(W * H);
let sp = 0;
const seed = (x, y) => {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const idx = y * W + x;
  if (outside[idx] || !isTransparent(idx)) return;
  outside[idx] = 1;
  stack[sp++] = idx;
};
for (let x = 0; x < W; x++) {
  seed(x, 0);
  seed(x, H - 1);
}
for (let y = 0; y < H; y++) {
  seed(0, y);
  seed(W - 1, y);
}
while (sp > 0) {
  const idx = stack[--sp];
  const x = idx % W;
  const y = (idx - x) / W;
  seed(x + 1, y);
  seed(x - 1, y);
  seed(x, y + 1);
  seed(x, y - 1);
}

// Le transparent non marque "outside" = l'ecran. Bounding box.
let minX = W;
let minY = H;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const idx = y * W + x;
    if (!outside[idx] && isTransparent(idx)) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const left = minX;
const top = minY;
const rw = maxX - minX + 1;
const rh = maxY - minY + 1;
console.log("frame", { W, H });
console.log("screen rect", { left, top, width: rw, height: rh });

const shot = await sharp(SHOT).resize(rw, rh, { fit: "fill" }).toBuffer();
const frame = await sharp(FRAME).ensureAlpha().toBuffer();

await sharp({
  create: {
    width: W,
    height: H,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: shot, left, top }, // capture DERRIERE
    { input: frame, left: 0, top: 0 }, // cadre PAR DESSUS
  ])
  .webp({ quality: 92 })
  .toFile(OUT);
console.log(`wrote → ${OUT}`);
