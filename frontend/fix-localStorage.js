const fs = require('fs');
const files = [
  './src/components/Sidebar.jsx', 
  './src/app/settings/page.js', 
  './src/app/reports/page.js', 
  './src/app/dashboard/page.js', 
  './src/app/assessment/page.js', 
  './src/app/chat/page.js'
];
files.forEach(f => {
  if (fs.existsSync(f)) {
      let s = fs.readFileSync(f, 'utf8');
      s = s.replace(/localStorage\.getItem\('aura_user'\)/g, "(localStorage.getItem('aura_user') || sessionStorage.getItem('aura_user'))");
      fs.writeFileSync(f, s);
      console.log('Fixed ' + f);
  }
});
