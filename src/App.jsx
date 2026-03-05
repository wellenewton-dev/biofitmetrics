import { useState, useEffect, useCallback, useRef, memo } from "react";

// ─── Firebase ─────────────────────────────────────────────────────────────────
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDIKi_RVr3EQJrCOQ5m_8YzuirC",
  authDomain: "biofitmetrics-aaa7e.firebaseapp.com",
  projectId: "biofitmetrics-aaa7e",
  storageBucket: "biofitmetrics-aaa7e.firebasestorage.app",
  messagingSenderId: "889195589017",
  appId: "1:889195589017:web:694b69e16113a3"
};

const firebaseApp = initializeApp(firebaseConfig);
const db_fire = getFirestore(firebaseApp);
const DOC_ID = "dados_principais";
const SETTINGS_DOC_ID = "configuracoes";


// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "aval-fisicas-v5";

// ─── Constantes de imagem (padrão) ────────────────────────────────────────────
const DEFAULT_ICON_B64 = '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';
const DEFAULT_LOGO_B64 = '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';

// ─── Settings storage ─────────────────────────────────────────────────────────
const SETTINGS_KEY = "biofitmetrics-settings";
async function loadSettings() {
  try {
    const ref = doc(db_fire, "biofitmetrics", SETTINGS_DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    const r = localStorage.getItem(SETTINGS_KEY);
    return r ? JSON.parse(r) : { logob64: DEFAULT_LOGO_B64, iconb64: DEFAULT_ICON_B64 };
  } catch(e) {
    try {
      const r = localStorage.getItem(SETTINGS_KEY);
      return r ? JSON.parse(r) : { logob64: DEFAULT_LOGO_B64, iconb64: DEFAULT_ICON_B64 };
    } catch { return { logob64: DEFAULT_LOGO_B64, iconb64: DEFAULT_ICON_B64 }; }
  }
}
async function saveSettings(s) {
  try {
    const ref = doc(db_fire, "biofitmetrics", SETTINGS_DOC_ID);
    await setDoc(ref, s);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
  } catch(e) {
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  }
}
async function loadData() {
  try {
    const ref = doc(db_fire, "biofitmetrics", DOC_ID);
    const snap = await getDoc(ref);
    if (snap.exists()) return snap.data();
    // fallback localStorage
    const r = localStorage.getItem(STORAGE_KEY);
    return r ? JSON.parse(r) : { alunos:[], avaliacoes:[] };
  } catch(e) {
    console.warn("Firebase indisponível, usando localStorage:", e);
    try {
      const r = localStorage.getItem(STORAGE_KEY);
      return r ? JSON.parse(r) : { alunos:[], avaliacoes:[] };
    } catch { return { alunos:[], avaliacoes:[] }; }
  }
}
async function saveData(d) {
  const safe = {
    ...d,
    avaliacoes: d.avaliacoes.map(av => ({
      ...av,
      posturalFotos: (av.posturalFotos||[]).filter(Boolean)
    }))
  };
  try {
    const ref = doc(db_fire, "biofitmetrics", DOC_ID);
    await setDoc(ref, safe);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  } catch(e) {
    console.warn("Firebase indisponível, salvando só localStorage:", e);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(safe)); } catch {}
  }
}

