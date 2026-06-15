const fs = require('fs')
const path = "./src/app/dashboard/wearables/page.tsx"
let lines = fs.readFileSync(path, 'utf8').split('\n')

// Găsim linia cu if (!areAcces
const idx = lines.findIndex(l => l.includes("if (!areAcces(plan as any, 'wearables_api'))"))
console.log('Linia găsită:', idx + 1)

if (idx >= 0) {
  // Găsim closing brace al if-ului - caută "}" după return block
  // Înlocuim linia cu if(!areAcces) cu if(false)
  lines[idx] = `  if (false) { // acces liber pentru toti`
  // Găsim și ștergem linia "// acces liber - continua"
  const idxAcesLiber = lines.findIndex((l, i) => i > idx && l.includes('// acces liber - continua'))
  if (idxAcesLiber >= 0) {
    lines.splice(idxAcesLiber, 1)
    console.log('Șters placeholder la linia:', idxAcesLiber + 1)
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done!')
