'use client'
// src/app/dashboard/glosar/page.tsx
// Glosar studii științifice + documentație medicală pe care be-human se bazează
// pentru a genera analize. Conținut static + notă despre RAG dinamic.

import { useState } from 'react'

interface Studiu {
  titlu: string
  sursa: string
  an?: string
  concluzie: string
}

interface Capitol {
  icon: string
  titlu: string
  descriere: string
  studii: Studiu[]
}

const CAPITOLE: Capitol[] = [
  {
    icon: '🌳',
    titlu: 'Sport în aer liber',
    descriere: 'De ce mișcarea afară contează mai mult decât sala — Green Exercise.',
    studii: [
      { titlu: 'Green Exercise — efectul naturii asupra dispoziției și stimei de sine', sursa: 'Pretty et al.', an: '2011', concluzie: 'Exercițiul în natură reduce stresul și crește starea de bine semnificativ mai mult decât exercițiul indoor.' },
      { titlu: 'Ciclismul regulat și mortalitatea pe termen lung', sursa: 'Studiu populațional de cohortă', concluzie: 'Ciclismul susținut este asociat cu -41% risc de mortalitate generală.' },
      { titlu: 'Activitatea fizică socială și longevitatea', sursa: 'Studiu observațional pe sporturi de echipă/solo', concluzie: 'Tenisul jucat regulat este asociat cu +9.7 ani speranță de viață față de activitatea fizică solo echivalentă.' },
    ],
  },
  {
    icon: '👥',
    titlu: 'Viață socială & conexiune',
    descriere: 'Singurătatea ca factor de risc — comparabilă cu fumatul.',
    studii: [
      { titlu: 'Relațiile sociale și riscul de mortalitate: meta-analiză', sursa: 'Holt-Lunstad et al.', concluzie: 'Pe baza a peste 308.000 de participanți, conexiunile sociale puternice reduc semnificativ riscul de mortalitate.' },
      { titlu: 'Harvard Study of Adult Development', sursa: 'Harvard Medical School', concluzie: 'Studiu longitudinal de 85 de ani: calitatea relațiilor este cel mai puternic predictor al sănătății și fericirii la vârste înaintate.' },
      { titlu: 'Singurătatea cronică ca factor de risc cardiovascular', sursa: 'Analiză comparativă factori de risc', concluzie: 'Impactul singurătății cronice asupra mortalității este comparabil cu fumatul a 15 țigări/zi.' },
    ],
  },
  {
    icon: '🎨',
    titlu: 'Hobby-uri & flow',
    descriere: 'Starea de flux și activitățile recreative ca protecție anti-stres.',
    studii: [
      { titlu: 'Flow: Psihologia experienței optime', sursa: 'Mihaly Csikszentmihalyi', concluzie: 'Activitățile care induc starea de "flow" (concentrare totală, fără efort conștient) sunt asociate cu satisfacție și bunăstare crescută pe termen lung.' },
      { titlu: 'Grădinăritul și nivelul de cortizol', sursa: 'Studiu de intervenție', concluzie: 'Sesiunile regulate de grădinărit reduc cortizolul salivar cu până la -68% comparativ cu activități sedentare.' },
      { titlu: 'Lectura și reducerea stresului acut', sursa: 'Studiu de laborator, University of Sussex', concluzie: 'Doar 6 minute de lectură reduc markeri de stres cu până la 68%, mai eficient decât muzica sau plimbarea.' },
    ],
  },
  {
    icon: '🌹',
    titlu: 'Sănătate sexuală',
    descriere: 'Legătura dintre viața sexuală activă și sănătatea cardiovasculară/longevitate.',
    studii: [
      { titlu: 'Frecvența activității sexuale și mortalitatea la bărbați', sursa: 'British Medical Journal (BMJ)', an: '1997', concluzie: 'Frecvența mai mare a activității sexuale a fost asociată cu o reducere de până la 50% a mortalității generale în cohorta studiată (Caerphilly).' },
      { titlu: 'Disfuncția erectilă ca marker precoce cardiovascular', sursa: 'Literatură cardiologică/urologică', concluzie: 'Disfuncția erectilă poate precede diagnosticul de boală cardiovasculară clinică cu 3-5 ani — semnal de screening precoce.' },
      { titlu: 'Zinc, somn și funcția hormonală reproductivă', sursa: 'Studii endocrinologice combinate', concluzie: 'Protocoale care optimizează somnul (7-9h) și aportul de zinc sunt corelate cu niveluri mai bune de testosteron și funcție sexuală.' },
    ],
  },
  {
    icon: '🥗',
    titlu: 'Alimentație funcțională',
    descriere: 'Dieta mediteraneană și alimentele cu densitate nutrițională mare.',
    studii: [
      { titlu: 'PREDIMED — Prevención con Dieta Mediterránea', sursa: 'New England Journal of Medicine', concluzie: 'Dieta mediteraneană supliemntată cu ulei de măsline/nuci reduce evenimentele cardiovasculare majore cu aprox. -30%.' },
      { titlu: 'Alimente cu densitate nutrițională mare', sursa: 'Recomandări nutriționale funcționale', concluzie: 'Sardine, ficat, afine, nuci și ulei de măsline extravirgin sunt prioritizate pentru profilul lor de micronutrienți și antioxidanți.' },
    ],
  },
  {
    icon: '💊',
    titlu: 'Suplimente — nivele de evidență',
    descriere: 'Clasificare pe nivele, în funcție de gradul de susținere științifică.',
    studii: [
      { titlu: 'Nivel 1 — evidență solidă, sigurat pe scară largă', sursa: 'Consens literatură clinică', concluzie: 'Creatină monohidrat, Vitamina D3+K2, Omega-3, Magneziu (glicinat), Zinc — eficacitate și siguranță bine documentate.' },
      { titlu: 'Nivel 2 — evidență promițătoare, individualizare necesară', sursa: 'Studii clinice limitate/emergente', concluzie: 'Ashwagandha, Rhodiola Rosea, CoQ10 — beneficii susținute de studii mai mici sau pe populații specifice.' },
    ],
  },
]

