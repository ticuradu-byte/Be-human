const fs = require('fs')
const path = "./src/app/dashboard/analiza/page.tsx"
let lines = fs.readFileSync(path, 'utf8').split('\n')

const idx = lines.findIndex(l => l.includes(".then(({ data }) => {"))
console.log('Linia:', idx + 1)

if (idx >= 0) {
  lines[idx] = lines[idx].replace('.then(({ data }) => {', '.then(async ({ data }) => {')
  const idxSetUtil = lines.findIndex((l, i) => i > idx && l.includes('setUtil(data)'))
  console.log('setUtil:', idxSetUtil + 1)
  if (idxSetUtil >= 0) {
    const code = [
      `          if (data?.profil_complet?.google_fit_conectat) {`,
      `            try {`,
      `              const gfitRes = await fetch(\`/api/wearables/google-fit/data?user_id=\${user.id}\`)`,
      `              const gfitData = await gfitRes.json()`,
      `              if (gfitData.ok && gfitData.zile?.length > 0) {`,
      `                const zile = gfitData.zile`,
      `                const n = zile.length`,
      `                const pasi = Math.round(zile.reduce((a,z) => a+z.pasi, 0)/n)`,
      `                const cal = Math.round(zile.reduce((a,z) => a+z.calorii, 0)/n)`,
      `                const hr = Math.round(zile.filter(z=>z.hr_medie>0).reduce((a,z)=>a+z.hr_medie,0)/Math.max(1,zile.filter(z=>z.hr_medie>0).length))`,
      `                const min = Math.round(zile.reduce((a,z)=>a+z.minute_active,0)/n)`,
      `                const azi = gfitData.azi`,
      "                const txt = `Date Google Fit (medie ${n} zile):\\nPași medii/zi: ${pasi.toLocaleString()}\\nCalorii medii/zi: ${cal} kcal\\nHR medie: ${hr} bpm\\nMinute active/zi: ${min} min\\nAzi (${azi?.data}): ${azi?.pasi?.toLocaleString()} pași · ${azi?.calorii} kcal · ${azi?.minute_active} min active`",
      `                setSurse(p => ({ ...p, smartwatch: txt }))`,
      `              }`,
      `            } catch(e) { console.log('GFit:', e) }`,
      `          }`,
    ]
    lines.splice(idxSetUtil + 1, 0, ...code)
    console.log('Adăugat!')
  }
}

fs.writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done!')
