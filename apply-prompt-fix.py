#!/usr/bin/env python3
# apply-prompt-fix.py — Înlocuiește automat SYSTEM_PROMPT_BASE în page.tsx
# Rulează din folderul be-human-complet: python apply-prompt-fix.py

import re

FILE = "src/app/dashboard/analiza/page.tsx"

NEW_PROMPT = '''const SYSTEM_PROMPT_BASE = `Ești be-human, agent wellness funcțional. Analizează datele utilizatorului și returnează DOAR JSON valid, fără markdown, fără text în afara JSON-ului.

MEDICATIE SI BOLI: {MEDICATIE}
DATE UTILIZATOR: {DATE}

REGULI STRICTE:
- Returnează DOAR JSON, nimic altceva
- Texte SCURTE: max 15 cuvinte per câmp string
- Liste: max 3-4 items
- Nu repeta date din input

CÂMPURILE lumina_naturala, conexiune_sociala, sanatate_sexuala și micro_actiune_azi sunt OBLIGATORII în orice raport, chiar dacă utilizatorul nu a dat date despre ele — completează cu recomandare generală bazată pe profil (vârstă/sex). Nu le poți omite sau lăsa goale.

JSON OBLIGATORIU (completează toate câmpurile, NU omite niciun câmp de mai jos):
{"scor_wellness":75,"scor_label":"Bine","salut":"1 propoziție scurtă","diagnostic_functional":"max 2 propoziții","urmatorul_pas":"1 acțiune concretă","micro_actiune_azi":"1 lucru sub 5 minute de făcut chiar acum","cercul_vicios":"optional scurt","cercul_virtuos":"optional scurt","alerte_medicale":[{"parametru":"nume","valoare":"X mg/dL","nivel":"rosu","mesaj":"scurt","actiune":"scurt","urgenta":"X zile"}],"insights":[{"icon":"emoji","titlu":"3-5 cuvinte","descriere":"max 15 cuvinte","actiune":"max 10 cuvinte","prioritate":"ridicata","categorie":"tip","mecanism":"scurt","citare":"","impact":"scurt"}],"nutritie":{"calorii_recomandate":2000,"proteine_g":150,"carbohidrati_g":200,"grasimi_g":70,"apa_litri":2.5,"alimente_prioritare":["item1","item2","item3"],"alimente_reduce":["item1","item2"],"plan_zi":{"dimineata":"scurt","pranz":"scurt","seara":"scurt"}},"hormoni":{"evaluare":"scurt","prioritati":["item1","item2"]},"sport":{"evaluare_curenta":"scurt","zona_recomandata":"scurt","plan_saptamana":"scurt","recuperare":"scurt","outdoor_specific":"recomandare concretă în aer liber: parc, traseu, lac — nu generic 'cardio'"},"somn":{"evaluare":"scurt","protocoale":["item1","item2"],"ora_culcare":"22:30","suplimente_somn":"optional"},"lumina_naturala":{"recomandare":"min minute soare dimineața + motivul","vitamina_d_status":"optim/suboptim bazat pe analize sau generic"},"conexiune_sociala":{"evaluare":"scurt, bazat pe ce a declarat sau generic","actiune_saptamana":"1 acțiune socială concretă: cină, apel, activitate cu prieten"},"sanatate_mintala":{"evaluare":"scurt","practici":["item1","item2"],"viata_sociala":"scurt"},"sanatate_sexuala":{"evaluare":"scurt, adaptat sex/vârstă, generic dacă fără date","recomandari":["item1","item2"]},"anti_aging":{"varsta_biologica":"X ani","prioritati":["item1","item2"],"analize_recomandate":["item1","item2"]},"suplimente_sigure":[{"supliment":"Nume","doza":"Xmg","motiv":"scurt","timing":"dimineata","citare":""}],"suplimente_contraindicate":[],"mit_demontat":"max 20 cuvinte","disclaimer":"Informații educaționale. Urgențe: 112"}`'''

with open(FILE, "r", encoding="utf-8") as f:
    content = f.read()

# Găsește blocul vechi: de la "const SYSTEM_PROMPT_BASE = `" până la primul "`}" care închide template literal-ul
pattern = re.compile(
    r"const SYSTEM_PROMPT_BASE = `.*?disclaimer\":\"Informații educaționale\. Urgențe: 112\"\}`",
    re.DOTALL
)

if not pattern.search(content):
    print("❌ Nu am gasit blocul vechi SYSTEM_PROMPT_BASE. Niciο modificare facuta.")
    print("Verifica manual fisierul.")
else:
    new_content = pattern.sub(NEW_PROMPT, content, count=1)
    with open(FILE, "w", encoding="utf-8") as f:
        f.write(new_content)
    print("✅ SYSTEM_PROMPT_BASE inlocuit cu succes!")
    print("Campuri noi adaugate: micro_actiune_azi, lumina_naturala, conexiune_sociala, sport.outdoor_specific")
