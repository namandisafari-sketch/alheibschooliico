
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = 'c:\\Users\\user\\Desktop\\alheb-school-bloom\\docs';
const files = fs.readdirSync(docsDir).filter(f => f.startsWith('doc_') && f.endsWith('.docx'));

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  console.log(`--- Processing: ${file} ---`);
  try {
    const tempDir = path.join('c:\\Users\\user\\Desktop\\alheb-school-bloom\\scratch', 'temp_docx_' + file);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
    
    const zipPath = filePath + '.zip';
    fs.copyFileSync(filePath, zipPath);
    
    // Use Expand-Archive in powershell
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`);
    
    const xmlPath = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(xmlPath)) {
      const xml = fs.readFileSync(xmlPath, 'utf8');
      // Extract text from w:t tags which are the actual text in docx
      const text = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
      if (text) {
        console.log(text.map(t => t.replace(/<[^>]+>/g, '')).join(' '));
      } else {
        console.log("(No text found in w:t tags)");
      }
    }
    
    fs.unlinkSync(zipPath);
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
});
