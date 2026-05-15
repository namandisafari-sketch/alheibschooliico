
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const docsDir = 'c:\\Users\\user\\Desktop\\alheb-school-bloom\\docs';
const files = fs.readdirSync(docsDir).filter(f => f.endsWith('.docx'));

files.forEach(file => {
  const filePath = path.join(docsDir, file);
  console.log(`--- Processing: ${file} ---`);
  try {
    // We can use a simple trick to read the xml content without external libs if we use unzip
    // But on windows we might not have unzip. We'll try to use powershell to extract.
    const tempDir = path.join('c:\\Users\\user\\Desktop\\alheb-school-bloom\\scratch', 'temp_docx');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);
    
    const zipPath = filePath + '.zip';
    fs.copyFileSync(filePath, zipPath);
    
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${tempDir}' -Force"`);
    
    const xmlPath = path.join(tempDir, 'word', 'document.xml');
    if (fs.existsSync(xmlPath)) {
      const xml = fs.readFileSync(xmlPath, 'utf8');
      // Very simple regex to strip xml tags and get text
      const text = xml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      console.log(text);
    }
    
    fs.unlinkSync(zipPath);
    // Cleanup temp dir
    // execSync(`powershell -Command "Remove-Item -Path '${tempDir}' -Recurse -Force"`);
  } catch (err) {
    console.error(`Error processing ${file}: ${err.message}`);
  }
});
