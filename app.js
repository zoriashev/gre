/* ---------- Storage ---------- */
const LS = {
  cKey:'crm_commissions_v6',
  aKey:'crm_ads_v6',
  getC(){return JSON.parse(localStorage.getItem(this.cKey)||'[]')},
  setC(v){localStorage.setItem(this.cKey,JSON.stringify(v))},
  getA(){return JSON.parse(localStorage.getItem(this.aKey)||'[]')},
  setA(v){localStorage.setItem(this.aKey,JSON.stringify(v))}
};
/* seed demo data */
(function seed(){
  if(!LS.getC().length){
    LS.setC([
      {name:'Default 2%',percent:2,comment:''},
      {name:'Cards 8%',percent:8,comment:'external processor'},
      {name:'HUI August 25',percent:8,comment:'summer promo'}
    ]);
  }
  if(!LS.getA().length){
    LS.setA([
      {date:'2025-05-29',geo:'US',campaign:'Cash10-US-01',buyer:'Zoe',cost:500,percent:2,costWith:510,leads:10,deal:0,funnel:'N/A',status:'approved'},
      {date:'2025-05-08',geo:'US',campaign:'Cash10-US-02',buyer:'Anton',cost:118,percent:8,costWith:127.44,leads:1,deal:0,funnel:'N/A',status:'approved'},
      {date:'2025-05-08',geo:'US',campaign:'Cash10-US-03',buyer:'Anton',cost:53,percent:8,costWith:57.24,leads:2,deal:0,funnel:'N/A',status:'approved'},
      {date:'2025-05-08',geo:'US',campaign:'Cash10-US-04',buyer:'Anton',cost:322,percent:2,costWith:328.44,leads:3,deal:0,funnel:'N/A',status:'approved'}
    ]);
  }
})();

/* ---------- Tabs ---------- */
document.getElementById('tabs').addEventListener('click',e=>{
  const b=e.target.closest('.tab'); if(!b) return;
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active')); b.classList.add('active');
  document.querySelectorAll('section.card').forEach(s=>s.style.display='none');
  document.getElementById('view-'+b.dataset.view).style.display='block';
  if(b.dataset.view==='ad') renderAds();
  if(b.dataset.view==='pl') renderPL();
  if(b.dataset.view==='pld') renderPLDaily();
  if(b.dataset.view==='comm') renderCommissions();
});

/* ---------- Helpers ---------- */
const round2=n=>Math.round(n*100)/100;
const validPct=n=>typeof n==='number' && !Number.isNaN(n) && n>=0 && n<=100;
const flag=geo=>({US:'🇺🇸',CA:'🇨🇦',DE:'🇩🇪',UK:'🇬🇧'})[geo]||'🏳️';
function escapeHTML(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}

/* =========================================================
   ADVERTISEMENT COSTS (TABLE + DRAWER ADD)
   ========================================================= */
const adTableBody=document.querySelector('#adTable tbody');
const adSearch = document.getElementById('adSearch');
function renderAds(){
  const q=(adSearch.value||'').toLowerCase();
  const rows = LS.getA().filter(r=>{
    const s=[r.campaign,r.buyer,r.geo].join(' ').toLowerCase();
    return s.includes(q);
  });
  adTableBody.innerHTML = rows.length ? rows.map(r=>`
    <tr>
      <td>${r.date}</td>
      <td>${flag(r.geo)} ${r.geo}</td>
      <td>${escapeHTML(r.campaign)}</td>
      <td>${escapeHTML(r.buyer)}</td>
      <td>$${(r.cost||0).toFixed(2)}</td>
      <td>${(r.percent||0).toFixed(2)}%</td>
      <td>$${(r.costWith||0).toFixed(2)}</td>
      <td>${r.leads??''}</td>
      <td>${r.deal?`$${r.deal.toFixed(2)}`:''}</td>
      <td>${escapeHTML(r.funnel||'')}</td>
      <td>${r.status==='approved'
            ?'<span class="badge ok">Approved</span>'
            :'<span class="badge bad">Disapproved</span>'}</td>
    </tr>`).join('')
    : `<tr><td class="empty" colspan="11">No Data found</td></tr>`;
}
adSearch && adSearch.addEventListener('input',renderAds);

/* Drawer open/close */
const adDrawer=document.getElementById('adDrawer');
const adOverlay=document.getElementById('adOverlay');
function openAdDrawer(){
  adOverlay.classList.add('open'); adDrawer.classList.add('open');
  // defaults
  const d=document.getElementById('adDate');
  if(!d.value) d.value=new Date().toISOString().slice(0,10);
  fillCommissionSelect();
  recalcAd();
}
function closeAdDrawer(){ adOverlay.classList.remove('open'); adDrawer.classList.remove('open'); }
document.getElementById('adAddBtn').onclick=openAdDrawer;
document.getElementById('adCloseBtn').onclick=closeAdDrawer;
document.getElementById('adCancel').onclick=closeAdDrawer;
adOverlay.addEventListener('click',closeAdDrawer);

