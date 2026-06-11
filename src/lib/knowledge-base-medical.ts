// be-human KNOWLEDGE BASE MEDICAL EXTINS v3
// Surse: PubMed, NIH, ESC Guidelines, AHA, NEJM, Lancet, BMJ, Nature Medicine, Examine.com
// Capitole: Cardiovascular, Obezitate, Tensiune, Sex, Mental, Timing Suplimente

export const KB_CARDIOVASCULAR = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CARDIOVASCULAR — CONEXIUNI SISTEMICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

LANȚUL OBEZITATE → INIMĂ (mecanismul complet):
1. Grăsime viscerală → eliberează acizi grași liberi + citokine inflamatorii (IL-6, TNF-α)
2. Acizii grași liberi → rezistență insulinică hepatică → hiperinsulinemie
3. Insulina crescută → retenție sodiu → volum sanguin crescut → HTA
4. Grăsime ectopică (în inimă, ficat, pancreas) → disfuncție organică directă
5. Inflamație cronică → oxidare LDL → plăci aterosclerotice → infarct/AVC
STUDIU: Framingham Heart Study (5209 participanți, 68 ani follow-up) — obezitatea abdominală
prezice boala cardiovasculară independent de greutatea totală

TENSIUNEA ARTERIALĂ — GHID ESC 2023:
- Optimă: <120/80 mmHg
- Normală: 120-129/80-84 mmHg
- Normal-înaltă: 130-139/85-89 mmHg (RISC x1.5 față de optimă)
- HTA grad 1: 140-159/90-99 mmHg → intervenție lifestyle obligatorie
- HTA grad 2: 160-179/100-109 mmHg → medicație + lifestyle
- HTA grad 3: ≥180/≥110 mmHg → urgență medicală
STUDIU SPRINT (NEJM 2015, 9361 pacienți): ținta <120 mmHg reduce evenimente CV cu 25%
și mortalitatea cu 27% față de ținta <140 mmHg

REDUCERE TA PRIN LIFESTYLE (evidențe clinice):
- Dieta DASH: -8-14 mmHg sistolică (Appel et al., NEJM 1997)
- Reducere sodiu la <2g/zi: -5-6 mmHg (meta-analiză Cochrane 2020, 185 RCT)
- Exercițiu aerob 30min x 5/săpt: -5-8 mmHg (meta-analiză Cornelissen, JACC 2013)
- Reducere alcool: -3-4 mmHg per reducere moderată
- Post intermitent 16/8: -8 mmHg sistolică în 12 săptămâni (Cell Metabolism 2022)
- Magneziu 300-500mg/zi: -3-4 mmHg (meta-analiză Zhang et al., 2016, 34 RCT)
- Sfeclă roșie (nitrati): -4-5 mmHg acut (Webb et al., Hypertension 2008)

COLESTEROL — INTERPRETARE FUNCȚIONALĂ:
- LDL standard: țintă <100 mg/dL (risc scăzut), <70 (risc moderat), <55 (risc înalt)
- ApoB: PREDICTOR SUPERIOR LDL — 1 particulă ApoB = 1 particulă aterogenă
  Țintă ApoB: <80 mg/dL (risc scăzut), <65 (risc moderat), <55 (risc înalt)
  STUDIU: Sniderman et al., JAMA Cardiology 2019 — ApoB prezice mai bine riscul decât LDL-C
- LDL mic-dens (sdLDL): cel mai aterogen — crescut în rezistența insulinică + trigliceride mari
- HDL: >60 mg/dL protector, <40 (B) sau <50 (F) = factor de risc independent
  Fiecare +1 mg/dL HDL = -2-3% risc coronarian (Framingham)
- Trigliceride: <150 normal, >200 crescut, >500 risc pancreatită acută
  Trigliceride/HDL ratio: <2 optim, >4 rezistență insulinică probabilă
