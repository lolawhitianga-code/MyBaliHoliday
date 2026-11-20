/* ============================================================
   stars.js — the gold star reward system
   Shared by every page. Import it and call celebrate().

     import { celebrate } from "./stars.js";
     celebrate("planner");        // after something saves

   Everything here is self-contained: the sound is synthesised
   on the fly, so there are no audio files to download and it
   still works with no signal.
   ============================================================ */

const FIREBASE = {
  apiKey: "AIzaSyB1NnJlvpL_dv7aPrAeFGtl5MM1oSa1YPk",
  authDomain: "mybaliholiday-5170c.firebaseapp.com",
  projectId: "mybaliholiday-5170c",
  storageBucket: "mybaliholiday-5170c.firebasestorage.app",
  messagingSenderId: "29285891302",
  appId: "1:29285891302:web:9497074c278aed8c0ccf27"
};

/* what each thing is worth, and what we say about it */
export const AWARDS = {
  alldone:   { points:50, label:"That's the lot",     note:"nothing left on your list" },
  visa:      { points:25, label:"Admin done",        note:"one less thing" },
  flight:    { points:15, label:"Flight added",      note:"we know when you land" },
  stay:      { points:15, label:"Beds sorted",       note:"nice one" },
  shoplog:   { points:15, label:"Shop logged",       note:"and squared up" },
  planner:   { points:10, label:"On the plan",       note:"the trip takes shape" },
  idea:      { points:10, label:"Good idea",         note:"let's see what they think" },
  expense:   { points:10, label:"Expense in",        note:"nobody's out of pocket" },
  photo:     { points:10, label:"Photo up",          note:"on the wall" },
  packing:   { points:5,  label:"You're bringing it", note:"so nobody else does" },
  packed:    { points:5,  label:"In the bag",        note:"" },
  shopping:  { points:5,  label:"On the list",       note:"" },
  vote:      { points:5,  label:"Voted",             note:"" },
  trolley:   { points:3,  label:"In the trolley",    note:"" }
};

/* ---------- sound ---------- */
let ctx = null;
let muted = localStorage.getItem("mbh_muted") === "1";

export const isMuted = () => muted;
export function setMuted(v){
  muted = !!v;
  localStorage.setItem("mbh_muted", muted ? "1" : "0");
}

function makeCtx(){
  try{
    if(!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if(ctx.state === "suspended") ctx.resume();
    return ctx;
  }catch(e){ return null; }
}

/* Safari and Chrome will only start audio during a genuine tap, and by the time a
   save has been through the network that tap is long over. So we open it on the
   very first touch of the session and keep it open. */
function unlock(){
  const c = makeCtx();
  if(c && c.state === "running"){
    removeEventListener("pointerdown", unlock, true);
    removeEventListener("keydown", unlock, true);
  }
}
addEventListener("pointerdown", unlock, true);
addEventListener("keydown", unlock, true);

function audio(){ return muted ? null : makeCtx(); }

function tone(c, freq, at, dur, vol, type){
  const o = c.createOscillator(), g = c.createGain();
  o.type = type || "triangle";
  o.frequency.setValueAtTime(freq, at);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g); g.connect(c.destination);
  o.start(at); o.stop(at + dur + 0.05);
}

/* a bright rising arpeggio, longer and higher the bigger the award */
function fanfare(points){
  const c = audio();
  if(!c) return;
  const t = c.currentTime + 0.02;
  const big = points >= 15;

  // C major, up the octaves
  const notes = big
    ? [523.25, 659.25, 783.99, 1046.50, 1318.51]
    : [523.25, 659.25, 783.99, 1046.50];

  notes.forEach((f, i) => {
    tone(c, f, t + i * 0.075, 0.42, 0.16, "triangle");
    tone(c, f * 2, t + i * 0.075, 0.20, 0.05, "sine");     // shimmer on top
  });

  // a little sparkle tail
  const tail = t + notes.length * 0.075;
  for(let i = 0; i < (big ? 7 : 4); i++){
    tone(c, 1600 + Math.random() * 1600, tail + i * 0.045, 0.16, 0.035, "sine");
  }

  if(big){
    tone(c, 130.81, t, 0.9, 0.10, "sine");   // low note underneath, for weight
  }
}

