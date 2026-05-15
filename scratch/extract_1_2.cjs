
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

const files = ['doc_1.docx', 'doc_2.docx'];
files.forEach(file => {
    console.log(`--- ${file} ---`);
    try {
        const zipPath = path.join('scratch', file + '.zip');
        const extractPath = path.join('scratch', file + '_extracted');
        fs.copyFileSync(path.join('docs', file), zipPath);
        execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${extractPath}' -Force"`);
        const xml = fs.readFileSync(path.join(extractPath, 'word', 'document.xml'), 'utf8');
        const text = xml.match(/<w:t[^>]*>([^<]+)<\/w:t>/g);
        if (text) {
            console.log(text.map(t => t.replace(/<[^>]+>/g, '')).join(' '));
        }
    } catch (e) {
        console.error(e.message);
    }
});
