
(async () => {
 const root=document.getElementById('static-a-preview'),byId=id=>root.querySelector('#'+id);
 const response=await fetch(new URL('./assets/dashboard-data.json',document.baseURI));
 if(!response.ok)throw new Error('Saved dashboard data unavailable: '+response.status);
 const data=await response.json();
 if(data.records.length!==5538)throw new Error('Saved record count mismatch');
 let records=data.records,meta=data.metadata;
 const esc=v=>String(v??'UNKNOWN').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const pct=v=>v==null?'UNKNOWN':(v>=0?'+':'')+(v*100).toFixed(2)+'%';
 const num=v=>v==null?'UNKNOWN':Number(v).toLocaleString('en',{maximumFractionDigits:6});
 const state={formation:meta.latest_reconstruction_date||meta.latest_signal_date||meta.asof,top:'PHASE5R_NEW',year:'2026',history:'ALL',page:0,detail:null,query:'',historyRank:'ALL',historyOutcome:'ALL'};
 const pc=()=>[...new Set(records.map(r=>r.provenance_class))].sort();
 const opts=()=>[['PHASE5R_NEW','Phase5R 回溯重建'],['LIVE_PRODUCTION','已認證 Live（独立）'],['ALL','全部（混合來源）'],['PRODUCTION','Production 保存（含事後產生）'],['CERTIFIED_HISTORICAL_SIGNAL','Certified historical signal'],['RESEARCH','Replay / research'],...pc().map(p=>[p,p])];
 const matches=(r,p)=>p==='ALL'||(p==='PHASE5R_NEW'?r.origin==='PHASE5R_RECONSTRUCTION':p==='PRODUCTION'?r.origin==='PRODUCTION':p==='RESEARCH'?r.origin==='RESEARCH':r.provenance_class===p);
 const badge=(value)=>'<span class="'+(value==='HIT'?'sa-hit':'sa-miss')+'">'+esc(value)+'</span>';
 const retCell=(r,k='final_return_20d')=>r[k]==null?(r.maturity_status==='PENDING'?'PENDING':'UNKNOWN'):'<span class="'+(r[k]>=0?'sa-positive':'sa-negative')+'">'+pct(r[k])+'</span>';
 const field=(k,v)=>'<div data-field="'+esc(k)+'"><span>'+esc(k)+'</span><strong>'+esc(v)+'</strong></div>';
 const searchIndex=new Map(records.map(r=>[r.signal_key,[r.signal_key,r.formation_date,r.ticker,r.company_name,r.security_id,r.provenance_class].join(' ').toLocaleLowerCase('zh-Hant')]));
 const latest=p=>records.filter(r=>matches(r,p)).reduce((d,r)=>r.formation_date>d?r.formation_date:d,'');
 function renderTop(){
  byId('sa-formation').value=state.formation;byId('sa-top-provenance').value=state.top;
  const rs=records.filter(r=>r.formation_date===state.formation&&matches(r,state.top)).sort((a,b)=>a.rank-b.rank);
  byId('sa-top-title').textContent=state.top==='PHASE5R_NEW'?'Phase5R 回溯重建 Top3':state.formation===latest(state.top)?'最新保存 STATIC_A Top3':'歷史保存 STATIC_A Top3';
  let notice='Formation date: '+state.formation+' · '+(!rs.length?'NO_SAVED_SIGNAL':state.formation===meta.asof?'SNAPSHOT_ASOF':state.formation===latest(state.top)?'LATEST_AVAILABLE':'HISTORICAL_SAVED');
  if(rs.length)notice+=' · '+rs[0].provenance_class+' · '+(rs[0].origin==='PHASE5R_RECONSTRUCTION'?'事後重建；不是原日實際發出；原始vintage未驗證':'原進場時點需依實際產生時間判斷');else notice+=' · 無此日期／來源的保存訊號';
  byId('sa-availability').textContent=notice;
  byId('sa-top3').innerHTML=[1,2,3].map(rank=>{
   const r=rs.find(x=>x.rank===rank);
   return r?'<button class="sa-pick" type="button" data-key="'+r.signal_key+'"><span class="sa-rank">#'+rank+'</span><span class="sa-stock">'+esc(r.company_name)+'</span><span class="sa-code">'+esc(r.ticker)+'</span><span class="sa-score">排序分數 <strong>'+r.static_score.toFixed(3)+'</strong></span><span class="sa-badge">'+esc(r.provenance_class)+'</span><span class="sa-result">Touch15 '+badge(r.touch15)+' · 20D '+retCell(r)+' · '+r.status+'</span></button>':'<div class="sa-pick"><span class="sa-rank">#'+rank+'</span><span class="sa-stock">無保存紀錄</span><span class="sa-code">—</span><span class="sa-score">排序分數 <strong>—</strong></span></div>';
  }).join('');
  root.querySelectorAll('#sa-top3 button').forEach(b=>b.onclick=()=>showDetail(b.dataset.key));
 }
 function renderHistory(){
  const tokens=state.query.trim().toLocaleLowerCase('zh-Hant').split(/\s+/).filter(Boolean);
  const rs=records.filter(r=>(state.year==='全部'||r.formation_date.startsWith(state.year))&&matches(r,state.history)&&(state.historyRank==='ALL'||r.rank===Number(state.historyRank))&&(state.historyOutcome==='ALL'||r.touch15===state.historyOutcome)&&tokens.every(t=>searchIndex.get(r.signal_key).includes(t))).sort((a,b)=>b.formation_date.localeCompare(a.formation_date)||a.rank-b.rank);
  const size=18;state.page=Math.max(0,Math.min(state.page,Math.max(0,Math.ceil(rs.length/size)-1)));const start=state.page*size;
  byId('sa-history').innerHTML=rs.slice(start,start+size).map(r=>'<tr><td>'+r.formation_date+'</td><td>#'+r.rank+'</td><td><button type="button" class="sa-row-link" data-key="'+r.signal_key+'">'+esc(r.ticker)+'</button></td><td>'+esc(r.company_name)+'</td><td>'+r.static_score.toFixed(6)+'</td><td><span class="sa-badge">'+esc(r.provenance_class)+'</span></td><td>'+badge(r.touch15)+'</td><td>'+retCell(r)+'</td><td>'+retCell(r,'max_return_20d')+'</td><td>'+r.status+'</td></tr>').join('');
  root.querySelectorAll('#sa-history button').forEach(b=>b.onclick=()=>{showDetail(b.dataset.key);byId('sa-detail').scrollIntoView({behavior:'smooth',block:'start'});});
  byId('sa-page-info').textContent=rs.length?(start+1)+'–'+Math.min(start+size,rs.length)+' / '+rs.length+' 筆':'無此來源保存紀錄';
  byId('sa-prev').disabled=state.page===0;byId('sa-next').disabled=start+size>=rs.length;
 }
 function drawChart(r){
  const host=byId('sa-price-chart');if(!host)return;
  const w=Math.max(260,host.clientWidth),h=240,left=64,right=14,top=16,bottom=42;
  const values=r.price_path.flatMap(p=>[p.high,p.low,p.close]).filter(v=>v!=null);if(r.target15!=null)values.push(r.target15);
  if(!values.length){host.style.minHeight='0';host.textContent='UNKNOWN · 沒有合法 t+1…t+20 行情證據';return;}host.style.minHeight='220px';
  const lo=Math.min(...values),hi=Math.max(...values),pad=(hi-lo)*.08||hi*.02,ymin=lo-pad,ymax=hi+pad;
  const x=s=>left+(s-1)*(w-left-right)/19,y=v=>top+(ymax-v)/(ymax-ymin)*(h-top-bottom);
  const path=k=>{let connected=false;return r.price_path.map(p=>{if(p[k]==null){connected=false;return '';}const part=(connected?'L':'M')+x(p.session)+','+y(p[k]);connected=true;return part;}).join(' ');};
  let content='<rect x="'+left+'" y="'+top+'" width="'+(w-left-right)+'" height="'+(h-top-bottom)+'" fill="none" stroke="var(--sa-line)"/>';
  for(let i=0;i<4;i++){const v=ymin+(ymax-ymin)*i/3;content+='<text x="'+(left-8)+'" y="'+(y(v)+4)+'" text-anchor="end">'+v.toFixed(2)+'</text>';}
  for(const s of [1,7,14,20])content+='<text x="'+x(s)+'" y="'+(h-bottom+18)+'" text-anchor="middle">'+s+'</text>';
  content+='<text x="'+(left+(w-left-right)/2)+'" y="'+(h-4)+'" text-anchor="middle">正式交易日（t+1…t+20）</text><text x="16" y="'+(h/2)+'" transform="rotate(-90 16 '+(h/2)+')" text-anchor="middle">調整價格（元）</text>';
  if(r.target15!=null)content+='<path d="M'+left+','+y(r.target15)+'H'+(w-right)+'" fill="none" stroke="var(--sa-sub)" stroke-dasharray="4 4"><title>Target +15% '+num(r.target15)+'</title></path>';
  content+='<path d="'+path('high')+'" fill="none" stroke="var(--sa-sub)" stroke-width="1"/><path d="'+path('low')+'" fill="none" stroke="var(--sa-sub)" stroke-dasharray="2 3" stroke-width="1"/><path d="'+path('close')+'" fill="none" stroke="var(--sa-accent)" stroke-width="2"/>';
  for(const p of r.price_path)if(p.close!=null)content+='<circle cx="'+x(p.session)+'" cy="'+y(p.close)+'" r="3" fill="var(--sa-accent)"><title>'+p.date+' close '+num(p.close)+'</title></circle>';
  host.innerHTML='<svg viewBox="0 0 '+w+' '+h+'" role="img" aria-label="'+esc(r.ticker)+' t+1 到 t+20 調整行情，缺失不連線">'+content+'</svg>';
 }
 function showDetail(key){
  const r=records.find(r=>r.signal_key===key);if(!r)return;state.detail=key;byId('sa-detail').dataset.recordKey=key;
  const fields=[['Formation date',r.formation_date],['Rank','#'+r.rank],['Ticker / Name',r.ticker+' '+r.company_name],['Security ID',r.security_id],['STATIC_A score',r.static_score],['Provenance',r.provenance_class],['原日實際生成時間 (UTC)',r.signal_generated_at||'未宣稱原日生成'],['Reconstruction timestamp (UTC)',r.reconstruction_timestamp||'N/A'],['Original vintage verified',r.original_vintage_verified===false?'FALSE':r.original_vintage_verified??'保存紀錄定義'],['Source capture times',(r.source_capture_times||[]).slice(0,3).join(' | ')+((r.source_capture_times||[]).length>3?' · 其餘 '+(r.source_capture_times.length-3)+' 個時間見下方擷取稽核':'')],['Master version',r.master_version||'保存紀錄定義'],['Declared source claim',r.declared_source_type],['Entry date',r.entry_date],['Entry adjusted open',num(r.entry_adjusted_open)],['Entry status',r.entry_status],['Target +15% price',num(r.target15)],['Touch15',r.touch15],['First touch date',r.first_touch_date],['Sessions to touch',r.sessions_to_touch],['t+20 date',r.t20_date],['t+20 adjusted close',num(r.t20_adjusted_close)],['Final return 20D',r.final_return_20d==null?(r.maturity_status==='PENDING'?'PENDING':'UNKNOWN'):pct(r.final_return_20d)],['Max return 20D',r.max_return_20d==null?(r.maturity_status==='PENDING'?'PENDING':'UNKNOWN'):pct(r.max_return_20d)],['Min return 20D',r.min_return_20d==null?(r.maturity_status==='PENDING'?'PENDING':'UNKNOWN'):pct(r.min_return_20d)],['Status / horizon',r.status+' / '+r.maturity_status],['Sessions elapsed / observed',r.sessions_elapsed+' / '+r.sessions_observed],['Latest available close',num(r.latest_available_close)],['Latest close date',r.latest_available_date],['Current return',pct(r.current_return)],['Archived Touch15 label',r.archive_touch15],['Calculation version',r.calculation_version],['Calculated at',r.calculated_at]];
  byId('sa-detail').innerHTML='<strong>'+esc(r.ticker)+' '+esc(r.company_name)+' · 訊號與結果明細</strong><p>'+esc(r.provenance_note)+'</p><div class="sa-detail-grid">'+fields.map(([k,v])=>field(k,v)).join('')+'</div>'+(r.source_capture_times?'<details><summary>來源擷取稽核（全部 '+r.source_capture_times.length+' 個 UTC 時間）</summary><p>'+r.source_capture_times.map(esc).join('<br>')+'</p><p>Original vintage verified: FALSE；事後市場值擷取不能證明原日15:30可得。</p></details>':'')+'<details><summary>Base6（僅保存值）</summary><div class="sa-detail-grid">'+(r.base6?Object.entries(r.base6).map(([k,v])=>field(k,num(v))).join(''):'UNKNOWN · 未保存特徵').toString()+'</div></details><p>調整行情路徑：實線收盤、細線最高、點線最低、虛線 +15% target；缺失保留 UNKNOWN。</p><div class="sa-chart" id="sa-price-chart"></div><details><summary>20 sessions 精確行情與來源</summary><div class="sa-table-wrap"><table><thead><tr><th>Session</th><th>Date</th><th>Open</th><th>High</th><th>Low</th><th>Close</th></tr></thead><tbody>'+r.price_path.map(p=>'<tr><td>'+p.session+'</td><td>'+p.date+'</td>'+['open','high','low','close'].map(k=>'<td>'+num(p[k])+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><p>Signal source: '+esc(r.source_artifact_or_table)+'</p><p>Price source: '+esc(r.price_source.join(' | '))+'</p><p>Calendar source: '+esc(r.calendar_source.join(' | '))+'</p></details>';
  drawChart(r);
 }
 function render(){
  root.dataset.cacheCalculatedAt=meta.calculated_at;
  const optionHTML=opts().map(([v,n])=>'<option value="'+esc(v)+'">'+esc(n)+'</option>').join('');
  for(const [id,key] of [['sa-top-provenance','top'],['sa-history-provenance','history']]){byId(id).innerHTML=optionHTML;byId(id).value=state[key];}
  const currentYears=[...new Set(records.map(r=>r.formation_date.slice(0,4)))].sort().reverse();
  for(const [id,key] of [['sa-history-year','year']]){byId(id).innerHTML=['全部',...currentYears].map(y=>'<option value="'+y+'">'+y+'</option>').join('');byId(id).value=state[key];}
  byId('sa-asof').textContent=meta.asof;
  renderTop();renderHistory();if(state.detail)showDetail(state.detail);
 }
 byId('sa-formation').onchange=e=>{state.formation=e.target.value;renderTop();};
 byId('sa-top-provenance').onchange=e=>{state.top=e.target.value;state.formation=latest(state.top)||meta.asof;renderTop();};
 byId('sa-latest').onclick=()=>{state.formation=latest(state.top)||meta.asof;renderTop();};byId('sa-today').onclick=()=>{state.formation=meta.asof;renderTop();};
 byId('sa-history-year').onchange=e=>{state.year=e.target.value;state.page=0;renderHistory();};byId('sa-history-provenance').onchange=e=>{state.history=e.target.value;state.page=0;renderHistory();};
 byId('sa-search').oninput=e=>{state.query=e.target.value;state.page=0;renderHistory();};
 byId('sa-history-rank').onchange=e=>{state.historyRank=e.target.value;state.page=0;renderHistory();};
 byId('sa-history-outcome').onchange=e=>{state.historyOutcome=e.target.value;state.page=0;renderHistory();};
 byId('sa-prev').onclick=()=>{state.page--;renderHistory();};byId('sa-next').onclick=()=>{state.page++;renderHistory();};
 new ResizeObserver(()=>{if(state.detail){const r=records.find(r=>r.signal_key===state.detail);if(r)drawChart(r);}}).observe(root);
 render();root.dataset.ready='true';

})().catch(e=>{document.getElementById('sa-availability').textContent='Dashboard 載入失敗：'+e.message;console.error(e);});