/* ---------- the shower ---------- */
function styles(){
  if(document.getElementById("mbh-star-css")) return;
  const s = document.createElement("style");
  s.id = "mbh-star-css";
  s.textContent = `
    #mbh-stars{
      position:fixed;inset:0;z-index:99998;pointer-events:none;overflow:hidden;
    }
    #mbh-stars b{
      position:absolute;top:-8vh;display:block;line-height:1;
      color:#FFD166;text-shadow:0 0 14px rgba(255,193,71,.9), 0 2px 5px rgba(120,70,0,.45);
      will-change:transform,opacity;
      animation:mbh-fall var(--dur) cubic-bezier(.35,.1,.6,1) var(--delay) both;
    }
    @keyframes mbh-fall{
      0%   { transform:translate3d(0,0,0) rotate(0deg) scale(.7); opacity:0 }
      10%  { opacity:1; transform:translate3d(0,10vh,0) rotate(60deg) scale(1) }
      100% { transform:translate3d(var(--dx),112vh,0) rotate(var(--rot)) scale(1); opacity:0 }
    }
    #mbh-pop{
      position:fixed;left:50%;top:34%;transform:translate(-50%,-50%);
      z-index:99999;pointer-events:none;text-align:center;
      animation:mbh-pop 2.1s cubic-bezier(.2,1.3,.4,1) both;
    }
    #mbh-pop .n{
      font-family:'Fraunces',Georgia,serif;font-weight:900;
      font-size:clamp(54px,17vw,92px);line-height:.9;color:#FFD166;
      text-shadow:0 0 34px rgba(255,193,71,.75), 0 4px 14px rgba(60,32,0,.5);
      display:block;
    }
    #mbh-pop .l{
      font-family:'Outfit',system-ui,sans-serif;font-weight:600;font-size:19px;
      color:#fff;text-shadow:0 2px 12px rgba(27,23,48,.85);margin-top:4px;display:block;
    }
    #mbh-pop .s{
      font-family:'DM Mono',ui-monospace,monospace;font-size:11.5px;letter-spacing:.16em;
      text-transform:uppercase;color:rgba(255,255,255,.8);
      text-shadow:0 2px 10px rgba(27,23,48,.85);margin-top:6px;display:block;
    }
    @keyframes mbh-pop{
      0%   { opacity:0; transform:translate(-50%,-50%) scale(.5) }
      14%  { opacity:1; transform:translate(-50%,-50%) scale(1.08) }
      24%  { transform:translate(-50%,-50%) scale(1) }
      74%  { opacity:1; transform:translate(-50%,-50%) scale(1) }
      100% { opacity:0; transform:translate(-50%,-58%) scale(.96) }
    }
    @media (prefers-reduced-motion:reduce){
      #mbh-stars{display:none}
      #mbh-pop{animation-duration:1.6s}
    }`;
  document.head.appendChild(s);
}

function shower(points){
  styles();
  if(matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const n = Math.min(64, 16 + points * 1.6);
  const wrap = document.createElement("div");
  wrap.id = "mbh-stars";

  const glyphs = ["★","★","★","✦","⭐"];
  let html = "";
  for(let i = 0; i < n; i++){
    const dur   = 1.5 + Math.random() * 1.6;
    const delay = Math.random() * 0.7;
    const size  = 13 + Math.random() * 26;
    const dx    = (Math.random() * 2 - 1) * 22;
    const rot   = (Math.random() * 2 - 1) * 720;
    html += `<b style="left:${Math.random()*100}%;font-size:${size}px;
      --dur:${dur}s;--delay:${delay}s;--dx:${dx}vw;--rot:${rot}deg;
      opacity:${0.65 + Math.random()*0.35}">${glyphs[i % glyphs.length]}</b>`;
  }
  wrap.innerHTML = html;
  document.body.appendChild(wrap);
  setTimeout(()=>wrap.remove(), 4200);
}

function popup(points, label, note){
  styles();
  const old = document.getElementById("mbh-pop");
  if(old) old.remove();
  const p = document.createElement("div");
  p.id = "mbh-pop";
  p.innerHTML = `<span class="n">+${points}</span>
    <span class="l">${label}</span>
    ${note ? `<span class="s">${note}</span>` : ""}`;
  document.body.appendChild(p);
  setTimeout(()=>p.remove(), 2200);
}

/* ---------- keeping score ---------- */
let scoreFns = null;

async function scoring(){
  if(scoreFns !== null) return scoreFns;
  try{
    const [appMod, fs, fa] = await Promise.all([
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"),
      import("https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js")
    ]);
    const app = appMod.getApps().length ? appMod.getApp() : appMod.initializeApp(FIREBASE);
    try{ await fa.signInAnonymously(fa.getAuth(app)); }catch(e){ /* open rules */ }
    const db = fs.getFirestore(app);
    scoreFns = {
      bump: (who, kind, points) => fs.setDoc(
        fs.doc(db, "scores", who),
        { points: fs.increment(points),
          [`counts.${kind}`]: fs.increment(1),
          last: Date.now(), name: who },
        { merge:true }),
      watch: cb => fs.onSnapshot(fs.collection(db, "scores"),
        snap => cb(snap.docs.map(d => ({ id:d.id, ...d.data() }))), () => {})
    };
  }catch(e){
    /* offline or no connection — celebrate anyway, just don't score */
    scoreFns = {
      bump: () => Promise.resolve(),
      watch: () => {}
    };
  }
  return scoreFns;
}

export async function watchScores(cb){ (await scoring()).watch(cb); }

/* ---------- scoring only: the animation is inline in each page now ---------- */
export async function score(who, kind, points){
  try{ await (await scoring()).bump(who, kind, points); }catch(e){ /* never mind */ }
}

/* kept so the leaderboard's own test button still works */
export function celebrate(kind, opts = {}){
  const a = AWARDS[kind];
  if(!a) return;
  const who = opts.who || localStorage.getItem("mbh_me");

  popup(a.points, opts.label || a.label, opts.note ?? a.note);
  shower(a.points);
  fanfare(a.points);

  if(who) scoring().then(s => s.bump(who, kind, a.points).catch(()=>{}));
}