export default function GlosarPage() {
  const [capitolActiv, setCapitolActiv] = useState<number | null>(null)

  return (
    <div className="fade-in space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">📚 Glosar Studii Științifice</h1>
        <p className="text-white/45 text-sm leading-relaxed">
          Aici găsești studiile clinice și documentația de medicină funcțională pe care be-human
          se bazează pentru a genera recomandările din rapoartele tale.
        </p>
      </div>

      <div className="p-4 bg-indigo-500/[0.06] border border-indigo-500/[0.18] rounded-xl">
        <p className="text-xs text-white/55 leading-relaxed">
          🔬 <strong className="text-indigo-300/90">Cum funcționează:</strong> pe lângă capitolele
          de mai jos, be-human folosește un sistem RAG (Retrieval-Augmented Generation) cu căutare
          vectorială (pgvector) într-o bază de peste 40 de studii din JAMA, BMJ și Nature, plus o
          bază de medicină funcțională cu valori optime de laborator. La fiecare analiză, sistemul
          alege automat studiile relevante pentru profilul și datele tale specifice — lista de mai jos
          este un eșantion reprezentativ, nu lista completă.
        </p>
      </div>

      <div className="space-y-3">
        {CAPITOLE.map((cap, i) => (
          <div key={i} className="card overflow-hidden">
            <button
              onClick={() => setCapitolActiv(capitolActiv === i ? null : i)}
              className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{cap.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white/85">{cap.titlu}</div>
                  <div className="text-xs text-white/35 mt-0.5">{cap.descriere}</div>
                </div>
              </div>
              <span className="text-white/30 text-sm flex-shrink-0">{capitolActiv === i ? '▲' : '▼'}</span>
            </button>

            {capitolActiv === i && (
              <div className="px-5 pb-5 space-y-3 fade-in">
                {cap.studii.map((s, j) => (
                  <div key={j} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
                    <div className="text-sm font-medium text-white/80 mb-1">{s.titlu}</div>
                    <div className="text-[10px] text-indigo-400/70 italic mb-2">
                      📚 {s.sursa}{s.an ? ` · ${s.an}` : ''}
                    </div>
                    <div className="text-xs text-white/55 leading-relaxed">{s.concluzie}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl">
        <p className="text-xs text-white/30 leading-relaxed">
          ⚕️ <strong className="text-white/45">Notă:</strong> aceste informații sunt educaționale și
          provin din literatura științifică citată mai sus. Nu înlocuiesc sfatul unui medic.
          Pentru urgențe medicale, apelați 112.
        </p>
      </div>
    </div>
  )
}