/* Form fields */
const adDateEl=document.getElementById('adDate');
const adGeoEl=document.getElementById('adGeo');
const adCampEl=document.getElementById('adCampaign');
const adBuyerEl=document.getElementById('adBuyer');
const adCostEl=document.getElementById('adCost');
const adCommEl=document.getElementById('adCommission');
const adPctEl=document.getElementById('adPct');
const adCostWithEl=document.getElementById('adCostWith');
const adLeadsEl=document.getElementById('adLeads');
const adDealEl=document.getElementById('adDeal');
const adFunnelEl=document.getElementById('adFunnel');
const adStatusEl=document.getElementById('adStatus');

function fillCommissionSelect(){
  const list=LS.getC();
  adCommEl.innerHTML='<option value="">— Select —</option>'+
    list.map((c,i)=>`<option value="${i}">${escapeHTML(c.name)}</option>`).join('');
}
function currentPct(){
  const list=LS.getC(); const idx=adCommEl.value;
  return idx===''?0:Number(list[idx]?.percent||0);
}
function recalcAd(){
  const pct=currentPct(); adPctEl.value=pct?pct.toFixed(2):'';
  const base=Number(adCostEl.value)||0; adCostWithEl.value=(base*(1+pct/100)).toFixed(2);
}
adCommEl.onchange=recalcAd; adCostEl.oninput=recalcAd;

document.getElementById('adSave').onclick=()=>{
  const date=adDateEl.value||new Date().toISOString().slice(0,10);
  const campaign=adCampEl.value.trim(), buyer=adBuyerEl.value.trim();
  if(!campaign || !buyer){ alert('Campaign & Buyer required'); return; }
  const rec={
    date, geo:adGeoEl.value, campaign, buyer,
    cost:Number(adCostEl.value)||0,
    percent:currentPct(),
    costWith:Number(adCostWithEl.value)||0,
    leads:adLeadsEl.value?Number(adLeadsEl.value):null,
    deal:adDealEl.value?Number(adDealEl.value):null,
    funnel:adFunnelEl.value||'',
    status:adStatusEl.value
  };
  const list=LS.getA(); list.push(rec); LS.setA(list);
  closeAdDrawer(); renderAds(); renderPL(); renderPLDaily();
  // приклад з питання: 100 + 8% => 108; працює через recalcAd()
};

/* =========================================================
   CARD COMMISSIONS (список + drawer create/edit з попереднього)
   ========================================================= */
const cTBody   = document.querySelector('#cTable tbody');
const cSearch  = document.getElementById('cSearch');
const sortInfo = document.getElementById('sortInfo');
const thName   = document.getElementById('thName');
const thPercent= document.getElementById('thPercent');

let cQuery=''; let sortKey=''; let sortDir='none';
cSearch && cSearch.addEventListener('input',e=>{ cQuery=e.target.value.trim().toLowerCase(); renderCommissions(); });

function cycleSortFor(key){ if (sortKey!==key){sortKey=key;sortDir='asc';} else if (sortDir==='asc'){sortDir='desc';} else if (sortDir==='desc'){sortDir='none';sortKey='';} else {sortDir='asc';} renderCommissions();}
thName && thName.addEventListener('click', ()=>cycleSortFor('name'));
thPercent && thPercent.addEventListener('click', ()=>cycleSortFor('percent'));

