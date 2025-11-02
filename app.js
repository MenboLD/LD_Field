/* ====== ld_resource_viewer_v10 logic (ported) + UI behaviors ====== */
const { createClient } = supabase;
const supabaseUrl = "https://cxgbloauhimuhdjlvwvh.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4Z2Jsb2F1aGltdWhkamx2d3ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA4NDQ1MDIsImV4cCI6MjA3NjQyMDUwMn0.wnRHKccWAba4wzC1XHqYPdzL0wF5uQOImbLkn4rs6SA";
const client = createClient(supabaseUrl, supabaseKey);

let roundInt = false;
let condensed = false;

const fmt = v => {
  if (v == null) return "－";
  if (roundInt) return Math.round(v).toLocaleString("ja-JP");
  const val = Math.round(v*10)/10; // 0.1刻み
  return val.toLocaleString("ja-JP", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

async function loadData() {
  const df=document.getElementById('diff_front').value;
  const db=document.getElementById('diff_back').value;
  const en=document.getElementById('energy_toggle').checked ? 3 : 1;
  const tbody=document.querySelector('#table tbody');
  tbody.innerHTML='<tr><td colspan="10">読込中...</td></tr>';

  const { data, error } = await client.from('ld_resources')
    .select('*')
    .eq('diff_front', df).eq('diff_back', db).eq('energy_mult', en)
    .order('match', { ascending: true });

  if (error) { tbody.innerHTML=`<tr><td colspan="10" style="color:red">Error: ${error.message}</td></tr>`; return; }
  if (!data || data.length===0) { tbody.innerHTML='<tr><td colspan="10">該当データなし</td></tr>'; return; }

  let rows="";
  data.forEach(row=>{
    if(!condensed || row.match%5===0){
      const diff = row.match <=5 ? df : db;
      rows+=`<tr data-diff="${diff}"><td>${row.match}</td>`+
             `<td>${fmt(row.gold)}</td><td>${fmt(row.key)}</td><td>${fmt(row.churu)}</td>`+
             `<td>${fmt(row.battery)}</td><td>${fmt(row.petfood)}</td>`+
             `<td>${fmt(row.myth)}</td><td>${fmt(row.immortal)}</td>`+
             `<td>${fmt(row.dia)}</td><td>(${fmt(row.invite)})</td></tr>`;
    }
  });
  tbody.innerHTML=rows;
}

/* Energy text sync */
const energyToggle = document.getElementById('energy_toggle');
const energyLabel  = document.getElementById('energy_label');
const syncEnergyText = ()=>{
  energyLabel.textContent = energyToggle.checked
    ? '（現在）エネ倍数パケ購入済'
    : '（現在）エネ倍数パケ未購入';
};
energyToggle.addEventListener('change', ()=>{ syncEnergyText(); loadData(); });

/* Display toggles */
document.getElementById("switch_round").addEventListener("change",(e)=>{ roundInt=e.target.checked; loadData(); });
document.getElementById("switch_condensed").addEventListener("change",(e)=>{ condensed=e.target.checked; loadData(); });

/* Difficulty change */
document.getElementById("diff_front").addEventListener("change", loadData);
document.getElementById("diff_back").addEventListener("change", loadData);

/* Init */
window.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('diff_front').value = '太初';
  document.getElementById('diff_back').value  = '神';
  syncEnergyText();
  loadData();
});