const fs = require('fs')
const path = "./src/app/dashboard/wearables/page.tsx"
let c = fs.readFileSync(path, 'utf8')

c = c.replace(
  `    return (
      <div className="fade-in max-w-lg mx-auto pt-16 text-center space-y-4">
        <div className="text-5xl mb-4">⌚</div>
        <h2 className="text-xl font-semibold text-white">Date automate din wearables</h2>
        <p className="text-white/45 text-sm leading-relaxed">
          Conectează Oura Ring și Garmin pentru a trage datele automat în fiecare zi — zero export manual.
          Disponibil pe planurile <strong className="text-white/70">Plus, Pro și Familie</strong>.
        </p>
        <Link href="/dashboard/cont" className="btn-green inline-block py-3 px-8 text-sm">
          Upgrade pentru acces →
        </Link>
        <div className="text-xs text-white/25">De la 9€/lună · Trial 14 zile gratuit</div>
      </div>
    )
  }`,
  `  // acces liber - continua`
)

fs.writeFileSync(path, c, 'utf8')
console.log('Done! Linii:', c.split('\n').length)
