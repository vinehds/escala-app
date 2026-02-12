const week = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const MS = 86400000;

let current = new Date();
let offDays = [];

const startDate = document.getElementById("startDate");
const endDate   = document.getElementById("endDate");
const pattern   = document.getElementById("pattern");

const monthLabel = document.getElementById("monthLabel");
const report = document.getElementById("report");
const reportGrid = document.getElementById("reportGrid");
const workCountEl = document.getElementById("workCount");
const offCountEl = document.getElementById("offCount");
const calendar = document.getElementById("calendar");

/* ================= HELPERS ================= */

function parsePattern(p){
  const [w,o] = p.split("x").map(Number);
  return {w,o};
}

function isWorkDay(date,start,w,o){
  const diff = Math.floor((date-start)/MS);
  const cycle = w+o;
  return (diff % cycle) < w;
}

function save(){
  localStorage.setItem("start", startDate.value);
  localStorage.setItem("end", endDate.value);
  localStorage.setItem("pattern", pattern.value);
}

function load(){
  startDate.value = localStorage.getItem("start") || "";
  endDate.value   = localStorage.getItem("end") || "";
  pattern.value   = localStorage.getItem("pattern") || "4x2";
}

/* ================= CONTAGEM GLOBAL ================= */

function calculateRangeCounts(){

  if(!startDate.value) return {work:0, off:0};

  const start = new Date(startDate.value+"T00:00:00");
  const {w,o} = parsePattern(pattern.value);

  let startLoop, endLoop;

  // se usuário definiu data final → usa intervalo completo
  if(endDate.value){
    startLoop = new Date(start);
    endLoop   = new Date(endDate.value+"T00:00:00");
  }
  // senão → usa mês atual
  else{
    startLoop = new Date(current.getFullYear(), current.getMonth(), 1);
    endLoop   = new Date(current.getFullYear(), current.getMonth()+1, 0);
  }

  let work=0, off=0;

  for(let d = new Date(startLoop); d <= endLoop; d.setDate(d.getDate()+1)){
    if(d < start) continue;

    if(isWorkDay(d,start,w,o)) work++;
    else off++;
  }

  return {work,off};
}

/* ================= CALENDÁRIO ================= */

function generate(){

  if(!startDate.value) return;

  save();

  const start = new Date(startDate.value+"T00:00:00");
  const end   = endDate.value ? new Date(endDate.value+"T00:00:00") : null;
  const {w,o} = parsePattern(pattern.value);

  calendar.innerHTML = "";

  week.forEach(d=>{
    const el=document.createElement("div");
    el.textContent=d;
    el.className="day header";
    calendar.appendChild(el);
  });

  const first = new Date(current.getFullYear(), current.getMonth(), 1);
  const last  = new Date(current.getFullYear(), current.getMonth()+1, 0);

  monthLabel.textContent =
    current.toLocaleDateString("pt-BR",{month:"long",year:"numeric"});

  for(let i=0;i<first.getDay();i++){
    calendar.appendChild(document.createElement("div"));
  }

  for(let d=1; d<=last.getDate(); d++){

    const date = new Date(current.getFullYear(), current.getMonth(), d);

    if(date < start || (end && date > end)){
      calendar.appendChild(document.createElement("div"));
      continue;
    }

    const work = isWorkDay(date,start,w,o);

    const el=document.createElement("div");
    el.className="day "+(work?"work":"off");
    el.textContent=d;

    if(date.toDateString()===new Date().toDateString())
      el.classList.add("today");

    calendar.appendChild(el);
  }

  const counts = calculateRangeCounts();
  workCountEl.textContent = counts.work+" trabalho";
  offCountEl.textContent  = counts.off+" folga";
}

/* ================= RELATÓRIO ================= */

function generateReport(){

  if(!startDate.value || !endDate.value){
    alert("Informe data inicial e final");
    return;
  }

  const start = new Date(startDate.value+"T00:00:00");
  const end   = new Date(endDate.value+"T00:00:00");
  const {w,o} = parsePattern(pattern.value);

  reportGrid.innerHTML = "";
  offDays = [];

  for(let d=new Date(start); d<=end; d.setDate(d.getDate()+1)){
    if(!isWorkDay(d,start,w,o)){
      offDays.push(new Date(d));
    }
  }

  const lines = offDays.map(d =>
    d.toLocaleDateString("pt-BR")
  );

  report.value = lines.join("\n");

  lines.forEach(text=>{
    const el=document.createElement("div");
    el.className="report-item";
    el.textContent=text;
    reportGrid.appendChild(el);
  });
}

/* ================= UX ================= */

function copyReport(){

  navigator.clipboard.writeText(report.value);

  const btn = event.target;
  const old = btn.textContent;

  btn.textContent = "✓ Copiado";
  btn.style.background = "#16a34a";

  setTimeout(()=>{
    btn.textContent = old;
    btn.style.background = "";
  },1500);
}

function printReport(){
  window.print();
}

function changeMonth(n){
  current.setMonth(current.getMonth()+n);
  generate();
}

/* ================= eventos ================= */

[startDate, endDate, pattern].forEach(el=>{
  el.addEventListener("input", generate);
});

load();
generate();