function applySortIndicators(){
  if(!thName) return;
  const set = (el,active,dir)=>{ el.parentElement.classList.remove('sorted','asc','desc','none'); el.parentElement.classList.add('sorted', active ? dir : 'none'); };
  set(thName,    sortKey==='name',    sortDir);
  set(thPercent, sortKey==='percent', sortDir);
  sortInfo.textContent = sortKey ? `Sorted by ${sortKey} (${sortDir})` : '';
}
function renderCommissions(){
  if(!cTBody) return;
  let rows=LS.getC().map((c,idx)=>({...c,__idx:idx}));
  if (cQuery) rows = rows.filter(c => (c.name||'').toLowerCase().includes(cQuery));
  if (sortKey && sortDir!=='none'){
    rows.sort((a,b)=>{
      let av = sortKey==='name' ? (a.name||'').toLowerCase() : Number(a.percent)||0;
      let bv = sortKey==='name' ? (b.name||'').toLowerCase() : Number(b.percent)||0;
      if (av<bv) return sortDir==='asc' ? -1 : 1;
      if (av>bv) return sortDir==='asc' ? 1 : -1;
      return 0;
    });
  }
  applySortIndicators();
  cTBody.innerHTML = rows.length
    ? rows.map(c=>`
      <tr>
        <td>${escapeHTML(c.name)}</td>
        <td>${(Number(c.percent)||0).toFixed(2)}%</td>
        <td>${escapeHTML(c.comment||'')}</td>
        <td>
          <button class="mini" data-edit="${c.__idx}">Edit</button>
          <button class="mini red" data-del="${c.__idx}">Delete</button>
        </td>
      </tr>`).join('')
    : `<tr><td class="empty" colspan="4">No results</td></tr>`;
}
cTBody && cTBody.addEventListener('click',e=>{
  const t=e.target;
  if(t.dataset.del!==undefined){
    const i=+t.dataset.del; const list=LS.getC();
    if(confirm(`Delete "${list[i].name}"?`)){ list.splice(i,1); LS.setC(list); renderCommissions(); fillCommissionSelect(); }
  }
  if(t.dataset.edit!==undefined){ ccOpen(LS.getC()[+t.dataset.edit], +t.dataset.edit); }
});

/* Drawer create/edit for commissions */
const ccOverlay  = document.getElementById('ccOverlay');
const ccDrawer   = document.getElementById('ccDrawer');
const ccCloseBtn = document.getElementById('ccCloseBtn');
const ccCancel   = document.getElementById('ccCancel');
const addNewTop  = document.getElementById('addNewTop');

const fName=document.getElementById('ccName');
const fPct =document.getElementById('ccPercent');
const fCom=document.getElementById('ccComment');
const eName=document.getElementById('ccNameErr');
const ePct =document.getElementById('ccPctErr');
const ccTitle=document.querySelector('.cc-dr-title');
const ccSave =document.getElementById('ccSave');

let editIndex=null;  let mode='create';
function isDuplicateName(name, skipIndex=null){ return LS.getC().some((c,i)=>i!==skipIndex && c.name.trim().toLowerCase()===name.trim().toLowerCase()); }
function clearErr(){ [fName,fPct].forEach(i=>i.classList.remove('error')); eName.style.display='none'; ePct.style.display='none'; }
function ccOpen(values=null,index=null){
  if(!ccDrawer) return;
  editIndex=index; mode=(index===null?'create':'edit');
  ccTitle.textContent = mode==='create'?'Add Commission':'Edit Commission';
  ccSave.textContent  = mode==='create'?'Save':'Update';
  fName.value = values?.name ?? ''; fPct.value  = values?.percent ?? ''; fCom.value  = values?.comment ?? '';
  clearErr(); ccOverlay.classList.add('open'); ccDrawer.classList.add('open');
}
function ccClose(){ ccOverlay.classList.remove('open'); ccDrawer.classList.remove('open'); editIndex=null; mode='create'; }
function saveCommission(){
  clearErr();
  const name=fName.value.trim(); let pct=parseFloat(fPct.value); const comment=fCom.value.trim();
  let ok=true;
  if(!name){ fName.classList.add('error'); eName.textContent='Enter the name'; eName.style.display='block'; ok=false; }
  if(!validPct(pct)){ fPct.classList.add('error'); ePct.style.display='block'; ok=false; }
  if(ok && isDuplicateName(name, editIndex)){ fName.classList.add('error'); eName.textContent='Name already exists'; eName.style.display='block'; ok=false; }
  if(!ok) return;
  pct=round2(pct);
  const list=LS.getC();
  if(mode==='create'){ list.push({name,percent:pct,comment}); } else { list[editIndex]={name,percent:pct,comment}; }
  LS.setC(list); renderCommissions(); fillCommissionSelect(); ccClose();
}
ccSave && ccSave.addEventListener('click',saveCommission);
addNewTop && addNewTop.addEventListener('click',()=>ccOpen());
ccCloseBtn && ccCloseBtn.addEventListener('click',ccClose);
ccCancel && ccCancel.addEventListener('click',ccClose);
ccOverlay && ccOverlay.addEventListener('click',ccClose);
fPct && fPct.addEventListener('input',()=>{ const n=parseFloat(fPct.value); if(!validPct(n)){ fPct.classList.add('error'); ePct.style.display='block'; } else { fPct.classList.remove('error'); ePct.style.display='none'; } });

/* =========================================================
   PROFIT & LOSS + DAILY (без змін по логіці, просто вивід)
   ========================================================= */