- Homocisteina: >15 μmol/L = risc CV crescut de 2x; reduce cu B6+B12+Folat
- CRP hs: <1 mg/L risc scăzut, 1-3 moderat, >3 înalt; reduce cu omega-3 + statine + lifestyle

FLUX SANGUIN & MICROCIRCULAȚIE:
- Disfuncția endotelială precede cu 10-20 ani boala cardiovasculară clinică
- Markeri endoteliali: ADMA crescut, oxid nitric scăzut
- Alimente pro-endoteliale: sfeclă (nitriți→NO), cacao flavanoli, L-arginină, L-citrulină
- Exercițiu fizic: cel mai puternic stimulator NO (oxid nitric) → vasodilatație
- Fumat: distruge endoteliul în minute; 10 ani abstinență = risc aproape normal
- Diabet/prediabet: glicozilarea endoteliului → rigiditate vasculară → HTA sistolică

INIMA & METABOLISMUL:
- Cardiopatia metabolică: grăsime în pericard și miocard → disfuncție diastolică
- HRV (Heart Rate Variability): marker recuperare sistem nervos autonom
  HRV scăzut = stres cronic, supraantrenament, inflamație, somn prost
  HRV crescut = recuperare bună, fitness cardiovascular, rezistență la stres
- VO2max: cel mai puternic predictor al longevității (mai puternic decât tensiunea, colesterolul)
  VO2max <25 = risc mortalitate x5 față de VO2max >50 (Mandsager et al., JAMA 2018)
  Fiecare 1 MET crescut = -13% mortalitate generală
`

export const KB_OBEZITATE_METABOLISM = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
OBEZITATE & METABOLISM — MECANISME ȘI INTERVENȚII
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

REZISTENȚA INSULINICĂ — DIAGNOSTIC ȘI CONSECINȚE:
- HOMA-IR = (insulina jeun × glucoza jeun) / 405
  <1.5 optim, 1.5-2.5 limită, >2.5 rezistență insulinică, >5 severă
- Consecințe: obezitate abdominală, HTA, dislipidemi, NAFLD, PCOS, disfuncție erectilă
- Progresie: rezistență insulinică → prediabet (10-15 ani) → DZ tip 2 → complicații
- REVERSIBIL în stadii timpurii cu: low-carb, post intermitent, exercițiu, pierdere 5-10% greutate
STUDIU: Hallberg et al., Diabetes Therapy 2018 — dieta low-carb + îngrijire digitală
reduce HbA1c cu 1.3%, 60% pacienți elimină insulina în 1 an

GRĂSIMEA VISCERALĂ vs. SUBCUTANATĂ:
- Grăsimea viscerală (în jurul organelor): metabolic activă, inflamatorie, periculoasă
  Circumferință talie: >94 cm (B) sau >80 cm (F) = risc metabolic crescut
  >102 cm (B) sau >88 cm (F) = risc foarte mare (ghid IDF)
- Grăsimea subcutanată (sub piele): relativ benignă metabolic
- Grăsimea ectopică: în ficat (NAFLD), pancreas, mușchi, inimă = cea mai periculoasă
- STUDIU: Fox et al., Circulation 2007 — grăsimea viscerală asociată cu HTA, DZ, dislipidemi
  independent de greutatea corporală totală (poți fi normal ponderal și metabolic obez)

ADIPOKINELE — MESAGERI AI GRĂSIMII:
- Adiponectina: scăzută în obezitate → antiinflamatoare, sensibilizantă insulinică
  Crește cu: exercițiu, pierdere greutate, omega-3, cafea
- Leptina: rezistența la leptină în obezitate → creier nu simte sațietatea
- IL-6, TNF-α, MCP-1: citokine inflamatorii eliberate de grăsimea viscerală

STRATEGII DE SLĂBIRE BAZATE PE DOVEZI:
1. Deficit caloric moderat (-300-500 kcal/zi): pierdere 0.5-1 kg/săpt fără pierdere musculară
2. Proteine mari (1.6-2.2 g/kg corp): păstrează masa musculară în deficit caloric
   STUDIU: Leidy et al., American Journal of Clinical Nutrition 2015 — proteine la micul dejun
   reduce foamea pe tot parcursul zilei cu 25%, reduce snacking-ul nocturn
3. Post intermitent 16/8: meta-analiză Harris et al., PLOS ONE 2018 — similar cu restricție
   calorică continuă pentru pierdere greutate, superior pentru sensibilitate insulinică
4. Exercițiu forță + aerob: exercițiul forță menține masa musculară + crește BMR cu 7-8%
5. Somn 7-9h: privarea de somn → grelina +15%, leptina -15% → foame crescută
   STUDIU: Spiegel et al., PLOS Medicine 2004 — <6h somn = creștere greutate x1.7

SETPOINT-UL METABOLIC:
- Corpul apără greutatea prin adaptare metabolică (reducere BMR, creștere eficiență)
- Soluție: schimbări lente (6-12 luni), cicluri de menținere, exercițiu crescut
- Refeed days strategice: 1-2 zile/lună la TDEE sau +10% pentru reseta leptina

CRONOBIOLOGIA ALIMENTAȚIEI:
- Mâncat în fereastră 8h (8:00-16:00): reduce TA cu 5 mmHg, insulina cu 3 μU/mL
  STUDIU: Sutton et al., Cell Metabolism 2018 — independent de pierderea în greutate
- Microbioame circadiene: bacteriile intestinale au ritmuri zilnice ce afectează metabolismul
- Ultima masă cu 3h înainte de culcare: reduce refluxul, îmbunătățește somnul, reduce NAFLD
`