// ─── Fórmulas ─────────────────────────────────────────────────────────────────
// JP7 — dobras em MM (sem conversão), usa (Σ)² não Σx²
function calcDC(mediasMM, sexo, idade) {
  const vals = Object.values(mediasMM).map(Number);
  if (vals.some(isNaN) || vals.every(v => v === 0)) return null;
  const id = parseFloat(idade);
  if (!id || isNaN(id)) return null;
  const S = vals.reduce((a,b)=>a+b,0);
  const S2 = S * S;
  return sexo==="M"
    ? 1.112 - 0.00043499*S + 0.00000055*S2 - 0.00028826*id
    : 1.097 - 0.00046971*S + 0.00000056*S2 - 0.00012828*id;
}
function calcPG(dc) { return dc&&dc>0 ? (4.95/dc-4.50)*100 : null; }
function calcIMC(p,a) { p=parseFloat(p);a=parseFloat(a); return p&&a ? p/(a*a) : null; }
function calcIdade(dn) {
  if(!dn) return null;
  let normalized = dn;
  // Aceita dd/mm/aaaa
  if(dn.includes("/")) {
    const parts = dn.split("/");
    if(parts.length === 3) normalized = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  const n=new Date(normalized), h=new Date();
  if(isNaN(n)) return null;
  let age=h.getFullYear()-n.getFullYear();
  if(h.getMonth()<n.getMonth()||(h.getMonth()===n.getMonth()&&h.getDate()<n.getDate())) age--;
  return age>=0?age:null;
}
function imcInfo(v) {
  if(!v) return {label:"—",color:"#888"};
  if(v<18.5) return {label:"Abaixo do Peso",color:"#60a5fa"};
  if(v<25)   return {label:"Normal",color:"#34d399"};
  if(v<30)   return {label:"Sobrepeso",color:"#fbbf24"};
  if(v<35)   return {label:"Obesidade I",color:"#f97316"};
  return           {label:"Obesidade II",color:"#f87171"};
}
function pgInfo(v) {
  if(!v) return {label:"—",color:"#888"};
  if(v<10) return {label:"Baixo",color:"#60a5fa"};
  if(v<20) return {label:"Normal",color:"#34d399"};
  if(v<25) return {label:"Acima do Normal",color:"#fbbf24"};
  return         {label:"Alto",color:"#f87171"};
}
function avgDobra(form,key) {
  const vals=[form[`${key}1`],form[`${key}2`],form[`${key}3`]].map(Number).filter(v=>!isNaN(v)&&v>0);
  return vals.length ? vals.reduce((a,b)=>a+b,0)/vals.length : 0;
}
function computeResults(form,sexo,idade) {
  const medias={};
  DOBRA_FIELDS.forEach(({key})=>{ medias[key]=avgDobra(form,key); });
  const dc=calcDC(medias,sexo,idade), pg=calcPG(dc), imc=calcIMC(form.peso,form.altura);
  return {medias,dc,pg,imc};
}
function fmtDate(s) {
  if(!s) return "—";
  if(s.includes("/")) return s; // já está no formato dd/mm/aaaa
  const[y,m,d]=s.split("-");
  return `${d}/${m}/${y}`;
}

// ─── Constantes ───────────────────────────────────────────────────────────────
const DOBRA_FIELDS=[
  {label:"Subescapular",key:"subescapular"},{label:"Tríceps",key:"triceps"},
  {label:"Peitoral",key:"peitoral"},{label:"Supra-Ilíaca",key:"supraIliaca"},
  {label:"Axilar Média",key:"axilarMedia"},{label:"Abdominal",key:"abdominal"},
  {label:"Femural",key:"femural"},
];
const PARQ_QUESTIONS=[
  "Algum médico já disse que você possui algum problema de coração e que só deveria realizar atividade física supervisionado por profissionais de saúde?",
  "Você sente dores no peito quando pratica atividade física?",
  "No último mês, você sentiu dores no peito quando NÃO estava praticando atividade física?",
  "Você apresenta desequilíbrio devido à tontura e/ou perda de consciência?",
  "Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade física?",
  "Você toma atualmente algum medicamento para pressão arterial e/ou problema de coração?",
  "Sabe de alguma outra razão pela qual você não deve praticar atividade física?",
];
const EMPTY_AVAL={
  data:new Date().toISOString().slice(0,10),
  objetivo:"",restricoes:"",
  peso:"",altura:"",pesoDesejado:"",pgDesejado:"",
  pressaoArterial:"",fc:"",
  torax:"",cintura:"",abs:"",quadril:"",
  bracoDir:"",bracoEsq:"",antebracoDir:"",antebracoEsq:"",
  coxaDir:"",coxaEsq:"",panturrilhaDir:"",panturrilhaEsq:"",
  subescapular1:"",subescapular2:"",subescapular3:"",
  triceps1:"",triceps2:"",triceps3:"",
  peitoral1:"",peitoral2:"",peitoral3:"",
  supraIliaca1:"",supraIliaca2:"",supraIliaca3:"",
  axilarMedia1:"",axilarMedia2:"",axilarMedia3:"",
  abdominal1:"",abdominal2:"",abdominal3:"",
  femural1:"",femural2:"",femural3:"",
  // PAR-Q: null=não respondido, true=sim, false=não
  parq0:null,parq1:null,parq2:null,parq3:null,parq4:null,parq5:null,parq6:null,
  // Postural
  posturalFotos:[],  // array de base64 strings (max 4)
  posturalResultado:"",
  observacoes:"",
};
const EMPTY_ALUNO={nome:"",dataNasc:"",sexo:"M"};
const FORM_TABS=["Pessoal","Biométrico","PA/FC","Medidas","Dobras","PAR-Q","Postural","Obs."];

// ─── PDF Export (client-side via print) ───────────────────────────────────────
function generatePDF(aluno, av, customLogo) {
  const idade = calcIdade(aluno.dataNasc);
  const imc = av.imc;
  const pg  = av.pg;
  const ic  = imcInfo(imc);
  const pc  = pgInfo(pg);
  const dm  = av.medias || {};
  const parqSim = PARQ_QUESTIONS.filter((_,i) => av[`parq${i}`] === true).length;
  const LOGO = customLogo || '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';

  const fotoHtml = (av.posturalFotos||[]).map(src =>
    `<img src="${src}" style="width:calc(50% - 5px);max-height:220px;object-fit:contain;background:#f1f5f9;border-radius:6px;display:inline-block;margin:2px;vertical-align:top;" />`
  ).join('');

  const medidas = [
    ['Tórax',av.torax],['Cintura',av.cintura],['ABS',av.abs],['Quadril',av.quadril],
    ['Braço Dir.',av.bracoDir],['Braço Esq.',av.bracoEsq],
    ['Antebraço Dir.',av.antebracoDir],['Antebraço Esq.',av.antebracoEsq],
    ['Coxa Dir.',av.coxaDir],['Coxa Esq.',av.coxaEsq],
    ['Panturrilha Dir.',av.panturrilhaDir],['Panturrilha Esq.',av.panturrilhaEsq],
  ].filter(([,v]) => v);

  const dobraRows = DOBRA_FIELDS.filter(({key}) => dm[key] > 0).map(({label,key}) =>
    `<tr><td>${label}</td><td>${av[key+'1']||'—'}</td><td>${av[key+'2']||'—'}</td><td>${av[key+'3']||'—'}</td><td style="font-weight:700;color:#1e3a8a;">${parseFloat(dm[key]).toFixed(2)} cm</td></tr>`
  ).join('');

  const parqRows = PARQ_QUESTIONS.map((q,i) => {
    const r = av[`parq${i}`];
    const cls = r===true ? 'sim' : r===false ? 'nao' : 'nd';
    const lbl = r===true ? 'SIM' : r===false ? 'NÃO' : '—';
    return `<div class="prow"><span class="pq">${i+1}. ${q}</span><span class="pa ${cls}">${lbl}</span></div>`;
  }).join('');

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/>
<title>Avaliação — ${aluno.nome}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:13px;color:#1e293b;background:#fff;}
.page{max-width:780px;margin:0 auto;padding:24px 28px;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border-bottom:3px solid #f97316;margin-bottom:16px;}
.hdr-logo{height:100px;}
.hdr-right{text-align:right;}
.hdr-nome{font-size:20px;font-weight:900;color:#1e293b;}
.hdr-sub{font-size:13px;color:#64748b;margin-top:2px;}
.hdr-data{font-size:12px;color:#94a3b8;margin-top:2px;}
.sec{margin-bottom:14px;}
.sec-t{font-size:11px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#f97316;border-bottom:1px solid #fed7aa;padding-bottom:3px;margin-bottom:8px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:8px 10px;}
.card.hl{border-left:3px solid #f97316;}
.cl{font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:2px;}
.cv{font-size:18px;font-weight:900;color:#1e293b;line-height:1;}
.cu{font-size:11px;color:#94a3b8;font-weight:400;}
.res{border-radius:9px;padding:12px 14px;margin-bottom:6px;}
.rl{font-size:8px;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:.85;}
.rv{font-size:32px;font-weight:900;line-height:1.1;color:#fff;}
.rc{font-size:11px;font-weight:700;color:#fff;margin-top:3px;}
table{width:100%;border-collapse:collapse;font-size:12px;}
th{background:#1e293b;color:#fff;padding:6px 8px;text-align:left;font-size:11px;font-weight:700;letter-spacing:.5px;}
td{padding:4px 7px;border-bottom:1px solid #f1f5f9;}
tr:nth-child(even) td{background:#f8fafc;}
.prow{display:flex;justify-content:space-between;align-items:flex-start;padding:4px 0;border-bottom:1px solid #f1f5f9;gap:10px;}
.pq{flex:1;font-size:12px;color:#475569;line-height:1.55;}
.pa{font-weight:700;font-size:11px;padding:3px 9px;border-radius:20px;flex-shrink:0;margin-top:1px;}
.sim{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}
.nao{background:#f0fdf4;color:#16a34a;border:1px solid #86efac;}
.nd{background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;}
.palert{margin-top:8px;padding:8px 12px;border-radius:7px;font-size:12px;font-weight:700;}
.pok{background:#f0fdf4;color:#16a34a;border:1px solid #86efac;}
.pwarn{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}
.tbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:12px;font-size:12px;line-height:1.8;white-space:pre-wrap;color:#334155;}
.ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;}
.ftr-logo{height:26px;opacity:.45;}
.ftr-txt{font-size:10px;color:#94a3b8;text-align:right;line-height:1.6;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{margin:10mm 12mm;size:A4;}}
</style></head>
<body><div class="page">

<div class="hdr">
  <img class="hdr-logo" src="data:image/jpeg;base64,${LOGO}" />
  <div class="hdr-right">
    <div class="hdr-nome">${aluno.nome}</div>
    <div class="hdr-sub">${aluno.sexo==='M'?'Masculino':'Feminino'}${idade!=null?' · '+idade+' anos':''}${aluno.dataNasc?' · Nasc. '+fmtDate(aluno.dataNasc):''}</div>
    <div class="hdr-data">Avaliação: ${fmtDate(av.data)} &nbsp;·&nbsp; Gerado: ${new Date().toLocaleDateString('pt-BR')}</div>
  </div>
</div>

${(imc||pg)?`<div class="sec"><div class="sec-t">Resultados</div><div class="g${imc&&pg?'2':'1'}">
  ${imc?`<div class="res" style="background:linear-gradient(135deg,${ic.color},${ic.color}bb);">
    <div class="rl" style="color:#fff">Índice de Massa Corporal</div>
    <div class="rv">${imc.toFixed(2)}</div><div class="rc">${ic.label}</div></div>`:''}
  ${pg?`<div class="res" style="background:linear-gradient(135deg,${pc.color},${pc.color}bb);">
    <div class="rl" style="color:#fff">% Gordura Corporal — JP7</div>
    <div class="rv">${pg.toFixed(2)}<span style="font-size:16px">%</span></div><div class="rc">${pc.label}</div></div>`:''}
</div></div>`:''}

<div class="sec"><div class="sec-t">Dados Biométricos</div>
  <div class="g4">
    ${av.peso?`<div class="card hl"><div class="cl">Peso</div><div class="cv">${av.peso}<span class="cu"> kg</span></div></div>`:''}
    ${av.altura?`<div class="card hl"><div class="cl">Altura</div><div class="cv">${av.altura}<span class="cu"> m</span></div></div>`:''}
    ${av.pressaoArterial?`<div class="card"><div class="cl">Pressão Arterial</div><div class="cv" style="font-size:15px">${av.pressaoArterial}<span class="cu"> mmHg</span></div></div>`:''}
    ${av.fc?`<div class="card"><div class="cl">Freq. Cardíaca</div><div class="cv">${av.fc}<span class="cu"> bpm</span></div></div>`:''}
    ${av.pesoDesejado?`<div class="card"><div class="cl">Peso Desejado</div><div class="cv" style="color:#f97316">${av.pesoDesejado}<span class="cu"> kg</span></div></div>`:''}
    ${av.pgDesejado?`<div class="card"><div class="cl">%G Desejado</div><div class="cv" style="color:#f97316">${av.pgDesejado}<span class="cu"> %</span></div></div>`:''}
  </div>
  ${av.objetivo||av.restricoes?`<div class="g2" style="margin-top:7px">
    ${av.objetivo?`<div class="card"><div class="cl">Objetivo</div><div style="font-size:10px;margin-top:3px;color:#334155">${av.objetivo}</div></div>`:''}
    ${av.restricoes?`<div class="card" style="border-color:#fca5a5"><div class="cl" style="color:#dc2626">Restrições</div><div style="font-size:10px;margin-top:3px;color:#dc2626">${av.restricoes}</div></div>`:''}
  </div>`:''}
</div>

${medidas.length>0?`<div class="sec"><div class="sec-t">Medidas Corporais (cm)</div>
  <div class="g4">${medidas.map(([l,v])=>`<div class="card"><div class="cl">${l}</div><div class="cv" style="font-size:15px">${v}<span class="cu"> cm</span></div></div>`).join('')}</div>
</div>`:''}

${dobraRows?`<div class="sec"><div class="sec-t">Dobras Cutâneas — Jackson &amp; Pollock 7 (cm)</div>
  <table><thead><tr><th>Dobra</th><th>1ª Medida</th><th>2ª Medida</th><th>3ª Medida</th><th>Média</th></tr></thead>
  <tbody>${dobraRows}${av.dc?`<tr style="background:#eff6ff"><td colspan="4" style="font-weight:700;color:#1e3a8a">Densidade Corporal (DC)</td><td style="font-weight:700;color:#1e3a8a">${parseFloat(av.dc).toFixed(4)}</td></tr>`:''}</tbody>
  </table>
</div>`:''}

<div class="sec"><div class="sec-t">PAR-Q — Prontidão para Atividade Física</div>
  ${parqRows}
  <div class="palert ${parqSim>0?'pwarn':'pok'}">${parqSim>0?`⚠ ${parqSim} resposta(s) SIM — recomenda-se avaliação médica antes de iniciar.`:'✓ Nenhuma contraindicação identificada pelo PAR-Q.'}</div>
</div>

${(av.posturalFotos&&av.posturalFotos.length>0)||av.posturalResultado?`<div class="sec"><div class="sec-t">Avaliação Postural</div>
  ${av.posturalFotos&&av.posturalFotos.length>0?`<div style="margin-bottom:8px">${fotoHtml}</div>`:''}
  ${av.posturalResultado?`<div class="tbox">${av.posturalResultado}</div>`:''}
</div>`:''}

${av.observacoes?`<div class="sec"><div class="sec-t">Observações</div><div class="tbox">${av.observacoes}</div></div>`:''}

<div class="ftr">
  <img class="ftr-logo" src="data:image/jpeg;base64,${LOGO}" />
  <div class="ftr-txt">${aluno.nome} · Avaliação de ${fmtDate(av.data)}<br/>Gerado em ${new Date().toLocaleDateString('pt-BR')} · Jackson &amp; Pollock 7 Dobras</div>
</div>

</div><script>window.addEventListener('load',function(){window.print();});<\/script>
</body></html>`;

  const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `Avaliacao_${aluno.nome.replace(/\s+/g,'_')}_${av.data}.html`;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
}


// ─── CSS ──────────────────────────────────────────────────────────────────────
const css=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wght@300;400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#080810;font-family:'DM Sans',sans-serif;color:#e4e4f0;}
input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;}
input[type=number]{-moz-appearance:textfield;}
.app{max-width:430px;margin:0 auto;min-height:100svh;background:#0c0c16;overflow-x:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:52px 20px 16px;background:linear-gradient(160deg,#0f0f24,#131326);border-bottom:1px solid rgba(255,255,255,0.05);}
.topbar-brand{display:flex;align-items:center;gap:10px;}
.topbar-icon{width:38px;height:38px;border-radius:10px;object-fit:cover;}
.topbar-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff;line-height:1.1;}
.topbar-sub{font-size:11px;color:rgba(255,255,255,0.35);margin-top:1px;}
.topbar-acts{display:flex;gap:8px;align-items:center;}
.btn-icon{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-radius:10px;padding:8px 11px;color:rgba(255,255,255,0.55);font-size:16px;cursor:pointer;}
/* Config Drawer */
.cfg-section{margin-bottom:22px;}
.cfg-section-title{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:10px;padding:0 2px;}
.cfg-item{display:flex;align-items:center;gap:12px;background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px 16px;margin-bottom:8px;cursor:pointer;}
.cfg-item:active{background:rgba(255,255,255,0.05);}
.cfg-item-icon{font-size:22px;width:40px;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.cfg-item-body{flex:1;}
.cfg-item-title{font-size:14px;font-weight:600;color:#e4e4f0;margin-bottom:2px;}
.cfg-item-sub{font-size:12px;color:rgba(255,255,255,0.3);}
.cfg-item-arrow{color:rgba(255,255,255,0.15);font-size:18px;}
.cfg-logo-preview{width:100%;border-radius:12px;object-fit:contain;background:#000;max-height:120px;margin-bottom:10px;}
.cfg-version{text-align:center;font-size:11px;color:rgba(255,255,255,0.18);padding:16px 0 8px;}
.btn-new{display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-radius:12px;padding:9px 15px;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:500;color:#fff;cursor:pointer;}
.search-wrap{padding:12px 16px;}
.search-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:14px;color:#e4e4f0;outline:none;}
.search-input::placeholder{color:rgba(255,255,255,0.25);}
.list{padding:0 16px 100px;}
.empty-state{text-align:center;padding:60px 20px;color:rgba(255,255,255,0.2);font-size:14px;line-height:2.2;white-space:pre-line;}
.empty-icon{font-size:48px;margin-bottom:12px;}
.aluno-card{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:16px;padding:16px;margin-bottom:10px;cursor:pointer;position:relative;overflow:hidden;}
.aluno-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radius:3px 0 0 3px;}
.aluno-card.M::before{background:linear-gradient(#3b82f6,#6366f1);}
.aluno-card.F::before{background:linear-gradient(#ec4899,#f97316);}
.aluno-top{display:flex;align-items:flex-start;justify-content:space-between;}
.aluno-nome{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bottom:3px;}
.aluno-meta{font-size:12px;color:rgba(255,255,255,0.35);}
.aluno-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;}
.badge{font-size:11px;font-weight:500;padding:3px 9px;border-radius:20px;border:1px solid;}
.aval-count{font-size:11px;color:rgba(99,130,237,0.7);margin-top:5px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:200;display:flex;flex-direction:column;justify-content:flex-end;}
.drawer{background:#0f0f1e;border-radius:20px 20px 0 0;max-height:72svh;display:flex;flex-direction:column;border-top:1px solid rgba(255,255,255,0.08);}
.drawer-handle{width:36px;height:4px;background:rgba(255,255,255,0.12);border-radius:2px;margin:12px auto 0;flex-shrink:0;}
.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20px 12px;border-bottom:1px solid rgba(255,255,255,0.06);flex-shrink:0;}
.drawer-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;}
.btn-close{background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:32px;height:32px;color:#fff;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.form-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:10px 16px 0;gap:6px;flex-shrink:0;}
.form-tabs::-webkit-scrollbar{display:none;}
.ftab{flex:0 0 auto;padding:6px 13px;border-radius:20px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:rgba(255,255,255,0.4);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;}
.ftab.active{background:rgba(99,130,237,0.18);border-color:rgba(99,130,237,0.5);color:#a5b4fc;}
.form-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 20px 12px;}
.fg{margin-bottom:14px;}
.fl{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.3);margin-bottom:7px;display:block;}
.fi,.fs,.fta{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:13px 14px;font-family:'DM Sans',sans-serif;font-size:16px;color:#e4e4f0;outline:none;-webkit-user-select:text;user-select:text;}
.fi:focus,.fs:focus,.fta:focus{border-color:rgba(99,130,237,0.5);}
.fs{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23888' d='M6 8L1 3h10z'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 14px center;}
.fs option{background:#1a1a2e;}
.fta{resize:none;min-height:80px;}
.f2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.f3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.hint{font-size:11px;color:rgba(255,255,255,0.22);margin-top:5px;}
.computed{background:rgba(99,130,237,0.08);border:1px solid rgba(99,130,237,0.2);border-radius:10px;padding:9px 12px;font-size:13px;color:#a5b4fc;margin-top:7px;line-height:1.5;}
.info-box{background:rgba(99,130,237,0.06);border:1px solid rgba(99,130,237,0.15);border-radius:10px;padding:10px 12px;font-size:12px;color:rgba(255,255,255,0.4);line-height:1.6;margin-bottom:14px;}
.dobra-block{margin-bottom:16px;}
.dobra-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.dobra-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,0.6);}
.dobra-avg{font-size:12px;color:#63b3ed;}
/* PAR-Q */
.parq-item{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;margin-bottom:10px;}
.parq-num{font-size:10px;font-weight:700;letter-spacing:1.5px;color:#63b3ed;margin-bottom:6px;}
.parq-q{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.55;margin-bottom:10px;}
.parq-btns{display:flex;gap:8px;}
.parq-btn{flex:1;padding:9px;border-radius:10px;border:1px solid;font-family:'DM Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;}
.parq-sim{background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.2);color:#f87171;}
.parq-sim.sel{background:rgba(239,68,68,0.25);border-color:#f87171;color:#fff;}
.parq-nao{background:rgba(52,211,153,0.08);border-color:rgba(52,211,153,0.2);color:#34d399;}
.parq-nao.sel{background:rgba(52,211,153,0.25);border-color:#34d399;color:#fff;}
/* Postural */
.foto-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.foto-slot{border:2px dashed rgba(255,255,255,0.12);border-radius:14px;aspect-ratio:3/4;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer;position:relative;overflow:hidden;background:rgba(255,255,255,0.03);}
.foto-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radius:12px;}
.foto-slot-del{position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);border:none;border-radius:50%;width:26px;height:26px;color:#f87171;font-size:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:2;}
.foto-add-icon{font-size:28px;color:rgba(255,255,255,0.2);margin-bottom:4px;}
.foto-add-label{font-size:11px;color:rgba(255,255,255,0.2);}
/* Form footer */
.form-footer{padding:12px 20px 16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;gap:10px;flex-shrink:0;}
.btn-cancel{flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:13px;color:rgba(255,255,255,0.5);font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;cursor:pointer;}
.btn-save{flex:2;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-radius:14px;padding:13px;color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;}
/* Detail */
.detail-header{padding:52px 20px 20px;background:linear-gradient(160deg,#0f0f24,#131326);border-bottom:1px solid rgba(255,255,255,0.05);}
.btn-back{display:flex;align-items:center;gap:6px;background:none;border:none;color:rgba(255,255,255,0.4);font-family:'DM Sans',sans-serif;font-size:13px;cursor:pointer;margin-bottom:16px;padding:0;}
.detail-nome{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;line-height:1.15;}
.detail-sub{font-size:13px;color:rgba(255,255,255,0.35);margin-top:4px;}
.detail-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.chip-sm{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);color:rgba(255,255,255,0.55);}
.chip-warn{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3);color:#fbbf24;}
.detail-acts{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.btn-sm{padding:7px 14px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;border:1px solid;}
.btn-sm-p{background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.4);color:#60a5fa;}
.btn-sm-d{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);color:#f87171;}
.btn-sm-g{background:rgba(52,211,153,0.1);border-color:rgba(52,211,153,0.3);color:#34d399;}
.dtabs{display:flex;background:#0c0c16;overflow-x:auto;scrollbar-width:none;position:sticky;top:0;z-index:10;border-bottom:1px solid rgba(255,255,255,0.06);}
.dtabs::-webkit-scrollbar{display:none;}
.dtab{flex:0 0 auto;padding:13px 15px;background:none;border:none;border-bottom:2px solid transparent;color:rgba(255,255,255,0.3);font-family:'DM Sans',sans-serif;font-size:12px;font-weight:500;cursor:pointer;white-space:nowrap;}
.dtab.active{color:#63b3ed;border-bottom-color:#63b3ed;}
.dcontent{padding:16px 16px 100px;}
.sec{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:10px;margin-top:22px;}
.sec:first-child{margin-top:0;}
.sg2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.sc{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;text-align:center;}
.sl{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.28);margin-bottom:5px;}
.sv{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1;}
.su{font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;}
.ic{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12px 16px;margin-bottom:10px;}
.ri{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.05);}
.ri:last-child{border-bottom:none;}
.rl{font-size:13px;color:rgba(255,255,255,0.45);flex-shrink:0;}
.rv{font-family:'Syne',sans-serif;font-size:13px;font-weight:600;color:#e4e4f0;text-align:right;max-width:65%;}
.result-block{border-radius:16px;padding:18px;margin-bottom:12px;position:relative;overflow:hidden;}
.result-block::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,rgba(255,255,255,0.05),transparent);}
.rb-l{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:3px;}
.rb-v{font-family:'Syne',sans-serif;font-size:44px;font-weight:800;line-height:1;color:#fff;}
.rb-c{font-size:13px;font-weight:500;margin-top:8px;}
.pw{margin-top:12px;background:rgba(255,255,255,0.1);border-radius:6px;height:6px;overflow:hidden;}
.pb{height:100%;border-radius:6px;}
.pm{display:flex;justify-content:space-between;font-size:11px;opacity:0.4;margin-top:7px;}
.dr{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12px 14px;margin-bottom:8px;}
.drh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.drn{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;}
.drm{font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#63b3ed;}
.dms{display:flex;gap:6px;}
.dm{flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:5px;text-align:center;}
.dml{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.25);margin-bottom:2px;}
.dmv{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,0.65);}
/* detail parq */
.dparq-item{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;border-bottom:1px solid rgba(255,255,255,0.05);gap:10px;}
.dparq-item:last-child{border-bottom:none;}
.dparq-q{font-size:12px;color:rgba(255,255,255,0.55);flex:1;line-height:1.5;}
.dparq-a{font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;flex-shrink:0;}
.a-sim{background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);}
.a-nao{background:rgba(52,211,153,0.1);color:#34d399;border:1px solid rgba(52,211,153,0.25);}
.a-nd{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.08);}
/* detail postural */
.postural-fotos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
.postural-foto{border-radius:12px;overflow:hidden;aspect-ratio:3/4;}
.postural-foto img{width:100%;height:100%;object-fit:cover;}
/* hist */
.hist-card{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14px;margin-bottom:10px;cursor:pointer;}
.hist-card.sel{border-color:rgba(99,130,237,0.4);background:rgba(99,130,237,0.06);}
.hist-date{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-bottom:6px;}
.hist-badges{display:flex;gap:6px;flex-wrap:wrap;}
.hist-acts{display:flex;gap:8px;margin-top:10px;}
.btn-he{flex:1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-radius:10px;padding:8px;color:#60a5fa;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;}
.btn-hd{flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:10px;padding:8px;color:#f87171;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;}
.btn-hp{flex:1;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-radius:10px;padding:8px;color:#34d399;font-family:'DM Sans',sans-serif;font-size:12px;cursor:pointer;}
.btn-nova{width:100%;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-radius:14px;padding:14px;color:#fff;font-family:'DM Sans',sans-serif;font-size:14px;font-weight:600;cursor:pointer;margin-bottom:16px;}
/* evolução */
.evol-row{display:flex;position:relative;}
.evol-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.evol-line{position:absolute;left:4px;top:14px;bottom:0;width:2px;background:rgba(255,255,255,0.07);}
.evol-body{margin-left:14px;flex:1;padding-bottom:20px;}
.evol-date{font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;}
.evol-vals{display:flex;gap:10px;flex-wrap:wrap;}
.evol-val{font-size:12px;color:rgba(255,255,255,0.55);}
.loading{display:flex;align-items:center;justify-content:center;height:60svh;color:rgba(255,255,255,0.2);font-size:14px;}
`;

// ─── Input com máscara de data dd/mm/aaaa ────────────────────────────────────
const DateMaskInput = memo(function DateMaskInput({ name, dv, onChange }) {
  // Converte de yyyy-mm-dd (armazenado) para dd/mm/aaaa (exibido)
  function toDisplay(stored) {
    if (!stored) return "";
    if (stored.includes("/")) return stored;
    const [y, m, d] = stored.split("-");
    if (!y || !m || !d) return stored;
    return `${d}/${m}/${y}`;
  }
  // Converte de dd/mm/aaaa para yyyy-mm-dd (para calcIdade)
  function toStored(display) {
    const clean = display.replace(/\D/g, "");
    if (clean.length < 8) return display; // incompleto, guarda como está
    const d = clean.slice(0, 2), m = clean.slice(2, 4), y = clean.slice(4, 8);
    return `${y}-${m}-${d}`;
  }
  function handleInput(e) {
    let raw = e.target.value.replace(/\D/g, "").slice(0, 8);
    let formatted = raw;
    if (raw.length > 4) formatted = `${raw.slice(0,2)}/${raw.slice(2,4)}/${raw.slice(4)}`;
    else if (raw.length > 2) formatted = `${raw.slice(0,2)}/${raw.slice(2)}`;
    e.target.value = formatted;
    onChange(name, toStored(formatted));
  }
  return (
    <input
      key={name}
      name={name}
      className="fi"
      type="text"
      inputMode="numeric"
      defaultValue={toDisplay(dv)}
      placeholder="dd/mm/aaaa"
      maxLength={10}
      autoComplete="off"
      autoCorrect="off"
      autoCapitalize="off"
      spellCheck="false"
      onInput={handleInput}
    />
  );
});
const SI = memo(({name,dv,onChange,type="text",placeholder="",cls="fi",style})=>(
  <input key={name} name={name} className={cls} type={type} defaultValue={dv}
    placeholder={placeholder} style={style} autoComplete="off" autoCorrect="off"
    autoCapitalize="off" spellCheck="false"
    onChange={e=>onChange(name,e.target.value)} />
));
const ST = memo(({name,dv,onChange,placeholder=""})=>(
  <textarea key={name} name={name} className="fta" defaultValue={dv}
    placeholder={placeholder} autoComplete="off"
    onChange={e=>onChange(name,e.target.value)} />
));
const SS = memo(({name,dv,onChange,children})=>(
  <select key={name} name={name} className="fs" defaultValue={dv}
    onChange={e=>onChange(name,e.target.value)}>{children}</select>
));

// ─── FormDrawer (Avaliação) ───────────────────────────────────────────────────
function FormDrawer({aluno,initial,onSave,onClose}) {
  const vr = useRef({...(initial||EMPTY_AVAL), data:initial?.data||new Date().toISOString().slice(0,10)});
  const [tab,setTab] = useState("Pessoal");
  const [preview,setPreview] = useState(()=>computeResults(vr.current,aluno.sexo,aluno.idade));
  // PAR-Q state (needs re-render for button highlight)
  const [parq,setParq] = useState(()=>Array(7).fill(null).map((_,i)=>vr.current[`parq${i}`]??null));
  // Postural fotos state (needs re-render to show thumbnails)
  const [fotos,setFotos] = useState(()=>vr.current.posturalFotos||[]);

  const hc = useCallback((name,value)=>{
    vr.current[name]=value;
    const calcFields=["peso","altura",...DOBRA_FIELDS.flatMap(({key})=>[`${key}1`,`${key}2`,`${key}3`])];
    if(calcFields.includes(name)) setPreview(computeResults(vr.current,aluno.sexo,aluno.idade));
  },[aluno.sexo,aluno.idade]);

  const setParqAnswer = (i,val)=>{
    vr.current[`parq${i}`]=val;
    setParq(p=>{const n=[...p];n[i]=val;return n;});
  };

  const compressImage = (dataUrl, maxW=400, quality=0.5) => new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.src = dataUrl;
  });

  const addFoto = (idx)=>{
    const inp=document.createElement("input");
    inp.type="file"; inp.accept="image/*"; inp.capture="environment";
    inp.onchange=e=>{
      const file=e.target.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=async ev=>{
        const compressed = await compressImage(ev.target.result);
        setFotos(prev=>{
          const next=[...prev];
          next[idx]=compressed;
          vr.current.posturalFotos=next;
          return next;
        });
      };
      reader.readAsDataURL(file);
    };
    inp.click();
  };

  const delFoto = (idx)=>{
    setFotos(prev=>{
      const next=[...prev];
      next.splice(idx,1);
      vr.current.posturalFotos=next;
      return next;
    });
  };

  const handleSave=()=>{
    const f=vr.current;
    const res=computeResults(f,aluno.sexo,aluno.idade);
    onSave({...f, id:initial?.id||Date.now().toString(), alunoId:aluno.id,
      imc:res.imc?parseFloat(res.imc.toFixed(2)):null,
      dc:res.dc?parseFloat(res.dc.toFixed(6)):null,
      pg:res.pg?parseFloat(res.pg.toFixed(2)):null,
      medias:res.medias, posturalFotos:fotos,
    });
  };

  const get=k=>vr.current[k]||"";
  const avgP=key=>{const m=preview.medias?.[key];return m&&m>0?m.toFixed(2):"—";};

  const renderTab=()=>{
    switch(tab){
      case "Pessoal": return(
        <div>
          <div className="info-box"><strong style={{color:"rgba(255,255,255,0.65)"}}>Aluno:</strong> {aluno.nome} &nbsp;·&nbsp; {aluno.sexo==="M"?"♂":"♀"} &nbsp;·&nbsp; {aluno.idade?`${aluno.idade} anos`:"idade não inf."}</div>
          <div className="fg"><label className="fl">Data da Avaliação</label><SI name="data" dv={get("data")} type="date" onChange={hc}/></div>
          <div className="fg"><label className="fl">Objetivo</label><SI name="objetivo" dv={get("objetivo")} placeholder="Ex: Diminuir percentual de gordura" onChange={hc}/></div>
          <div className="fg"><label className="fl">Restrições</label><ST name="restricoes" dv={get("restricoes")} placeholder="Ex: Dor no joelho direito" onChange={hc}/></div>
        </div>
      );
      case "Biométrico": return(
        <div>
          <div className="f2">
            <div className="fg"><label className="fl">Peso (kg)</label><SI name="peso" dv={get("peso")} type="number" placeholder="80.5" onChange={hc}/></div>
            <div className="fg"><label className="fl">Altura (m)</label><SI name="altura" dv={get("altura")} type="number" placeholder="1.750" onChange={hc}/></div>
          </div>
          {preview.imc&&<div className="computed">IMC: <strong>{preview.imc.toFixed(2)}</strong> — <span style={{color:imcInfo(preview.imc).color}}>{imcInfo(preview.imc).label}</span></div>}
          <div className="f2" style={{marginTop:14}}>
            <div className="fg"><label className="fl">Peso Desejado (kg)</label><SI name="pesoDesejado" dv={get("pesoDesejado")} type="number" placeholder="Meta" onChange={hc}/></div>
            <div className="fg"><label className="fl">%G Desejado</label><SI name="pgDesejado" dv={get("pgDesejado")} type="number" placeholder="%" onChange={hc}/></div>
          </div>
        </div>
      );
      case "PA/FC": return(
        <div>
          <div className="fg"><label className="fl">Pressão Arterial</label><SI name="pressaoArterial" dv={get("pressaoArterial")} placeholder="Ex: 120/80" onChange={hc}/><p className="hint">Formato: sistólica/diastólica (mmHg)</p></div>
          <div className="fg"><label className="fl">Frequência Cardíaca (bpm)</label><SI name="fc" dv={get("fc")} type="number" placeholder="72" onChange={hc}/></div>
        </div>
      );
      case "Medidas": return(
        <div>
          {[
            {t:"Tronco",fs:[["Tórax","torax"],["Cintura","cintura"],["ABS","abs"],["Quadril","quadril"]]},
            {t:"Braços",fs:[["Braço Dir.","bracoDir"],["Braço Esq.","bracoEsq"],["Antebraço Dir.","antebracoDir"],["Antebraço Esq.","antebracoEsq"]]},
            {t:"Pernas",fs:[["Coxa Dir.","coxaDir"],["Coxa Esq.","coxaEsq"],["Panturrilha Dir.","panturrilhaDir"],["Panturrilha Esq.","panturrilhaEsq"]]},
          ].map(g=>(
            <div key={g.t} style={{marginBottom:18}}>
              <p className="fl" style={{marginBottom:10,letterSpacing:2}}>{g.t} (cm)</p>
              <div className="f2">{g.fs.map(([lbl,key])=>(
                <div className="fg" key={key} style={{margin:0}}><label className="fl">{lbl}</label><SI name={key} dv={get(key)} type="number" placeholder="0.0" onChange={hc}/></div>
              ))}</div>
            </div>
          ))}
        </div>
      );
      case "Dobras": return(
        <div>
          <div className="info-box" style={{marginBottom:14}}>
            Insira as 3 medidas em <strong style={{color:"#a5b4fc"}}>centímetros (cm)</strong>. O %G é calculado automaticamente via Jackson &amp; Pollock 7 dobras.
          </div>
          {DOBRA_FIELDS.map(({label,key})=>(
            <div className="dobra-block" key={key}>
              <div className="dobra-head"><span className="dobra-name">{label}</span><span className="dobra-avg">média: {avgP(key)} cm</span></div>
              <div className="f3">{[1,2,3].map(n=>(
                <div key={n}><label className="fl">{n}ª medida</label><SI name={`${key}${n}`} dv={get(`${key}${n}`)} type="number" placeholder="—" onChange={hc}/></div>
              ))}</div>
            </div>
          ))}
          {preview.pg&&<div className="computed">%G: <strong>{preview.pg.toFixed(2)}%</strong> <span style={{color:pgInfo(preview.pg).color}}>({pgInfo(preview.pg).label})</span> · DC: {preview.dc?.toFixed(4)}</div>}
        </div>
      );
      case "PAR-Q": return(
        <div>
          <div className="info-box" style={{marginBottom:14}}>Questionário de Prontidão para Atividade Física. Responda SIM ou NÃO a cada pergunta.</div>
          {PARQ_QUESTIONS.map((q,i)=>(
            <div className="parq-item" key={i}>
              <div className="parq-num">PERGUNTA {i+1}</div>
              <div className="parq-q">{q}</div>
              <div className="parq-btns">
                <button className={`parq-btn parq-sim ${parq[i]===true?"sel":""}`} onClick={()=>setParqAnswer(i,true)}>SIM</button>
                <button className={`parq-btn parq-nao ${parq[i]===false?"sel":""}`} onClick={()=>setParqAnswer(i,false)}>NÃO</button>
              </div>
            </div>
          ))}
        </div>
      );
      case "Postural": return(
        <div>
          <div className="info-box" style={{marginBottom:14}}>Tire ou anexe até 4 fotos para a avaliação postural (frente, costas, perfil direito, perfil esquerdo).</div>
          <div className="foto-grid">
            {["Frente","Costas","Perfil Direito","Perfil Esquerdo"].map((label,i)=>(
              <div key={i} className="foto-slot" onClick={()=>!fotos[i]&&addFoto(i)}>
                {fotos[i]
                  ? <><img src={fotos[i]} alt={label}/><button className="foto-slot-del" onClick={e=>{e.stopPropagation();delFoto(i);}}>✕</button></>
                  : <><div className="foto-add-icon">📷</div><div className="foto-add-label">{label}</div></>
                }
              </div>
            ))}
          </div>
          <div className="fg"><label className="fl">Resultado da Avaliação Postural</label>
            <ST name="posturalResultado" dv={get("posturalResultado")} placeholder="Descreva os achados posturais, desvios, compensações e recomendações..." onChange={hc}/>
          </div>
        </div>
      );
      case "Obs.": return(
        <div><div className="fg"><label className="fl">Observações</label>
          <ST name="observacoes" dv={get("observacoes")} placeholder="Bioimpedância, dinamometria, notas adicionais..." onChange={hc}/>
        </div></div>
      );
      default: return null;
    }
  };

  return(
    <div className="overlay">
      <div className="drawer">
        <div className="drawer-handle"/>
        <div className="drawer-header">
          <span className="drawer-title">{initial?"Editar Avaliação":"Nova Avaliação"}</span>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-tabs">{FORM_TABS.map(s=><button key={s} className={`ftab ${tab===s?"active":""}`} onClick={()=>setTab(s)}>{s}</button>)}</div>
        <div className="form-scroll">{renderTab()}</div>
        <div className="form-footer"><button className="btn-cancel" onClick={onClose}>Cancelar</button><button className="btn-save" onClick={handleSave}>Salvar</button></div>
      </div>
    </div>
  );
}

// ─── AlunoForm ────────────────────────────────────────────────────────────────
function AlunoForm({initial,onSave,onClose}) {
  const vr=useRef({...EMPTY_ALUNO,...(initial||{})});
  const [idade,setIdade]=useState(()=>calcIdade(initial?.dataNasc));
  const hc=useCallback((name,value)=>{ vr.current[name]=value; if(name==="dataNasc") setIdade(calcIdade(value)); },[]);
  const get=k=>vr.current[k]||"";
  const handleSave=()=>{ if(!vr.current.nome?.trim()){alert("Informe o nome.");return;} onSave({...vr.current,id:initial?.id||Date.now().toString()}); };
  return(
    <div className="overlay">
      <div className="drawer">
        <div className="drawer-handle"/>
        <div className="drawer-header"><span className="drawer-title">{initial?"Editar Aluno":"Novo Aluno"}</span><button className="btn-close" onClick={onClose}>✕</button></div>
        <div className="form-scroll" style={{padding:"20px"}}>
          <div className="fg"><label className="fl">Nome Completo</label><SI name="nome" dv={get("nome")} placeholder="Nome do aluno" onChange={hc}/></div>
          <div className="fg"><label className="fl">Data de Nascimento</label><DateMaskInput name="dataNasc" dv={get("dataNasc")} onChange={hc}/></div>
          <div className="fg"><label className="fl">Sexo</label><SS name="sexo" dv={get("sexo")||"M"} onChange={hc}><option value="M">Masculino</option><option value="F">Feminino</option></SS></div>
          {idade!==null&&<div className="computed">Idade calculada: <strong>{idade} anos</strong></div>}
        </div>
        <div className="form-footer"><button className="btn-cancel" onClick={onClose}>Cancelar</button><button className="btn-save" onClick={handleSave}>Salvar</button></div>
      </div>
    </div>
  );
}

// ─── DetailView ───────────────────────────────────────────────────────────────
function DetailView({aluno,avaliacoes,onBack,onEditAluno,onDeleteAluno,onSaveAval,onDeleteAval,onPDF}) {
  const [dtab,setDtab]=useState("Histórico");
  const [selId,setSelId]=useState(null);
  const [showForm,setShowForm]=useState(false);
  const [editAval,setEditAval]=useState(null);

  const sorted=[...avaliacoes].sort((a,b)=>a.data.localeCompare(b.data));
  const sel=sorted.find(a=>a.id===selId)||sorted[sorted.length-1];
  const latest=sorted[sorted.length-1];
  const idade=calcIdade(aluno.dataNasc);

  const imc=sel?.imc, pg=sel?.pg;
  const ic=imcInfo(imc), pc=pgInfo(pg);
  const dtabs=["Histórico","Perfil","Medidas","Dobras","Resultados","PAR-Q","Postural","Evolução"];

  const renderHistorico=()=>(
    <>
      <button className="btn-nova" onClick={()=>{setEditAval(null);setShowForm(true);}}>+ Nova Avaliação</button>
      {sorted.length===0&&<div className="empty-state" style={{padding:"20px 0"}}><div className="empty-icon">📋</div>Nenhuma avaliação ainda.</div>}
      {[...sorted].reverse().map(av=>{
        const ic2=imcInfo(av.imc),pc2=pgInfo(av.pg);
        return(
          <div key={av.id} className={`hist-card ${selId===av.id||(selId===null&&av.id===latest?.id)?"sel":""}`} onClick={()=>setSelId(av.id)}>
            <div className="hist-date">{fmtDate(av.data)}</div>
            <div className="hist-badges">
              {av.imc!=null&&<span className="badge" style={{background:`${ic2.color}15`,borderColor:`${ic2.color}40`,color:ic2.color}}>IMC {av.imc.toFixed(1)}</span>}
              {av.pg!=null&&<span className="badge" style={{background:`${pc2.color}15`,borderColor:`${pc2.color}40`,color:pc2.color}}>%G {av.pg.toFixed(1)}</span>}
              {av.peso&&<span className="badge" style={{background:"rgba(255,255,255,0.05)",borderColor:"rgba(255,255,255,0.1)",color:"rgba(255,255,255,0.4)"}}>{av.peso}kg</span>}
            </div>
            <div className="hist-acts">
              <button className="btn-he" onClick={e=>{e.stopPropagation();setEditAval(av);setShowForm(true);}}>Editar</button>
              <button className="btn-hp" onClick={e=>{e.stopPropagation();onPDF&&onPDF(aluno,av);}}>PDF</button>
              <button className="btn-hd" onClick={e=>{e.stopPropagation();onDeleteAval(av.id);}}>Excluir</button>
            </div>
          </div>
        );
      })}
    </>
  );

  const renderPerfil=()=>!sel?<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:20}}>Selecione uma avaliação no Histórico.</p>:(
    <>
      <p className="sec">Dados — {fmtDate(sel.data)}</p>
      <div className="sg2">
        <div className="sc"><div className="sl">Peso</div><div className="sv">{sel.peso||"—"}</div><div className="su">kg</div></div>
        <div className="sc"><div className="sl">Altura</div><div className="sv" style={{fontSize:sel.altura&&sel.altura.toString().length>4?20:26}}>{sel.altura||"—"}</div><div className="su">m</div></div>
      </div>
      <div className="ic">
        <div className="ri"><span className="rl">Sexo</span><span className="rv">{aluno.sexo==="M"?"Masculino":"Feminino"}</span></div>
        {aluno.dataNasc&&<div className="ri"><span className="rl">Nascimento</span><span className="rv">{fmtDate(aluno.dataNasc)}</span></div>}
        {idade!==null&&<div className="ri"><span className="rl">Idade</span><span className="rv">{idade} anos</span></div>}
      </div>
      {(sel.pressaoArterial||sel.fc)&&(<><p className="sec">Pressão &amp; FC</p><div className="sg2">
        {sel.pressaoArterial&&<div className="sc"><div className="sl">Pressão Arterial</div><div className="sv" style={{fontSize:20}}>{sel.pressaoArterial}</div><div className="su">mmHg</div></div>}
        {sel.fc&&<div className="sc"><div className="sl">Freq. Cardíaca</div><div className="sv">{sel.fc}</div><div className="su">bpm</div></div>}
      </div></>)}
      {(sel.objetivo||sel.restricoes)&&(<><p className="sec">Objetivo &amp; Restrições</p><div className="ic">
        {sel.objetivo&&<div className="ri"><span className="rl">Objetivo</span><span className="rv" style={{fontSize:12,textTransform:"capitalize"}}>{sel.objetivo.toLowerCase()}</span></div>}
        {sel.restricoes&&<div className="ri"><span className="rl">Restrições</span><span className="rv" style={{color:"#fbbf24",fontSize:12,textTransform:"capitalize"}}>{sel.restricoes.toLowerCase()}</span></div>}
      </div></>)}
      {(sel.pesoDesejado||sel.pgDesejado)&&(<><p className="sec">Metas</p><div className="sg2">
        {sel.pesoDesejado&&<div className="sc" style={{borderColor:"rgba(99,130,237,0.25)"}}><div className="sl">Peso Desejado</div><div className="sv" style={{color:"#63b3ed"}}>{sel.pesoDesejado}</div><div className="su">kg</div></div>}
        {sel.pgDesejado&&<div className="sc" style={{borderColor:"rgba(99,130,237,0.25)"}}><div className="sl">%G Desejado</div><div className="sv" style={{color:"#63b3ed"}}>{sel.pgDesejado}</div><div className="su">%</div></div>}
      </div></>)}
      {sel.observacoes&&(<><p className="sec">Observações</p><div style={{background:"rgba(99,130,237,0.07)",border:"1px solid rgba(99,130,237,0.2)",borderRadius:14,padding:14,fontSize:13,color:"rgba(255,255,255,0.55)",lineHeight:1.65}}>{sel.observacoes}</div></>)}
    </>
  );

  const renderMedidas=()=>{
    if(!sel)return null;
    const groups=[
      {t:"Tronco",items:[["Tórax",sel.torax],["Cintura",sel.cintura],["ABS",sel.abs],["Quadril",sel.quadril]]},
      {t:"Braços",items:[["Braço Dir.",sel.bracoDir],["Braço Esq.",sel.bracoEsq],["Antebraço Dir.",sel.antebracoDir],["Antebraço Esq.",sel.antebracoEsq]]},
      {t:"Pernas",items:[["Coxa Dir.",sel.coxaDir],["Coxa Esq.",sel.coxaEsq],["Panturrilha Dir.",sel.panturrilhaDir],["Panturrilha Esq.",sel.panturrilhaEsq]]},
    ];
    return groups.map(g=>{const f=g.items.filter(([,v])=>v);if(!f.length)return null;return(
      <div key={g.t}><p className="sec">{g.t}</p><div className="ic">{f.map(([l,v])=><div className="ri" key={l}><span className="rl">{l}</span><span className="rv">{v} <span style={{fontSize:11,opacity:0.35}}>cm</span></span></div>)}</div></div>
    );});
  };

  const renderDobras=()=>{
    if(!sel)return null;
    const dm=sel.medias||{};
    const rows=DOBRA_FIELDS.filter(({key})=>dm[key]>0);
    if(!rows.length)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:12}}>Nenhuma dobra registrada.</p>;
    return(<><p className="sec">7 Dobras Cutâneas (cm)</p>
      {rows.map(({label,key})=>(
        <div className="dr" key={key}>
          <div className="drh"><span className="drn">{label}</span><span className="drm">{parseFloat(dm[key]).toFixed(2)} <span style={{fontSize:11,opacity:0.4}}>cm</span></span></div>
          <div className="dms">{[1,2,3].map(n=><div className="dm" key={n}><div className="dml">{n}ª</div><div className="dmv">{sel[`${key}${n}`]||"—"}</div></div>)}</div>
        </div>
      ))}
      {sel.dc&&<div className="ic" style={{marginTop:10}}>
        <div className="ri"><span className="rl">Densidade Corporal</span><span className="rv">{parseFloat(sel.dc).toFixed(4)}</span></div>
        <div className="ri"><span className="rl">Protocolo</span><span className="rv">Jackson &amp; Pollock 7</span></div>
      </div>}
    </>);
  };

  const renderResultados=()=>{
    if(!sel)return null;
    if(!imc&&!pg)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,textAlign:"center",marginTop:30}}>Preencha peso, altura e dobras para ver os resultados.</p>;
    return(<>
      {imc&&(<><p className="sec">IMC</p>
        <div className="result-block" style={{background:`linear-gradient(135deg,${ic.color}22,${ic.color}11)`,border:`1px solid ${ic.color}44`}}>
          <div className="rb-l" style={{color:ic.color}}>Índice de Massa Corporal</div>
          <div className="rb-v">{imc.toFixed(2)}</div><div className="rb-c" style={{color:ic.color}}>{ic.label}</div>
          <div className="pw"><div className="pb" style={{width:`${Math.min(((imc-15)/30)*100,100)}%`,background:ic.color}}/></div>
          <div className="pm"><span>&lt;18.5</span><span>Normal: 18.5–25</span><span>&gt;30</span></div>
        </div>
      </>)}
      {pg&&(<><p className="sec">% Gordura Corporal</p>
        <div className="result-block" style={{background:`linear-gradient(135deg,${pc.color}22,${pc.color}11)`,border:`1px solid ${pc.color}44`}}>
          <div className="rb-l" style={{color:pc.color}}>Percentual de Gordura (JP7)</div>
          <div className="rb-v">{pg.toFixed(1)}<span style={{fontSize:20,opacity:0.6}}>%</span></div><div className="rb-c" style={{color:pc.color}}>{pc.label}</div>
          <div className="pw"><div className="pb" style={{width:`${Math.min((pg/35)*100,100)}%`,background:pc.color}}/></div>
          {sel.pgDesejado&&<div className="pm"><span>Meta: {sel.pgDesejado}%</span><span>Δ {(pg-sel.pgDesejado).toFixed(1)}%</span></div>}
        </div>
      </>)}
      {sel.peso&&sel.pesoDesejado&&(<><p className="sec">Metas de Peso</p><div className="ic">
        <div className="ri"><span className="rl">Peso atual</span><span className="rv">{sel.peso} kg</span></div>
        <div className="ri"><span className="rl">Peso desejado</span><span className="rv" style={{color:"#63b3ed"}}>{sel.pesoDesejado} kg</span></div>
        <div className="ri"><span className="rl">Diferença</span><span className="rv" style={{color:"#fbbf24"}}>{(parseFloat(sel.peso)-parseFloat(sel.pesoDesejado)).toFixed(1)} kg</span></div>
      </div></>)}
    </>);
  };

  const renderParq=()=>{
    if(!sel)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:20}}>Selecione uma avaliação no Histórico.</p>;
    const simCount=PARQ_QUESTIONS.filter((_,i)=>sel[`parq${i}`]===true).length;
    const itens=PARQ_QUESTIONS.map((q,i)=>{
      const r=sel[`parq${i}`];
      const cls=r===true?"a-sim":r===false?"a-nao":"a-nd";
      const label=r===true?"SIM":r===false?"NÃO":"—";
      return(
        <div className="dparq-item" key={i}>
          <span className="dparq-q">{i+1}. {q}</span>
          <span className={`dparq-a ${cls}`}>{label}</span>
        </div>
      );
    });
    const alertStyle={padding:"10px 14px",borderRadius:12,marginTop:4,
      background:simCount>0?"rgba(239,68,68,0.1)":"rgba(52,211,153,0.1)",
      border:`1px solid ${simCount>0?"rgba(239,68,68,0.3)":"rgba(52,211,153,0.3)"}`,
      fontSize:13,color:simCount>0?"#f87171":"#34d399",fontWeight:500};
    const alertMsg=simCount>0?`⚠ ${simCount} resposta(s) SIM — encaminhar para avaliação médica.`:"✓ Nenhuma contraindicação identificada.";
    return(
      <>
        <p className="sec">Questionário PAR-Q</p>
        <div className="ic">{itens}</div>
        <div style={alertStyle}>{alertMsg}</div>
      </>
    );
  };

  const renderPostural=()=>{
    if(!sel)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:20}}>Selecione uma avaliação no Histórico.</p>;
    const fotos=sel.posturalFotos||[];
    return(<>
      {fotos.length>0&&(<><p className="sec">Fotos Posturais</p>
        <div className="postural-fotos">{fotos.map((src,i)=><div key={i} className="postural-foto"><img src={src} alt={`Foto ${i+1}`}/></div>)}</div>
      </>)}
      {sel.posturalResultado&&(<><p className="sec">Resultado</p>
        <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:14,padding:14,fontSize:13,color:"rgba(255,255,255,0.65)",lineHeight:1.7,whiteSpace:"pre-wrap"}}>{sel.posturalResultado}</div>
      </>)}
      {!fotos.length&&!sel.posturalResultado&&<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:12}}>Nenhuma avaliação postural registrada.</p>}
    </>);
  };

  const renderEvolucao=()=>{
    if(sorted.length<2) return(
      <div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.25)",fontSize:13}}>
        Cadastre pelo menos 2 avaliações para ver a evolução.
      </div>
    );
    const linhas = sorted.map((av,i)=>{
      const prev=sorted[i-1];
      const dp=prev?.pg!=null&&av.pg!=null?(av.pg-prev.pg).toFixed(1):null;
      const dw=prev?.peso&&av.peso?(parseFloat(av.peso)-parseFloat(prev.peso)).toFixed(1):null;
      const di=prev?.imc&&av.imc?(av.imc-prev.imc).toFixed(2):null;
      const isLast=i===sorted.length-1;
      return(
        <div key={av.id} className="evol-row">
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",width:10}}>
            <div className="evol-dot" style={{background:isLast?"#34d399":"#3b82f6"}}/>
            {!isLast&&<div className="evol-line"/>}
          </div>
          <div className="evol-body">
            <div className="evol-date">{fmtDate(av.data)}</div>
            <div className="evol-vals">
              {av.peso&&<span className="evol-val">⚖ {av.peso}kg{dw&&<span style={{color:parseFloat(dw)<0?"#34d399":"#f87171",marginLeft:4}}>{parseFloat(dw)>0?"+":""}{dw}</span>}</span>}
              {av.pg!=null&&<span className="evol-val">💧 {av.pg.toFixed(1)}%{dp&&<span style={{color:parseFloat(dp)<0?"#34d399":"#f87171",marginLeft:4}}>{parseFloat(dp)>0?"+":""}{dp}</span>}</span>}
              {av.imc!=null&&<span className="evol-val">📊 {av.imc.toFixed(1)}{di&&<span style={{color:parseFloat(di)<0?"#34d399":"#f87171",marginLeft:4}}>{parseFloat(di)>0?"+":""}{di}</span>}</span>}
            </div>
          </div>
        </div>
      );
    });
    const f=sorted[0], l=sorted[sorted.length-1];
    const varPeso=f.peso&&l.peso?(parseFloat(l.peso)-parseFloat(f.peso)).toFixed(1):null;
    const varPg=f.pg!=null&&l.pg!=null?(l.pg-f.pg).toFixed(1):null;
    return(
      <>
        <p className="sec">Linha do Tempo</p>
        {linhas}
        <p className="sec" style={{marginTop:24}}>Resumo</p>
        <div className="ic">
          <div className="ri"><span className="rl">Período</span><span className="rv">{fmtDate(f.data)} → {fmtDate(l.data)}</span></div>
          <div className="ri"><span className="rl">Avaliações</span><span className="rv">{sorted.length}</span></div>
          {varPeso!=null&&<div className="ri"><span className="rl">Variação de Peso</span><span className="rv" style={{color:parseFloat(varPeso)<0?"#34d399":"#f87171"}}>{parseFloat(varPeso)>0?"+":""}{varPeso} kg</span></div>}
          {varPg!=null&&<div className="ri"><span className="rl">Variação %G</span><span className="rv" style={{color:parseFloat(varPg)<0?"#34d399":"#f87171"}}>{parseFloat(varPg)>0?"+":""}{varPg}%</span></div>}
        </div>
      </>
    );
  };

  return(
    <div className="app">
      <div className="detail-header">
        <button className="btn-back" onClick={onBack}>← Voltar</button>
        <div className="detail-nome">{aluno.nome}</div>
        <div className="detail-sub">{aluno.sexo==="M"?"Masculino":"Feminino"}{idade!==null?` · ${idade} anos`:""}{aluno.dataNasc?` · Nasc. ${fmtDate(aluno.dataNasc)}`:""}{sorted.length>0?` · ${sorted.length} avaliação${sorted.length>1?"ões":""}`:""}</div>
        {latest&&<div className="detail-chips">
          {latest.imc!=null&&<span className="chip-sm" style={{borderColor:`${imcInfo(latest.imc).color}44`,color:imcInfo(latest.imc).color}}>IMC {latest.imc.toFixed(1)}</span>}
          {latest.pg!=null&&<span className="chip-sm" style={{borderColor:`${pgInfo(latest.pg).color}44`,color:pgInfo(latest.pg).color}}>%G {latest.pg.toFixed(1)}</span>}
          {avaliacoes.some(a=>a.restricoes)&&<span className="chip-sm chip-warn">⚠ Restrições</span>}
        </div>}
        <div className="detail-acts">
          <button className="btn-sm btn-sm-p" onClick={onEditAluno}>Editar Aluno</button>
          <button className="btn-sm btn-sm-d" onClick={onDeleteAluno}>Excluir Aluno</button>
        </div>
      </div>
      <div className="dtabs">{dtabs.map(t=><button key={t} className={`dtab ${dtab===t?"active":""}`} onClick={()=>setDtab(t)}>{t}</button>)}</div>
      <div className="dcontent">
        {dtab==="Histórico"&&renderHistorico()}
        {dtab==="Perfil"&&renderPerfil()}
        {dtab==="Medidas"&&renderMedidas()}
        {dtab==="Dobras"&&renderDobras()}
        {dtab==="Resultados"&&renderResultados()}
        {dtab==="PAR-Q"&&renderParq()}
        {dtab==="Postural"&&renderPostural()}
        {dtab==="Evolução"&&renderEvolucao()}
      </div>
      {showForm&&<FormDrawer aluno={{...aluno,idade:calcIdade(aluno.dataNasc)}} initial={editAval}
        onSave={av=>{onSaveAval(av);setShowForm(false);setEditAval(null);setSelId(av.id);setDtab("Histórico");}}
        onClose={()=>{setShowForm(false);setEditAval(null);}}/>}
    </div>
  );
}

// ─── ConfigDrawer ─────────────────────────────────────────────────────────────
function ConfigDrawer({settings, onUpdateSettings, db, onImport, onClose}) {
  const fileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const iconInputRef = useRef(null);
  const [msg, setMsg] = useState('');

  const flash = (m) => { setMsg(m); setTimeout(()=>setMsg(''), 3000); };

  // ── Export ──
  const handleExport = () => {
    try {
      const payload = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...db });
      const blob = new Blob([payload], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      const ts   = new Date().toISOString().slice(0,10);
      a.href = url; a.download = `BioFitMetrics_backup_${ts}.json`;
      document.body.appendChild(a); a.click();
      setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
      flash('✅ Backup exportado com sucesso!');
    } catch(e) { flash('❌ Erro ao exportar: ' + e.message); }
  };

  // ── Import ──
  const handleImportFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.alunos || !parsed.avaliacoes) throw new Error('Formato inválido');
        if (!confirm(`Importar ${parsed.alunos.length} aluno(s) e ${parsed.avaliacoes.length} avaliação(ões)?\n\nISTO IRÁ SUBSTITUIR todos os dados atuais.`)) return;
        onImport({ alunos: parsed.alunos, avaliacoes: parsed.avaliacoes });
        flash('✅ Dados importados com sucesso!');
      } catch(err) { flash('❌ Arquivo inválido: ' + err.message); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // ── Update Logo ──
  const handleLogoFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result.split(',')[1];
      const updated = { ...settings, logob64: b64 };
      onUpdateSettings(updated);
      flash('✅ Logo atualizada!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Update Icon ──
  const handleIconFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const b64 = ev.target.result.split(',')[1];
      const updated = { ...settings, iconb64: b64 };
      onUpdateSettings(updated);
      flash('✅ Ícone atualizado!');
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const totalAvals = db.avaliacoes?.length || 0;
  const totalAlunos = db.alunos?.length || 0;

  return (
    <div className="overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="drawer">
        <div className="drawer-handle"/>
        <div className="drawer-header">
          <span className="drawer-title">⚙️ Configurações</span>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>
        <div className="form-scroll">

          {/* Banco de Dados */}
          <div className="cfg-section">
            <div className="cfg-section-title">Banco de Dados</div>

            <div className="cfg-item" onClick={handleExport}>
              <div className="cfg-item-icon" style={{background:'rgba(52,211,153,0.12)'}}>📤</div>
              <div className="cfg-item-body">
                <div className="cfg-item-title">Exportar Backup</div>
                <div className="cfg-item-sub">{totalAlunos} aluno{totalAlunos!==1?'s':''} · {totalAvals} avaliação{totalAvals!==1?'ões':''}</div>
              </div>
              <span className="cfg-item-arrow">›</span>
            </div>

            <div className="cfg-item" onClick={()=>fileInputRef.current?.click()}>
              <div className="cfg-item-icon" style={{background:'rgba(59,130,246,0.12)'}}>📥</div>
              <div className="cfg-item-body">
                <div className="cfg-item-title">Importar Backup</div>
                <div className="cfg-item-sub">Restaurar dados de arquivo .json</div>
              </div>
              <span className="cfg-item-arrow">›</span>
            </div>
            <input ref={fileInputRef} type="file" accept=".json,application/json" style={{display:'none'}} onChange={handleImportFile}/>
          </div>

          {/* Personalização */}
          <div className="cfg-section">
            <div className="cfg-section-title">Personalização</div>

            <div style={{marginBottom:10}}>
              <span className="fl">Logo atual (usada no PDF)</span>
              <img className="cfg-logo-preview" src={`data:image/jpeg;base64,${settings.logob64}`} alt="Logo atual"/>
              <div className="cfg-item" onClick={()=>logoInputRef.current?.click()}>
                <div className="cfg-item-icon" style={{background:'rgba(245,158,11,0.12)'}}>🖼️</div>
                <div className="cfg-item-body">
                  <div className="cfg-item-title">Atualizar Logo do PDF</div>
                  <div className="cfg-item-sub">Imagem exibida nos relatórios PDF</div>
                </div>
                <span className="cfg-item-arrow">›</span>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleLogoFile}/>
            </div>

            <div>
              <span className="fl">Ícone do App</span>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <img src={`data:image/png;base64,${settings.iconb64}`} style={{width:56,height:56,borderRadius:14,objectFit:'cover'}} alt="Ícone"/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,color:'#e4e4f0',marginBottom:2}}>Ícone atual</div>
                  <div style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Exibido na barra superior</div>
                </div>
              </div>
              <div className="cfg-item" onClick={()=>iconInputRef.current?.click()}>
                <div className="cfg-item-icon" style={{background:'rgba(139,92,246,0.12)'}}>📱</div>
                <div className="cfg-item-body">
                  <div className="cfg-item-title">Atualizar Ícone do App</div>
                  <div className="cfg-item-sub">PNG ou JPG — aparece no cabeçalho</div>
                </div>
                <span className="cfg-item-arrow">›</span>
              </div>
              <input ref={iconInputRef} type="file" accept="image/*" style={{display:'none'}} onChange={handleIconFile}/>
            </div>
          </div>

          {/* Sobre */}
          <div className="cfg-version">BioFitMetrics v2.0 · Jackson &amp; Pollock 7 Dobras</div>

          {msg && <div style={{position:'sticky',bottom:0,background:msg.startsWith('✅')?'rgba(52,211,153,0.15)':'rgba(239,68,68,0.15)',border:`1px solid ${msg.startsWith('✅')?'rgba(52,211,153,0.4)':'rgba(239,68,68,0.4)'}`,borderRadius:12,padding:'10px 14px',fontSize:13,color:msg.startsWith('✅')?'#34d399':'#f87171',textAlign:'center',marginTop:8}}>{msg}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [db,setDb]          = useState({alunos:[],avaliacoes:[]});
  const [loading,setLoading] = useState(true);
  const [settings,setSettings] = useState({logob64:DEFAULT_LOGO_B64, iconb64:DEFAULT_ICON_B64});
  const [detailId,setDetailId] = useState(null);
  const [showAlunoForm,setShowAlunoForm] = useState(false);
  const [editAluno,setEditAluno]         = useState(null);
  const [search,setSearch]   = useState('');
  const [showConfig,setShowConfig] = useState(false);

  useEffect(()=>{
    Promise.all([loadData(), loadSettings()]).then(([d,s])=>{
      setDb(d); setSettings(s); setLoading(false);
    });
  },[]);

  const persist = useCallback(async next => { setDb(next); await saveData(next); },[]);
  const persistSettings = useCallback(async s => { setSettings(s); await saveSettings(s); },[]);

  const handleSaveAluno = async al => {
    const exists = db.alunos.some(a=>a.id===al.id);
    const alunos = exists ? db.alunos.map(a=>a.id===al.id?al:a) : [al,...db.alunos];
    await persist({...db,alunos});
    setShowAlunoForm(false); setEditAluno(null);
    if(!exists) setDetailId(al.id);
  };
  const handleDeleteAluno = async id => {
    if(!confirm('Excluir este aluno e todas as suas avaliações?')) return;
    await persist({alunos:db.alunos.filter(a=>a.id!==id),avaliacoes:db.avaliacoes.filter(a=>a.alunoId!==id)});
    setDetailId(null);
  };
  const handleSaveAval = async av => {
    const exists = db.avaliacoes.some(a=>a.id===av.id);
    const avaliacoes = exists ? db.avaliacoes.map(a=>a.id===av.id?av:a) : [av,...db.avaliacoes];
    const next = {...db, avaliacoes};
    setDb(next);
    await saveData(next);
  };
  const handleDeleteAval = async id => {
    if(!confirm('Excluir esta avaliação?')) return;
    await persist({...db,avaliacoes:db.avaliacoes.filter(a=>a.id!==id)});
  };
  const handleImport = async d => { await persist(d); };

  const filtered = db.alunos.filter(a=>a.nome.toLowerCase().includes(search.toLowerCase()));
  const detail   = detailId ? db.alunos.find(a=>a.id===detailId) : null;
  const detailAv = detail   ? db.avaliacoes.filter(a=>a.alunoId===detail.id) : [];

  // Pass logo to PDF generator via settings
  const makePDF = (aluno, av) => generatePDF(aluno, av, settings.logob64);

  if(loading) return(<><style>{css}</style><div className="app"><div className="loading">Carregando...</div></div></>);

  if(detail) return(<>
    <style>{css}</style>
    <DetailView aluno={detail} avaliacoes={detailAv} onBack={()=>setDetailId(null)}
      onEditAluno={()=>{setEditAluno(detail);setShowAlunoForm(true);}}
      onDeleteAluno={()=>handleDeleteAluno(detail.id)}
      onSaveAval={handleSaveAval} onDeleteAval={handleDeleteAval}
      onPDF={makePDF}/>
    {showAlunoForm&&<AlunoForm initial={editAluno} onSave={handleSaveAluno} onClose={()=>{setShowAlunoForm(false);setEditAluno(null);}}/>}
    {showConfig&&<ConfigDrawer settings={settings} onUpdateSettings={persistSettings} db={db} onImport={handleImport} onClose={()=>setShowConfig(false)}/>}
  </>);

  return(<>
    <style>{css}</style>
    <div className="app">
      <div className="topbar">
        <div className="topbar-brand">
          <img className="topbar-icon" src={`data:image/png;base64,${settings.iconb64}`} alt="BioFitMetrics"/>
          <div>
            <div className="topbar-title">BioFitMetrics</div>
            <div className="topbar-sub">{db.alunos.length} aluno{db.alunos.length!==1?'s':''} · {db.avaliacoes.length} aval.</div>
          </div>
        </div>
        <div className="topbar-acts">
          <button className="btn-icon" onClick={()=>setShowConfig(true)} title="Configurações">⚙️</button>
          <button className="btn-new" onClick={()=>{setEditAluno(null);setShowAlunoForm(true);}}>
            <span style={{fontSize:18,lineHeight:1}}>＋</span> Novo
          </button>
        </div>
      </div>
      <div className="search-wrap"><input className="search-input" placeholder="Buscar aluno..." value={search} onChange={e=>setSearch(e.target.value)}/></div>
      <div className="list">
        {filtered.length===0&&<div className="empty-state"><div className="empty-icon">🏋️</div>{search?'Nenhum aluno encontrado.':'Nenhum aluno cadastrado.\nToque em "Novo" para começar.'}</div>}
        {filtered.map(al=>{
          const idade=calcIdade(al.dataNasc);
          const avs=db.avaliacoes.filter(a=>a.alunoId===al.id).sort((a,b)=>b.data.localeCompare(a.data));
          const last=avs[0];
          const ic2=imcInfo(last?.imc),pc2=pgInfo(last?.pg);
          return(
            <div key={al.id} className={`aluno-card ${al.sexo}`} onClick={()=>setDetailId(al.id)}>
              <div className="aluno-top">
                <div><div className="aluno-nome">{al.nome}</div><div className="aluno-meta">{al.sexo==='M'?'Masculino':'Feminino'}{idade!==null?` · ${idade} anos`:''}{al.dataNasc?` · ${fmtDate(al.dataNasc)}`:''}</div></div>
                <span style={{color:'rgba(255,255,255,0.2)',fontSize:20}}>›</span>
              </div>
              <div className="aluno-badges">
                {last?.imc!=null&&<span className="badge" style={{background:`${ic2.color}15`,borderColor:`${ic2.color}40`,color:ic2.color}}>IMC {last.imc.toFixed(1)}</span>}
                {last?.pg!=null&&<span className="badge" style={{background:`${pc2.color}15`,borderColor:`${pc2.color}40`,color:pc2.color}}>%G {last.pg.toFixed(1)}</span>}
                {avs.some(a=>a.restricoes)&&<span className="badge" style={{background:'rgba(251,191,36,0.1)',borderColor:'rgba(251,191,36,0.3)',color:'#fbbf24'}}>⚠ Restrições</span>}
              </div>
              <div className="aval-count">{avs.length} avaliação{avs.length!==1?'ões':''}{last?` · última em ${fmtDate(last.data)}`:''}</div>
            </div>
          );
        })}
      </div>
      {showAlunoForm&&<AlunoForm initial={editAluno} onSave={handleSaveAluno} onClose={()=>{setShowAlunoForm(false);setEditAluno(null);}}/>}
      {showConfig&&<ConfigDrawer settings={settings} onUpdateSettings={persistSettings} db={db} onImport={handleImport} onClose={()=>setShowConfig(false)}/>}
    </div>
  </>);
}
