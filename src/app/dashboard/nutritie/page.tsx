'use client'
// src/app/dashboard/nutritie/page.tsx
// Program nutriție săptămânal personalizat — high protein, low carb, healthy fats

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/supabase'

// ── TIPURI ────────────────────────────────────────────────────────────────────
interface Masa {
  ora: string
  nume: string
  descriere: string
  proteine: number
  carbohidrati: number
  grasimi: number
  calorii: number
  ingrediente: string[]
  prep: string
}

interface ZiNutritie {
  zi: string
  ziScurt: string
  temaZi: string
  mese: Masa[]
  totalProteine: number
  totalCarbs: number
  totalGrasimi: number
  totalCalorii: number
  sfatZi: string
}

// ── GENERATOR PROGRAM ─────────────────────────────────────────────────────────
function genereazaProgram(profil: any): ZiNutritie[] {
  const greutate = parseFloat(profil?.greutate_kg || profil?.greutate || '80')
  const inaltime = parseFloat(profil?.inaltime_cm || profil?.inaltime || '175')
  const sex = profil?.sex || 'M'
  const activitate = profil?.activitate || 'moderat'
  const obiective = profil?.obiective || []
  const dieta = profil?.dieta || profil?.tip_dieta || 'omnivora'

  // Calculează necesarul caloric (Mifflin-St Jeor)
  let bmr = sex === 'M'
    ? 10 * greutate + 6.25 * inaltime - 5 * 30 + 5
    : 10 * greutate + 6.25 * inaltime - 5 * 30 - 161

  const factorActivitate: Record<string, number> = {
    sedentar: 1.2, usor: 1.375, moderat: 1.55, activ: 1.725, very_activ: 1.9
  }
  let tdee = Math.round(bmr * (factorActivitate[activitate] || 1.55))

  // Ajustare obiective
  const vreaSlabire = obiective.includes('slabire')
  const vreaMasa = obiective.includes('masa_musculara')
  if (vreaSlabire) tdee -= 400
  if (vreaMasa) tdee += 200

  // Macro targets: 35% proteine, 30% carbohidrați, 35% grăsimi
  const proteine = Math.round((tdee * 0.35) / 4)
  const carbs = Math.round((tdee * 0.30) / 4)
  const grasimi = Math.round((tdee * 0.35) / 9)

  const eVegetarian = ['vegetariana', 'vegana', 'pescatariana'].includes(dieta)

  const zile: ZiNutritie[] = [
    {
      zi: 'Luni', ziScurt: 'Lu', temaZi: '💪 Zi de proteine lean',
      sfatZi: 'Luni e ziua perfectă pentru reset metabolic. Concentrează-te pe proteine slabe și legume bogate în fibre.',
      mese: [
        {
          ora: '07:30', nume: 'Mic dejun proteic',
          descriere: eVegetarian ? 'Omletă din tofu + avocado + spanac' : 'Omletă 3 ouă + somon afumat + avocado',
          proteine: 35, carbohidrati: 8, grasimi: 22, calorii: Math.round(tdee * 0.25),
          ingrediente: eVegetarian
            ? ['200g tofu', '½ avocado', 'Spanac proaspăt', '1 lingură ulei cocos', 'Sare, piper, turmeric']
            : ['3 ouă', '80g somon afumat', '½ avocado', 'Spanac', '1 linguriță unt ghee'],
          prep: '10 minute'
        },
        {
          ora: '12:30', nume: 'Prânz putere',
          descriere: eVegetarian ? 'Bowl quinoa + naut + legume grilate + tahini' : 'Piept pui grillat + salată mare + ulei măsline',
          proteine: 45, carbohidrati: 25, grasimi: 18, calorii: Math.round(tdee * 0.35),
          ingrediente: eVegetarian
            ? ['150g quinoa gătit', '200g naut', 'Ardei, dovlecel, vinete grilate', '2 linguri tahini', 'Lămâie, usturoi']
            : ['200g piept pui', 'Salată verde mare', 'Roșii cherry', 'Castraveți', '2 linguri ulei măsline extra virgin', 'Lămâie'],
          prep: '20 minute'
        },
        {
          ora: '16:00', nume: 'Gustare inteligentă',
          descriere: 'Iaurt grecesc + nuci + afine',
          proteine: 20, carbohidrati: 15, grasimi: 12, calorii: Math.round(tdee * 0.15),
          ingrediente: ['200g iaurt grecesc 10%', '30g nuci/migdale', '100g afine proaspete', '1 linguriță scorțișoară'],
          prep: '2 minute'
        },
        {
          ora: '19:30', nume: 'Cină ușoară',
          descriere: eVegetarian ? 'Supă cremă linte roșie + pâine integral' : 'Somon la cuptor + broccoli aburit + lămâie',
          proteine: 38, carbohidrati: 15, grasimi: 20, calorii: Math.round(tdee * 0.25),
          ingrediente: eVegetarian
            ? ['200g linte roșie', 'Morcov, țelină, ceapă', 'Lapte cocos', 'Cumin, turmeric', '1 felie pâine integral']
            : ['200g somon atlantic', '300g broccoli', '1 linguriță ulei măsline', 'Usturoi, lămâie', 'Sare roz himalaya'],
          prep: '25 minute'
        },
      ],
      totalProteine: proteine, totalCarbs: carbs, totalGrasimi: grasimi, totalCalorii: tdee
    },
    {
      zi: 'Marți', ziScurt: 'Ma', temaZi: '🥑 Zi de grăsimi sănătoase',
      sfatZi: 'Grăsimile sănătoase îți hrănesc creierul, echilibrează hormonii și îți dau energie susținută toată ziua.',
      mese: [
        {
          ora: '07:30', nume: 'Mic dejun keto-friendly',
          descriere: 'Smoothie avocado + spanac + lapte cocos + proteine',
          proteine: 30, carbohidrati: 10, grasimi: 28, calorii: Math.round(tdee * 0.25),
          ingrediente: ['1 avocado mare', '200ml lapte cocos', 'Spanac baby', '1 scoop proteină vanilie', '1 linguriță ulei MCT', 'Ghimbir'],
          prep: '5 minute'
        },
        {
          ora: '12:30', nume: 'Prânz mediteranean',
          descriere: eVegetarian ? 'Falafel + humus + salată + ulei măsline' : 'Macrou la grătar + salată grecească + ulei măsline',
          proteine: 42, carbohidrati: 20, grasimi: 25, calorii: Math.round(tdee * 0.35),
          ingrediente: eVegetarian
            ? ['6 falafel', '4 linguri humus', 'Roșii, castraveți, măsline', 'Brânză feta', '2 linguri ulei măsline']
            : ['200g macrou', 'Roșii, castraveți, măsline kalamata', 'Brânză feta', '2 linguri ulei măsline', 'Oregano'],
          prep: '15 minute'
        },
        {
          ora: '16:00', nume: 'Gustare omega-3',
          descriere: 'Sardine pe crackers integral + roșii cherry',
          proteine: 22, carbohidrati: 12, grasimi: 14, calorii: Math.round(tdee * 0.15),
          ingrediente: ['1 conservă sardine în ulei măsline', '4 crackers integral', 'Roșii cherry', 'Pătrunjel'],
          prep: '3 minute'
        },
        {
          ora: '19:30', nume: 'Cină antiinflamatoare',
          descriere: eVegetarian ? 'Curry naut + lapte cocos + orez brun' : 'Pui turmeric + legume wok + semințe',
          proteine: 36, carbohidrati: 18, grasimi: 22, calorii: Math.round(tdee * 0.25),
          ingrediente: eVegetarian
            ? ['300g naut', '200ml lapte cocos', '100g orez brun', 'Turmeric, ghimbir, scorțișoară', 'Ulei cocos']
            : ['200g pui', 'Ardei colorați, broccoli, morcov', '2 linguri ulei cocos', 'Turmeric, ghimbir, usturoi', 'Semințe susan'],
          prep: '20 minute'
        },
      ],
      totalProteine: proteine, totalCarbs: Math.round(carbs * 0.85), totalGrasimi: Math.round(grasimi * 1.15), totalCalorii: tdee
    },
    {
      zi: 'Miercuri', ziScurt: 'Mi', temaZi: '🥗 Zi de fibre și detox',
      sfatZi: 'Ziua de mijloc e perfectă pentru reset digestiv. Fibrele hrănesc microbiomul și reduc inflamația.',
      mese: [
        {
          ora: '07:30', nume: 'Mic dejun fiber boost',
          descriere: 'Overnight oats + semințe chia + fructe de pădure',
          proteine: 25, carbohidrati: 30, grasimi: 15, calorii: Math.round(tdee * 0.25),
          ingrediente: ['80g ovăz integral', '200ml lapte migdale', '2 linguri semințe chia', '100g fructe pădure mixte', '1 lingură miere crudă', '1 scoop colagen'],
          prep: '5 min + 8h repaus'
        },
        {
          ora: '12:30', nume: 'Prânz rainbow bowl',
          descriere: 'Bowl colorat cu 7 legume + proteină + dressing tahini-lămâie',
          proteine: 38, carbohidrati: 28, grasimi: 16, calorii: Math.round(tdee * 0.35),
          ingrediente: eVegetarian
            ? ['150g edamame', 'Sfeclă roșie rasă', 'Morcov, varză roșie', 'Avocado', 'Semințe floarea soarelui', '2 linguri tahini + lămâie']
            : ['150g ton', 'Sfeclă, morcov, varză mov', 'Avocado', 'Castraveți', 'Semințe dovleac', 'Dressing tahini'],
          prep: '15 minute'
        },
        {
          ora: '16:00', nume: 'Gustare prebiotică',
          descriere: 'Măr + unt de migdale + scorțișoară',
          proteine: 8, carbohidrati: 25, grasimi: 12, calorii: Math.round(tdee * 0.12),
          ingrediente: ['1 măr verde', '2 linguri unt migdale natural', 'Scorțișoară Ceylon', 'Opțional: 1 dată medjool'],
          prep: '2 minute'
        },
        {
          ora: '19:30', nume: 'Cină ușoară digestivă',
          descriere: 'Supă miso + tofu + legume + alge wakame',
          proteine: 28, carbohidrati: 12, grasimi: 10, calorii: Math.round(tdee * 0.23),
          ingrediente: ['2 linguri pastă miso', '150g tofu ferm', 'Alge wakame', 'Ceapă verde', 'Ciuperci shiitake', 'Ghimbir'],
          prep: '15 minute'
        },
      ],
      totalProteine: Math.round(proteine * 0.9), totalCarbs: Math.round(carbs * 1.1), totalGrasimi: Math.round(grasimi * 0.9), totalCalorii: Math.round(tdee * 0.95)
    },
    {
      zi: 'Joi', ziScurt: 'Jo', temaZi: '💪 Zi de încărcare proteică',
      sfatZi: 'Joi e ziua de maximizat sinteza proteică — ideal după antrenament de forță. Proteine la fiecare masă.',
      mese: [
        {
          ora: '07:00', nume: 'Mic dejun anabolic',
          descriere: eVegetarian ? 'Pancakes proteice din ovăz + unt migdale' : 'Ouă poșate + friptură slabă + roșii',
          proteine: 42, carbohidrati: 15, grasimi: 18, calorii: Math.round(tdee * 0.27),
          ingrediente: eVegetarian
            ? ['100g ovăz', '1 scoop proteină', '2 ouă', 'Lapte migdale', 'Unt migdale', 'Afine']
            : ['3 ouă poșate', '150g mușchi vită', 'Roșii', 'Spanac', 'Ulei măsline'],
          prep: '15 minute'
        },
        {
          ora: '12:30', nume: 'Prânz masă musculară',
          descriere: eVegetarian ? 'Tempeh + linte + orez brun + legume' : 'Piept curcan + cartofi dulci + fasole verde',
          proteine: 50, carbohidrati: 35, grasimi: 14, calorii: Math.round(tdee * 0.35),
          ingrediente: eVegetarian
            ? ['200g tempeh', '100g linte', '100g orez brun', 'Broccoli, ardei', 'Sos soia tamari']
            : ['250g piept curcan', '150g cartof dulce', '200g fasole verde', 'Usturoi, rozmarin', 'Ulei măsline'],
          prep: '25 minute'
        },
        {
          ora: '16:00', nume: 'Shake post-antrenament',
          descriere: 'Shake proteine + banană + lapte + creatină',
          proteine: 35, carbohidrati: 28, grasimi: 5, calorii: Math.round(tdee * 0.18),
          ingrediente: ['1.5 scoop proteină zer/vegetală', '1 banană', '300ml lapte/lapte ovăz', '3g creatină monohidrat', 'Ghimbir'],
          prep: '2 minute'
        },
        {
          ora: '19:30', nume: 'Cină proteică ușoară',
          descriere: eVegetarian ? 'Skyr + semințe + nuci + fructe de pădure' : 'Cod la cuptor + sparanghel + lămâie',
          proteine: 40, carbohidrati: 10, grasimi: 12, calorii: Math.round(tdee * 0.20),
          ingrediente: eVegetarian
            ? ['300g skyr natural', '2 linguri semințe mix', 'Nuci', 'Fructe de pădure', 'Scorțișoară']
            : ['220g cod atlantic', '300g sparanghel', 'Lămâie', 'Usturoi', 'Ulei măsline', 'Capere'],
          prep: '20 minute'
        },
      ],
      totalProteine: Math.round(proteine * 1.15), totalCarbs: Math.round(carbs * 0.9), totalGrasimi: Math.round(grasimi * 0.9), totalCalorii: tdee
    },
    {
      zi: 'Vineri', ziScurt: 'Vi', temaZi: '🫒 Zi mediteraneană',
      sfatZi: 'Dieta mediteraneană reduce riscul cardiovascular cu 30%. Vineri e ziua perfectă pentru ulei măsline, pește și leguminoase.',
      mese: [
        {
          ora: '07:30', nume: 'Mic dejun mediteranean',
          descriere: 'Iaurt + miere + nuci + granola low-sugar + rodie',
          proteine: 22, carbohidrati: 28, grasimi: 18, calorii: Math.round(tdee * 0.25),
          ingrediente: ['200g iaurt grecesc', '1 linguriță miere crudă', '30g nuci', '3 linguri granola', 'Semințe rodie', 'Scorțișoară'],
          prep: '3 minute'
        },
        {
          ora: '12:30', nume: 'Prânz levantine',
          descriere: eVegetarian ? 'Humus + falafel + tabbouleh + pita integral' : 'Doradă la grătar + salată mediteraneană + humus',
          proteine: 38, carbohidrati: 30, grasimi: 22, calorii: Math.round(tdee * 0.35),
          ingrediente: eVegetarian
            ? ['5 falafel', '5 linguri humus', 'Tabbouleh (pătrunjel, bulgur, roșii, lămâie)', '1 pita integral', 'Măsline kalamata']
            : ['200g doradă', 'Roșii, castraveți, ceapă roșie', 'Măsline, capere', '4 linguri humus', 'Ulei măsline extra virgin'],
          prep: '20 minute'
        },
        {
          ora: '16:00', nume: 'Gustare antioxidantă',
          descriere: 'Nuci mixte + ciocolată neagră 85% + ceai verde',
          proteine: 10, carbohidrati: 12, grasimi: 20, calorii: Math.round(tdee * 0.13),
          ingrediente: ['30g nuci mixte (migdale, caju, nuci pecan)', '20g ciocolată neagră 85%+', 'Ceai verde matcha sau sencha'],
          prep: '1 minut'
        },
        {
          ora: '19:30', nume: 'Cină relaxată',
          descriere: eVegetarian ? 'Pasta integral + sos marinara + parmezan + busuioc' : 'Pește la cuptor cu ierburi + cartofi la cuptor + salată',
          proteine: 32, carbohidrati: 22, grasimi: 18, calorii: Math.round(tdee * 0.27),
          ingrediente: eVegetarian
            ? ['120g pasta integral', 'Sos roșii naturale', 'Parmezan', 'Busuioc proaspăt', 'Ulei măsline']
            : ['200g file pește alb', 'Rozmarin, cimbru, lămâie', '2 cartofi medii la cuptor', 'Salată verde + ulei măsline'],
          prep: '30 minute'
        },
      ],
      totalProteine: Math.round(proteine * 0.95), totalCarbs: Math.round(carbs * 1.05), totalGrasimi: grasimi, totalCalorii: tdee
    },
    {
      zi: 'Sâmbătă', ziScurt: 'Sb', temaZi: '🥩 Zi de brunch & batch cooking',
      sfatZi: 'Weekend-ul e perfect pentru batch cooking — gătești pentru 3 zile și îți asiguri mese sănătoase toată săptămâna.',
      mese: [
        {
          ora: '09:30', nume: 'Brunch proteic',
          descriere: eVegetarian ? 'Shakshuka vegană + pâine sourdough' : 'Shakshuka cu ouă + cârnați de pui + pâine sourdough',
          proteine: 35, carbohidrati: 25, grasimi: 20, calorii: Math.round(tdee * 0.30),
          ingrediente: eVegetarian
            ? ['400g roșii zdrobite', '1 ardei roșu', 'Ceapă, usturoi', 'Cumin, paprika', 'Tofu', '1 felie pâine sourdough']
            : ['3 ouă', '400g roșii zdrobite', '1 ardei roșu', 'Cârnați pui', 'Ceapă, usturoi', '1 felie pâine sourdough'],
          prep: '20 minute'
        },
        {
          ora: '13:30', nume: 'Prânz batch cooking',
          descriere: 'Bol cu orez brun + proteină + legume prăjite + sos tahini-miso',
          proteine: 42, carbohidrati: 35, grasimi: 18, calorii: Math.round(tdee * 0.38),
          ingrediente: eVegetarian
            ? ['200g orez brun', '200g tofu crocant', 'Broccoli, morcov, ardei la cuptor', 'Sos miso-tahini', 'Semințe susan']
            : ['150g orez brun', '200g pui', 'Legume mixte la cuptor', 'Sos tahini-miso', 'Semințe susan negre'],
          prep: '35 minute (batch pentru 2 zile)'
        },
        {
          ora: '17:00', nume: 'Gustare socială',
          descriere: 'Platou humus + legume crude + nuci + fructe',
          proteine: 15, carbohidrati: 20, grasimi: 15, calorii: Math.round(tdee * 0.17),
          ingrediente: ['Humus de casă', 'Morcovi, țelină, ardei crude', 'Nuci mixte', 'Struguri', 'Smochine proaspete'],
          prep: '5 minute'
        },
        {
          ora: '20:00', nume: 'Cină de weekend',
          descriere: eVegetarian ? 'Pizza cauliflower + mozzarella + legume' : 'Friptură slabă + salată coleslaw + cartofi dulci',
          proteine: 38, carbohidrati: 20, grasimi: 22, calorii: Math.round(tdee * 0.25),
          ingrediente: eVegetarian
            ? ['Base cauliflower', 'Sos roșii', 'Mozzarella di bufala', 'Roșii cherry, busuioc, rucola', 'Ulei trufe']
            : ['200g mușchi vită/porc slab', 'Varză, morcov pentru coleslaw', '150g cartof dulce', 'Ulei măsline', 'Ierburi aromatice'],
          prep: '30 minute'
        },
      ],
      totalProteine: proteine, totalCarbs: Math.round(carbs * 1.1), totalGrasimi: grasimi, totalCalorii: Math.round(tdee * 1.1)
    },
    {
      zi: 'Duminică', ziScurt: 'Du', temaZi: '🌿 Zi de reset & longevitate',
      sfatZi: 'Duminică e ziua de detox și longevitate. Post scurt + mese antiinflamatorii + hidratare maximă pregătesc corpul pentru săptămâna nouă.',
      mese: [
        {
          ora: '10:00', nume: 'Mic dejun târziu (mini-post)',
          descriere: 'Smoothie verde + semințe + collagen + lămâie',
          proteine: 20, carbohidrati: 20, grasimi: 12, calorii: Math.round(tdee * 0.20),
          ingrediente: ['300ml apă cocos', 'Spanac, castraveți, ghimbir', '1 linguriță spirulină', '1 scoop colagen', 'Lămâie, mentă', '1 lingură semințe chia'],
          prep: '5 minute'
        },
        {
          ora: '13:00', nume: 'Prânz longevitate',
          descriere: 'Bowl longevitate: leguminoase + cereale integrale + legume + ierburi',
          proteine: 35, carbohidrati: 32, grasimi: 16, calorii: Math.round(tdee * 0.35),
          ingrediente: eVegetarian
            ? ['200g fasole neagră', '100g quinoa', 'Avocado', 'Varză kale', 'Rodie', 'Dressing lămâie-tahini']
            : ['100g fasole', '100g quinoa', '150g pui', 'Avocado', 'Varză kale', 'Semințe rodie'],
          prep: '20 minute'
        },
        {
          ora: '16:30', nume: 'Gustare antioxidantă',
          descriere: 'Ceai matcha + trufe cacao (homemade)',
          proteine: 5, carbohidrati: 15, grasimi: 10, calorii: Math.round(tdee * 0.10),
          ingrediente: ['1 linguriță matcha ceremonial', 'Lapte ovăz', '20g ciocolată neagră 90%', 'Curmale, nuci caju, cacao'],
          prep: '10 minute'
        },
        {
          ora: '19:00', nume: 'Cină ușoară de reset',
          descriere: 'Supă cremă legume + semințe + pâine integral',
          proteine: 18, carbohidrati: 25, grasimi: 12, calorii: Math.round(tdee * 0.25),
          ingrediente: ['Dovleac, morcov, ghimbir, turmeric', 'Lapte cocos', 'Semințe dovleac prăjite', '1 felie pâine integrală', 'Ulei măsline la final'],
          prep: '25 minute'
        },
      ],
      totalProteine: Math.round(proteine * 0.85), totalCarbs: Math.round(carbs * 0.9), totalGrasimi: Math.round(grasimi * 0.9), totalCalorii: Math.round(tdee * 0.85)
    },
  ]

  return zile
}