export const KB_SANATATE_SEXUALA = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SĂNĂTATE SEXUALĂ — CONEXIUNI SISTEMICE ȘI DOVEZI
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

DISFUNCȚIA ERECTILĂ — SEMNAL CARDIOVASCULAR:
- DE precede boala cardiovasculară cu 3-5 ani în 70% din cazuri
- Mecanism: arterele peniene (1-2mm diametru) se afectează înaintea celor coronariene (3-4mm)
- DE = "angina pectoris a penisului" — același mecanism aterosclerotic
- STUDIU: Montorsi et al., European Urology 2003 — 67% pacienți cu infarct aveau DE anterior
- Factori comuni: HTA, DZ, fumat, obezitate, dislipidemie, sedentarism
- Implicație clinică: DE nou-apărut la bărbat <60 ani = screening cardiovascular obligatoriu
- Tratament holistic: controlul factorilor de risc CV îmbunătățește DE în 30-40% cazuri

TESTOSTERONUL — FUNCȚII SISTEMICE:
- Valori normale (bărbați): 300-1000 ng/dL total, optim 600-800 ng/dL
- Testosteron liber: mai relevant clinic (1-3% din total)
- SHBG (globulina): când e mare → leagă testosteronul → simptome de deficit chiar cu total normal
- Simptome deficit T: oboseală, libido scăzut, masă musculară redusă, grăsime abdominală,
  depresie, disfuncție erectilă, densitate osoasă scăzută
- Cauzele scăderii T: obezitate (aromataza din grăsime → estrogen), stres cronic (cortizol
  competiționează cu T pentru precursori), somn prost, alcool, xenoestrogeni

CREȘTEREA NATURALĂ A TESTOSTERONULUI:
- Exercițiu forță: cea mai eficientă intervenție, peak T la 15-30min după antrenament
  STUDIU: Vingren et al., Sports Medicine 2010 — exercițiu compound (squat, deadlift) > izolat
- Zinc: cofactor esențial sinteza T; deficit de zinc = deficit T (Prasad et al., Nutrition 1996)
  Sursă: stridii (cel mai bogat), carne roșie, semințe dovleac; Supliment: 25-45mg/zi cu masă
