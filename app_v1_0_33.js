// app.js — v1.0.25
(function(){
  const $  = (s)=>document.querySelector(s);
  const $$ = (s)=>document.querySelectorAll(s);

  function showError(msg){
    const b = $("#ld-error"), t = $("#ld-error-msg");
    if (b && t){ t.textContent = msg; b.style.display = ""; }
    console.error(msg);
  }

  const { createClient } = supabase;
  const supabaseUrl = "https://cxgbloauhimuhdjlvwvh.supabase.co";
  const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z2Jsb2F1aGltdWhkamx2d3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDQ1MDIsImV4cCI6MjA3NjQyMDUwMn0.wnRHKccWAba4wzC1XHqYPdzL0wF5uQOImbLkn4rs6SA";
  const client = createClient(supabaseUrl, supabaseKey);

  // ---- Elements (match) ----
  const tbody = $("#table tbody");
  const $df = $("#diff_front");
  const $db = $("#diff_back");
  const $en = $("#energy_toggle");
  const $round = $("#switch_round");
  const $cond  = $("#switch_condensed");
  const $energyValue = $("#energy_value");
  const $numberValue = $("#number_value");
  const $rowsValue   = $("#rows_value");

  // ---- Elements (shop) ----
  const shopBody = $("#shop_table tbody");
  const sum = {
    gold: $("#sum_gold"),
    dia: $("#sum_dia"),
    key: $("#sum_key"),
    churu: $("#sum_churu"),
    battery: $("#sum_battery"),
    petfood: $("#sum_petfood"),
    myth: $("#sum_myth"),
    invite: $("#sum_invite"),
  };

  // ---- Formatters ----
  const nfInt = new Intl.NumberFormat("ja-JP");
  const nf1   = new Intl.NumberFormat("ja-JP",{ minimumFractionDigits:1, maximumFractionDigits:1 });
  const fmtInt = (v)=> v==null ? "－" : nfInt.format(Math.round(v));
  const fmt1   = (v)=> v==null ? "－" : nf1.format(Math.round(v*10)/10);
  const setText = (el,v)=>{ if(el) el.textContent = v; };
  function setCost(el, v){
    if(!el) return;
    const n = Math.round(v);
    el.textContent = nfInt.format(n);
    el.classList.toggle('neg', n < 0);
  }

  // ---- Match state ----
  let state = { df:"太初", db:"神", en:3, roundInt:true, condensed:false };
  let lastRequestId = 0, lastRows = null;
  const ckOf = (s)=>`ld_resources:${s.df}|${s.db}|${s.en}|v1`;
  const cacheGet = (k)=>{ try{return JSON.parse(sessionStorage.getItem(k)||"null");}catch(_){return null;} };
  const cacheSet = (k,v)=>{ try{sessionStorage.setItem(k,JSON.stringify(v));}catch(_){ } };

  function readUI(){
    state.df = $df?.value ?? "太初";
    state.db = $db?.value ?? "神";
    state.en = $en?.checked ? 3 : 1;
    state.roundInt = !!$round?.checked;
    state.condensed = !!$cond?.checked;
  }
  function syncLabels(){
    if ($energyValue) $energyValue.textContent = $en?.checked ? "x3" : "x1";
    if ($numberValue) $numberValue.textContent = $round?.checked ? "整数" : "小数";
    if ($rowsValue)   $rowsValue.textContent   = $cond?.checked ? "5の倍数" : "全行";
  }

  function paintRows(rows){
    if (!tbody) return;
    const fmt = (v)=> v==null ? "－" : (state.roundInt ? fmtInt(v) : fmt1(v));
    if (!rows || rows.length===0){ tbody.innerHTML = '<tr><td colspan="10">該当データなし</td></tr>'; return; }
    let html = "";
    for (const r of rows){
      if (!state.condensed || r.match % 5 === 0){
        const diff = r.match <= 5 ? state.df : state.db;
        html += `<tr data-diff="${diff}"><td>${r.match}</td>`+
                `<td>${fmt(r.gold)}</td><td>${fmt(r.key)}</td><td>${fmt(r.churu)}</td>`+
                `<td>${fmt(r.battery)}</td><td>${fmt(r.petfood)}</td>`+
                `<td>${fmt(r.myth)}</td><td>${fmt(r.immortal)}</td>`+
                `<td>${fmt(r.dia)}</td><td>(${fmt(r.invite)})</td></tr>`;
      }
    }
    tbody.innerHTML = html;
  }

  async function fetchAndPaint(){
    try{
      readUI();
      const reqId = ++lastRequestId;
      if (tbody) tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;opacity:.8">読込中...</td></tr>';
      const ck = ckOf(state);
      const cached = cacheGet(ck);
      if (cached && reqId === lastRequestId){ lastRows = cached; paintRows(lastRows); }

      const { data, error } = await client
        .from('ld_resources')
        .select('match,gold,key,churu,battery,petfood,myth,immortal,dia,invite')
        .eq('diff_front', state.df).eq('diff_back', state.db).eq('energy_mult', state.en)
        .order('match', { ascending: true });

      if (reqId !== lastRequestId) return;
      if (error) throw error;
      if (!data || data.length===0) throw new Error("ld_resources: 行が見つかりません");

      lastRows = data; cacheSet(ck, lastRows); paintRows(lastRows);
    }catch(e){ showError(e.message || e); if (tbody) tbody.innerHTML = `<tr><td colspan="10" style="color:#ff6b6b">エラー: ${e.message ?? e}</td></tr>`; }
  }

  
  function clamp(v,min,max){ return v<min?min:(v>max?max:v); }
  const ART_MAX = 31;
  function loadArtifactCount(){
    try{ const v = parseInt(localStorage.getItem('ld_artifact_m')||'0',10); return isNaN(v)?0:clamp(v,0,ART_MAX); }catch(_){ return 0; }
  }
  function saveArtifactCount(v){
    try{ localStorage.setItem('ld_artifact_m', String(clamp(v,0,ART_MAX))); }catch(_){}
  }
  function updateArtifactUI(){
    const lab = document.getElementById('art_label');
    if(lab) lab.textContent = `${artifactCount}/${ART_MAX}`;
  }
// ---- Shop ----
  let artifactCount = 0;
  let shopRows = [], shopSelected = new Set();

  const iconOf = (slug)=>{
    const base = "https://menbold.github.io/LD_Field/";
    switch(slug){
      case "gold": return base+"i_01_gold.png";
      case "key": return base+"i_02_key.png";
      case "churu": return base+"i_03_chur.png";
      case "battery": return base+"i_04_battery.png";
      case "petfood": return base+"i_05_petfood.png";
      case "mythstone": return base+"i_06_Mythstone.png";
      case "immortalstone": return base+"i_07_immotalstone.png";
      case "diamond": return base+"i_08_dia.png";
      case "invite": return base+"i_09_Scroll.png";
      case "artifact": return base+"i_10_Artifact.png";
      default: return "";
    }
  };
  const keyOf = (r)=> `${r.item}|${r.price_currency}`;
  const mainYieldOf = (r)=>{
    switch(r.item){
      case "invite": return r.yield_invite||0;
      case "artifact": return r.yield_artifact||0;
      case "key": return r.yield_key||0;
      case "churu": return r.yield_churu||0;
      case "battery": return r.yield_battery||0;
      case "petfood": return r.yield_petfood||0;
      case "mythstone": return r.yield_myth||0;
      case "immortalstone": return r.yield_immortal||0;
      default: return 0;
    }
  };

  function computeTotals(){
    const factor = (artifactCount||0) / 31;
    // Aggregate (include artifact)
    const t = { cost_gold:0, cost_dia:0, invite:0, myth:0, dia:0, gold:0, key:0, churu:0, battery:0, petfood:0, artifact:0 };
    for (const r of shopRows){
      if (!shopSelected.has(keyOf(r))) continue;
      if (r.item === "artifact"){
        if (r.price_currency === "dia") t.cost_dia += Math.round((r.price||0)*factor);
        else if (r.price_currency === "gold") t.cost_gold += (r.price||0);
      } else {
        if (r.price_currency === "gold") t.cost_gold += r.price||0;
        else if (r.price_currency === "dia") t.cost_dia += r.price||0;
      }
      /*__ART_PRICE__*/
      t.invite   += r.yield_invite   || 0;
      t.myth     += r.yield_myth     || 0;
      t.dia      += r.yield_dia      || 0;
      t.gold     += r.yield_gold     || 0;
      t.key      += r.yield_key      || 0;
      t.churu    += r.yield_churu    || 0;
      t.battery  += r.yield_battery  || 0;
      t.petfood  += r.yield_petfood  || 0;
      t.artifact += (r.price_currency === "dia" ? (r.yield_artifact || 0) * factor : (r.yield_artifact || 0)); /*__ART_YIELD__*/
    }

    // Net values
    const netGold = (t.gold||0) - (t.cost_gold||0);
    const netDia  = (t.dia ||0) - (t.cost_dia ||0);

    // Paint summary chips
    setCost(sum.gold, netGold);
    setCost(sum.dia,  netDia);

    // Key with (+artifact) when artifact selected
    const keyStr = fmt1(t.key||0);
    const artVal = Math.round((t.artifact||0)*10)/10;
    setText(sum.key, artVal>0 ? `${keyStr} (+${fmt1(artVal)})` : keyStr);

    setText(sum.churu,    fmt1(t.churu||0));
    setText(sum.battery,  fmt1(t.battery||0));
    setText(sum.petfood,  fmt1(t.petfood||0));
    setText(sum.myth,     fmt1(t.myth||0));
    setText(sum.invite,   '(' + fmtInt(t.invite||0) + ')');
  }

  function paintShop(rows){
    if (!shopBody) return;
    if (!rows || rows.length===0){
      shopBody.innerHTML = `<tr><td colspan="5" style="text-align:center;opacity:.8">データ未設定</td></tr>`;
      computeTotals(); return;
    }
    let html = "";
    for (const r of rows){
      const key = keyOf(r);
      const checked = shopSelected.has(key) ? "checked" : "";
      const icon = iconOf(r.item);
      const qty = mainYieldOf(r);
      const isInvite = r.item === "invite";
      const expander = isInvite ? `<button class="expander" data-key="${key}" aria-expanded="false">＋</button>` : "";
      const curClass = (r.price_currency==="dia") ? "cur-dia" : "cur-gold";

      html += `<tr data-rowkey="${key}" class="${curClass} ${isInvite?'parent-invite':''}">`+
        `<td><input type="checkbox" class="shop-check" data-key="${key}" ${checked}></td>`+
        `<td class="item"><div class="item-wrap">${icon?`<img class="icon" src="${icon}" alt="">`:""}${expander}</div></td>`+
        `<td>${(r.item==='key'||r.item==='churu'||r.item==='battery'||r.item==='petfood'||r.item==='mythstone')?fmt1(qty):(r.item==='artifact'?(r.price_currency==='dia'?fmt1(qty*((artifactCount||0)/31)):fmt1(qty)):fmtInt(qty))}</td>`+
        `<td>${r.item==='artifact'?(r.price_currency==='dia'?fmtInt(Math.round((r.price||0)*((artifactCount||0)/31))):fmtInt(r.price)):fmtInt(r.price)}</td>`+
        `<td>${r.price_currency==="dia"?`<img class="icon" src="${iconOf('diamond')}" alt="">`:`<img class="icon" src="${iconOf('gold')}" alt="">`}</td>`+
      `</tr>`;

      if (isInvite){
        const childRows = [];
        if (r.yield_gold) childRows.push({slug:'gold', qty:r.yield_gold, fmt:fmtInt});
        if (r.yield_dia)  childRows.push({slug:'diamond', qty:r.yield_dia, fmt:fmtInt});
        if (r.yield_myth) childRows.push({slug:'mythstone', qty:r.yield_myth, fmt:fmt1});
        for (const ch of childRows){
          html += `<tr class="child-row" data-parent="${key}" style="display:none">`+
            `<td></td>`+
            `<td class="item"><div class="item-wrap"><img class="icon" src="${iconOf(ch.slug)}" alt=""></div></td>`+
            `<td>${ch.fmt(ch.qty)}</td>`+
            `<td>－</td>`+
            `<td>－</td>`+
          `</tr>`;
        }
      }
    }
    shopBody.innerHTML = html;

    $$(".shop-check").forEach(chk=>{
      chk.addEventListener("change", (e)=>{
        const k = e.currentTarget.getAttribute("data-key");
        if (e.currentTarget.checked) shopSelected.add(k); else shopSelected.delete(k);
        computeTotals();
      });
    });
    $$(".expander").forEach(btn=>{
      btn.addEventListener("click", (e)=>{
        const k = e.currentTarget.getAttribute("data-key");
        const expanded = e.currentTarget.getAttribute("aria-expanded")==="true";
        e.currentTarget.setAttribute("aria-expanded", expanded?"false":"true");
        e.currentTarget.textContent = expanded ? "＋" : "－";
        document.querySelectorAll(`tr.child-row[data-parent="${k}"]`).forEach(tr=>{
          tr.style.display = expanded ? "none" : "";
        });
      });
    });

    computeTotals();
  }


  function bindArtifactButtons(){
    const p5 = document.getElementById('art_plus5');
    const p1 = document.getElementById('art_plus1');
    const m1 = document.getElementById('art_minus1');
    const m5 = document.getElementById('art_minus5');
    [p5,p1,m1,m5].forEach(btn=>{
      if(!btn) return;
    });
    if(p5) p5.addEventListener('click', ()=>{ artifactCount = clamp(artifactCount+5,0,ART_MAX); saveArtifactCount(artifactCount); updateArtifactUI(); paintShop(shopRows); computeTotals(); });
    if(p1) p1.addEventListener('click', ()=>{ artifactCount = clamp(artifactCount+1,0,ART_MAX); saveArtifactCount(artifactCount); updateArtifactUI(); paintShop(shopRows); computeTotals(); });
    if(m1) m1.addEventListener('click', ()=>{ artifactCount = clamp(artifactCount-1,0,ART_MAX); saveArtifactCount(artifactCount); updateArtifactUI(); paintShop(shopRows); computeTotals(); });
    if(m5) m5.addEventListener('click', ()=>{ artifactCount = clamp(artifactCount-5,0,ART_MAX); saveArtifactCount(artifactCount); updateArtifactUI(); paintShop(shopRows); computeTotals(); });
  }

  async function fetchShop(){
    try{
      const { data, error } = await client
        .from("ld_shop")
        .select('item,price_currency,price,enabled,sort_index,yield_invite,yield_gold,yield_dia,yield_myth,yield_key,yield_churu,yield_battery,yield_petfood,yield_immortal,yield_artifact')
        .order('sort_index', { ascending:true })
        .order('item', { ascending:true });
      if (error) throw error;
      shopRows = data || [];
      shopSelected.clear();
      for (const r of shopRows){
        if (r.enabled === true || r.enabled === "true") shopSelected.add(keyOf(r));
      }
      paintShop(shopRows);
    }catch(e){ showError(e.message || e); if (shopBody) shopBody.innerHTML = `<tr><td colspan="5" style="color:#ff6b6b">エラー: ${e.message ?? e}</td></tr>`; }
  }

  function wireEvents(){
    $en?.addEventListener('change', ()=>{ readUI(); syncLabels(); fetchAndPaint(); });
    $df?.addEventListener('change', ()=>{ readUI(); fetchAndPaint(); });
    $db?.addEventListener('change', ()=>{ readUI(); fetchAndPaint(); });
    $round?.addEventListener('change', ()=>{ readUI(); syncLabels(); paintRows(lastRows); });
    $cond ?.addEventListener('change', ()=>{ readUI(); syncLabels(); paintRows(lastRows); });
  }

  window.addEventListener("error", (e)=> showError(e.message || String(e)) );

  document.addEventListener('DOMContentLoaded', ()=>{
    if ($df) $df.value = '太初';
    if ($db) $db.value = '神';
    if ($en) $en.checked = true;     // x3
    if ($round) $round.checked = true; // 整数
    if ($cond) $cond.checked = false;  // 全行
    syncLabels();
    wireEvents();
    artifactCount = loadArtifactCount();
    updateArtifactUI();
    bindArtifactButtons();
    fetchAndPaint();
    fetchShop();
  });
})();
