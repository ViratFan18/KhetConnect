const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docx = 'C:/Users/dev.DESKTOP-RV88KA4/Downloads/KhetConnect_Master_Blueprint-1.docx';
const temp = path.join(process.env.TEMP, 'khetconnect_docx');
if (fs.existsSync(temp)) fs.rmSync(temp, { recursive: true, force: true });
fs.mkdirSync(temp, { recursive: true });
fs.copyFileSync(docx, path.join(temp, 'doc.zip'));
execSync(`powershell -NoProfile -Command "Expand-Archive -Path '${path.join(temp, 'doc.zip')}' -DestinationPath '${temp}' -Force"`);
const xml = fs.readFileSync(path.join(temp, 'word/document.xml'), 'utf8');
const paras = xml.split(/<w:p[ >]/).slice(1).map((p) => {
  const ts = [...p.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1]);
  return ts.join('');
}).filter(Boolean);
fs.writeFileSync(path.join(__dirname, 'blueprint.txt'), paras.join('\n'), 'utf8');
// Debug log removed: file now writes `blueprint.txt` without console output
