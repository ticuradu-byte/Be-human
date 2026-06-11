'use client'
// src/app/dashboard/recuperare/page.tsx
// Coach de Recuperare — protocol exact după petreceri, weekend greu, somn insuficient

import { useState } from 'react'

const SCENARII = [
  { val: 'alcool',      icon: '🍷', label: 'Am băut alcool',        desc: 'Aseară sau în weekend' },
  { val: 'somn_putin',  icon: '😴', label: 'Somn insuficient',      desc: 'Sub 6h, noapte albă' },
  { val: 'mancat_greu', icon: '🍕', label: 'Am mâncat greu/mult',   desc: 'Fast food, exces calorii' },
  { val: 'stres_mare',  icon: '😮‍💨', label: 'Stres intens',          desc: 'Zi grea la muncă/personal' },
  { val: 'sport_excesiv', icon: '💪', label: 'Supraantrenament',    desc: 'Am exagerat cu sportul' },
  { val: 'combinate',   icon: '🎉', label: 'Weekend greu (combo)',   desc: 'Alcool + somn puțin + stres' },
]

const PROTOCOL_RECUPERARE: Record<string, any> = {
  alcool: {
    titlu: 'Protocol Recuperare Post-Alcool',
    timp_recuperare: '18-24 ore',
    culoare: '#a78bfa',
    pasi_imediat: [
      { icon: '💧', titlu: 'Hidratare cu electroliți ACUM', desc: '500ml apă + 1/4 linguriță sare de mare + suc de jumătate de lămâie. Repetă la 30 min.' },
      { icon: '🥚', titlu: 'Micul dejun: ouă + banane', desc: 'Ouă (L-cisteina degradează acetaldehida), banane (potasiu + B6), evită cafeaua primele 2h.' },
      { icon: '💊', titlu: 'NAC 600mg + Vitamina C 1000mg', desc: 'NAC precursor glutation — detoxifierea ficatului. Vitamina C antioxidant. Cu mâncare.' },
      { icon: '🚫', titlu: 'Evită acetaminofenul (Paracetamol)', desc: 'Combinația alcool + paracetamol = hepatotoxic! Ibuprofenul e mai sigur dacă ai dureri de cap.' },
    ],
    sport_azi: { ok: false, desc: 'Fără antrenament azi. Plimbare ușoară 20 min e maximul acceptabil.' },
    cafea: 'Amâna cafeaua 2-3h după trezire. Alcoolul + cafeina = deshidratare amplificată.',
    recuperare_completa: 'Ficatul procesează 1 unitate de alcool/oră. 3 beri = ~9h. Somnul accelerează recuperarea.',
    studiu: 'Swift & Davidson, 1998: B vitamins + electrolytes = recuperare accelerată; Koch et al., 2018: L-cisteina reduce simptomele',
  },
  somn_putin: {
    titlu: 'Protocol Recuperare Post-Somn Insuficient',
    timp_recuperare: '24-48 ore',
    culoare: '#38bdf8',
    pasi_imediat: [
      { icon: '☀️', titlu: 'Lumina naturală ACUM — 10 min afară', desc: 'Lumina dimineții resetează ceasul biologic. Cel mai puternic instrument anti-oboseală disponibil.' },
      { icon: '☕', titlu: 'Cafeina strategic: 90mg la 90 min după trezire', desc: 'Lasă adenozina să fie parțial clearată înainte de cafeina. Evita după 13:00.' },
      { icon: '💤', titlu: 'Pui de somn 20 min (nu mai mult!)', desc: 'Nap-ul de 20 min creste alertness fără "sleep inertia". Alarma la 20 min — exact.' },
      { icon: '🥗', titlu: 'Carbohidrați complecși + proteina la prânz', desc: 'Creierul obosit consumă mai multă glucoză. Orez + pui, nu zahăr (crash garantat).' },
    ],
    sport_azi: { ok: true, desc: 'Sport ușor OK (Z2 cardio, yoga). HIIT sau forță maximă: EVITAT — risc leziuni +30% când ești obosit.' },
    cafea: 'Maxim 200mg cafeina azi. Ultima doză înainte de 13:00 pentru a nu perturba somnul de recuperare.',
    recuperare_completa: 'Somnul de datorii nu se recuperează 1:1 dar 2 nopți de 9h reduc semnificativ deficitul.',
    studiu: 'Huberman Lab 2021: lumina dimineții = cel mai puternic resetor circadian; Mednick, 2003: nap 20 min > 200mg cafeina pentru performanță',
  },
  mancat_greu: {
    titlu: 'Protocol Reset Digestiv',
    timp_recuperare: '12-24 ore',
    culoare: '#facc15',
    pasi_imediat: [
      { icon: '🚶', titlu: 'Plimbare 20-30 min ACUM', desc: 'Mișcarea post-masă grea: tranzit intestinal accelerat, glicemie scăzută, disconfort redus.' },
      { icon: '🍵', titlu: 'Ceai de ghimbir sau mentă', desc: 'Ghimbirul reduce greața și accelerează golirea gastrică. Fără lapte, fără zahăr.' },
      { icon: '💧', titlu: 'Hidratare 3L azi', desc: 'Sodiul din mâncarea grea retine apa. Hidratare crescută = retenție redusă.' },
      { icon: '🌿', titlu: 'Masă ușoară seara: supă + legume', desc: 'Sistemul digestiv are nevoie de pauză. Nu sari peste masă complet — supă de legume e ideală.' },
    ],
    sport_azi: { ok: true, desc: 'Sport ușor OK după 3-4h de la masă. Evită antrenamente intense — sângele e concentrat la digestie.' },
    cafea: 'Cafeina OK dar evit pe stomacul gol sau dacă ai disconfort gastric.',
    recuperare_completa: 'Excesul caloric de 1 zi nu se transformă în grăsime dacă reiei alimentația normală imediat.',
    studiu: 'Reynolds et al., 2020: mers 10 min post-masă reduce spike glicemic cu 35%; van Loon et al.: contracția musculară = uptake glucoză independent de insulina',
  },
  stres_mare: {
    titlu: 'Protocol Resetare Nervoasă',
    timp_recuperare: '24-48 ore',
    culoare: '#f472b6',
    pasi_imediat: [
      { icon: '🫁', titlu: 'Respirație 4-7-8 ACUM (5 minute)', desc: 'Inspiră 4s, ține 7s, expiră 8s. Activează sistemul nervos parasimpatic în 2-3 cicluri.' },
      { icon: '🌿', titlu: 'Ieși afară 20 min — fără telefon', desc: 'Natura reduce cortizolul cu 16% în 20 min. Fără stimuli digitali — lași cortexul prefrontal să se reseteze.' },
      { icon: '🤝', titlu: 'Contactează o persoană dragă', desc: 'Oxitocina (contactul social) antagonizează direct cortizolul. Apel telefonic > mesaj text.' },
      { icon: '🛁', titlu: 'Baie caldă sau duș cu contrast', desc: 'Baie caldă 40°C seara: temperatura corporală scade rapid după → somn mai profund. Sau duș alternant cald-rece: norepinefrină crescută.' },
    ],
    sport_azi: { ok: true, desc: 'Sport moderat recomandat! Exercițiul = cel mai rapid reducator cortizol. Alergare ușoară 30 min sau yoga > orice.' },
    cafea: 'Reduce cafeina azi — cortizolul crescut + cafeina = anxietate amplificată. Ceai verde ca alternativă.',
    recuperare_completa: 'Cortizolul cronic necesită 2-3 zile de recuperare activă (somn, natură, sport moderat, social).',
    studiu: 'Chandrasekhar et al., 2012: Ashwagandha reduce cortizol cu 27.9%; Li et al., 2011: 20 min pădure = cortizol -16%',
  },
  sport_excesiv: {
    titlu: 'Protocol Recuperare Supraantrenament',
    timp_recuperare: '48-72 ore',
    culoare: '#fb923c',
    pasi_imediat: [
      { icon: '🥩', titlu: 'Proteine 40g în următoarea oră', desc: 'Fereastra anabolică: leucina inițiază sinteza proteică. Shake whey + banană sau carne + orez.' },
      { icon: '🍒', titlu: 'Suc de cireșe acre 240ml', desc: 'Antocianinele din cireșe acre reduc DOMS (durerea musculară) cu 40%. Studiat la sportivi de elită.' },
      { icon: '🧊', titlu: 'Baie de gheață sau crioterapie (optional)', desc: '10-15 min la 10-15°C: inflamație redusă, recuperare accelerată. Sau contrast cald-rece 1 min each, 5 cicluri.' },
      { icon: '😴', titlu: 'Somn 9h azi + nap 20 min dacă poți', desc: 'GH (hormonul de creștere) = secretat 70% în somn deep. Recuperarea musculară se face în somn, nu la sală.' },
    ],
    sport_azi: { ok: false, desc: 'ZERO sport azi și probabil mâine. Plimbare lentă OK. Forța revine mai mare dacă laș recuperarea completă.' },
    cafea: 'Cafeina OK în doze normale. Nu exagera — cortizolul e deja crescut din antrenament.',
    recuperare_completa: 'Regula: dacă HRV e sub 80% din media ta → zi de recuperare. Niciodată 2 zile grele consecutiv.',
    studiu: 'Howatson et al., 2010: suc cireșe acre reduce DOMS cu 40% la maratonist; Walker, Why We Sleep: GH secretat 70% în somn deep',
  },
  combinate: {
    titlu: 'Protocol Weekend Greu — Reset Complet',
    timp_recuperare: '48-72 ore',
    culoare: '#f87171',
    pasi_imediat: [
      { icon: '💧', titlu: 'Hidratare agresivă imediat: 1L în 30 min', desc: 'Cu electroliți: sodiu + potasiu + magneziu. Rehydration sachets sau apă + sare + lămâie + miere.' },
      { icon: '☀️', titlu: 'Lumina naturală în prima oră — obligatoriu', desc: 'Resetul circadian e baza recuperării. Fără asta, toate celelalte sunt mai puțin eficiente.' },
      { icon: '🍳', titlu: 'Micul dejun: ouă + avocado + fructe', desc: 'Grăsimi sănătoase + proteine + potasiu. Evită zahărul simplu — crash garantat.' },
      { icon: '🚶', titlu: 'Plimbare 30 min (nu alergare)', desc: 'Mișcarea ușoară: circulație, detoxifiere, cortizol redus. Nu HIIT când ești deja stresat.' },
      { icon: '💊', titlu: 'NAC 600mg + Vitamina C 1000mg + Magneziu 400mg', desc: 'Suportul hepatic + antioxidant + recuperare musculară și nervoasă.' },
      { icon: '😴', titlu: 'Culcare la 22:00 maxim azi', desc: 'Somnul de recuperare = cel mai puternic instrument. Melatonina 1mg dacă ai probleme de adormit.' },
    ],
    sport_azi: { ok: false, desc: 'Azi: zero sport intens. Mâine: evaluezi HRV — dacă e sub media ta, încă o zi recovery.' },
    cafea: 'Maxim 1 cafea azi. Alcoolul epuizează adenozina — ești mai obosit decât crezi.',
    recuperare_completa: 'Cu protocolul complet: 80% recuperare în 24h, 100% în 48h.',
    studiu: 'Combinat: hidratare + lumina dimineții + proteine + mișcare ușoară = protocol validat clinic',
  },
}