const plFrom=document.getElementById('plFrom'), plTo=document.getElementById('plTo');
const plCamp=document.getElementById('plCamp'), plBuyer=document.getElementById('plBuyer');
const plThead=document.querySelector('#plTable thead tr'), plTBody=document.querySelector('#plTable tbody');
const sumCost=document.getElementById('sumCost'), sumWith=document.getElementById('sumWith');

function colChecks(){ return Object.fromEntries([...document.querySelectorAll('.pl-col')].map(i=>[i.dataset.col,i.checked]))}
function badge(status){ return status==='approved'?`<span class="badge ok">Approved</span>`:`<span class="badge bad">Disapproved</span>`; }

function renderPL(){
  if(!plThead) return;
  const a=LS.getA().filter(r=>{
    if(plFrom.value && r.date < plFrom.value) return false;
    if(plTo.value && r.date > plTo.value) return false;
    if(plCamp.value && !r.campaign.toLowerCase().includes(plCamp.value.toLowerCase())) return false;
    if(plBuyer.value && !r.buyer.toLowerCase().includes(plBuyer.value.toLowerCase())) return false;
    return true;
  });
  const show=colChecks();
  const headers=[
    ['date','Date'], ['geo','GEO'], ['campaign','Campaign'], ['buyer','Buyer'],
    ['leads','Leads'], ['deal','Deal'], ['status','Status'],
    ['cost','Advertising Cost'], ['pct','%'], ['with','Advertising Cost with commission']
  ].filter(([k])=>show[k]);

  plThead.innerHTML=headers.map(([_,t])=>`<th>${t}</th>`).join('');
  let sCost=0,sWith=0;
  plTBody.innerHTML = a.length? a.map(r=>{
    sCost+=r.cost; sWith+=r.costWith;
    const row={
      date:r.date, geo:`${flag(r.geo)} ${r.geo}`, campaign:r.campaign, buyer:r.buyer,
      leads:r.leads??'', deal:r.deal!=null?`$${r.deal.toFixed(2)}`:'',
      status:badge(r.status), cost:`$${r.cost.toFixed(2)}`, pct:r.percent?`${r.percent.toFixed(2)}%`:'',
      with:`$${r.costWith.toFixed(2)}`
    };
    return `<tr>${headers.map(([k])=>`<td>${row[k]??''}</td>`).join('')}</tr>`;
  }).join('') : `<tr><td class="empty" colspan="${headers.length}">No Data found</td></tr>`;
  sumCost.textContent = '$'+sCost.toFixed(2);
  sumWith.textContent = '$'+sWith.toFixed(2);
}
document.querySelectorAll('.pl-col').forEach(c=>c.onchange=renderPL);
[plFrom,plTo,plCamp,plBuyer].forEach(i=>i.oninput=renderPL);

const pldFrom=document.getElementById('pldFrom'), pldTo=document.getElementById('pldTo');
const pldTBody=document.querySelector('#pldTable tbody');
document.getElementById('pldClear')?.addEventListener('click',()=>{ pldFrom.value=''; pldTo.value=''; renderPLDaily(); });
function renderPLDaily(){
  if(!pldTBody) return;
  const map=new Map();
  LS.getA().forEach(r=>{
    if(pldFrom.value && r.date < pldFrom.value) return;
    if(pldTo.value && r.date > pldTo.value) return;
    const m=map.get(r.date)||{leads:0,deal:0,with:0};
    m.leads+=(r.leads||0); m.deal+=(r.deal||0); m.with+=r.costWith; map.set(r.date,m);
  });
  const rows=[...map.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  pldTBody.innerHTML=rows.length?rows.map(([d,v])=>`<tr>
    <td>${d}</td><td>${v.leads}</td><td>$${v.deal.toFixed(2)}</td><td>$${v.with.toFixed(2)}</td>
  </tr>`).join(''): `<tr><td class="empty" colspan="4">No Data found</td></tr>`;
}


// Profit & Loss — колоночний фільтр (кнопка + drawer)
document.addEventListener('DOMContentLoaded', () => {
  const view = document.getElementById('view-pl');
  if (!view) return;

  const btn    = document.getElementById('plFilterBtn');
  const drawer = document.getElementById('plFilterDrawer');
  const close  = document.getElementById('plFilterClose');

  if (btn && drawer && close) {
    btn.addEventListener('click', () => drawer.classList.add('open'));
    close.addEventListener('click', () => drawer.classList.remove('open'));
  }

  // застосування видимості колонок
  function applyVisibility() {
    document.querySelectorAll('#plFilterDrawer .pl-col').forEach(cb => {
      const col = cb.dataset.col;
      const show = cb.checked;
      view.querySelectorAll(`th.${col}, td.${col}`).forEach(cell => {
        cell.style.display = show ? '' : 'none';
      });
    });
  }

  // реагувати одразу при кліку
  document.querySelectorAll('#plFilterDrawer .pl-col')
    .forEach(cb => cb.addEventListener('change', () => {
      applyVisibility();
      try { if (typeof renderPL === 'function') renderPL(); } catch(e){}
    }));

  // перша синхронізація (на випадок, якщо таблиця вже намальована)
  applyVisibility();
});
// Profit & Loss filter drawer
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById('plFilterBtn');
  const drawer = document.getElementById('plFilterDrawer');
  const closeBtn = document.getElementById('plFilterClose');

  if (btn && drawer && closeBtn) {
    btn.onclick = () => drawer.classList.add('open');
    closeBtn.onclick = () => drawer.classList.remove('open');
  }

  // toggle columns visibility
  document.querySelectorAll('#plFilterDrawer input[type=checkbox]')
    .forEach(cb => cb.addEventListener('change', e => {
      const col = e.target.dataset.col;
      const visible = e.target.checked;
      document.querySelectorAll(`#view-pl .${col}`)
        .forEach(el => el.style.display = visible ? '' : 'none');
    }));
});