- Vitamina D: comportă ca hormon steroid, receptor în celulele Leydig
  STUDIU: Pilz et al., Hormone and Metabolic Research 2011 — D3 3332 UI/zi → T +25%
- Somn 8h: 70-80% din T secretat în somn (faza REM); 5h somn → T -10-15%
- Reducere stres: cortizol cronic inhibă direct steroidogeneza
- Ashwagandha KSM-66: meta-analiză 2022 (5 RCT) — crește T cu 14-15%, spermă +167%

ESTROGENII LA FEMEI — CICLUL ȘI MENOPAUZA:
- Fazele ciclului și impactul alimentar/sport:
  Folicularǎ (zi 1-14): estrogen crescut → energie, motivație, toleranță durere crescută
  → Ideal pentru antrenamente intense, carbohidrați mai mulți
  Luteală (zi 15-28): progesteron dominant → retenție apă, poftă dulce, oboseală
  → Magneziul reduce simptomele PMS, reducere zahăr, mai mult somn
- Menopauza: scădere estrogen → accelerare pierdere densitate osoasă (3-5%/an primii 5 ani)
- Fitoestrogenii: izoflavone soia (50-100mg/zi) — reduc bufeurile cu 25-30% (Cochrane 2013)
- THS (terapie hormonală de substituție): beneficii > riscuri dacă inițiată înainte de 60 ani

LIBIDOUL — FACTORI SISTEMICI:
Femei: estrogen (lubrifierea), testosteron (dorința), tiroidă normală, fier/feritina optima
(feritina <20 = libido scăzut), cortizol scăzut, relație sigură, sleep suficient
Bărbați: testosteron, dopamină, funcție cardiacă bună, NO endotelial
Ambele sexe: serotonina SCADE libidoul (SSRI = efect secundar sexual în 30-40%)

FRECVENȚA OPTIMĂ A ACTIVITĂȚII SEXUALE:
- STUDIU: Charnetski & Brennan, Psychological Reports 2004 — 1-2x/săpt = IgA crescut +30%
  (imunitate crescută vs. abstinență sau frecvență foarte mare)
- Beneficii cardiovasculare: activitate sexuală echivalentă cu 3-5 METs (mers vioi)
  STUDIU: Ebrahim et al., Journal of Epidemiology 2002 — sex frecvent = mortalitate CV -50%
