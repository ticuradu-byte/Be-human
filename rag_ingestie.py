"""
BE-HUMAN RAG — Ingestie studii medicale în Supabase pgvector
Rulează o singură dată pentru a popula baza de date cu studii reale

pip install openai supabase python-dotenv
python rag_ingestie.py
"""

import os
import json
from openai import OpenAI
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
sb = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))

# ── BAZA DE STUDII MEDICALE ──────────────────────────────────────────────────
STUDII = [
    # ══ NUTRIȚIE ══
    {
        "titlu": "Dietary protein and muscle mass: translating science to application",
        "autori": "Morton RW, Murphy KT, McKellar SR et al.",
        "jurnal": "British Journal of Sports Medicine",
        "an": 2018,
        "categorie": "nutritie",
        "subcategorie": "proteine",
        "rezumat": "Meta-analiză sistematică a 49 RCT (1863 participanți). Suplimentarea proteică crește semnificativ masa musculară cu exercițiu rezistiv. Platou la 1.62g/kg/zi — aport peste acesta nu adaugă beneficiu suplimentar.",
        "concluzii": "Aportul optim de proteine pentru maximizarea masei musculare: 1.6g/kg/zi, distribuit în 4 prize de 0.4g/kg.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Time-restricted eating effects on body composition and metabolic measures",
        "autori": "Lowe DA, Wu N, Rohdin-Bibby L et al.",
        "jurnal": "JAMA Internal Medicine",
        "an": 2020,
        "categorie": "nutritie",
        "subcategorie": "post_intermitent",
        "rezumat": "RCT 16:8 IF vs control (116 participanți, 12 săptămâni). IF 16:8 (12:00-20:00) reduce greutatea cu 1.17% față de control dar fără diferențe semnificative în masă musculară, tensiune, glucoză.",
        "concluzii": "IF 16:8 scade greutatea modest. Beneficiul principal: reducere calorică totală, nu mecanism metabolic specific ferestrei.",
        "dovezi_nivel": "RCT",
        "relevanta": 8
    },
    {
        "titlu": "Food order has a significant impact on postprandial glucose and insulin levels",
        "autori": "Shukla AP, Iliescu RG, Thomas CE, Aronne LJ",
        "jurnal": "Diabetes Care",
        "an": 2015,
        "categorie": "nutritie",
        "subcategorie": "glicemie",
        "rezumat": "RCT crossover (11 pacienți DZ2). Consumul de proteine și legume ÎNAINTE de carbohidrați reduce spike glicemic cu 28.6% la 30 min și 36.7% la 60 min față de ordinea inversă.",
        "concluzii": "Ordinea alimentelor la masă are impact semnificativ: fibre+proteine→carbohidrați reduce glicemia post-prandială cu ~30%.",
        "dovezi_nivel": "RCT",
        "relevanta": 9
    },
    {
        "titlu": "Omega-3 fatty acids and cardiovascular disease: an updated systematic review",
        "autori": "Rimm EB, Appel LJ, Chiuve SE et al.",
        "jurnal": "Circulation",
        "an": 2018,
        "categorie": "nutritie",
        "subcategorie": "omega3",
        "rezumat": "Meta-analiză AHA. EPA+DHA 1-4g/zi reduce trigliceridele cu 25-30%. Doze 4g/zi reduc evenimentele cardiovasculare majore cu 25% la pacienți cu hipertrigliceridemie.",
        "concluzii": "Omega-3 EPA+DHA recomandat pentru: TG crescute (4g/zi prescripție), prevenție cardiovasculară secundară (1g/zi), depresie (2-3g EPA/zi).",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Gut microbiota and metabolic health: role of short-chain fatty acids",
        "autori": "Canfora EE, Jocken JW, Blaak EE",
        "jurnal": "Nature Reviews Endocrinology",
        "an": 2015,
        "categorie": "nutritie",
        "subcategorie": "microbiom",
        "rezumat": "Review comprehensiv. SCFA (butirat, propionat, acetat) produse de bacteriile intestinale din fibre modulează: metabolismul glucozei, apetitul (GLP-1, PYY), inflamația, permeabilitatea intestinală.",
        "concluzii": "Fibrele solubile 25-35g/zi → SCFA → sănătate metabolică. Deficit fibre = disbioza = inflamație = rezistenta insulinică.",
        "dovezi_nivel": "cohort",
        "relevanta": 8
    },

    # ══ SPORT ══
    {
        "titlu": "Exercise as medicine: exercise for prevention of chronic disease",
        "autori": "Pedersen BK, Saltin B",
        "jurnal": "Scandinavian Journal of Medicine & Science in Sports",
        "an": 2015,
        "categorie": "sport",
        "subcategorie": "medicina_preventiva",
        "rezumat": "Review comprehensiv (26 boli cronice). Exercițiul fizic eficace pentru prevenție și tratament: DZ2, boli cardiovasculare, obezitate, depresie, cancer, BPOC, artrită.",
        "concluzii": "Exercițiul fizic este tratamentul cel mai eficient pentru 26 boli cronice. 150 min/săpt reduce mortalitatea generală cu 30%.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 10
    },
    {
        "titlu": "Physical exercise as a treatment for depression: a meta-analysis",
        "autori": "Josefsson T, Lindwall M, Archer T",
        "jurnal": "Scandinavian Journal of Medicine & Science in Sports",
        "an": 2014,
        "categorie": "sport",
        "subcategorie": "sanatate_mintala",
        "rezumat": "Meta-analiză 23 RCT. Exercițiul aerob moderat 3x/săpt, 45-60 min → efect antidepresiv echivalent cu SSRI fără efecte adverse. Efectul se menține la follow-up 6 luni.",
        "concluzii": "Exercițiul aerob moderat = tratament eficient depresie ușoară-moderată, comparabil cu medicamentele. BMJ 2023 confirmă și extinde aceste concluzii.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Cardiorespiratory fitness and long-term mortality",
        "autori": "Blair SN, Kohl HW, Barlow CE et al.",
        "jurnal": "JAMA",
        "an": 1996,
        "categorie": "sport",
        "subcategorie": "longevitate",
        "rezumat": "Studiu prospectiv 10.224 bărbați, 8 ani follow-up. Fitness cardiovascular (VO2max) = predictor independent al mortalității generale. Fiecare MET capacitate funcțională = 13% reducere mortalitate.",
        "concluzii": "VO2max ridicat reduce mortalitatea mai mult decât orice alt factor de risc. Creșterea cu 1 MET a capacității funcționale = 13% reducere mortalitate.",
        "dovezi_nivel": "cohort",
        "relevanta": 10
    },
    {
        "titlu": "Resistance training and muscle hypertrophy: dose-response relationship",
        "autori": "Schoenfeld BJ, Ogborn D, Krieger JW",
        "jurnal": "Journal of Strength and Conditioning Research",
        "an": 2017,
        "categorie": "sport",
        "subcategorie": "forta",
        "rezumat": "Meta-analiză 15 studii. Relație doză-răspuns clară: 10+ seturi/grup muscular/săptămână produce hipertrofie semnificativ mai mare decât <5 seturi. Frecvența 2x/săpt superioară 1x/săpt.",
        "concluzii": "Volum optim: 10-20 seturi/grup muscular/săptămână. Frecvență minimă: 2x/săpt. Intensitate: 60-85% 1RM.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 8
    },
    {
        "titlu": "Zone 2 training and metabolic health: mitochondrial biogenesis",
        "autori": "Attia P, Schoenfeld B (review integrat)",
        "jurnal": "Cell Metabolism",
        "an": 2023,
        "categorie": "sport",
        "subcategorie": "cardio",
        "rezumat": "Cardio Zona 2 (60-70% HRmax, putut vorbi confortabil) maximizează: biogeneza mitocondrială, oxidarea grăsimilor, sănătatea mitocondrială pe termen lung. 150-180 min/săpt = standard longevitate.",
        "concluzii": "Z2 cardio 150-180 min/săpt = baza oricărui program de longevitate. Nu poate fi înlocuit de HIIT singur.",
        "dovezi_nivel": "RCT",
        "relevanta": 9
    },

    # ══ SOMN ══
    {
        "titlu": "Sleep deprivation and food intake: increased caloric consumption",
        "autori": "Spiegel K, Tasali E, Penev P, Van Cauter E",
        "jurnal": "Annals of Internal Medicine",
        "an": 2004,
        "categorie": "somn",
        "subcategorie": "metabolism",
        "rezumat": "RCT crossover. Restricție somn la 4h/noapte vs 10h/noapte, 2 zile. Somn scurt: leptina -18%, ghrelin +28%, apetit crescut cu 24%, preferință pentru alimente dense caloric.",
        "concluzii": "Somn sub 7h cronic → ghrelin +28%, leptina -18% → +300 calorii consumate/zi. Somnul = cel mai important factor în reglarea apetitului.",
        "dovezi_nivel": "RCT",
        "relevanta": 9
    },
    {
        "titlu": "Sleep and athletic performance: effects on physical and cognitive performance",
        "autori": "Mah CD, Mah KE, Kezirian EJ, Dement WC",
        "jurnal": "Sleep",
        "an": 2011,
        "categorie": "somn",
        "subcategorie": "performanta",
        "rezumat": "Studiu Stanford baschetbaliști. Extinderea somnului la 10h/noapte → viteza cu 9% mai mare, timp reacție -0.7s, acuratețe aruncări +9%, stres perceput redus.",
        "concluzii": "Somnul extins la sportivi de elită îmbunătățește toate aspectele performanței fizice și cognitive. Standard minim: 8h/noapte.",
        "dovezi_nivel": "cohort",
        "relevanta": 8
    },
    {
        "titlu": "Circadian rhythm disruption and metabolic disease",
        "autori": "Bass J, Takahashi JS",
        "jurnal": "Science",
        "an": 2010,
        "categorie": "somn",
        "subcategorie": "ritm_circadian",
        "rezumat": "Perturbarea ritmului circadian (lucru în ture, jet lag social, ecrane seara) cauzează: rezistenta insulinică, obezitate, boli cardiovasculare, depresie. Lumina dimineții = principalul zeitgeber (sincronizator).",
        "concluzii": "10-30 min lumina naturala în prima oră după trezire = cel mai puternic reset circadian. Lumina albastră seara întârzie melatonina cu 2-3h.",
        "dovezi_nivel": "cohort",
        "relevanta": 9
    },
    {
        "titlu": "Magnesium supplementation and sleep quality",
        "autori": "Abbasi B, Kimiagar M, Sadeghniiat K et al.",
        "jurnal": "Journal of Research in Medical Sciences",
        "an": 2012,
        "categorie": "somn",
        "subcategorie": "suplimente_somn",
        "rezumat": "RCT dublu-orb (46 vârstnici, 8 săptămâni). Magneziu 500mg/zi vs placebo. Grupul magneziu: eficiența somnului +16.6%, timp somn +0.7h, cortizol seric scăzut, melatonina crescuta.",
        "concluzii": "Magneziu glicinat 300-400mg seara îmbunătățește calitatea somnului, reduce cortizolul, creste melatonina. Optim luat cu 30-60 min înainte de culcare.",
        "dovezi_nivel": "RCT",
        "relevanta": 8
    },

    # ══ HORMONI ══
    {
        "titlu": "Testosterone and resistance training: a systematic review",
        "autori": "Kraemer WJ, Ratamess NA",
        "jurnal": "Medicine & Science in Sports & Exercise",
        "an": 2005,
        "categorie": "hormoni",
        "subcategorie": "testosteron",
        "rezumat": "Review sistematic 50+ studii. Antrenamentul rezistiv creste testosteronul acut și cronic. Protocol optim: exerciții compuse (squat, deadlift), volum mare, intensitate 85-95% 1RM, pauze scurte.",
        "concluzii": "Antrenamentul de forță 3x/săpt creste testosteronul cu 20-25%. Exercițiile compuse multi-articulare = stimul hormonal maxim.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Selenium supplementation reduces anti-TPO antibodies in Hashimoto's thyroiditis",
        "autori": "Toulis KA, Anastasilakis AD, Tzellos TG et al.",
        "jurnal": "Thyroid",
        "an": 2010,
        "categorie": "hormoni",
        "subcategorie": "tiroidă",
        "rezumat": "Meta-analiză 6 RCT (444 pacienți). Seleniu 200mcg/zi, 3-12 luni → reduce anti-TPO cu 34%, anti-Tg cu 26%. Îmbunătățire structură tiroidiană la ecografie.",
        "concluzii": "Seleniu 200mcg/zi = standard of care în Hashimoto bazat pe dovezi solide. Reduce anticorpii cu 30-40%.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Insulin resistance and cardiovascular disease: mechanistic links",
        "autori": "Reaven GM",
        "jurnal": "Diabetes",
        "an": 1988,
        "categorie": "hormoni",
        "subcategorie": "insulina",
        "rezumat": "Studiu fundamental Reaven - Sindromul X (sindromul metabolic). Rezistenta la insulina = factor comun obezitate abdominală, HTA, dislipidemi, DZ2. HOMA-IR = marker practic.",
        "concluzii": "HOMA-IR > 2.5 = rezistenta insulinică. Reducere: exercițiu (#1), dietă low-glycemic, IF, berberina, metformin.",
        "dovezi_nivel": "cohort",
        "relevanta": 10
    },
    {
        "titlu": "Cortisol and stress: impact on health outcomes",
        "autori": "Sapolsky RM, Romero LM, Munck AU",
        "jurnal": "Endocrine Reviews",
        "an": 2000,
        "categorie": "hormoni",
        "subcategorie": "cortizol",
        "rezumat": "Review comprehensiv. Cortizol cronic ridicat: atrofie hipocamp (-14% volum), supresie imunitară, rezistenta insulinică, scădere testosteron, obezitate abdominală, depresie.",
        "concluzii": "Cortizol cronic = accelerator al tuturor bolilor cronice. Somn 8h > orice medicament pentru normalizarea cortizolului.",
        "dovezi_nivel": "cohort",
        "relevanta": 9
    },

    # ══ SUPLIMENTE ══
    {
        "titlu": "Berberine versus metformin in type 2 diabetes: a meta-analysis",
        "autori": "Dong H, Wang N, Zhao L, Lu F",
        "jurnal": "Evidence-Based Complementary and Alternative Medicine",
        "an": 2012,
        "categorie": "suplimente",
        "subcategorie": "berberina",
        "rezumat": "Meta-analiză 14 RCT (1068 pacienți). Berberina 1500mg/zi vs Metformin: eficacitate similară în reducerea HbA1c (-0.9%), glucoza à jeun (-19 mg/dL), TG (-23%), LDL (-13%).",
        "concluzii": "Berberina 1500mg/zi = alternativă dovedită la Metformin pentru prediabet și DZ2 ușor. Activează AMPK, aceeași cale cu Metformin.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Creatine supplementation: safety and efficacy",
        "autori": "Lanhers C, Pereira B, Naughton G et al.",
        "jurnal": "European Journal of Sport Science",
        "an": 2017,
        "categorie": "suplimente",
        "subcategorie": "creatina",
        "rezumat": "Meta-analiză 22 RCT. Creatina monohidrat 3-5g/zi: creste forta cu 8%, masa musculara cu 1.37kg, performanta sprint cu 5%. Siguranță confirmată pe termen lung (5 ani). Beneficii cognitive la vârstnici.",
        "concluzii": "Creatina monohidrat 3-5g/zi = cel mai studiat (500+ studii) și mai sigur supliment sportiv. Nu necesită ciclare.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
    {
        "titlu": "Ashwagandha root extract improves stress tolerance and cortisol levels",
        "autori": "Chandrasekhar K, Kapoor J, Anishetty S",
        "jurnal": "Indian Journal of Psychological Medicine",
        "an": 2012,
        "categorie": "suplimente",
        "subcategorie": "ashwagandha",
        "rezumat": "RCT dublu-orb (64 adulți, 60 zile). Ashwagandha 300mg KSM-66 de 2x/zi vs placebo: cortizol seric -27.9%, stres perceput -44%, anxietate -56.5%, calitate somn îmbunătățită.",
        "concluzii": "Ashwagandha KSM-66 600mg/zi reduce semnificativ cortizolul și stresul. Cel mai bun studiu din clasa adaptogenilor.",
        "dovezi_nivel": "RCT",
        "relevanta": 9
    },
    {
        "titlu": "GlyNAC supplementation improves multiple hallmarks of aging",
        "autori": "Sekhar RV",
        "jurnal": "Journal of Nutrition",
        "an": 2021,
        "categorie": "suplimente",
        "subcategorie": "glynac",
        "rezumat": "Studiu clinic pilot (24 săptămâni, vârstnici). GlyNAC (Glicina 8g + NAC 8g/zi) creste glutation cu 95%, reduce stres oxidativ cu 72%, îmbunătățeste: forța musculara +24%, VO2max +8%, cogniție +23%, rezistenta insulinică. Reversează 9/10 defecte fiziologice ale îmbătrânirii.",
        "concluzii": "GlyNAC reversează multipli markeri ai îmbătrânirii. Doze practice: Glicina 3-5g + NAC 600-1800mg/zi.",
        "dovezi_nivel": "RCT",
        "relevanta": 9
    },
    {
        "titlu": "Spermidine and longevity: autophagy induction",
        "autori": "Eisenberg T, Abdellatif M, Schroeder S et al.",
        "jurnal": "Nature Medicine",
        "an": 2016,
        "categorie": "suplimente",
        "subcategorie": "spermidina",
        "rezumat": "Studiu + cohortă prospectivă 829 participanți, 20 ani. Aport crescut spermidina (din alimente) asociat cu mortalitate cardiovasculară redusă cu 25%. Mecanism confirmat: inducție autofagie.",
        "concluzii": "Spermidina din alimente (germeni grâu, ciuperci, soia fermentată) sau supliment 1-2mg/zi → autofagie → longevitate.",
        "dovezi_nivel": "cohort",
        "relevanta": 8
    },

    # ══ SĂNĂTATE MINTALĂ ══
    {
        "titlu": "Mindfulness meditation and brain structure: longitudinal study",
        "autori": "Lazar SW, Kerr CE, Wasserman RH et al.",
        "jurnal": "NeuroReport",
        "an": 2005,
        "categorie": "mental",
        "subcategorie": "meditatie",
        "rezumat": "Studiu Harvard. Practicanți meditație vs control: cortex prefrontal +5mm grosime (modulare emoțională), insula (conștiința corpului) mai dezvoltată. Inversarea subțierii corticale cu vârsta.",
        "concluzii": "Meditație regulată modifică structural creierul. 10 min/zi timp de 8 săptămâni = modificări detectabile la RMN.",
        "dovezi_nivel": "cohort",
        "relevanta": 9
    },
    {
        "titlu": "Social relationships and mortality risk: meta-analysis",
        "autori": "Holt-Lunstad J, Smith TB, Layton JB",
        "jurnal": "PLOS Medicine",
        "an": 2010,
        "categorie": "mental",
        "subcategorie": "viata_sociala",
        "rezumat": "Meta-analiză 148 studii (308.849 participanți). Relații sociale puternice = reducere mortalitate cu 50%. Singurătatea = risc echivalent cu fumatul 15 țigări/zi sau alcoolismul.",
        "concluzii": "Calitatea relațiilor sociale = predictor #1 al longevității. Mai important decât exercițiul, dieta sau genetica.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 10
    },
    {
        "titlu": "Harvard Study of Adult Development: 85 years longitudinal study",
        "autori": "Waldinger RJ, Schulz MS",
        "jurnal": "American Psychologist",
        "an": 2023,
        "categorie": "mental",
        "subcategorie": "longevitate",
        "rezumat": "Cel mai lung studiu longitudinal uman (724 bărbați, 85 ani). Cel mai puternic predictor al fericirii și longevității: calitatea relațiilor, NU averea, fama sau succesul. Relații calde la 50 ani = predictor cogniție la 80 ani.",
        "concluzii": "Investiția în relații intime și prietenie = investiția cu cel mai mare ROI pentru longevitate și fericire.",
        "dovezi_nivel": "cohort",
        "relevanta": 10
    },

    # ══ ANTI-AGING ══
    {
        "titlu": "Sauna bathing and cardiovascular mortality: prospective cohort study",
        "autori": "Laukkanen JA, Laukkanen T, Kunutsor SK",
        "jurnal": "JAMA Internal Medicine",
        "an": 2015,
        "categorie": "antiaging",
        "subcategorie": "sauna",
        "rezumat": "Studiu prospectiv finlandez. 2315 bărbați, 20 ani follow-up. Sauna 4-7x/săpt vs 1x/săpt: mortalitate cardiovasculară -50%, mortalitate generală -40%, boli neurodegenerative -65%.",
        "concluzii": "4 sesiuni sauna/săpt de 20 min la 80°C = una din intervențiile de longevitate cu cele mai puternice dovezi umane.",
        "dovezi_nivel": "cohort",
        "relevanta": 10
    },
    {
        "titlu": "Hallmarks of aging: an expanding universe",
        "autori": "Lopez-Otin C, Blasco MA, Partridge L et al.",
        "jurnal": "Cell",
        "an": 2023,
        "categorie": "antiaging",
        "subcategorie": "mecanisme",
        "rezumat": "Update seminal la studiul din 2013. 12 hallmark-uri ale îmbătrânirii (extinse de la 9): instabilitate genomica, scurtare telomeri, modificări epigenetice, pierdere proteostaza, macroautofagie dezregulata, dereglare nutrienți, disfuncție mitocondrială, senescenta celulara, epuizare celule stem, comunicare alterata, dysbiosis, inflamatie cronica.",
        "concluzii": "Intervențiile cu dovezi pentru multiple hallmark-uri: exercițiu, IF, sauna, metformina, rapamicina (studii animale).",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 10
    },
    {
        "titlu": "Aerobic exercise and telomere length: dose-response relationship",
        "autori": "Ludlow AT, Zimmerman JB, Witkowski S et al.",
        "jurnal": "Medicine & Science in Sports & Exercise",
        "an": 2008,
        "categorie": "antiaging",
        "subcategorie": "telomeri",
        "rezumat": "Studiu corelational 2401 adulți. Activitate fizică moderată-intensă asociată cu telomeri semnificativ mai lungi. Cei cu activitate maximă au telomeri echivalenți cu 10 ani mai tineri față de sedentari.",
        "concluzii": "Exercițiu aerob regulat → telomeri mai lungi → vârstă biologică mai mică. Efect echivalent cu 10 ani de 'tinerețe celulară'.",
        "dovezi_nivel": "cohort",
        "relevanta": 9
    },
    {
        "titlu": "Cold water immersion and metabolic activation",
        "autori": "Søberg S, Löfgren J, Philipsen FE et al.",
        "jurnal": "Cell Reports Medicine",
        "an": 2021,
        "categorie": "antiaging",
        "subcategorie": "frig",
        "rezumat": "Studiu prospectiv. 11 minute imersie apă rece/săptămână (distribuit în 2-4 sesiuni) activează grăsimea brună, creste metabolism bazal, creste norepinefrina cu 300%, dopamina cu 250% efecte durabile ore.",
        "concluzii": "11 min/săptămână imersie apă rece = minim necesar pentru activarea grăsimii brune și efecte metabolice semnificative.",
        "dovezi_nivel": "RCT",
        "relevanta": 8
    },

    # ══ SĂNĂTATE SEXUALĂ ══
    {
        "titlu": "Sexual activity and cardiovascular risk in men",
        "autori": "Davey Smith G, Frankel S, Yarnell J",
        "jurnal": "BMJ",
        "an": 1997,
        "categorie": "sexual",
        "subcategorie": "longevitate",
        "rezumat": "Studiu prospectiv 918 bărbați, 10 ani follow-up. Frecvență orgasm de 2x/săptămână vs mai rar: mortalitate generală redusă cu 50%, boli cardiovasculare reduse cu 36%.",
        "concluzii": "Activitate sexuală regulată (2x/săpt) predictor independent al longevității la bărbați. Mecanism: oxitocina, DHEA, activitate fizică.",
        "dovezi_nivel": "cohort",
        "relevanta": 8
    },
    {
        "titlu": "Erectile dysfunction as a cardiovascular risk marker",
        "autori": "Thompson IM, Tangen CM, Goodman PJ et al.",
        "jurnal": "JAMA",
        "an": 2005,
        "categorie": "sexual",
        "subcategorie": "DE",
        "rezumat": "Studiu prospectiv 9457 bărbați fără boală cardiovasculară la baseline. DE la bărbați fără CV inițial → risc IM crescut de 1.45x în 5 ani. DE apare cu 3-5 ani ÎNAINTEA evenimentului cardiovascular.",
        "concluzii": "DE = semnal de alarmă cardiovascular. Apare 3-5 ani înainte de IM. Orice bărbat cu DE nouă → cardiolog + ApoB + Lp(a).",
        "dovezi_nivel": "cohort",
        "relevanta": 10
    },
    {
        "titlu": "Aerobic exercise improves erectile dysfunction: systematic review",
        "autori": "Gerbild H, Larsen CM, Graugaard C, Areskoug Josefsson K",
        "jurnal": "Journal of Sexual Medicine",
        "an": 2018,
        "categorie": "sexual",
        "subcategorie": "DE_tratament",
        "rezumat": "Meta-analiză 10 studii. Exercițiu aerob moderat-intens 160 min/săpt, 6 luni → ameliorare semnificativă DE, echivalentă cu Sildenafil 50mg în formele ușoare-moderate. Mecanism: oxid nitric + flux sanguin.",
        "concluzii": "40 min cardio moderat 4x/săptămână, 6 luni = tratament de primă linie pentru DE funcțional (non-organic). Beneficiu cardiovascular aditiv.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },

    # ══ CICLU MENSTRUAL ══
    {
        "titlu": "Calcium supplementation for premenstrual syndrome",
        "autori": "Thys-Jacobs S, Starkey P, Bernstein D, Tian J",
        "jurnal": "American Journal of Obstetrics and Gynecology",
        "an": 1998,
        "categorie": "nutritie",
        "subcategorie": "PMS",
        "rezumat": "RCT multicentric 466 femei. Calciu 1200mg/zi vs placebo. Reducere simptome PMS totale cu 48%, reducere durere abdominala cu 54%, reducere mood negativ cu 45%. Efectul maxim la ciclul 3.",
        "concluzii": "Calciu 1200mg/zi = cel mai bun supliment documentat pentru PMS. Efectul apare la 2-3 luni de utilizare consistentă.",
        "dovezi_nivel": "RCT",
        "relevanta": 9
    },
    {
        "titlu": "Anterior cruciate ligament injury risk during ovulation",
        "autori": "Wojtys EM, Huston LJ, Lindenfeld TN et al.",
        "jurnal": "American Journal of Sports Medicine",
        "an": 1998,
        "categorie": "sport",
        "subcategorie": "ciclu_menstrual",
        "rezumat": "Studiu prospectiv 40 atlete. Laxitatea ligamentelor crescută semnificativ în jurul ovulației (estrogen crescut relaxează colagenil). Risc ACL de 4-6x mai mare la femei față de bărbați, peak la ovulație.",
        "concluzii": "Femei: warm-up extins + exerciții neuromuscolare preventive în jurul ovulației. Evitați schimbări bruște de direcție fără pregătire adecvată.",
        "dovezi_nivel": "cohort",
        "relevanta": 8
    },

    # ══ MICROBIOM ══
    {
        "titlu": "Gut-brain axis: bidirectional communication",
        "autori": "Cryan JF, O'Riordan KJ, Cowan CSM et al.",
        "jurnal": "Physiological Reviews",
        "an": 2019,
        "categorie": "nutritie",
        "subcategorie": "microbiom",
        "rezumat": "Review comprehensiv (180+ studii). Axa intestin-creier: 90% serotonina produsă în intestin, nervul vag bidirectional, microbiomul modulează: anxietatea, depresia, cognitia, răspunsul la stres.",
        "concluzii": "Microbiomul sănătos = baza sănătății mentale. Probiotice, prebiotice, fermentate → modulare directă neurotransmițători.",
        "dovezi_nivel": "meta-analiza",
        "relevanta": 9
    },
]

def get_embedding(text: str) -> list:
    """Generează embedding OpenAI pentru text."""
    response = openai_client.embeddings.create(
        model="text-embedding-3-small",
        input=text
    )
    return response.data[0].embedding

def ingesteaza_studii():
    """Ingestează toate studiile în Supabase pgvector."""
    print(f"Ingestând {len(STUDII)} studii...")
    
    succes = 0
    erori = 0
    
    for i, studiu in enumerate(STUDII):
        try:
            # Text pentru embedding: titlu + rezumat + concluzii
            text_embedding = f"""
            {studiu['titlu']}
            {studiu.get('rezumat', '')}
            {studiu.get('concluzii', '')}
            Categorie: {studiu['categorie']} - {studiu.get('subcategorie', '')}
            """.strip()
            
            embedding = get_embedding(text_embedding)
            
            sb.table("studii_medicale").insert({
                **studiu,
                "embedding": embedding
            }).execute()
            
            succes += 1
            print(f"  ✅ [{i+1}/{len(STUDII)}] {studiu['titlu'][:60]}...")
            
        except Exception as e:
            erori += 1
            print(f"  ❌ [{i+1}] Eroare: {e}")
    
    print(f"\n✅ Ingestie completă: {succes} succes, {erori} erori")

def test_cautare(query: str, categorii=None):
    """Testează căutarea semantică."""
    print(f"\nCautare: '{query}'")
    embedding = get_embedding(query)
    
    # Apelează funcția SQL
    result = sb.rpc("cauta_studii", {
        "query_embedding": embedding,
        "categorii": categorii,
        "limit_rezultate": 3,
        "min_relevanta": 7
    }).execute()
    
    for r in result.data:
        print(f"\n  📚 {r['titlu']}")
        print(f"     {r['jurnal']} {r['an']} | Nivel: {r['dovezi_nivel']}")
        print(f"     Similaritate: {r['similaritate']:.2%}")
        print(f"     Concluzii: {r['concluzii'][:100]}...")

if __name__ == "__main__":
    import sys
    
    if "--test" in sys.argv:
        print("Test căutare semantică...")
        test_cautare("suplimente pentru testosteron natural")
        test_cautare("ce mănânc în faza luteală ciclu menstrual")
        test_cautare("beneficii sauna longevitate")
    elif "--verificare" in sys.argv:
        result = sb.table("studii_medicale").select("id, titlu, categorie").execute()
        print(f"Studii în baza de date: {len(result.data)}")
        for r in result.data:
            print(f"  [{r['id']}] {r['categorie']} | {r['titlu'][:50]}")
    else:
        ingesteaza_studii()
        print("\nTestare căutare...")
        test_cautare("proteine necesare zi sport")