/* ---------- Init ---------- */
function init(){
  renderAds(); renderPL(); renderPLDaily(); renderCommissions(); fillCommissionSelect();
}
init();


document.addEventListener('DOMContentLoaded', () => {
  const view   = document.getElementById('view-pl');
  if (!view) return;

  const btn    = document.getElementById('plFilterBtn');
  const mask   = document.getElementById('plMask');
  const drawer = document.getElementById('plFilterDrawer');
  const reset  = document.getElementById('plFilterReset');
  const close  = document.getElementById('plFilterClose');
  const apply  = document.getElementById('plFilterApply');

  const open  = ()=>{ drawer.classList.add('open'); mask.classList.add('open'); };
  const hide  = ()=>{ drawer.classList.remove('open'); mask.classList.remove('open'); };

  btn?.addEventListener('click', open);
  mask?.addEventListener('click', hide);
  close?.addEventListener('click', hide);
  apply?.addEventListener('click', hide);

  function applyVisibility(){
    document.querySelectorAll('#plFilterDrawer .pl-col').forEach(cb=>{
      const k = cb.dataset.col;
      const show = cb.checked;
      view.querySelectorAll(`th.${k}, td.${k}`).forEach(el=>{
        el.style.display = show ? '' : 'none';
      });
    });
  }

  // оновлюємо при зміні чекбоксів
  document.querySelectorAll('#plFilterDrawer .pl-col')
    .forEach(cb => cb.addEventListener('change', () => {
      applyVisibility();
      try { if (typeof renderPL === 'function') renderPL(); } catch(e){}
    }));

  // RESET — увімкнути всі
  reset?.addEventListener('click', ()=>{
    document.querySelectorAll('#plFilterDrawer .pl-col').forEach(cb=>cb.checked=true);
    applyVisibility();
    try { if (typeof renderPL === 'function') renderPL(); } catch(e){}
  });

  // стартова синхронізація (якщо таблиця вже намальована)
  applyVisibility();
});

document.addEventListener('DOMContentLoaded', () => {
  const rangeInput = document.getElementById('plRangePicker');
  const fromHidden = document.getElementById('plFrom');
  const toHidden   = document.getElementById('plTo');

  if (!rangeInput) return;

  const fp = flatpickr(rangeInput, {
    mode: 'range',
    locale: flatpickr.l10ns.uk,     // українська
    dateFormat: 'd.m.Y',            // що бачить користувач
    altInput: false,
    allowInput: true,
    clickOpens: true,
    defaultDate: [],                // можна підставити поточний діапазон
    onReady: function(_, __, instance) {
      // понеділок — перший день тижня
      instance.set('locale', { ...flatpickr.l10ns.uk, firstDayOfWeek: 1 });
    },
    onChange: function(selectedDates, _str, instance) {
      // selectedDates[0] = від, selectedDates[1] = до (може бути undefined поки не вибрано другу дату)
      const [from, to] = selectedDates;
      const fmt = d => d ? instance.formatDate(d, 'Y-m-d') : '';

      // якщо вибрано лише одну дату — вважаємо обидві однаковими
      fromHidden.value = fmt(from);
      toHidden.value   = fmt(to || from);
    }
  });

  // Якщо хочеш програмно задати діапазон (наприклад "сьогодні"):
  // const today = new Date();
  // fp.setDate([today, today], true); // другий аргумент true — викликає onChange
});