- Oxitocina eliberată post-orgasm: reduce cortizolul, tensiunea arterială, îmbunătățește somnul
`

export const KB_SANATATE_MENTALA = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SĂNĂTATE MINTALĂ — CONEXIUNI BIOLOGICE ȘI INTERVENȚII
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

AXA INTESTIN-CREIER (GUT-BRAIN AXIS):
- 90% din serotonina corpului produsă în intestin de enterocromafine
- Microbiomul influențează direct producția de neurotransmițători
- Bacterii probiotice (Lactobacillus, Bifidobacterium) → GABA crescut → anxietate redusă
  STUDIU: Bravo et al., PNAS 2011 — L. rhamnosus reduce anxietatea și depresia la șoareci
  Studiu uman: Steenbergen et al., Brain, Behavior, and Immunity 2015 —
  multispecies probiotic reduce gândirea ruminativă în 4 săptămâni
- Disbioza intestinală (LPS din bacterii gram-negative) → inflamație sistemică → depresie
- "Leaky gut" → endotoxemie → neuroinflamamție → depresie rezistentă
- Alimente pro-microbiom: fibre diverse (prebiotice), fermentate (kefir, kimchi, miso),
  polifenoli (afine, cacao, rodie)

INFLAMAȚIA ȘI DEPRESIA — LEGĂTURA CLINICĂ:
- "Teoria inflamatorie a depresiei" — 30-40% din depresii au marker inflamatori crescuți
  (CRP >3 mg/L, IL-6 crescut) — nu răspund la SSRI, răspund la antiinflamatorii
- STUDIU: Raison et al., JAMA Psychiatry 2013 — infliximab (anti-TNF) îmbunătățește
  depresia rezistentă DOAR la pacienții cu CRP >5 mg/L
- Omega-3 (EPA dominant): meta-analiză Sublette et al., Journal of Clinical Psychiatry 2011 —
  EPA >60% din formulă = efect antidepresiv semnificativ, similar SSRI în depresie ușoară-moderată
- Curcumina: meta-analiză Ng et al., Journal of Affective Disorders 2017 —
  1g/zi reduce scoruri depresie și anxietate, crește BDNF

CORTIZOLUL ȘI STRESUL CRONIC:
- Cortizol cronic → atrofie hipocampus (10-20% reducere volum în depresie majoră)
  STUDIU: Sheline et al., PNAS 1996 — durată depresie corelată cu pierdere volum hipocampal
- HPA axis disfuncțional: cortizol matinal plat = epuizare suprarenală (burnout)
  Test optim: cortizol salivar la 4 puncte (7:00, 12:00, 17:00, 22:00)
- Cortizol → rezistență insulinică, depozitare grăsime abdominală, imunosupresie
- Reducere cortizol: Ashwagandha -27% (Chandrasekhar et al., JCHP 2012),
  Rhodiola rosea (adaptogen), meditație mindfulness (Hölzel et al., NeuroImage 2011),
  exercițiu moderat (intense crește cortizol!)

EXERCIȚIUL FIZIC CA ANTIDEPRESIV:
- META-ANALIZĂ BMJ 2023 (218 RCT, 14170 participanți): exercițiul fizic la fel de eficient
  ca antidepresivele în depresie moderată, superior în anxietate
- Mecanisme: BDNF (neurogeneza hipocampală), endorfine, endocannabinoizi (euforia alergătorului),
  norepinefrină, dopamină, serotonină crescute post-exercițiu
- Doza optimă: 150-300 min/săpt activitate moderată sau 75-150 min intensă
- Efectul antidepresiv apare după 2-4 săptămâni de exercițiu regulat

SOMNUL ȘI SĂNĂTATEA MINTALĂ:
- Privarea de somn = simptome psihotice la oameni sănătoși după 60-72h
- REM sleep: procesarea emoțiilor (amigdala), consolidarea memoriei emoționale
  Deficit REM → hiperreactivitate emoțională → iritabilitate, anxietate
- Insomnia: factor de risc independent pentru depresie (x2), anxietate (x3), psihoze
- Tratament insomnie: CBT-I (terapie cognitiv-comportamentală) = superior hipnoticelor
  pe termen lung (meta-analiză Morin et al., Sleep 2006)

NUTRIENȚI CHEIE PENTRU SĂNĂTATE MINTALĂ:
- Magneziu L-treonat: traversează bariera hemato-encefalică, îmbunătățește sinapsele
  STUDIU: Slutsky et al., Neuron 2010 — Mg-L-treonat crește densitatea sinaptică
- Zinc: cofactor >300 enzime cerebrale; deficit → depresie, ADHD, anorexie
- Vitamina B12 + Folat: metilare ADN cerebral; deficit → depresie, demență
- L-Teanina (din ceai verde): crește alpha brain waves → relaxare fără sedare
  Sinergie L-Teanina 200mg + Cafeina 100mg = focus optim (Owen et al., 2008)
- 5-HTP (precursor serotonină): 100-300mg seara, NU combinat cu SSRI (serotonin syndrome)
`

export const KB_TIMING_SUPLIMENTE = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TIMING SUPLIMENTE — PROTOCOL OPTIM DE ADMINISTRARE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PRINCIPII GENERALE:
1. Liposolubile (D3, K2, CoQ10, Omega-3, Vitamina A, E): ÎNTOTDEAUNA cu masă grasă
   → absorbția crește 2-5x față de stomac gol
