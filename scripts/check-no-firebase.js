// Fail the build if any 'firebase' string exists in src
const fs = require('fs');
const path = require('path');

function scan(dir){
  for (const name of fs.readdirSync(dir)){
    const p = path.join(dir, name);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) scan(p);
    else if (stat.isFile()){
      const text = fs.readFileSync(p, 'utf8');
      if (/firebase\s*\//i.test(text) || /from\s+['"]firebase['"]/i.test(text)){
        console.error(`Found forbidden firebase import in: ${p}`);
        process.exit(1);
      }
    }
  }
}
scan(path.join(process.cwd(), 'src'));