export default function RecuperarePage() {
  const [scenariu, setScenariu] = useState<string | null>(null)
  const [detalii, setDetalii]   = useState('')

  const protocol = scenariu ? PROTOCOL_RECUPERARE[scenariu] : null

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">🔄 Coach Recuperare</h1>
        <p className="text-white/40 text-sm">Protocol exact după weekend greu · Bazat pe dovezi știintifice</p>
      </div>

      {!scenariu ? (
        <div className="space-y-3">
          <div className="text-sm text-white/50 text-center py-2">Ce s-a întâmplat?</div>
          {SCENARII.map(s => (
            <div key={s.val} onClick={() => setScenariu(s.val)}
              className="card p-4 hover:bg-white/[0.05] cursor-pointer transition-all flex items-center gap-4">
              <span className="text-3xl flex-shrink-0">{s.icon}</span>
              <div className="flex-1">
                <div className="text-sm font-semibold text-white/85">{s.label}</div>
                <div className="text-xs text-white/40">{s.desc}</div>
              </div>
              <span className="text-white/25">→</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4 fade-in">
          <button onClick={() => setScenariu(null)} className="text-white/40 text-sm hover:text-white/60">← Alege alt scenariu</button>

          {/* Header protocol */}
          <div className="rounded-2xl p-5" style={{ background: `${protocol.culoare}10`, border: `1px solid ${protocol.culoare}30` }}>
            <div className="font-fraunces text-lg font-bold text-white mb-1">{protocol.titlu}</div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-semibold" style={{ color: protocol.culoare, background: `${protocol.culoare}20` }}>
                ⏱ Recuperare completă: {protocol.timp_recuperare}
              </span>
            </div>
          </div>

          {/* Pași imediat */}
          <div className="card p-5">
            <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-4">⚡ Fă ACUM — în ordinea asta</div>
            <div className="space-y-4">
              {protocol.pasi_imediat.map((pas: any, i: number) => (
                <div key={i} className="flex gap-4">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-xs font-bold text-white/50">
                    {i + 1}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{pas.icon}</span>
                      <span className="text-sm font-semibold text-white/85">{pas.titlu}</span>
                    </div>
                    <p className="text-xs text-white/55 leading-relaxed">{pas.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sport + Cafea */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`rounded-xl p-4 ${protocol.sport_azi.ok ? 'bg-green-500/[0.06] border border-green-500/[0.15]' : 'bg-red-500/[0.06] border border-red-500/[0.15]'}`}>
              <div className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${protocol.sport_azi.ok ? 'text-green-400' : 'text-red-400'}`}>
                {protocol.sport_azi.ok ? '✅ Sport azi' : '🚫 Sport azi'}
              </div>
              <p className="text-xs text-white/60 leading-relaxed">{protocol.sport_azi.desc}</p>
            </div>
            <div className="bg-yellow-500/[0.06] border border-yellow-500/[0.15] rounded-xl p-4">
              <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider mb-2">☕ Cafeina</div>
              <p className="text-xs text-white/60 leading-relaxed">{protocol.cafea}</p>
            </div>
          </div>

          {/* Recuperare completă */}
          <div className="bg-indigo-500/[0.06] border border-indigo-500/[0.18] rounded-xl p-4">
            <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-2">🔬 Știința din spate</div>
            <p className="text-sm text-white/65 leading-relaxed mb-2">{protocol.recuperare_completa}</p>
            <div className="text-xs text-indigo-400/60 italic">📚 {protocol.studiu}</div>
          </div>
        </div>
      )}
    </div>
  )
}