2. Hidrosolubile (B-complex, C, Zinc): pot fi luate cu sau fără masă
   → dar Zincul pe stomac gol poate cauza greață — mai sigur cu proteină
3. Competiție de absorbție:
   - Calciu interferă cu: Magneziu, Zinc, Fier → nu le combina
   - Fier interferă cu: Zinc, Calciu, Cupru → administrează separat cu 2h
   - Vitamina C crește absorbția fierului cu 3x → combină-le

PROTOCOL DIMINEAȚA PE STOMAC GOL (cu 30-60 min înainte de masă):
- Levotiroxina (tiroidă): OBLIGATORIU stomac gol, 30-60 min înainte de masă/cafea
- Berberina: 30 min înainte de masă → blochează absorbția glucozei post-prandiale
- NAC (N-Acetil-Cisteina): stomac gol sau cu proteină (nu carbohidrați)
- L-Arginina/L-Citrulina: dimineața sau pre-sport pentru efect NO maxim

PROTOCOL DIMINEAȚA CU MASĂ GRASĂ:
- Vitamina D3 (1000-10000 UI): cu masă care conține grăsimi
  STUDIU: Dawson-Hughes et al., JCEM 2015 — D3 cu masă grasă = absorbție +50%
- Vitamina K2 (MK-7, 100-200mcg): cu D3, sinergie completă (direcționează calciul)
- CoQ10 (ubiquinol, 100-300mg): cu masă grasă; ubiquinol > ubiquinonă în absorbție
- Omega-3 (EPA+DHA, 2-4g): cu masă, reduce eructațiile și crește biodisponibilitatea
- Astaxantina (4-12mg): cu grăsimi; antioxidant carotenoidal puternic
- Vitamina A (retinol): cu grăsimi, NU megadoze (toxic la >10000 UI/zi pe termen lung)

PROTOCOL PRÂNZ / CU MESE:
- Vitamina C (500-1000mg): cu masă pentru absorbție graduală, reduce iritația gastrică
- B-complex: cu masă (reduce greața, mai ales B6 și niacina)
- Zinc (25-45mg): cu proteină animală; NU cu fier sau calciu
- Seleniu (100-200mcg): cu masă; sinergie cu Vitamina E
- Iod (150-300mcg): cu masă; important pentru tiroidă, sinergie cu Seleniu

PROTOCOL ÎNAINTE DE MASĂ (15-30 minute):
- Berberina 500mg: înainte de fiecare masă principală (3x/zi) → control glicemic optim
- Apple Cider Vinegar (ACV, 1-2 linguri în apă): reduce spike glicemic cu 20-34%
  STUDIU: Johnston et al., Diabetes Care 2004 — ACV îmbunătățește sensibilitatea insulinică
- Psyllium husk (5-10g): formează gel → încetinește absorbția zaharurilor

PROTOCOL PRE-SPORT (30-60 min înainte):
- Creatina monohidrat (3-5g): oricând (saturație tisulară), dar pre/post sport cu carbohidrați
  STUDIU: Tarnopolsky et al., Journal of Applied Physiology 1992 — creatina crește puterea
  cu 5-15% și masa musculară prin retenție apă intracelulară și sinteza proteică
- Beta-alanina (3.2-6.4g): reduce acidoza musculară, senzație de furnicături normală
- L-Citrulina (6-8g) sau L-Arginina (3-6g): pump muscular, NO crescut
- Cofeina (3-6 mg/kg): peak efect la 45-60 min; evitare după ora 14:00

PROTOCOL SEARA (înainte de culcare):
- Magneziu glicinat/L-treonat (300-400mg): îmbunătățește calitatea somnului, relaxare
  NU magneziu oxid (absorbție slabă, efect laxativ)
- Glicina (3-5g): reduce temperatura corporală → somnolență → somn mai profund
  STUDIU: Bannai et al., Sleep and Biological Rhythms 2012 — glicina 3g îmbunătățește
  calitatea somnului obiectiv (PSG) și subiectiv
