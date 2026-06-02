
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = 'c:\\Users\\user\\Desktop\\alheb-school-bloom\\docs';
const files = fs.readdirSync(docsDir).filter(f => f.startsWith('doc') && f.endsWith('.docx'));

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  console.log(`--- Processing: ${file} ---`);
  try {
    const tempDir = path.join('c:\\Users\\user\\Desktop\\alheb-school-bloom\\scratch', 'temp_docx_' + file);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const zipPath = filePath + '.zip';
    fs.copyFileSync(filePath, zipPath);
    
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`);
    
    const xmlPath = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(xmlPath)) {
      const xml = fs.readFileSync(xmlPath, 'utf8');
      const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(text);
    }
    
    fs.unlinkSync(zipPath);
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
});
