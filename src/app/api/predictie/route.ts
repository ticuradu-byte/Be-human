export const dynamic = 'force-dynamic'
// src/app/api/pdf/route.ts
// Generator raport PDF be-human — pentru medic sau arhivă personală
// Folosește jsPDF (client-side) sau html-pdf-node (server-side)

import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Neautentificat' }, { status: 401 })

  const { analiza_id, tip } = await req.json()
  // tip: 'analiza' | 'saptamanal' | 'complet'

  // Obține datele
  const { data: util } = await supabase.from('utilizatori')
    .select('*').eq('id', user.id).single()

  let analiza = null
  if (analiza_id) {
    const { data } = await supabase.from('analize_bh')
      .select('*').eq('id', analiza_id).eq('user_id', user.id).single()
    analiza = data
  } else {
    // Ultima analiză
    const { data } = await supabase.from('analize_bh')
      .select('*').eq('user_id', user.id)
      .order('creat_la', { ascending: false }).limit(1).single()
    analiza = data
  }

  // Jurnal ultimele 30 zile
  const { data: jurnal } = await supabase.from('jurnal_zilnic')
    .select('*').eq('user_id', user.id)
    .order('data_zi', { ascending: false }).limit(30)

  // Generează HTML-ul pentru PDF
  const html = generatePDFHTML(util, analiza, jurnal || [])

  return NextResponse.json({ html, filename: `be-human-raport-${new Date().toISOString().slice(0, 10)}.pdf` })
}

