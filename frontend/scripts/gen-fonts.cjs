// scripts/gen-fonts.cjs
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_FONTS = path.join(ROOT, 'public', 'fonts');
const OUT_DIR = path.join(ROOT, 'src', 'ui', 'generated');
const OUT_FONTS_CSS = path.join(OUT_DIR, 'fonts.css');
const OUT_VARS_CSS  = path.join(OUT_DIR, 'font-vars.css');

const BUCKETS = ['font-brand', 'font-ui', 'font-serif', 'font-mono'];

const WEIGHT_MAP = {
  thin: 100,
  extralight: 200,
  ultralight: 200,
  light: 300,
  regular: 400,
  normal: 400,
  medium: 500,
  semibold: 600,
  demibold: 600,
  bold: 700,
  extrabold: 800,
  ultrabold: 800,
  black: 900,
};

function parseFileName(file) {
  // Family-WeightItalic?.woff2  |  Family-400Italic?.woff2
  const base = path.basename(file, path.extname(file));
  // разбиваем по последнему дефису
  const lastDash = base.lastIndexOf('-');
  if (lastDash === -1) return null;

  const family = base.slice(0, lastDash);
  const weightRaw = base.slice(lastDash + 1); // например "SemiBoldItalic" или "400" или "Bold"

  const italic = /italic$/i.test(weightRaw);
  const weightToken = italic ? weightRaw.replace(/italic$/i, '') : weightRaw;

  let weight = WEIGHT_MAP[weightToken.toLowerCase()];
  if (!weight) {
    const num = parseInt(weightToken, 10);
    if (!Number.isNaN(num)) weight = num;
  }
  if (!weight) weight = 400;

  return { family, weight, style: italic ? 'italic' : 'normal' };
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function gen() {
  ensureDir(OUT_DIR);

  let fontFaceCss = `/* GENERATED: do not edit by hand */\n`;
  let varsCss = `/* GENERATED: do not edit by hand */\n:root {\n`;

  const familyByBucket = {};

  for (const bucket of BUCKETS) {
    const dir = path.join(PUBLIC_FONTS, bucket);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir).filter(f => /\.woff2$/i.test(f));
    let bucketFamily = null;

    for (const f of files) {
      const parsed = parseFileName(f);
      if (!parsed) continue;

      const { family, weight, style } = parsed;
      if (!bucketFamily) bucketFamily = family;

      const publicUrl = `/fonts/${bucket}/${f}`;
      fontFaceCss += `
@font-face{
  font-family:"${family}";
  src:url("${publicUrl}") format("woff2");
  font-display:swap;
  font-weight:${weight};
  font-style:${style};
}
`;
    }

    // переменная для этого «роля» шрифта
    if (bucketFamily) {
      familyByBucket[bucket] = bucketFamily;
      const varName =
        bucket === 'font-brand' ? '--font-brand' :
        bucket === 'font-ui'    ? '--font-ui' :
        bucket === 'font-serif' ? '--font-serif' :
        '--font-mono';
      varsCss += `  ${varName}: "${bucketFamily}";\n`;
    }
  }

  // дефолты, если каких-то папок нет
  if (!familyByBucket['font-brand']) varsCss += `  --font-brand: "system-ui";\n`;
  if (!familyByBucket['font-ui'])    varsCss += `  --font-ui: "system-ui";\n`;
  if (!familyByBucket['font-serif']) varsCss += `  --font-serif: "Georgia", "Times New Roman", serif;\n`;
  if (!familyByBucket['font-mono'])  varsCss += `  --font-mono: ui-monospace, "SFMono-Regular", Menlo, monospace;\n`;

  varsCss += `}\n`;

  fs.writeFileSync(OUT_FONTS_CSS, fontFaceCss, 'utf8');
  fs.writeFileSync(OUT_VARS_CSS, varsCss, 'utf8');

  console.log('✅ fonts.css и font-vars.css сгенерированы.');
}

gen();