// ── COMPONENTA PRINCIPALĂ ─────────────────────────────────────────────────────
export default function NutritiePage() {
  const supabase = createBrowserClient()
  const [profil, setProfil] = useState<any>(null)
  const [ziActiva, setZiActiva] = useState(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1)
  const [masaActiva, setMasaActiva] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [program, setProgram] = useState<ZiNutritie[]>([])

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('utilizatori').select('profil_complet').eq('id', user.id).single()
      const p = data?.profil_complet || {}
      setProfil(p)
      setProgram(genereazaProgram(p))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-3xl animate-pulse">🥗</div>
    </div>
  )

  const zi = program[ziActiva]
  if (!zi) return null

  const macroColor = { p: '#f87171', c: '#60a5fa', g: '#4ade80' }

  return (
    <div className="fade-in space-y-4 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-white mb-1">🥗 Planul tău de nutriție</h1>
        <p className="text-white/40 text-sm">High protein · Low carb · Grăsimi sănătoase · Personalizat pentru tine</p>
      </div>

      {/* Macro targets card */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-4">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">🎯 Targeturi zilnice personalizate</div>
        <div className="grid grid-cols-4 gap-2">
          {[
            { l: 'Calorii', v: zi.totalCalorii, u: 'kcal', c: '#facc15' },
            { l: 'Proteine', v: zi.totalProteine, u: 'g', c: macroColor.p },
            { l: 'Carbohidrați', v: zi.totalCarbs, u: 'g', c: macroColor.c },
            { l: 'Grăsimi', v: zi.totalGrasimi, u: 'g', c: macroColor.g },
          ].map((m, i) => (
            <div key={i} className="text-center p-3 bg-white/[0.03] rounded-xl border border-white/[0.06]">
              <div className="text-lg font-bold leading-none" style={{ color: m.c }}>{m.v}</div>
              <div className="text-[9px] text-white/30 mt-0.5">{m.u}</div>
              <div className="text-[9px] text-white/20 mt-0.5">{m.l}</div>
            </div>
          ))}
        </div>
        {/* Macro bar */}
        <div className="mt-3 h-2 rounded-full overflow-hidden flex gap-0.5">
          <div className="h-full rounded-l-full" style={{ width: '35%', background: macroColor.p }} />
          <div className="h-full" style={{ width: '30%', background: macroColor.c }} />
          <div className="h-full rounded-r-full" style={{ width: '35%', background: macroColor.g }} />
        </div>
        <div className="flex justify-between text-[9px] text-white/25 mt-1">
          <span>35% proteine</span>
          <span>30% carbohidrați</span>
          <span>35% grăsimi</span>
        </div>
      </div>

      {/* Selector zile */}
      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {program.map((z, i) => (
          <button key={i} onClick={() => { setZiActiva(i); setMasaActiva(null) }}
            className={`flex-shrink-0 flex flex-col items-center px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              ziActiva === i
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'text-white/35 hover:text-white/60 border border-white/[0.07]'
            }`}>
            <span className="text-base mb-0.5">{z.temaZi.split(' ')[0]}</span>
            <span>{z.ziScurt}</span>
          </button>
        ))}
      </div>

      {/* Tema zilei */}
      <div className="bg-green-500/[0.06] border border-green-500/[0.15] rounded-2xl p-4">
        <div className="text-sm font-semibold text-green-400 mb-1">{zi.temaZi}</div>
        <p className="text-xs text-white/50 leading-relaxed">{zi.sfatZi}</p>
      </div>

      {/* Mesele zilei */}
      <div className="space-y-2">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider">Mesele zilei — {zi.zi}</div>
        {zi.mese.map((masa, i) => (
          <div key={i} className="bg-white/[0.02] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div
              className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/[0.02] transition-all"
              onClick={() => setMasaActiva(masaActiva === i ? null : i)}
            >
              {/* Ora */}
              <div className="text-center flex-shrink-0 w-12">
                <div className="text-xs font-bold text-green-400">{masa.ora}</div>
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white/85">{masa.nume}</div>
                <div className="text-xs text-white/40 mt-0.5 truncate">{masa.descriere}</div>
                <div className="flex gap-3 mt-1.5 text-[10px]">
                  <span style={{ color: macroColor.p }}>P: {masa.proteine}g</span>
                  <span style={{ color: macroColor.c }}>C: {masa.carbohidrati}g</span>
                  <span style={{ color: macroColor.g }}>G: {masa.grasimi}g</span>
                  <span className="text-white/30">{masa.calorii} kcal</span>
                </div>
              </div>
              <span className="text-white/20 text-xs flex-shrink-0">{masaActiva === i ? '▲' : '▼'}</span>
            </div>

            {/* Detalii masă */}
            {masaActiva === i && (
              <div className="px-4 pb-4 border-t border-white/[0.05] pt-3 space-y-3">
                {/* Ingrediente */}
                <div>
                  <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-2">🛒 Ingrediente</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {masa.ingrediente.map((ing, j) => (
                      <div key={j} className="flex items-start gap-1.5 text-xs text-white/60">
                        <span className="text-green-400/60 flex-shrink-0 mt-0.5">→</span>
                        <span>{ing}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Prep time */}
                <div className="flex items-center gap-2 text-xs text-white/40">
                  <span>⏱️ Timp preparare:</span>
                  <span className="text-white/60 font-medium">{masa.prep}</span>
                </div>
                {/* Macro detaliat */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { l: 'Proteine', v: masa.proteine, c: macroColor.p },
                    { l: 'Carbohidrați', v: masa.carbohidrati, c: macroColor.c },
                    { l: 'Grăsimi', v: masa.grasimi, c: macroColor.g },
                  ].map((m, j) => (
                    <div key={j} className="text-center p-2 bg-white/[0.03] rounded-xl">
                      <div className="text-sm font-bold" style={{ color: m.c }}>{m.v}g</div>
                      <div className="text-[9px] text-white/25 mt-0.5">{m.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Sfaturi generale */}
      <div className="bg-white/[0.02] border border-white/[0.07] rounded-2xl p-4 space-y-2">
        <div className="text-[10px] font-bold text-white/30 uppercase tracking-wider mb-3">💡 Principii nutriționale</div>
        {[
          { icon: '🥩', text: 'Proteine la fiecare masă — mențin masa musculară și sațietatea' },
          { icon: '🥑', text: 'Grăsimi sănătoase (avocado, nuci, ulei măsline) la 2-3 mese/zi' },
          { icon: '🥦', text: 'Jumătate din farfurie = legume colorate — fibre + antioxidanți' },
          { icon: '💧', text: 'Minim 2.5L apă/zi — hidratarea optimizează metabolismul cu 30%' },
          { icon: '⏰', text: 'Ultima masă cu 3h înainte de culcare pentru somn optim' },
        ].map((s, i) => (
          <div key={i} className="flex gap-3 py-2 border-b border-white/[0.04]">
            <span className="text-base flex-shrink-0">{s.icon}</span>
            <span className="text-xs text-white/55 leading-relaxed">{s.text}</span>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/20 text-center pb-4">
        ⚕️ Plan educațional personalizat. Consultă un nutriționist pentru afecțiuni specifice.
      </div>
    </div>
  )
}
