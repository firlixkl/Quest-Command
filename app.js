const $=s=>document.querySelector(s),app=$('#app');let tools=[];
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const copy=(t,b)=>{navigator.clipboard.writeText(t);const o=b.textContent;b.textContent='¡Copiado!';setTimeout(()=>b.textContent=o,1200)};

// --- Diagnóstico ---------------------------------------------------------
// Carga UN fichero de herramienta y devuelve siempre un objeto con el
// resultado, nunca lanza: así un fichero roto no tumba el Promise.all de
// todos los demás. Además deja rastro detallado en la consola (F12).
async function fetchTool(fname){
  const url='data/tools/'+fname;
  let res;
  try{
    res=await fetch(url);
  }catch(netErr){
    console.error(`[tools] ${fname} -> error de red al hacer fetch('${url}')`,netErr);
    return {fname,url,ok:false,stage:'network',detail:netErr.message||String(netErr)};
  }
  let text;
  try{
    text=await res.text();
  }catch(readErr){
    console.error(`[tools] ${fname} -> no se pudo leer el cuerpo de la respuesta`,readErr);
    return {fname,url,ok:false,stage:'read',detail:readErr.message||String(readErr)};
  }
  if(!res.ok){
    console.error(`[tools] ${fname} -> HTTP ${res.status} ${res.statusText} pidiendo ${url}`);
    console.error(`[tools] ${fname} -> cuerpo recibido (primeros 300 car.):\n`+text.slice(0,300));
    return {fname,url,ok:false,stage:'http',status:res.status,statusText:res.statusText,detail:`HTTP ${res.status} ${res.statusText}`,body:text.slice(0,300)};
  }
  let json;
  try{
    json=JSON.parse(text);
  }catch(parseErr){
    console.error(`[tools] ${fname} -> el servidor respondió 200 pero el cuerpo no es JSON válido`,parseErr);
    console.error(`[tools] ${fname} -> cuerpo recibido (primeros 300 car.):\n`+text.slice(0,300));
    return {fname,url,ok:false,stage:'parse',detail:parseErr.message||String(parseErr),body:text.slice(0,300)};
  }
  for(const campo of ['id','name','category','binary','summary','questions']){
    if(json[campo]===undefined){
      console.warn(`[tools] ${fname} -> cargado, pero le falta el campo obligatorio "${campo}"`);
    }
  }
  console.log(`[tools] ${fname} -> OK (HTTP ${res.status}, id="${json.id}")`);
  return {fname,url,ok:true,data:json};
}

function mostrarBannerFallos(failed){
  const viejo=$('#tools-err');if(viejo)viejo.remove();
  if(!failed.length)return;
  const div=document.createElement('div');
  div.id='tools-err';div.className='err';
  div.innerHTML=`<b>⚠ No se han podido cargar ${failed.length} fichero(s) de herramientas</b> (detalle completo en la consola, F12 → Console):`+
    `<ul>${failed.map(f=>`<li><code>${esc(f.url)}</code> — ${esc(f.detail)}</li>`).join('')}</ul>`;
  app.before(div);
}

async function init(){
  console.group('%cPentestHub: carga de catálogo','color:#58a6ff;font-weight:bold');
  console.time('carga total');

  // 1) Índice ---------------------------------------------------------
  let idx;
  try{
    const idxRes=await fetch('data/tools.json');
    console.log('[tools.json] HTTP',idxRes.status,idxRes.statusText);
    const idxText=await idxRes.text();
    if(!idxRes.ok){
      console.error('[tools.json] cuerpo recibido:\n'+idxText.slice(0,300));
      throw new Error(`data/tools.json devolvió HTTP ${idxRes.status} ${idxRes.statusText}`);
    }
    idx=JSON.parse(idxText);
    console.log(`[tools.json] ${idx.length} ficheros listados:`,idx);
  }catch(e){
    console.error('[tools.json] fallo cargando el índice ->',e);
    console.timeEnd('carga total');console.groupEnd();
    app.innerHTML=`<div class="err"><b>No se pudo cargar data/tools.json</b><pre>${esc(e.message||String(e))}</pre></div>`;
    return;
  }

  // 2) Cada fichero de herramienta, en paralelo, sin que uno tumbe a los demás
  const results=await Promise.all(idx.map(fetchTool));
  const ok=results.filter(r=>r.ok);
  const failed=results.filter(r=>!r.ok);
  tools=ok.map(r=>r.data);

  console.table(results.map(r=>({
    fichero:r.fname,
    estado:r.ok?'OK':'FALLO',
    detalle:r.ok?('id='+r.data.id):r.detail
  })));
  console.log(`[tools] ${ok.length}/${results.length} cargadas correctamente.`);
  if(failed.length)console.warn(`[tools] ${failed.length} fallidas:`,failed.map(f=>f.fname));
  console.timeEnd('carga total');
  console.groupEnd();

  mostrarBannerFallos(failed);

  addEventListener('hashchange',()=>{
    try{route()}catch(e){
      console.error('[render] error al cambiar de ruta ->',e);
      app.innerHTML=`<div class="err"><b>Error al mostrar esta herramienta</b><pre>${esc(e.message||String(e))}</pre></div>`;
    }
  });
  try{
    route();
  }catch(e){
    console.error('[render] error en el renderizado inicial ->',e);
    app.innerHTML=`<div class="err"><b>Error al renderizar</b><pre>${esc(e.message||String(e))}</pre></div>`;
  }
}

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
