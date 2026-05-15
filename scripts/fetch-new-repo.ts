import https from 'https';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const token = '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';
const repo = 'namandisafari-sketch/Alheib-School-Source-code';
const url = `https://api.github.com/repos/${repo}/zipball/main`;

const options = {
  headers: {
    'User-Agent': 'NodeJS-App',
    'Authorization': `token ${token}`
  }
};

console.log(`Downloading ${url}...`);

function download(targetUrl: string) {
  https.get(targetUrl, options, (res) => {
    if (res.statusCode === 302 || res.statusCode === 301) {
      download(res.headers.location!);
    } else {
      handleResponse(res);
    }
  }).on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

download(url);

function handleResponse(res: any) {
  if (res.statusCode !== 200) {
    console.error(`Failed to download: ${res.statusCode} ${res.statusMessage}`);
    res.resume();
    process.exit(1);
  }

  const file = fs.createWriteStream('repo_new.zip');
  res.pipe(file);
  file.on('finish', () => {
    file.close();
    console.log('Download completed. Extracting...');
    try {
      const targetDir = path.join(process.cwd(), 'temp_clone');
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir);
      
      execSync(`npx -y extract-zip repo_new.zip "${targetDir}"`);
      console.log('Extraction complete.');
      
      const subdirs = fs.readdirSync(targetDir);
      if (subdirs.length > 0) {
        const innerDir = path.join(targetDir, subdirs[0]);
        console.log(`Contents extracted to ${innerDir}`);
        
        const moveRecursive = (src: string, dest: string) => {
          if (fs.lstatSync(src).isDirectory()) {
            if (!fs.existsSync(dest)) {
              fs.mkdirSync(dest);
            }
            const files = fs.readdirSync(src);
            for (const f of files) {
              moveRecursive(path.join(src, f), path.join(dest, f));
            }
          } else {
            // Don't overwrite .env if it exists in root
            if (path.basename(dest) === '.env' && fs.existsSync(dest)) {
               console.log("Skipping .env overwrite");
               return;
            }
            if (fs.existsSync(dest)) {
              fs.unlinkSync(dest);
            }
            fs.renameSync(src, dest);
          }
        };

        const files = fs.readdirSync(innerDir);
        for (const f of files) {
          moveRecursive(path.join(innerDir, f), path.join('.', f));
        }
      }
      
      fs.unlinkSync('repo_new.zip');
      console.log('Success!');
    } catch (err: any) {
      console.error('Extraction error:', err.message);
      process.exit(1);
    }
  });
}
