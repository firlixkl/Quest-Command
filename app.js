const $=s=>document.querySelector(s),app=$('#app');let tools=[];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const copy=(t,b)=>{navigator.clipboard.writeText(t);const o=b.textContent;b.textContent='¡Copiado!';setTimeout(()=>b.textContent=o,1200)};
async function init(){
  try{const idx=await (await fetch('data/tools.json')).json();
  tools=await Promise.all(idx.map(f=>fetch('data/tools/'+f).then(r=>r.json())));
  addEventListener('hashchange',route);route()}catch(e){app.textContent='Error cargando datos: '+e}}
function route(){const t=tools.find(t=>t.id===location.hash.slice(1));t?renderTool(t):renderCatalog()}
function renderCatalog(){
  const cats=[...new Set(tools.map(t=>t.category))];let cat='',q='';
  app.innerHTML=`<input type="search" id="q" placeholder="Buscar herramienta…"><div class="chips" id="chips"></div><div id="list"></div>`;
  const draw=()=>{
    $('#chips').innerHTML=['Todas',...cats].map(c=>`<button class="chip ${(c==='Todas'&&!cat)||c===cat?'on':''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
    $('#chips').querySelectorAll('button').forEach(b=>b.onclick=()=>{cat=b.dataset.c==='Todas'?'':b.dataset.c;draw()});
    let h='';for(const c of cats){if(cat&&c!==cat)continue;
      const l=tools.filter(t=>t.category===c&&(t.name+t.summary).toLowerCase().includes(q));if(!l.length)continue;
      h+=`<h2>${esc(c)}</h2><div class="grid">${l.map(t=>`<a class="card" href="#${t.id}"><b>${esc(t.name)}</b><p>${esc(t.summary)}</p></a>`).join('')}</div>`}
    $('#list').innerHTML=h||'<p>Sin resultados.</p>'};
  $('#q').oninput=e=>{q=e.target.value.toLowerCase();draw()};draw()}
function renderTool(t){
  let tab='wizard';
  const draw=()=>{app.innerHTML=`<a href="#">← Catálogo</a><h1>${esc(t.name)}</h1><p>${esc(t.summary)}</p>
  <div class="tabs"><button class="${tab==='wizard'?'pri':''}" data-t="wizard">Asistente</button><button class="${tab==='cheat'?'pri':''}" data-t="cheat">Chuleta</button></div><div id="body"></div>`;
  app.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{tab=b.dataset.t;draw()});
  tab==='wizard'?wizard(t,$('#body')):cheat(t,$('#body'))};draw()}
function cheat(t,el){el.innerHTML=(t.cheats||[]).map((c,i)=>`<div class="cheat"><b>${esc(c.title)}</b><code>${esc(c.cmd)}</code><span>${esc(c.note||'')}</span> <button data-i="${i}">Copiar</button></div>`).join('')||'<p>Sin chuleta aún.</p>';
  el.querySelectorAll('button').forEach(b=>b.onclick=()=>copy(t.cheats[b.dataset.i].cmd,b))}
function wizard(t,el){
  const A={};let i=0;
  const vis=()=>t.questions.filter(q=>!q.when||Object.entries(q.when).every(([k,v])=>[].concat(v).includes(A[k])));
  const build=()=>{const p=[t.binary];for(const q of vis()){const a=A[q.id];
    if(q.type==='select'){const o=q.options.find(o=>o.id===a);if(o&&o.frag)p.push(o.frag)}
    else if(q.type==='bool'){if(a)p.push(q.flag)}
    else if(a)p.push(q.flag.replace('{v}',a));
    else if(q.required)p.push(`<${q.id}>`)}return p.join(' ')};
  q0:for(const q of t.questions){if(q.default!==undefined)A[q.id]=q.default}
  const draw=()=>{const v=vis();if(i>=v.length)i=v.length-1;const q=v[i];let inp='';
    if(q.type==='select')inp=`<div class="opts">${q.options.map(o=>`<button class="opt ${A[q.id]===o.id?'on':''}" data-id="${esc(o.id)}">${esc(o.label)}<small>${esc(o.frag||'')}</small></button>`).join('')}</div>`;
    else if(q.type==='bool')inp=`<label><input type="checkbox" id="in" ${A[q.id]?'checked':''}> Sí, activar <code>${esc(q.flag)}</code></label>`;
    else inp=`<input type="${q.type==='number'?'number':'text'}" id="in" value="${esc(A[q.id]||'')}" placeholder="${esc(q.placeholder||'')}">`;
    el.innerHTML=`<div class="q"><h3>${esc(q.label)}</h3><p class="help">${esc(q.help||'')}${q.required?' (obligatorio)':''}</p>${inp}
    <div class="nav"><button id="b">← Atrás</button><span>Paso ${i+1}/${v.length}</span><button id="n" class="pri">${i===v.length-1?'Reiniciar':'Siguiente →'}</button></div></div>
    <div class="cmd"><code id="cmd"></code><button id="cp">Copiar</button></div>`;
    const upd=()=>$('#cmd').textContent=build();upd();
    el.querySelectorAll('.opt').forEach(b=>b.onclick=()=>{A[q.id]=b.dataset.id;draw()});
    const inEl=$('#in');if(inEl)inEl.oninput=()=>{A[q.id]=q.type==='bool'?inEl.checked:inEl.value;upd()};
    $('#b').onclick=()=>{if(i>0){i--;draw()}};
    $('#n').onclick=()=>{if(i===vis().length-1){i=0;for(const k in A)delete A[k];for(const x of t.questions)if(x.default!==undefined)A[x.id]=x.default}else i++;draw()};
    $('#cp').onclick=e=>copy(build(),e.target)};
  draw()}
init();