function generatePDFHTML(util: any, analiza: any, jurnal: any[]): string {
  const data = analiza?.rezultat_json || {}
  const dataGenerare = new Date().toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })

  const scorColor = (s: number) => s >= 75 ? '#16a34a' : s >= 55 ? '#d97706' : '#dc2626'

  const mediScor = jurnal.filter(j => j.scor_wellness).reduce((s: number, j: any) => s + j.scor_wellness, 0) /
    Math.max(1, jurnal.filter(j => j.scor_wellness).length)

  return `<!DOCTYPE html>
<html lang="ro">
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; background: white; font-size: 11px; line-height: 1.5; }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  
  /* Header */
  .header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 32px; padding-bottom: 20px; border-bottom: 2px solid #16a34a; }
  .logo { display: flex; align-items: center; gap: 12px; }
  .logo-icon { width: 44px; height: 44px; background: linear-gradient(135deg, #15803d, #4ade80); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 22px; }
  .logo-text h1 { font-size: 22px; font-weight: 700; color: #15803d; }
  .logo-text p { font-size: 10px; color: #6b7280; letter-spacing: 1px; text-transform: uppercase; }
  .header-meta { text-align: right; color: #6b7280; font-size: 10px; line-height: 1.8; }
  
  /* Disclaimer */
  .disclaimer-top { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 10px 14px; margin-bottom: 24px; font-size: 10px; color: #92400e; }
  
  /* Secțiuni */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; padding-bottom: 6px; border-bottom: 1px solid #e5e7eb; }
  
  /* Scor */
  .scor-box { background: linear-gradient(135deg, #f0fdf4, #dcfce7); border: 1px solid #86efac; border-radius: 12px; padding: 20px; display: flex; align-items: center; gap: 24px; margin-bottom: 20px; }
  .scor-numar { font-size: 52px; font-weight: 700; line-height: 1; }
  .scor-label { font-size: 16px; font-weight: 600; margin-top: 4px; }
  .scor-desc { font-size: 11px; color: #374151; line-height: 1.6; flex: 1; }
  
  /* Grid 2 col */
  .grid2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px; }
  
  /* Insight */
  .insight { background: #f9fafb; border: 1px solid #e5e7eb; border-left: 3px solid #16a34a; border-radius: 8px; padding: 12px; margin-bottom: 8px; }
  .insight-title { font-size: 11px; font-weight: 600; color: #111827; margin-bottom: 4px; }
  .insight-body { font-size: 10px; color: #4b5563; line-height: 1.5; }
  .insight-action { font-size: 10px; color: #15803d; font-weight: 600; margin-top: 5px; }
  .insight-citare { font-size: 9px; color: #9ca3af; font-style: italic; margin-top: 3px; }
  
  /* Alertă */
  .alerta-ros { background: #fef2f2; border: 1px solid #fca5a5; border-left: 3px solid #ef4444; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
  .alerta-gal { background: #fffbeb; border: 1px solid #fcd34d; border-left: 3px solid #f59e0b; border-radius: 8px; padding: 10px 12px; margin-bottom: 8px; }
  .alerta-title { font-size: 10px; font-weight: 700; margin-bottom: 3px; }
  
  /* Tabel jurnal */
  table { width: 100%; border-collapse: collapse; font-size: 10px; }
  th { background: #f3f4f6; padding: 7px 10px; text-align: left; font-weight: 600; color: #374151; border: 1px solid #e5e7eb; }
  td { padding: 6px 10px; border: 1px solid #e5e7eb; color: #374151; }
  tr:nth-child(even) td { background: #f9fafb; }
  
  /* Macro box */
  .macro-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 12px; }
  .macro-box { text-align: center; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 10px 6px; }
  .macro-val { font-size: 18px; font-weight: 700; color: #111827; }
  .macro-label { font-size: 9px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
  
  /* Footer */
  .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; display: flex; justify-content: space-between; align-items: flex-start; }
  .footer-disclaimer { font-size: 9px; color: #9ca3af; max-width: 500px; line-height: 1.6; }
  .footer-logo { text-align: right; }
  .footer-logo p { font-size: 10px; color: #15803d; font-weight: 600; }
  .footer-logo small { font-size: 9px; color: #9ca3af; }

  @media print {
    .page { padding: 20px; }
    body { font-size: 10px; }
  }
</style>
</head>
<body>
<div class="page">

  <!-- HEADER -->
  <div class="header">
    <div class="logo">
      <div class="logo-icon">🫀</div>
      <div class="logo-text">
        <h1>be-human</h1>
        <p>Raport Wellness Personal</p>
      </div>
    </div>
    <div class="header-meta">
      <strong>${util?.nume || 'Utilizator'}</strong><br/>
      ${util?.email || ''}<br/>
      Generat: ${dataGenerare}<br/>
      <span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:10px;font-weight:600;">Plan ${util?.plan?.toUpperCase() || 'FREE'}</span>
    </div>
  </div>

  <!-- DISCLAIMER -->
  <div class="disclaimer-top">
    ⚕️ <strong>Raport informativ — nu înlocuiește consultul medical.</strong> 
    Valorile și recomandările din acest raport au caracter educațional. 
    Prezentați acest raport medicului dumneavoastră pentru interpretare clinică completă.
    Urgențe medicale: <strong>112</strong>
  </div>

  <!-- SCOR WELLNESS -->
  <div class="section">
    <div class="section-title">📊 Scor Wellness</div>
    <div class="scor-box">
      <div>
        <div class="scor-numar" style="color:${scorColor(analiza?.scor_wellness || 0)}">${analiza?.scor_wellness || '—'}</div>
        <div class="scor-label" style="color:${scorColor(analiza?.scor_wellness || 0)}">${data.scor_label || '—'}</div>
        <div style="font-size:9px;color:#6b7280;margin-top:4px;">din 100 · Data: ${analiza ? new Date(analiza.creat_la).toLocaleDateString('ro-RO') : '—'}</div>
      </div>
      <div class="scor-desc">
        <p><strong>Diagnostic funcțional:</strong> ${data.diagnostic_functional || '—'}</p>
        ${data.urmatorul_pas ? `<p style="margin-top:8px"><strong>Pasul cheie recomandat:</strong> ${data.urmatorul_pas}</p>` : ''}
        ${mediScor > 0 ? `<p style="margin-top:8px"><strong>Medie 30 zile jurnal:</strong> ${Math.round(mediScor)}/100</p>` : ''}
      </div>
    </div>
  </div>

  <!-- ALERTE MEDICALE -->
  ${analiza?.alerte?.length ? `
  <div class="section">
    <div class="section-title">🚨 Alerte Medicale</div>
    ${analiza.alerte.map((a: any) => `
    <div class="${a.nivel === 'rosu' ? 'alerta-ros' : 'alerta-gal'}">
      <div class="alerta-title" style="color:${a.nivel === 'rosu' ? '#dc2626' : '#d97706'}">
        ${a.nivel === 'rosu' ? '🚨 CONSULT MEDICAL URGENT' : '⚠️ Consult Medical Recomandat'} — ${a.parametru}: ${a.valoare}
      </div>
      <div style="font-size:10px;color:#374151;">${a.mesaj}</div>
      <div style="font-size:10px;font-weight:600;color:${a.nivel === 'rosu' ? '#dc2626' : '#d97706'};margin-top:4px;">→ ${a.actiune} · ${a.urgenta}</div>
    </div>`).join('')}
  </div>` : ''}

  <!-- NUTRIȚIE -->
  ${data.nutritie ? `
  <div class="section">
    <div class="section-title">🥗 Nutriție Personalizată</div>
    <div class="macro-grid">
      <div class="macro-box"><div class="macro-val">${data.nutritie.calorii_recomandate || '—'}</div><div class="macro-label">Calorii</div></div>
      <div class="macro-box"><div class="macro-val">${data.nutritie.proteine_g || '—'}g</div><div class="macro-label">Proteine</div></div>
      <div class="macro-box"><div class="macro-val">${data.nutritie.carbohidrati_g || '—'}g</div><div class="macro-label">Carbohidrați</div></div>
      <div class="macro-box"><div class="macro-val">${data.nutritie.grasimi_g || '—'}g</div><div class="macro-label">Grăsimi</div></div>
      <div class="macro-box"><div class="macro-val">${data.nutritie.apa_litri || '—'}L</div><div class="macro-label">Apă</div></div>
    </div>
    ${data.nutritie.plan_zi ? `
    <div class="grid2">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
        <div style="font-size:10px;font-weight:700;color:#374151;margin-bottom:6px;">🍽️ Plan alimentar recomandat</div>
        <p><strong>Dimineața:</strong> ${data.nutritie.plan_zi.dimineata || '—'}</p>
        <p><strong>Prânz:</strong> ${data.nutritie.plan_zi.pranz || '—'}</p>
        <p><strong>Seara:</strong> ${data.nutritie.plan_zi.seara || '—'}</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
        <div style="font-size:10px;font-weight:700;color:#15803d;margin-bottom:4px;">+ Prioritar de adăugat</div>
        ${(data.nutritie.alimente_prioritare || []).slice(0, 4).map((a: string) => `<p>• ${a}</p>`).join('')}
        <div style="font-size:10px;font-weight:700;color:#dc2626;margin-top:8px;margin-bottom:4px;">− De redus</div>
        ${(data.nutritie.alimente_reduce || []).slice(0, 3).map((a: string) => `<p>• ${a}</p>`).join('')}
      </div>
    </div>` : ''}
  </div>` : ''}

  <!-- TOP INSIGHTS -->
  ${data.insights?.length ? `
  <div class="section">
    <div class="section-title">💡 Insights Personalizate (Top ${Math.min(5, data.insights.length)})</div>
    ${data.insights.slice(0, 5).map((ins: any) => `
    <div class="insight">
      <div class="insight-title">${ins.icon} ${ins.titlu} <span style="font-size:9px;color:${ins.prioritate === 'ridicata' ? '#dc2626' : ins.prioritate === 'medie' ? '#d97706' : '#16a34a'};text-transform:uppercase;">[${ins.prioritate}]</span></div>
      <div class="insight-body">${ins.descriere}</div>
      <div class="insight-action">✅ ${ins.actiune}</div>
      ${ins.citare ? `<div class="insight-citare">📚 ${ins.citare}</div>` : ''}
    </div>`).join('')}
  </div>` : ''}

  <!-- SPORT & RECUPERARE -->
  ${data.sport ? `
  <div class="section">
    <div class="section-title">🏃 Sport & Activitate Fizică</div>
    <div class="grid2">
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
        <div style="font-size:10px;font-weight:700;color:#374151;margin-bottom:4px;">Evaluare activitate</div>
        <p>${data.sport.evaluare_curenta || '—'}</p>
        <div style="font-size:10px;font-weight:700;color:#374151;margin-top:8px;margin-bottom:4px;">Zona HR recomandată</div>
        <p>${data.sport.zona_recomandata || '—'}</p>
      </div>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:12px;">
        <div style="font-size:10px;font-weight:700;color:#374151;margin-bottom:4px;">Plan săptămânal</div>
        <p>${data.sport.plan_saptamana || '—'}</p>
        <div style="font-size:10px;font-weight:700;color:#374151;margin-top:8px;margin-bottom:4px;">Recuperare</div>
        <p>${data.sport.recuperare || '—'}</p>
      </div>
    </div>
  </div>` : ''}

  <!-- SUPLIMENTE -->
  ${data.suplimente_sigure?.length ? `
  <div class="section">
    <div class="section-title">💊 Suplimente Recomandate (verificate față de medicație)</div>
    <table>
      <tr>
        <th>Supliment</th><th>Doză</th><th>Motiv</th><th>Timing</th>
      </tr>
      ${data.suplimente_sigure.map((s: any) => `
      <tr>
        <td><strong>${s.supliment}</strong></td>
        <td>${s.doza || '—'}</td>
        <td>${s.motiv || '—'}</td>
        <td>${s.timing || '—'}</td>
      </tr>`).join('')}
    </table>
    <p style="font-size:9px;color:#9ca3af;margin-top:6px;">⚠️ Consultați medicul sau farmacistul înainte de a începe orice supliment.</p>
  </div>` : ''}

  <!-- JURNAL ULTIMELE 14 ZILE -->
  ${jurnal.length > 0 ? `
  <div class="section">
    <div class="section-title">📓 Jurnal Wellness — Ultimele ${Math.min(14, jurnal.length)} Zile</div>
    <table>
      <tr>
        <th>Data</th><th>Scor</th><th>Energie</th><th>Mood</th><th>Foame</th><th>Note</th>
      </tr>
      ${jurnal.slice(0, 14).map((j: any) => `
      <tr>
        <td>${new Date(j.data_zi + 'T12:00:00').toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' })}</td>
        <td style="color:${scorColor(j.scor_wellness || 0)};font-weight:600;">${j.scor_wellness || '—'}</td>
        <td>${['', '😫', '😴', '😐', '😊', '⚡'][j.energie || 0] || '—'}</td>
        <td>${['', '😢', '😕', '😐', '🙂', '😄'][j.mood || 0] || '—'}</td>
        <td>${j.foame || '—'}</td>
        <td style="max-width:150px;">${(j.alte || '').slice(0, 60)}${(j.alte || '').length > 60 ? '...' : ''}</td>
      </tr>`).join('')}
    </table>
  </div>` : ''}

  <!-- FOOTER -->
  <div class="footer">
    <div class="footer-disclaimer">
      <strong>⚕️ Disclaimer Medical Obligatoriu</strong><br/>
      Acest raport be-human este strict informativ și educațional. Nu înlocuiește și nu constituie sfat medical.
      Valorile din analize trebuie interpretate de un medic în context clinic complet.
      Nu modificați niciun tratament medical fără acordul medicului curant.
      Dacă aveți simptome sau valori anormale, consultați medicul de familie sau de specialitate.
      Urgențe: 112
    </div>
    <div class="footer-logo">
      <p>🫀 be-human.ro</p>
      <small>Wellness AI Personal<br/>Medicină Funcțională<br/>${dataGenerare}</small>
    </div>
  </div>

</div>
</body>
</html>`
}
