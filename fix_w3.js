const fs = require('fs')
const path = "./src/app/dashboard/wearables/page.tsx"
let lines = fs.readFileSync(path, 'utf8').split('\n')

// Găsim linia cu if(false)
const idx = lines.findIndex(l => l.includes('if (false) { // acces liber'))
console.log('if(false) la linia:', idx + 1)

if (idx >= 0) {
  // Ștergem doar linia cu if(false)
  lines.splice(idx, 1)
  console.log('Șters!')
}

fs.writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done!')
