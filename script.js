/* ---------------- CLOCK ---------------- */
const weekdays = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
function pad(n){ return String(n).padStart(2,'0'); }
function updateClock(){
  const now = new Date();
  document.getElementById('clockTime').textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  document.getElementById('clockDate').textContent =
    `${weekdays[now.getDay()]}, ${monthNames[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
}
updateClock();
// Only the minute changes now (no seconds shown), so sync updates to the
// start of the next minute, then refresh once a minute after that.
const msToNextMinute = 60000 - (Date.now() % 60000);
setTimeout(()=>{
  updateClock();
  setInterval(updateClock, 60000);
}, msToNextMinute);

/* ---------------- WEEKLY VOCAB ---------------- */
// 학원용 Vocab Test 교재의 페이지 진행 순서 (Google Drive 파일 목록 기준)
const pageSequence = [6,9,12,15,24,27,30,33,42,45,48,51,60,63,66,69,78,81,84,87,96,99,102,105,114,117,120,123,132,135,138,141,150,153,156,159];
const anchorIndex = 8; // p.42 위치 (2026-09-21 주)
const anchorMonday = new Date(2026,8,21); // 2026-09-21 (월요일 확인됨)

function getMondayOf(d){
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = date.getDay();
  const diff = (day===0) ? -6 : 1-day;
  date.setDate(date.getDate()+diff);
  return date;
}
function fmtRange(monday){
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate()+5);
  if(monday.getMonth()===saturday.getMonth()){
    return `${monday.getMonth()+1}/${monday.getDate()}-${saturday.getDate()}`;
  }
  return `${monday.getMonth()+1}/${monday.getDate()}-${saturday.getMonth()+1}/${saturday.getDate()}`;
}
function pageForMonday(monday){
  const diffDays = Math.round((monday - anchorMonday)/(1000*60*60*24));
  const diffWeeks = Math.round(diffDays/7);
  const idx = anchorIndex + diffWeeks;
  return (idx>=0 && idx<pageSequence.length) ? pageSequence[idx] : null;
}
function isSameWeek(a,b){
  return getMondayOf(a).getTime() === getMondayOf(b).getTime();
}
function updateVocab(){
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  document.getElementById('vocabMonthLabel').textContent = `${monthNames[month]} Vocab Schedule`;

  const lastDay = new Date(year, month+1, 0);
  let monday = getMondayOf(new Date(year, month, 1));
  const weeks = [];
  while(monday <= lastDay){
    weeks.push(new Date(monday));
    monday = new Date(monday);
    monday.setDate(monday.getDate()+7);
  }

  const list = document.getElementById('vocabList');
  list.innerHTML = '';
  weeks.forEach(wk=>{
    const page = pageForMonday(wk);
    const row = document.createElement('div');
    row.className = 'vocab-row' + (isSameWeek(wk,today) ? ' current' : '');
    const pageLabel = page!==null ? `p.${page}` : 'TBD';
    const badge = isSameWeek(wk,today) ? '<span class="badge">This Week</span>' : '';
    row.innerHTML = `<div class="range">${fmtRange(wk)}</div><div class="right">${badge}<div class="page">${pageLabel}</div></div>`;
    list.appendChild(row);
  });
}
updateVocab();
setInterval(updateVocab, 60*1000);

/* ---------------- NEXT SAT ---------------- */
const satDates = ['2026-10-03','2026-11-07','2026-12-05','2027-03-06','2027-05-01','2027-06-05'];
function updateSat(){
  const today = new Date(); today.setHours(0,0,0,0);
  const upcoming = satDates.map(s=>new Date(s+'T00:00:00')).filter(d=>d>=today);
  const big = document.getElementById('satDdayBig');

  if(upcoming.length===0){
    big.innerHTML = 'D-<span>-</span>';
    document.getElementById('satFullDate').textContent = 'No upcoming dates';
    document.getElementById('satFutureList').innerHTML = '';
    return;
  }

  const next = upcoming[0];
  const dday = Math.round((next-today)/(1000*60*60*24));
  if (dday === 0) {
       document.getElementById('satDdayBig').innerHTML = `D-DAY`;
  } else {
       document.getElementById('satDdayBig').innerHTML = `D-<span>${dday}</span>`;
  }
  document.getElementById('satFullDate').textContent =
    `${weekdays[next.getDay()]}, ${monthNames[next.getMonth()]} ${next.getDate()}, ${next.getFullYear()}`;
  const list = document.getElementById('satFutureList');
  list.innerHTML='';
  upcoming.slice(1,4).forEach(d=>{
    const li = document.createElement('li');
    li.innerHTML = `<span>${d.getMonth()+1}/${d.getDate()}</span><span>D-${Math.ceil((d-today)/(1000*60*60*24))}</span>`;
    list.appendChild(li);
  });
}
updateSat();
setInterval(updateSat, 60*60*1000);

/* ---------------- HIDE EXPIRED PROMOS ---------------- */
(function(){
  const today = new Date(); today.setHours(0,0,0,0);
  document.querySelectorAll('[data-expires]').forEach(el=>{
    if(today > new Date(el.dataset.expires+'T23:59:59')) el.remove();
  });
  const grid = document.getElementById('promoGrid');
  if(grid && !grid.querySelector('.promo-card')){
    grid.closest('.slide').remove();
  }
})();

/* ---------------- SLIDE ROTATION ---------------- */
const slides = Array.from(document.querySelectorAll('.slide'));
const dotsWrap = document.getElementById('dots');
slides.forEach((s,i)=>{
  const d = document.createElement('button');
  d.className = 'dot'+(i===0?' active':'');
  d.type = 'button';
  d.setAttribute('aria-label', `Go to slide ${i+1}`);
  d.addEventListener('click', ()=>{ showSlide(i); restartRotation(); });
  dotsWrap.appendChild(d);
});
const dots = Array.from(dotsWrap.children);
let current = 0;
let rotationTimer = null;
const SLIDE_SECONDS = 12;
function showSlide(i){
  slides.forEach((s,idx)=>s.classList.toggle('active', idx===i));
  dots.forEach((d,idx)=>d.classList.toggle('active', idx===i));
  current = i;
}
function restartRotation(){
  if(rotationTimer) clearInterval(rotationTimer);
  rotationTimer = setInterval(()=>{ showSlide((current+1)%slides.length); }, SLIDE_SECONDS*1000);
}
showSlide(0);
restartRotation();

/* ---------------- SCALE STAGE TO FIT SCREEN (keeps 16:9 ratio on any TV) ---------------- */
const stage = document.getElementById('stage');
function fitStage(){
  const scale = Math.min(window.innerWidth/1920, window.innerHeight/1080);
  stage.style.transform = `translate(-50%,-50%) scale(${scale})`;
  stage.style.position = 'absolute';
  stage.style.top = '50%';
  stage.style.left = '50%';
}
window.addEventListener('resize', fitStage);
window.addEventListener('orientationchange', fitStage);
fitStage();

/* ---------------- KEEP SCREEN AWAKE ---------------- */
// 1) Screen Wake Lock API
let wakeLock = null;
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator){
      wakeLock = await navigator.wakeLock.request('screen');
    }
  }catch(e){}
}
requestWakeLock();
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState === 'visible'){ requestWakeLock(); }
});

// 2) Hidden YouTube video (looping, low volume)
const ytApiScript = document.createElement('script');
ytApiScript.src = 'https://www.youtube.com/iframe_api';
document.head.appendChild(ytApiScript);
let ytKeepAwakePlayer = null;
function onYouTubeIframeAPIReady(){
  ytKeepAwakePlayer = new YT.Player('ytKeepAwake', {
    videoId: 'mW6sqYDDFN0',
    width: '2',
    height: '2',
    playerVars: {
      autoplay: 1, mute: 0, loop: 1, playlist: 'mW6sqYDDFN0',
      controls: 0, modestbranding: 1, rel: 0, showinfo: 0,
      iv_load_policy: 3, disablekb: 1, fs: 0, playsinline: 1
    },
    events: {
      onReady: (e)=>{ e.target.unMute(); e.target.setVolume(8); e.target.playVideo(); },
      onStateChange: (e)=>{ if(e.data === YT.PlayerState.ENDED){ e.target.playVideo(); } }
    }
  });
}
