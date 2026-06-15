const fs = require('fs')
const path = "./src/app/dashboard/wearables/page.tsx"
let lines = fs.readFileSync(path, 'utf8').split('\n')

// Găsim linia cu "Viitoare"
const idx = lines.findIndex(l => l.includes('{/* Viitoare */}') || l.includes('{/* Viitoare */}'))
console.log('Viitoare la linia:', idx + 1, lines[idx])

const gfitBlock = [
  `          {/* Google Fit */}`,
  `          <div className="card p-5">`,
  `            <div className="flex items-start gap-4">`,
  `              <div className="text-3xl">🔵</div>`,
  `              <div className="flex-1">`,
  `                <div className="flex items-center justify-between mb-1">`,
  `                  <div className="font-semibold text-white/85 text-sm">Google Fit</div>`,
  `                  {util?.profil_complet?.google_fit_conectat`,
  `                    ? <span className="text-xs text-green-400 font-medium">✅ Conectat</span>`,
  `                    : <button onClick={() => window.location.href = \`/api/wearables/google-fit?user_id=\${userId}\`}`,
  `                        className="btn-green text-xs py-1.5 px-4">Conectează →</button>`,
  `                  }`,
  `                </div>`,
  `                <div className="text-xs text-white/40">Pași, calorii, frecvență cardiacă, minute active</div>`,
  `              </div>`,
  `            </div>`,
  `          </div>`,
]

lines.splice(idx, 0, ...gfitBlock)
fs.writeFileSync(path, lines.join('\n'), 'utf8')
console.log('Done!')
