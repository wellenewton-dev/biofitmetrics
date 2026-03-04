import { useState, useEffect, useCallback, useRef, memo } from "react";
// ─── Storage ──────────────────────────────────────────────────────────────────
const STORAGE_KEY = "aval-fisicas-v5";
// ─── Constantes de imagem (padrão) ────────────────────────────────────────────
const DEFAULT_ICON_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAQAElEQVR42u2be7BdVX3
const DEFAULT_LOGO_B64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhc
// ─── Settings storage ─────────────────────────────────────────────────────────
const SETTINGS_KEY = "biofitmetrics-settings";
async function loadSettings() {
try {
const r = localStorage.getItem(SETTINGS_KEY);
return r ? JSON.parse(r) : { logob64: DEFAULT_LOGO_B64, iconb64: DEFAULT_ICON_B64 };
} catch { return { logob64: DEFAULT_LOGO_B64, iconb64: DEFAULT_ICON_B64 }; }
}
async function saveSettings(s) {
try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
}
async function loadData() {
try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : { alunos:[],
catch { return { alunos:[], avaliacoes:[] }; }
}
async function saveData(d) {
try {
// Remove fotos posturais grandes antes de salvar (guardar só metadados)
const safe = {
...d,
avaliacoes: d.avaliacoes.map(av => ({
...av,
posturalFotos: (av.posturalFotos||[]).map(f => f && f.length > 50000 ? '__foto_grande
}))
};
localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
} catch(e) {
// Se localStorage cheio, tenta sem as fotos
try {
const semFotos = {
...d,
avaliacoes: d.avaliacoes.map(av => ({...av, posturalFotos:[]}))
};
localStorage.setItem(STORAGE_KEY, JSON.stringify(semFotos));
console.warn('Fotos removidas por limite de armazenamento');
} catch(e2) { console.error('Erro ao salvar:', e2); }
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
if(h.getMonth()<n.getMonth()||(h.getMonth()===n.getMonth()&&h.getDate()<n.getDate())) age--
return age>=0?age:null;
}
function imcInfo(v) {
if(!v) return {label:"—",color:"#888"};
if(v<18.5) return {label:"Abaixo do Peso",color:"#60a5fa"};
if(v<25) return {label:"Normal",color:"#34d399"};
if(v<30) return {label:"Sobrepeso",color:"#fbbf24"};
if(v<35) return {label:"Obesidade I",color:"#f97316"};
return {label:"Obesidade II",color:"#f87171"};
}
function pgInfo(v) {
if(!v) return {label:"—",color:"#888"};
if(v<10) return {label:"Baixo",color:"#60a5fa"};
if(v<20) return {label:"Normal",color:"#34d399"};
if(v<25) return {label:"Acima do Normal",color:"#fbbf24"};
return {label:"Alto",color:"#f87171"};
}
function avgDobra(form,key) {
const vals=[form[`${key}1`],form[`${key}2`],form[`${key}3`]].map(Number).filter(v=>!isNaN(v
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
"Algum médico já disse que você possui algum problema de coração e que só deveria realizar
"Você sente dores no peito quando pratica atividade física?",
"No último mês, você sentiu dores no peito quando NÃO estava praticando atividade física?",
"Você apresenta desequilíbrio devido à tontura e/ou perda de consciência?",
"Você possui algum problema ósseo ou articular que poderia ser piorado pela atividade físic
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
posturalFotos:[], // array de base64 strings (max 4)
posturalResultado:"",
observacoes:"",
};
const EMPTY_ALUNO={nome:"",dataNasc:"",sexo:"M"};
const FORM_TABS=["Pessoal","Biométrico","PA/FC","Medidas","Dobras","PAR-Q","Postural","Obs."]
// ─── PDF Export (client-side via print) ───────────────────────────────────────
function generatePDF(aluno, av, customLogo) {
const idade = calcIdade(aluno.dataNasc);
const imc = av.imc;
const pg = av.pg;
const ic = imcInfo(imc);
const pc = pgInfo(pg);
const dm = av.medias || {};
const parqSim = PARQ_QUESTIONS.filter((_,i) => av[`parq${i}`] === true).length;
const LOGO = customLogo || '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyc
const fotoHtml = (av.posturalFotos||[]).map(src =>
`<img src="${src}" style="width:calc(50% - 5px);height:160px;object-fit:cover;border-radi
).join('');
const medidas = [
['Tórax',av.torax],['Cintura',av.cintura],['ABS',av.abs],['Quadril',av.quadril],
['Braço Dir.',av.bracoDir],['Braço Esq.',av.bracoEsq],
['Antebraço Dir.',av.antebracoDir],['Antebraço Esq.',av.antebracoEsq],
['Coxa Dir.',av.coxaDir],['Coxa Esq.',av.coxaEsq],
['Panturrilha Dir.',av.panturrilhaDir],['Panturrilha Esq.',av.panturrilhaEsq],
].filter(([,v]) => v);
const dobraRows = DOBRA_FIELDS.filter(({key}) => dm[key] > 0).map(({label,key}) =>
`<tr><td>${label}</td><td>${av[key+'1']||'—'}</td><td>${av[key+'2']||'—'}</td><td>${av[ke
).join('');
const parqRows = PARQ_QUESTIONS.map((q,i) => {
const r = av[`parq${i}`];
const cls = r===true ? 'sim' : r===false ? 'nao' : 'nd';
const lbl = r===true ? 'SIM' : r===false ? 'NÃO' : '—';
return `<div class="prow"><span class="pq">${i+1}. ${q}</span><span class="pa ${cls}">${l
}).join('');
const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"/>
<title>Avaliação — ${aluno.nome}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Segoe UI',Arial,sans-serif;font-size:11px;color:#1e293b;background:#fff;}
.page{max-width:780px;margin:0 auto;padding:24px 28px;}
.hdr{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;border
.hdr-logo{height:66px;}
.hdr-right{text-align:right;}
.hdr-nome{font-size:20px;font-weight:900;color:#1e293b;}
.hdr-sub{font-size:11px;color:#64748b;margin-top:2px;}
.hdr-data{font-size:10px;color:#94a3b8;margin-top:2px;}
.sec{margin-bottom:14px;}
.sec-t{font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#f97
.g2{display:grid;grid-template-columns:1fr 1fr;gap:7px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:7px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:7px;}
.card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:8px 10px;}
.card.hl{border-left:3px solid #f97316;}
.cl{font-size:8px;letter-spacing:1.5px;text-transform:uppercase;color:#94a3b8;margin-bottom:2
.cv{font-size:18px;font-weight:900;color:#1e293b;line-height:1;}
.cu{font-size:9px;color:#94a3b8;font-weight:400;}
.res{border-radius:9px;padding:12px 14px;margin-bottom:6px;}
.rl{font-size:8px;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:.85;}
.rv{font-size:32px;font-weight:900;line-height:1.1;color:#fff;}
.rc{font-size:11px;font-weight:700;color:#fff;margin-top:3px;}
table{width:100%;border-collapse:collapse;font-size:10px;}
th{background:#1e293b;color:#fff;padding:5px 7px;text-align:left;font-size:9px;font-weight:70
td{padding:4px 7px;border-bottom:1px solid #f1f5f9;}
tr:nth-child(even) td{background:#f8fafc;}
.prow{display:flex;justify-content:space-between;align-items:flex-start;padding:4px 0;border-
.pq{flex:1;font-size:10px;color:#475569;line-height:1.45;}
.pa{font-weight:700;font-size:9px;padding:2px 7px;border-radius:20px;flex-shrink:0;margin-top
.sim{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}
.nao{background:#f0fdf4;color:#16a34a;border:1px solid #86efac;}
.nd{background:#f8fafc;color:#94a3b8;border:1px solid #e2e8f0;}
.palert{margin-top:8px;padding:6px 10px;border-radius:7px;font-size:10px;font-weight:700;}
.pok{background:#f0fdf4;color:#16a34a;border:1px solid #86efac;}
.pwarn{background:#fef2f2;color:#dc2626;border:1px solid #fca5a5;}
.tbox{background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:10px;font-size:10
.ftr{margin-top:20px;padding-top:10px;border-top:1px solid #e2e8f0;display:flex;justify-conte
.ftr-logo{height:26px;opacity:.45;}
.ftr-txt{font-size:8px;color:#94a3b8;text-align:right;line-height:1.6;}
@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}@page{margin:10m
</style></head>
<body><div class="page">
<div class="hdr">
<img class="hdr-logo" src="data:image/jpeg;base64,${LOGO}" />
<div class="hdr-right">
<div class="hdr-nome">${aluno.nome}</div>
<div class="hdr-sub">${aluno.sexo==='M'?'Masculino':'Feminino'}${idade!=null?' · '+idade+
<div class="hdr-data">Avaliação: ${fmtDate(av.data)} &nbsp;·&nbsp; Gerado: ${new Date().t
</div>
</div>
${(imc||pg)?`<div class="sec"><div class="sec-t">Resultados</div><div class="g${imc&&pg?'2':'
${imc?`<div class="res" style="background:linear-gradient(135deg,${ic.color},${ic.color}bb)
<div class="rl" style="color:#fff">Índice de Massa Corporal</div>
<div class="rv">${imc.toFixed(2)}</div><div class="rc">${ic.label}</div></div>`:''}
${pg?`<div class="res" style="background:linear-gradient(135deg,${pc.color},${pc.color}bb);
<div class="rl" style="color:#fff">% Gordura Corporal — JP7</div>
<div class="rv">${pg.toFixed(2)}<span style="font-size:16px">%</span></div><div class="rc
</div></div>`:''}
<div class="sec"><div class="sec-t">Dados Biométricos</div>
<div class="g4">
${av.peso?`<div class="card hl"><div class="cl">Peso</div><div class="cv">${av.peso}<span
${av.altura?`<div class="card hl"><div class="cl">Altura</div><div class="cv">${av.altura
${av.pressaoArterial?`<div class="card"><div class="cl">Pressão Arterial</div><div class=
${av.fc?`<div class="card"><div class="cl">Freq. Cardíaca</div><div class="cv">${av.fc}<s
${av.pesoDesejado?`<div class="card"><div class="cl">Peso Desejado</div><div class="cv" s
${av.pgDesejado?`<div class="card"><div class="cl">%G Desejado</div><div class="cv" style
</div>
${av.objetivo||av.restricoes?`<div class="g2" style="margin-top:7px">
${av.objetivo?`<div class="card"><div class="cl">Objetivo</div><div style="font-size:10px
${av.restricoes?`<div class="card" style="border-color:#fca5a5"><div class="cl" style="co
</div>`:''}
</div>
${medidas.length>0?`<div class="sec"><div class="sec-t">Medidas Corporais (cm)</div>
<div class="g4">${medidas.map(([l,v])=>`<div class="card"><div class="cl">${l}</div><div cl
</div>`:''}
${dobraRows?`<div class="sec"><div class="sec-t">Dobras Cutâneas — Jackson &amp; Pollock 7 (c
<table><thead><tr><th>Dobra</th><th>1ª Medida</th><th>2ª Medida</th><th>3ª Medida</th><th>M
<tbody>${dobraRows}${av.dc?`<tr style="background:#eff6ff"><td colspan="4" style="font-weig
</table>
</div>`:''}
<div class="sec"><div class="sec-t">PAR-Q — Prontidão para Atividade Física</div>
${parqRows}
<div class="palert ${parqSim>0?'pwarn':'pok'}">${parqSim>0?`⚠ ${parqSim} resposta(s) SIM —
</div>
${(av.posturalFotos&&av.posturalFotos.length>0)||av.posturalResultado?`<div class="sec"><div
${av.posturalFotos&&av.posturalFotos.length>0?`<div style="margin-bottom:8px">${fotoHtml}</
${av.posturalResultado?`<div class="tbox">${av.posturalResultado}</div>`:''}
</div>`:''}
${av.observacoes?`<div class="sec"><div class="sec-t">Observações</div><div class="tbox">${av
<div class="ftr">
<img class="ftr-logo" src="data:image/jpeg;base64,${LOGO}" />
<div class="ftr-txt">${aluno.nome} · Avaliação de ${fmtDate(av.data)}<br/>Gerado em ${new D
</div>
</div><script>window.addEventListener('load',function(){window.print();});<\/script>
</body></html>`;
const blob = new Blob([html], {type: 'text/html;charset=utf-8'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = `Avaliacao_${aluno.nome.replace(/\s+/g,'_')}_${av.data}.html`;
document.body.appendChild(a);
a.click();
setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url); }, 3000);
}
// ─── CSS ──────────────────────────────────────────────────────────────────────
const css=`
@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;700;800&family=DM+Sans:wg
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#080810;font-family:'DM Sans',sans-serif;color:#e4e4f0;}
input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;}
input[type=number]{-moz-appearance:textfield;}
.app{max-width:430px;margin:0 auto;min-height:100svh;background:#0c0c16;overflow-x:hidden;}
.topbar{display:flex;align-items:center;justify-content:space-between;padding:52px 20px 16px;
.topbar-brand{display:flex;align-items:center;gap:10px;}
.topbar-icon{width:38px;height:38px;border-radius:10px;object-fit:cover;}
.topbar-title{font-family:'Syne',sans-serif;font-size:18px;font-weight:800;color:#fff;line-he
.topbar-sub{font-size:11px;color:rgba(255,255,255,0.35);margin-top:1px;}
.topbar-acts{display:flex;gap:8px;align-items:center;}
.btn-icon{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.1);border-rad
/* Config Drawer */
.cfg-section{margin-bottom:22px;}
.cfg-section-title{font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase
.cfg-item{display:flex;align-items:center;gap:12px;background:#141424;border:1px solid rgba(2
.cfg-item:active{background:rgba(255,255,255,0.05);}
.cfg-item-icon{font-size:22px;width:40px;height:40px;border-radius:12px;display:flex;align-it
.cfg-item-body{flex:1;}
.cfg-item-title{font-size:14px;font-weight:600;color:#e4e4f0;margin-bottom:2px;}
.cfg-item-sub{font-size:12px;color:rgba(255,255,255,0.3);}
.cfg-item-arrow{color:rgba(255,255,255,0.15);font-size:18px;}
.cfg-logo-preview{width:100%;border-radius:12px;object-fit:contain;background:#000;max-height
.cfg-version{text-align:center;font-size:11px;color:rgba(255,255,255,0.18);padding:16px 0 8px
.btn-new{display:flex;align-items:center;gap:6px;background:linear-gradient(135deg,#3b82f6,#6
.search-wrap{padding:12px 16px;}
.search-input{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,
.search-input::placeholder{color:rgba(255,255,255,0.25);}
.list{padding:0 16px 100px;}
.empty-state{text-align:center;padding:60px 20px;color:rgba(255,255,255,0.2);font-size:14px;l
.empty-icon{font-size:48px;margin-bottom:12px;}
.aluno-card{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:16px;pad
.aluno-card::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;border-radiu
.aluno-card.M::before{background:linear-gradient(#3b82f6,#6366f1);}
.aluno-card.F::before{background:linear-gradient(#ec4899,#f97316);}
.aluno-top{display:flex;align-items:flex-start;justify-content:space-between;}
.aluno-nome{font-family:'Syne',sans-serif;font-size:15px;font-weight:700;color:#fff;margin-bo
.aluno-meta{font-size:12px;color:rgba(255,255,255,0.35);}
.aluno-badges{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;}
.badge{font-size:11px;font-weight:500;padding:3px 9px;border-radius:20px;border:1px solid;}
.aval-count{font-size:11px;color:rgba(99,130,237,0.7);margin-top:5px;}
.overlay{position:fixed;inset:0;background:rgba(0,0,0,0.8);z-index:200;display:flex;flex-dire
.drawer{background:#0f0f1e;border-radius:20px 20px 0 0;max-height:72svh;display:flex;flex-dir
.drawer-handle{width:36px;height:4px;background:rgba(255,255,255,0.12);border-radius:2px;marg
.drawer-header{display:flex;align-items:center;justify-content:space-between;padding:14px 20p
.drawer-title{font-family:'Syne',sans-serif;font-size:17px;font-weight:800;}
.btn-close{background:rgba(255,255,255,0.08);border:none;border-radius:50%;width:32px;height:
.form-tabs{display:flex;overflow-x:auto;scrollbar-width:none;padding:10px 16px 0;gap:6px;flex
.form-tabs::-webkit-scrollbar{display:none;}
.ftab{flex:0 0 auto;padding:6px 13px;border-radius:20px;border:1px solid rgba(255,255,255,0.1
.ftab.active{background:rgba(99,130,237,0.18);border-color:rgba(99,130,237,0.5);color:#a5b4fc
.form-scroll{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:16px 20px 12px;}
.fg{margin-bottom:14px;}
.fl{font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:rgba(2
.fi,.fs,.fta{width:100%;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0
.fi:focus,.fs:focus,.fta:focus{border-color:rgba(99,130,237,0.5);}
.fs{appearance:none;-webkit-appearance:none;background-image:url("data:image/svg+xml,%3Csvg x
.fs option{background:#1a1a2e;}
.fta{resize:none;min-height:80px;}
.f2{display:grid;grid-template-columns:1fr 1fr;gap:10px;}
.f3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;}
.hint{font-size:11px;color:rgba(255,255,255,0.22);margin-top:5px;}
.computed{background:rgba(99,130,237,0.08);border:1px solid rgba(99,130,237,0.2);border-radiu
.info-box{background:rgba(99,130,237,0.06);border:1px solid rgba(99,130,237,0.15);border-radi
.dobra-block{margin-bottom:16px;}
.dobra-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.dobra-name{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,2
.dobra-avg{font-size:12px;color:#63b3ed;}
/* PAR-Q */
.parq-item{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padd
.parq-num{font-size:10px;font-weight:700;letter-spacing:1.5px;color:#63b3ed;margin-bottom:6px
.parq-q{font-size:13px;color:rgba(255,255,255,0.65);line-height:1.55;margin-bottom:10px;}
.parq-btns{display:flex;gap:8px;}
.parq-btn{flex:1;padding:9px;border-radius:10px;border:1px solid;font-family:'DM Sans',sans-s
.parq-sim{background:rgba(239,68,68,0.08);border-color:rgba(239,68,68,0.2);color:#f87171;}
.parq-sim.sel{background:rgba(239,68,68,0.25);border-color:#f87171;color:#fff;}
.parq-nao{background:rgba(52,211,153,0.08);border-color:rgba(52,211,153,0.2);color:#34d399;}
.parq-nao.sel{background:rgba(52,211,153,0.25);border-color:#34d399;color:#fff;}
/* Postural */
.foto-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;}
.foto-slot{border:2px dashed rgba(255,255,255,0.12);border-radius:14px;aspect-ratio:3/4;displ
.foto-slot img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;border-radiu
.foto-slot-del{position:absolute;top:6px;right:6px;background:rgba(0,0,0,0.6);border:none;bor
.foto-add-icon{font-size:28px;color:rgba(255,255,255,0.2);margin-bottom:4px;}
.foto-add-label{font-size:11px;color:rgba(255,255,255,0.2);}
/* Form footer */
.form-footer{padding:12px 20px 16px;border-top:1px solid rgba(255,255,255,0.06);display:flex;
.btn-cancel{flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.08);
.btn-save{flex:2;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-radius
/* Detail */
.detail-header{padding:52px 20px 20px;background:linear-gradient(160deg,#0f0f24,#131326);bord
.btn-back{display:flex;align-items:center;gap:6px;background:none;border:none;color:rgba(255,
.detail-nome{font-family:'Syne',sans-serif;font-size:22px;font-weight:800;color:#fff;line-hei
.detail-sub{font-size:13px;color:rgba(255,255,255,0.35);margin-top:4px;}
.detail-chips{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
.chip-sm{font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.07)
.chip-warn{background:rgba(251,191,36,0.1);border-color:rgba(251,191,36,0.3);color:#fbbf24;}
.detail-acts{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.btn-sm{padding:7px 14px;border-radius:10px;font-family:'DM Sans',sans-serif;font-size:12px;f
.btn-sm-p{background:rgba(59,130,246,0.15);border-color:rgba(59,130,246,0.4);color:#60a5fa;}
.btn-sm-d{background:rgba(239,68,68,0.1);border-color:rgba(239,68,68,0.25);color:#f87171;}
.btn-sm-g{background:rgba(52,211,153,0.1);border-color:rgba(52,211,153,0.3);color:#34d399;}
.dtabs{display:flex;background:#0c0c16;overflow-x:auto;scrollbar-width:none;position:sticky;t
.dtabs::-webkit-scrollbar{display:none;}
.dtab{flex:0 0 auto;padding:13px 15px;background:none;border:none;border-bottom:2px solid tra
.dtab.active{color:#63b3ed;border-bottom-color:#63b3ed;}
.dcontent{padding:16px 16px 100px;}
.sec{font-family:'Syne',sans-serif;font-size:10px;font-weight:700;letter-spacing:2.5px;text-t
.sec:first-child{margin-top:0;}
.sg2{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px;}
.sc{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:14p
.sl{font-size:10px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.28);m
.sv{font-family:'Syne',sans-serif;font-size:26px;font-weight:800;color:#fff;line-height:1;}
.su{font-size:11px;color:rgba(255,255,255,0.3);margin-top:2px;}
.ic{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12p
.ri{display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bo
.ri:last-child{border-bottom:none;}
.rl{font-size:13px;color:rgba(255,255,255,0.45);flex-shrink:0;}
.rv{font-family:'Syne',sans-serif;font-size:13px;font-weight:600;color:#e4e4f0;text-align:rig
.result-block{border-radius:16px;padding:18px;margin-bottom:12px;position:relative;overflow:h
.result-block::before{content:'';position:absolute;inset:0;background:linear-gradient(135deg,
.rb-l{font-size:10px;font-weight:600;letter-spacing:2px;text-transform:uppercase;opacity:0.7;
.rb-v{font-family:'Syne',sans-serif;font-size:44px;font-weight:800;line-height:1;color:#fff;}
.rb-c{font-size:13px;font-weight:500;margin-top:8px;}
.pw{margin-top:12px;background:rgba(255,255,255,0.1);border-radius:6px;height:6px;overflow:hi
.pb{height:100%;border-radius:6px;}
.pm{display:flex;justify-content:space-between;font-size:11px;opacity:0.4;margin-top:7px;}
.dr{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padding:12p
.drh{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;}
.drn{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;}
.drm{font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#63b3ed;}
.dms{display:flex;gap:6px;}
.dm{flex:1;background:rgba(255,255,255,0.04);border-radius:8px;padding:5px;text-align:center;
.dml{font-size:9px;letter-spacing:1px;text-transform:uppercase;color:rgba(255,255,255,0.25);m
.dmv{font-family:'Syne',sans-serif;font-size:13px;font-weight:700;color:rgba(255,255,255,0.65
/* detail parq */
.dparq-item{display:flex;justify-content:space-between;align-items:flex-start;padding:9px 0;b
.dparq-item:last-child{border-bottom:none;}
.dparq-q{font-size:12px;color:rgba(255,255,255,0.55);flex:1;line-height:1.5;}
.dparq-a{font-size:11px;font-weight:700;padding:3px 8px;border-radius:10px;flex-shrink:0;}
.a-sim{background:rgba(239,68,68,0.15);color:#f87171;border:1px solid rgba(239,68,68,0.3);}
.a-nao{background:rgba(52,211,153,0.1);color:#34d399;border:1px solid rgba(52,211,153,0.25);}
.a-nd{background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.25);border:1px solid rgba(25
/* detail postural */
.postural-fotos{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:14px;}
.postural-foto{border-radius:12px;overflow:hidden;aspect-ratio:3/4;}
.postural-foto img{width:100%;height:100%;object-fit:cover;}
/* hist */
.hist-card{background:#141424;border:1px solid rgba(255,255,255,0.07);border-radius:14px;padd
.hist-card.sel{border-color:rgba(99,130,237,0.4);background:rgba(99,130,237,0.06);}
.hist-date{font-family:'Syne',sans-serif;font-size:14px;font-weight:700;color:#fff;margin-bot
.hist-badges{display:flex;gap:6px;flex-wrap:wrap;}
.hist-acts{display:flex;gap:8px;margin-top:10px;}
.btn-he{flex:1;background:rgba(59,130,246,0.1);border:1px solid rgba(59,130,246,0.3);border-r
.btn-hd{flex:1;background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-ra
.btn-hp{flex:1;background:rgba(52,211,153,0.08);border:1px solid rgba(52,211,153,0.2);border-
.btn-nova{width:100%;background:linear-gradient(135deg,#3b82f6,#6366f1);border:none;border-ra
/* evolução */
.evol-row{display:flex;position:relative;}
.evol-dot{width:10px;height:10px;border-radius:50%;flex-shrink:0;margin-top:4px;}
.evol-line{position:absolute;left:4px;top:14px;bottom:0;width:2px;background:rgba(255,255,255
.evol-body{margin-left:14px;flex:1;padding-bottom:20px;}
.evol-date{font-size:11px;color:rgba(255,255,255,0.3);margin-bottom:4px;}
.evol-vals{display:flex;gap:10px;flex-wrap:wrap;}
.evol-val{font-size:12px;color:rgba(255,255,255,0.55);}
.loading{display:flex;align-items:center;justify-content:center;height:60svh;color:rgba(255,2
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
const vr = useRef({...(initial||EMPTY_AVAL), data:initial?.data||new Date().toISOString().s
const [tab,setTab] = useState("Pessoal");
const [preview,setPreview] = useState(()=>computeResults(vr.current,aluno.sexo,aluno.idade)
// PAR-Q state (needs re-render for button highlight)
const [parq,setParq] = useState(()=>Array(7).fill(null).map((_,i)=>vr.current[`parq${i}`]??
// Postural fotos state (needs re-render to show thumbnails)
const [fotos,setFotos] = useState(()=>vr.current.posturalFotos||[]);
const hc = useCallback((name,value)=>{
vr.current[name]=value;
const calcFields=["peso","altura",...DOBRA_FIELDS.flatMap(({key})=>[`${key}1`,`${key}2`,`
if(calcFields.includes(name)) setPreview(computeResults(vr.current,aluno.sexo,aluno.idade
},[aluno.sexo,aluno.idade]);
const setParqAnswer = (i,val)=>{
vr.current[`parq${i}`]=val;
setParq(p=>{const n=[...p];n[i]=val;return n;});
};
const addFoto = (idx)=>{
const inp=document.createElement("input");
inp.type="file"; inp.accept="image/*"; inp.capture="environment";
inp.onchange=e=>{
const file=e.target.files[0]; if(!file)return;
const reader=new FileReader();
reader.onload=ev=>{
setFotos(prev=>{
const next=[...prev];
next[idx]=ev.target.result;
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
<div className="info-box"><strong style={{color:"rgba(255,255,255,0.65)"}}>Aluno:</
<div className="fg"><label className="fl">Data da Avaliação</label><SI name="data"
<div className="fg"><label className="fl">Objetivo</label><SI name="objetivo" dv={g
<div className="fg"><label className="fl">Restrições</label><ST name="restricoes" d
</div>
);
case "Biométrico": return(
<div>
<div className="f2">
<div className="fg"><label className="fl">Peso (kg)</label><SI name="peso" dv={ge
<div className="fg"><label className="fl">Altura (m)</label><SI name="altura" dv=
</div>
{preview.imc&&<div className="computed">IMC: <strong>{preview.imc.toFixed(2)}</stro
<div className="f2" style={{marginTop:14}}>
<div className="fg"><label className="fl">Peso Desejado (kg)</label><SI name="pes
<div className="fg"><label className="fl">%G Desejado</label><SI name="pgDesejado
</div>
</div>
);
case "PA/FC": return(
<div>
</div>
<div className="fg"><label className="fl">Pressão Arterial</label><SI name="pressao
<div className="fg"><label className="fl">Frequência Cardíaca (bpm)</label><SI name
);
case "Medidas": return(
<div>
{[
{t:"Tronco",fs:[["Tórax","torax"],["Cintura","cintura"],["ABS","abs"],["Quadril",
{t:"Braços",fs:[["Braço Dir.","bracoDir"],["Braço Esq.","bracoEsq"],["Antebraço D
{t:"Pernas",fs:[["Coxa Dir.","coxaDir"],["Coxa Esq.","coxaEsq"],["Panturrilha Dir
].map(g=>(
<div key={g.t} style={{marginBottom:18}}>
<p className="fl" style={{marginBottom:10,letterSpacing:2}}>{g.t} (cm)</p>
<div className="f2">{g.fs.map(([lbl,key])=>(
<div className="fg" key={key} style={{margin:0}}><label className="fl">{lbl}<
))}</div>
</div>
))}
</div>
);
case "Dobras": return(
<div>
<div className="info-box" style={{marginBottom:14}}>
Insira as 3 medidas em <strong style={{color:"#a5b4fc"}}>centímetros (cm)</strong
</div>
{DOBRA_FIELDS.map(({label,key})=>(
<div className="dobra-block" key={key}>
<div className="dobra-head"><span className="dobra-name">{label}</span><span cl
<div className="f3">{[1,2,3].map(n=>(
<div key={n}><label className="fl">{n}ª medida</label><SI name={`${key}${n}`}
))}</div>
</div>
))}
</div>
{preview.pg&&<div className="computed">%G: <strong>{preview.pg.toFixed(2)}%</strong
);
case "PAR-Q": return(
<div>
<div className="info-box" style={{marginBottom:14}}>Questionário de Prontidão para
{PARQ_QUESTIONS.map((q,i)=>(
<div className="parq-item" key={i}>
<div className="parq-num">PERGUNTA {i+1}</div>
<div className="parq-q">{q}</div>
<div className="parq-btns">
<button className={`parq-btn parq-sim ${parq[i]===true?"sel":""}`} onClick={(
<button className={`parq-btn parq-nao ${parq[i]===false?"sel":""}`} onClick={
</div>
</div>
))}
</div>
);
case "Postural": return(
<div>
<div className="info-box" style={{marginBottom:14}}>Tire ou anexe até 4 fotos para
<div className="foto-grid">
{["Frente","Costas","Perfil Direito","Perfil Esquerdo"].map((label,i)=>(
<div key={i} className="foto-slot" onClick={()=>!fotos[i]&&addFoto(i)}>
{fotos[i]
? <><img src={fotos[i]} alt={label}/><button className="foto-slot-del" onCl
: <><div className="foto-add-icon"> </div><div className="foto-add-label">
}
</div>
))}
</div>
<div className="fg"><label className="fl">Resultado da Avaliação Postural</label>
<ST name="posturalResultado" dv={get("posturalResultado")} placeholder="Descreva
</div>
</div>
);
case "Obs.": return(
<div><div className="fg"><label className="fl">Observações</label>
<ST name="observacoes" dv={get("observacoes")} placeholder="Bioimpedância, dinamome
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
<div className="form-tabs">{FORM_TABS.map(s=><button key={s} className={`ftab ${tab==
<div className="form-scroll">{renderTab()}</div>
<div className="form-footer"><button className="btn-cancel" onClick={onClose}>Cancela
</div>
</div>
);
}
// ─── AlunoForm ────────────────────────────────────────────────────────────────
function AlunoForm({initial,onSave,onClose}) {
const vr=useRef({...EMPTY_ALUNO,...(initial||{})});
const [idade,setIdade]=useState(()=>calcIdade(initial?.dataNasc));
const hc=useCallback((name,value)=>{ vr.current[name]=value; if(name==="dataNasc") setIdade
const get=k=>vr.current[k]||"";
const handleSave=()=>{ if(!vr.current.nome?.trim()){alert("Informe o nome.");return;} onSav
return(
<div className="overlay">
<div className="drawer">
<div className="drawer-handle"/>
<div className="drawer-header"><span className="drawer-title">{initial?"Editar <div className="form-scroll" style={{padding:"20px"}}>
<div className="fg"><label className="fl">Nome Completo</label><SI name="nome" dv={
<div className="fg"><label className="fl">Data de Nascimento</label><DateMaskInput
<div className="fg"><label className="fl">Sexo</label><SS name="sexo" dv={get("sexo
{idade!==null&&<div className="computed">Idade calculada: <strong>{idade} anos</str
</div>
<div className="form-footer"><button className="btn-cancel" onClick={onClose}>Cancela
</div>
</div>
Aluno"
);
}
// ─── DetailView ───────────────────────────────────────────────────────────────
function DetailView({aluno,avaliacoes,onBack,onEditAluno,onDeleteAluno,onSaveAval,onDeleteAva
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
const dtabs=["Histórico","Perfil","Medidas","Dobras","Resultados","PAR-Q","Postural","Evolu
const renderHistorico=()=>(
<>
<button className="btn-nova" onClick={()=>{setEditAval(null);setShowForm(true);}}>+ Nov
{sorted.length===0&&<div className="empty-state" style={{padding:"20px 0"}}><div classN
{[...sorted].reverse().map(av=>{
const ic2=imcInfo(av.imc),pc2=pgInfo(av.pg);
return(
<div key={av.id} className={`hist-card ${selId===av.id||(selId===null&&av.id===late
<div className="hist-date">{fmtDate(av.data)}</div>
<div className="hist-badges">
{av.imc!=null&&<span className="badge" style={{background:`${ic2.color}15`,bord
{av.pg!=null&&<span className="badge" style={{background:`${pc2.color}15`,borde
{av.peso&&<span className="badge" style={{background:"rgba(255,255,255,0.05)",b
</div>
<div className="hist-acts">
<button className="btn-he" onClick={e=>{e.stopPropagation();setEditAval(av);set
<button className="btn-hp" onClick={e=>{e.stopPropagation();onPDF&&onPDF(aluno,
<button className="btn-hd" onClick={e=>{e.stopPropagation();onDeleteAval(av.id)
</div>
</div>
);
})}
</>
);
const renderPerfil=()=>!sel?<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:
<>
<p className="sec">Dados — {fmtDate(sel.data)}</p>
<div className="sg2">
<div className="sc"><div className="sl">Peso</div><div className="sv">{sel.peso||"—"}
<div className="sc"><div className="sl">Altura</div><div className="sv" style={{fontS
</div>
<div className="ic">
<div className="ri"><span className="rl">Sexo</span><span className="rv">{aluno.sexo=
{aluno.dataNasc&&<div className="ri"><span className="rl">Nascimento</span><span clas
{idade!==null&&<div className="ri"><span className="rl">Idade</span><span className="
</div>
{(sel.pressaoArterial||sel.fc)&&(<><p className="sec">Pressão &amp; FC</p><div classNam
{sel.pressaoArterial&&<div className="sc"><div className="sl">Pressão Arterial</div><
{sel.fc&&<div className="sc"><div className="sl">Freq. Cardíaca</div><div className="
</div></>)}
{(sel.objetivo||sel.restricoes)&&(<><p className="sec">Objetivo &amp; Restrições</p><di
{sel.objetivo&&<div className="ri"><span className="rl">Objetivo</span><span classNam
{sel.restricoes&&<div className="ri"><span className="rl">Restrições</span><span clas
</div></>)}
{(sel.pesoDesejado||sel.pgDesejado)&&(<><p className="sec">Metas</p><div className="sg2
{sel.pesoDesejado&&<div className="sc" style={{borderColor:"rgba(99,130,237,0.25)"}}>
{sel.pgDesejado&&<div className="sc" style={{borderColor:"rgba(99,130,237,0.25)"}}><d
</div></>)}
{sel.observacoes&&(<><p className="sec">Observações</p><div style={{background:"rgba(99
</>
);
const renderMedidas=()=>{
if(!sel)return null;
const groups=[
{t:"Tronco",items:[["Tórax",sel.torax],["Cintura",sel.cintura],["ABS",sel.abs],["Quadri
{t:"Braços",items:[["Braço Dir.",sel.bracoDir],["Braço Esq.",sel.bracoEsq],["Antebraço
{t:"Pernas",items:[["Coxa Dir.",sel.coxaDir],["Coxa Esq.",sel.coxaEsq],["Panturrilha Di
];
return groups.map(g=>{const f=g.items.filter(([,v])=>v);if(!f.length)return null;return(
<div key={g.t}><p className="sec">{g.t}</p><div className="ic">{f.map(([l,v])=><div cla
);});
};
const renderDobras=()=>{
if(!sel)return null;
const dm=sel.medias||{};
const rows=DOBRA_FIELDS.filter(({key})=>dm[key]>0);
if(!rows.length)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:12}}
return(<><p className="sec">7 Dobras Cutâneas (cm)</p>
{rows.map(({label,key})=>(
<div className="dr" key={key}>
<div className="drh"><span className="drn">{label}</span><span className="drm">{par
<div className="dms">{[1,2,3].map(n=><div className="dm" key={n}><div className="dm
</div>
))}
{sel.dc&&<div className="ic" style={{marginTop:10}}>
<div className="ri"><span className="rl">Densidade Corporal</span><span className="rv
<div className="ri"><span className="rl">Protocolo</span><span className="rv">Jackson
</div>}
</>);
};
const renderResultados=()=>{
if(!sel)return null;
if(!imc&&!pg)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,textAlign:"center
return(<>
{imc&&(<><p className="sec">IMC</p>
<div className="result-block" style={{background:`linear-gradient(135deg,${ic.color}2
<div className="rb-l" style={{color:ic.color}}>Índice de Massa Corporal</div>
<div className="rb-v">{imc.toFixed(2)}</div><div className="rb-c" style={{color:ic.
<div className="pw"><div className="pb" style={{width:`${Math.min(((imc-15)/30)*100
<div className="pm"><span>&lt;18.5</span><span>Normal: 18.5–25</span><span>&gt;30</
</div>
</>)}
{pg&&(<><p className="sec">% Gordura Corporal</p>
<div className="result-block" style={{background:`linear-gradient(135deg,${pc.color}2
<div className="rb-l" style={{color:pc.color}}>Percentual de Gordura (JP7)</div>
<div className="rb-v">{pg.toFixed(1)}<span style={{fontSize:20,opacity:0.6}}>%</spa
<div className="pw"><div className="pb" style={{width:`${Math.min((pg/35)*100,100)}
{sel.pgDesejado&&<div className="pm"><span>Meta: {sel.pgDesejado}%</span><span>Δ {(
</div>
</>)}
{sel.peso&&sel.pesoDesejado&&(<><p className="sec">Metas de Peso</p><div className="ic"
<div className="ri"><span className="rl">Peso atual</span><span className="rv">{sel.p
<div className="ri"><span className="rl">Peso desejado</span><span className="rv" sty
<div className="ri"><span className="rl">Diferença</span><span className="rv" style={
</div></>)}
</>);
};
const renderParq=()=>{
if(!sel)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:20}}>Selecio
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
const alertMsg=simCount>0?`⚠ ${simCount} resposta(s) SIM — encaminhar para avaliação médi
return(
<>
<p className="sec">Questionário PAR-Q</p>
<div className="ic">{itens}</div>
<div style={alertStyle}>{alertMsg}</div>
</>
);
};
const renderPostural=()=>{
if(!sel)return<p style={{color:"rgba(255,255,255,0.3)",fontSize:13,marginTop:20}}>Selecio
const fotos=sel.posturalFotos||[];
return(<>
{fotos.length>0&&(<><p className="sec">Fotos Posturais</p>
<div className="postural-fotos">{fotos.map((src,i)=><div key={i} className="postural-
</>)}
{sel.posturalResultado&&(<><p className="sec">Resultado</p>
<div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0
</>)}
{!fotos.length&&!sel.posturalResultado&&<p style={{color:"rgba(255,255,255,0.3)",fontSi
</>);
};
const renderEvolucao=()=>{
if(sorted.length<2) return(
<div style={{textAlign:"center",padding:"30px 0",color:"rgba(255,255,255,0.25)",fontSiz
Cadastre pelo menos 2 avaliações para ver a evolução.
</div>
);
const linhas = sorted.map((av,i)=>{
const prev=sorted[i-1];
const dp=prev?.pg!=null&&av.pg!=null?(av.pg-prev.pg).toFixed(1):null;
const dw=prev?.peso&&av.peso?(parseFloat(av.peso)-parseFloat(prev.peso)).toFixed(1):nul
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
{av.peso&&<span className="evol-val">⚖ {av.peso}kg{dw&&<span style={{color:pars
{av.pg!=null&&<span className="evol-val"> {av.pg.toFixed(1)}%{dp&&<span style
{av.imc!=null&&<span className="evol-val"> {av.imc.toFixed(1)}{di&&<span styl
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
<div className="ri"><span className="rl">Período</span><span className="rv">{fmtDat
<div className="ri"><span className="rl">Avaliações</span><span className="rv">{sor
{varPeso!=null&&<div className="ri"><span className="rl">Variação de Peso</span><sp
{varPg!=null&&<div className="ri"><span className="rl">Variação %G</span><span clas
</div>
</>
);
};
return(
<div className="app">
<div className="detail-header">
<button className="btn-back" onClick={onBack}>← Voltar</button>
<div className="detail-nome">{aluno.nome}</div>
<div className="detail-sub">{aluno.sexo==="M"?"Masculino":"Feminino"}{idade!==null?`
{latest&&<div className="detail-chips">
{latest.imc!=null&&<span className="chip-sm" style={{borderColor:`${imcInfo(latest.
{latest.pg!=null&&<span className="chip-sm" style={{borderColor:`${pgInfo(latest.pg
{avaliacoes.some(a=>a.restricoes)&&<span className="chip-sm chip-warn">⚠ Restrições
</div>}
<div className="detail-acts">
<button className="btn-sm btn-sm-p" onClick={onEditAluno}>Editar Aluno</button>
<button className="btn-sm btn-sm-d" onClick={onDeleteAluno}>Excluir Aluno</button>
</div>
</div>
<div className="dtabs">{dtabs.map(t=><button key={t} className={`dtab ${dtab===t?"activ
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
{showForm&&<FormDrawer aluno={{...aluno,idade:calcIdade(aluno.dataNasc)}} initial={edit
onSave={av=>{onSaveAval(av);setShowForm(false);setEditAval(null);setSelId(av.id);setD
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
const payload = JSON.stringify({ version: 2, exportedAt: new Date().toISOString(), ...d
const blob = new Blob([payload], { type: 'application/json' });
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
const ts = new Date().toISOString().slice(0,10);
a.href = url; a.download = `BioFitMetrics_backup_${ts}.json`;
document.body.appendChild(a); a.click();
setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); }, 2000);
flash(' Backup exportado com sucesso!');
} catch(e) { flash(' Erro ao exportar: ' + e.message); }
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
if (!confirm(`Importar ${parsed.alunos.length} aluno(s) e ${parsed.avaliacoes.length}
onImport({ alunos: parsed.alunos, avaliacoes: parsed.avaliacoes });
flash(' Dados importados com sucesso!');
} catch(err) { flash(' Arquivo inválido: ' + err.message); }
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
flash(' Logo atualizada!');
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
flash(' Ícone atualizado!');
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
<span className="drawer-title"> Configurações</span>
<button className="btn-close" onClick={onClose}>✕</button>
</div>
<div className="form-scroll">
{/* Banco de Dados */}
<div className="cfg-section">
<div className="cfg-section-title">Banco de Dados</div>
<div className="cfg-item" onClick={handleExport}>
<div className="cfg-item-icon" style={{background:'rgba(52,211,153,0.12)'}}> <
<div className="cfg-item-body">
<div className="cfg-item-title">Exportar Backup</div>
<div className="cfg-item-sub">{totalAlunos} aluno{totalAlunos!==1?'s':''} · {
</div>
<span className="cfg-item-arrow">›</span>
</div>
<div className="cfg-item" onClick={()=>fileInputRef.current?.click()}>
<div className="cfg-item-icon" style={{background:'rgba(59,130,246,0.12)'}}> <
<div className="cfg-item-body">
<div className="cfg-item-title">Importar Backup</div>
<div className="cfg-item-sub">Restaurar dados de arquivo .json</div>
</div>
<span className="cfg-item-arrow">›</span>
</div>
<input ref={fileInputRef} type="file" accept=".json,application/json" style={{dis
</div>
{/* Personalização */}
<div className="cfg-section">
<div className="cfg-section-title">Personalização</div>
<div style={{marginBottom:10}}>
<span className="fl">Logo atual (usada no PDF)</span>
<img className="cfg-logo-preview" src={`data:image/jpeg;base64,${settings.logob
<div className="cfg-item" onClick={()=>logoInputRef.current?.click()}>
<div className="cfg-item-icon" style={{background:'rgba(245,158,11,0.12)'}}>
<div className="cfg-item-body">
<div className="cfg-item-title">Atualizar Logo do PDF</div>
<div className="cfg-item-sub">Imagem exibida nos relatórios PDF</div>
</div>
<span className="cfg-item-arrow">›</span>
</div>
<input ref={logoInputRef} type="file" accept="image/*" style={{display:'none'}}
</div>
<div>
<span className="fl">Ícone do App</span>
<div style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
<img src={`data:image/png;base64,${settings.iconb64}`} style={{width:56,heigh
<div style={{flex:1}}>
<div style={{fontSize:13,color:'#e4e4f0',marginBottom:2}}>Ícone atual</div>
<div style={{fontSize:12,color:'rgba(255,255,255,0.3)'}}>Exibido na barra s
</div>
</div>
<div className="cfg-item" onClick={()=>iconInputRef.current?.click()}>
<div className="cfg-item-icon" style={{background:'rgba(139,92,246,0.12)'}}>
<div className="cfg-item-body">
<div className="cfg-item-title">Atualizar Ícone do App</div>
<div className="cfg-item-sub">PNG ou JPG — aparece no cabeçalho</div>
</div>
<span className="cfg-item-arrow">›</span>
</div>
<input ref={iconInputRef} type="file" accept="image/*" style={{display:'none'}}
</div>
</div>
{/* Sobre */}
<div className="cfg-version">BioFitMetrics v2.0 · Jackson &amp; Pollock 7 Dobras</d
{msg && <div style={{position:'sticky',bottom:0,background:msg.startsWith(' ')?'rg
</div>
</div>
</div>
);
}
// ─── Main ─────────────────────────────────────────────────────────────────────
export default function App() {
const [db,setDb] = useState({alunos:[],avaliacoes:[]});
const [loading,setLoading] = useState(true);
const [settings,setSettings] = useState({logob64:DEFAULT_LOGO_B64, iconb64:DEFAULT_ICON_B64
const [detailId,setDetailId] = useState(null);
const [showAlunoForm,setShowAlunoForm] = useState(false);
const [editAluno,setEditAluno] = useState(null);
const [search,setSearch] = useState('');
const [showConfig,setShowConfig] = useState(false);
useEffect(()=>{
Promise.all([loadData(), loadSettings()]).then(([d,s])=>{
setDb(d); setSettings(s); setLoading(false);
});
},[]);
const persist = useCallback(async next => { setDb(next); await saveData(next); },[]);
const persistSettings = useCallback(async s => { setSettings(s); await saveSettings(s); },[
const handleSaveAluno = async al => {
const exists = db.alunos.some(a=>a.id===al.id);
const alunos = exists ? db.alunos.map(a=>a.id===al.id?al:a) : [al,...db.alunos];
await persist({...db,alunos});
setShowAlunoForm(false); setEditAluno(null);
if(!exists) setDetailId(al.id);
};
const handleDeleteAluno = async id => {
if(!confirm('Excluir este aluno e todas as suas avaliações?')) return;
await persist({alunos:db.alunos.filter(a=>a.id!==id),avaliacoes:db.avaliacoes.filter(a=>a
setDetailId(null);
};
const handleSaveAval = async av => {
const exists = db.avaliacoes.some(a=>a.id===av.id);
const avaliacoes = exists ? db.avaliacoes.map(a=>a.id===av.id?av:a) : [av,...db.avaliacoe
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
const detail = detailId ? db.alunos.find(a=>a.id===detailId) : null;
const detailAv = detail ? db.avaliacoes.filter(a=>a.alunoId===detail.id) : [];
// Pass logo to PDF generator via settings
const makePDF = (aluno, av) => generatePDF(aluno, av, settings.logob64);
if(loading) return(<><style>{css}</style><div className="app"><div className="loading">Carr
if(detail) return(<>
<style>{css}</style>
<DetailView aluno={detail} avaliacoes={detailAv} onBack={()=>setDetailId(null)}
onEditAluno={()=>{setEditAluno(detail);setShowAlunoForm(true);}}
onDeleteAluno={()=>handleDeleteAluno(detail.id)}
onSaveAval={handleSaveAval} onDeleteAval={handleDeleteAval}
onPDF={makePDF}/>
{showAlunoForm&&<AlunoForm initial={editAluno} onSave={handleSaveAluno} onClose={()=>{set
{showConfig&&<ConfigDrawer settings={settings} onUpdateSettings={persistSettings} db={db}
</>);
return(<>
<style>{css}</style>
aluno.
<div className="app">
<div className="topbar">
<div className="topbar-brand">
<img className="topbar-icon" src={`data:image/png;base64,${settings.iconb64}`} alt=
<div>
<div className="topbar-title">BioFitMetrics</div>
<div className="topbar-sub">{db.alunos.length} aluno{db.alunos.length!==1?'s':''}
</div>
</div>
<div className="topbar-acts">
<button className="btn-icon" onClick={()=>setShowConfig(true)} title="Configurações
<button className="btn-new" onClick={()=>{setEditAluno(null);setShowAlunoForm(true)
<span style={{fontSize:18,lineHeight:1}}>＋</span> Novo
</button>
</div>
</div>
<div className="search-wrap"><input className="search-input" placeholder="Buscar <div className="list">
{filtered.length===0&&<div className="empty-state"><div className="empty-icon"> </di
{filtered.map(al=>{
const idade=calcIdade(al.dataNasc);
const avs=db.avaliacoes.filter(a=>a.alunoId===al.id).sort((a,b)=>b.data.localeCompa
const last=avs[0];
const ic2=imcInfo(last?.imc),pc2=pgInfo(last?.pg);
return(
<div key={al.id} className={`aluno-card ${al.sexo}`} onClick={()=>setDetailId(al.
<div className="aluno-top">
<div><div className="aluno-nome">{al.nome}</div><div className="aluno-meta">{
<span style={{color:'rgba(255,255,255,0.2)',fontSize:20}}>›</span>
</div>
<div className="aluno-badges">
{last?.imc!=null&&<span className="badge" style={{background:`${ic2.color}15`
{last?.pg!=null&&<span className="badge" style={{background:`${pc2.color}15`,
{avs.some(a=>a.restricoes)&&<span className="badge" style={{background:'rgba(
</div>
<div className="aval-count">{avs.length} avaliação{avs.length!==1?'ões':''}{las
</div>
);
})}
</div>
{showAlunoForm&&<AlunoForm initial={editAluno} onSave={handleSaveAluno} onClose={()=>{s
{showConfig&&<ConfigDrawer settings={settings} onUpdateSettings={persistSettings} db={d
</div>
</>);
}