- L-Teanina (200-400mg): reduce anxietatea de tip "racing mind"
- Ashwagandha KSM-66 (300-600mg): reduce cortizolul seral, îmbunătățește somnul
- Melatonina (0.5-3mg): pentru jet lag sau readaptare program; NU cronică (desensibilizare)
  Doza mică (0.5mg) = la fel de eficientă ca 5mg, mai puțin efect rezidual

INTERACȚIUNI IMPORTANTE DE EVITAT:
- Calciu + Fier: competiție absorbție (administrează cu 2h separat)
- Zinc + Cupru: zinc >40mg/zi scade cuprul → anemie; suplementează 2mg cupru la doze mari zinc
- 5-HTP + SSRI/SNRI: risc sindrom serotoninergic (PERICULOS)
- St. John's Wort + orice medicament: inductor puternic CYP3A4 → scade eficiența multor medicamente
- Vitamina K2 + anticoagulante (Warfarina): K2 antagonizează efectul → consult medical obligatoriu
- Grapefruit + statine/antihistaminice/benzodiazepine: inhibă CYP3A4 → crește nivelul medicamentelor

STACKING-URI DOVEDITE (sinergie):
1. Longevitate: Spermidina + Quercetina + NMN/NR + Resveratrol + Omega-3
2. Metabolic: Berberina + Vitamina D3 + Magneziu + Zinc + Omega-3
3. Cognitiv: Omega-3 EPA/DHA + Magneziu L-treonat + L-Teanina + Cofeina + Bacopa
4. Cardiovascular: CoQ10 + Omega-3 + Vitamina K2 + Magneziu + Coenzima B-complex
5. Anti-inflamator: Omega-3 + Curcumina (cu piperin) + Vitamina D3 + Quercetina + Ghimbir
6. Hormonii masculini: Zinc + Vitamina D3 + Ashwagandha + Magneziu + Seleniu
7. Somn: Magneziu glicinat + Glicina + L-Teanina + Ashwagandha (fără melatonina cronică)
`

export const KB_NUTRITIE_AVANSATA = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NUTRIȚIE AVANSATĂ — DOVEZI CLINICE ȘI APLICAȚII
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

PROTEINELE — DOZA OPTIMĂ:
- Minimul: 0.8g/kg/zi (RDA — previne deficiența, NU optimizează)
- Optim sănătate: 1.2-1.6g/kg/zi
- Optim masă musculară: 1.6-2.2g/kg/zi (meta-analiză Morton et al., BJSM 2018, 49 RCT)
- Vârstnici >65 ani: 1.6-2.4g/kg/zi (rezistență anabolică → necesar mai mare)
- Distribuție optimă: 20-40g proteine per masă la 3-4h interval (sinteza proteică maximizată)
- Leucina (aminoacid cheie): prag 2.5-3g leucina/masă pentru a activa mTOR → sinteză proteică
  Surse bogate leucina: zer (11%), carne vită (8%), pui (7.5%), soia (7%)
- Proteine animale vs. vegetale: animale au scor DIAAS superior, dar combinații vegetale pot fi complete

CARBOHIDRAȚII — CRONOBIOLOGIE:
- Carbohidrați dimineața: cresc serotonina, energia, performanța cognitivă
- Carbohidrați seara: paradoxal — pot îmbunătăți somnul (serotonina→melatonina), NU îngrașă dacă
  sunt în limitele calorice zilnice (mitul carbohidraților seara = dezmințit)
- Indexul glicemic vs. sarcina glicemică: IG fără volum = irelevant clinic
  Pepene IG=72 dar porție mică = sarcina glicemică mică (9) → OK
- Carbohidrați rezistenți: hrănesc bacteriile benefice, nu se absorb calorific
  Surse: banane verzi, orez/cartofi răciți, ovăz, leguminoase

GRĂSIMILE — TIPURI ȘI FUNCȚII:
- Omega-3 (EPA+DHA): antiinflamator, cardiprotector, neuroprotector
  EPA: antidepresiv, antiinflamator, reduce TG
  DHA: structural (creier, retina), anti-alzheimer
  Raport optim omega-6/omega-3: <4:1 (modern 15-20:1 → inflamație cronică)
  STUDIU REDUCE-IT (NEJM 2018): EPA 4g/zi reduce evenimente CV cu 25% la pacienți cu risc înalt
- MUFA (oleic acid, ulei de măsline): reduce LDL, crește HDL, antiinflamator
  Dieta mediteraneană: PREDIMED study (NEJM 2013) — reduce evenimente CV cu 30%
- Grăsimi saturate: nu toate egale — C8/C10 (MCT) → cetone direct, C18 (stearic) neutru,
  C12-C16 (lauric, palmitic) → cresc LDL dar și HDL
- Trans: ELIMINATE total (uleiuri hidrogenate) → +23% risc infarct per 2% din calorii

MICRONUTRIENȚI CRITICI SUBDIAGNOSTICAȚI:
- Magneziu: deficit în 45-68% din populație (sol epuizat, procesare alimentară)
  Funcții: 300+ reacții enzimatice, sinteză ATP, reglare zahăr sânge, tensiune
  Semne deficit: crampe musculare, insomnii, anxietate, constipație, migrenă, HTA
- Vitamina D: deficit (<30 ng/mL) în 70-80% europeni iarna
  Funcții: imunitate, oase, hormoni steroizi, insulino-secreție, neuroproteție
  Doza de corecție: 50000 UI/săpt (prescripție) sau 4000-8000 UI/zi → retestat după 3 luni
- Zinc: deficit subclinic în 20-30% (vegetarieni, vârstnici, alcoolici)
  Funcții: imunitate, reproducere, gust/miros, vindecare plăgi, sinteză proteică
- Iod: deficiența cauzei principale de hipotiroidism global (nu Hashimoto)
  Sursă principală: pești, fructe de mare, sare iodată, alge marine (kelp)
- Fier/Feritina: feritina <30 ng/mL = deficit funcțional chiar cu hemoglobina normală
  Simptome: oboseală, căderea părului, libido scăzut, restless legs, performance sportivă scăzută
  Absorbție optimă: fier hemic (carne roșie) > non-hemic (plante); vitamina C crește absorbția x3

ALIMENTELE "STAR" — TOP DENSITATE NUTRIȚIONALĂ:
1. Stridii: zinc (74mg/100g!), B12, fier, seleniu, omega-3, taurina
2. Ficat de vită: B12, fier hemic, vitamina A, folat, cupru, CoQ10
3. Sardine: omega-3 complete (EPA+DHA), calciu (cu oase), vitamina D, B12
4. Ouă (întregi): colină (cel mai bogat), luteina, B12, proteine complete, D
5. Broccoli: sulforafan (anti-cancer), vitamina C, K, folat, fibra
6. Afine: antocianine (ORAC ridicat), pterostilben (anti-aging), cogniție
7. Nuci: omega-3 ALA, vitamina E, magneziu, polifenoli; 30g/zi = -17% mortalitate CV
8. Kefir: probiotice diverse (>50 tulpini), proteine, calciu, K2 (MK-4)
9. Curcuma: curcumina antiinflamatoare (cu piperin +2000% absorbție)
10. Ciocolată neagră >85%: magneziu, fier, flavanoli (endoteliu, cogniție), serotonina
`

// Export combinat pentru sistem prompt
export const KNOWLEDGE_BASE_MEDICAL_V3 = [
  KB_CARDIOVASCULAR,
  KB_OBEZITATE_METABOLISM,
  KB_SANATATE_SEXUALA,
  KB_SANATATE_MENTALA,
  KB_TIMING_SUPLIMENTE,
  KB_NUTRITIE_AVANSATA,
].join('\n\n')
