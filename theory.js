/* 로스트포인트 — 공용 이론
   기록장(index.html)과 스튜디오(studio.html)가 같은 기준으로 말하도록 여기 한 곳에 모은다.
   예전에는 두 페이지가 각자 판정을 갖고 있어 「발달 구간」이 75%부터이기도 하고
   80%부터이기도 했고, 플릭을 찾는 방식도 서로 달랐다.

   용어를 갈라 쓴다 —
     · 교과서 구간 : 건조 / 메일라아드 / 발달   (CANON.phase 의 50·30·20%)
     · 측정 창     : 초반 / 중반 / 후반          (곡선 특성을 재려고 잡은 0~40·40~75·75~100%)
   둘은 목적이 다르므로 이름도 다르게 부른다. */
"use strict";

/* ── 1층 : 교과서 상수 ───────────────────────────────
   SCA 로스팅 커리큘럼과 로스팅 문헌에서 통용되는 값. 임의로 손대지 않는다.
   주의 — 교과서의 절대 시간은 드럼(10~14분) 기준이라 쓰지 않는다.
   IKAWA 50g은 5~7분이므로 비율만 가져오고 시간은 실측에서 잡는다. */
const CANON = {
  level: {
    light : {name:"라이트",       loss:[11,13], dtr:[15,20], dropHint:[198,203]},
    mlight: {name:"미디엄 라이트", loss:[12,14], dtr:[17,22], dropHint:[201,205]},
    medium: {name:"미디엄",       loss:[13,15], dtr:[19,24], dropHint:[204,208]},
    mdark : {name:"미디엄 다크",   loss:[15,17], dtr:[20,25], dropHint:[207,211]}
  },
  phase:{ dry:50, maillard:30, dev:20 },     // 전체 시간 대비 %
  rule :"승온율은 끝까지 감소해야 한다 (크래시·플릭은 결함)",
  /* 결함 판정 기준 — 두 페이지가 이 숫자를 함께 쓴다 */
  flaw :{ bake:1.0, crash:0, flick:1.2 }
};
const LVNAME = {light:"라이트", mlight:"미디엄 라이트", medium:"미디엄", mdark:"미디엄 다크"};

/* ── 곡선 유틸 ─────────────────────────────────────
   [[t,v]] 과 [{t,v}] 을 모두 받는다. 두 페이지가 서로 다른 모양을 쓰고 있어서다. */
function curvePt(c,i){ const p=c[i]; return Array.isArray(p)?{t:p[0],v:p[1]}:p; }
function curveAt(c,x){
  if(!c||!c.length) return null;
  const n=c.length, a0=curvePt(c,0);
  if(x<=a0.t) return a0.v;
  for(let i=1;i<n;i++){
    const a=curvePt(c,i-1), b=curvePt(c,i);
    if(x<=b.t) return b.t===a.t?b.v:a.v+(b.v-a.v)*(x-a.t)/(b.t-a.t);
  }
  return curvePt(c,n-1).v;
}
/* 승온율(℃/분) 계열. 창을 두고 기울기를 재야 잡음에 흔들리지 않는다.
   표본이 G초 넘게 비어 있으면(블루투스가 끊겼던 구간) 그 위로 기울기를 재지 않는다.
   예전에는 창을 뒤로 훑다가 공백을 그냥 넘어가서, 200초 떨어진 두 점 사이의
   기울기를 계산했다. 그러면 승온율 그래프에 뜬금없는 수직 스파이크가 생기고
   세로축이 그 값에 맞춰져 정작 봐야 할 범위가 납작해진다. */
function rorSeries(c,win,gapMax){
  if(!c||c.length<4) return [];
  const W=win||30, G=gapMax||15, out=[];
  for(let i=1;i<c.length;i++){
    const p=curvePt(c,i);
    let j=i;
    while(j>0){
      const a=curvePt(c,j-1), b=curvePt(c,j);
      if(b.t-a.t>G) break;                       // 공백 — 여기서 멈춘다
      j--;
      if(p.t-curvePt(c,j).t>=W) break;
    }
    const q=curvePt(c,j), dt=p.t-q.t;
    if(dt>=Math.min(W*0.5,10)) out.push([p.t,+(((p.v-q.v)/dt)*60).toFixed(2)]);
  }
  return out;
}
/* 표본이 비어 있는 구간을 찾아낸다 — 그래프를 이어 그리지 않으려고 쓴다 */
function curveGaps(c,gapMax){
  const G=gapMax||15, out=[];
  for(let i=1;i<(c||[]).length;i++){
    const a=curvePt(c,i-1), b=curvePt(c,i);
    if(b.t-a.t>G) out.push([a.t,b.t]);
  }
  return out;
}
/* 마지막 25%(측정 창의 「후반」)의 승온율 — 기록에 남기는 값 */
function rorTail(c){
  if(!c||c.length<4) return null;
  const end=curvePt(c,c.length-1).t;
  const q=[]; for(let i=0;i<c.length;i++){ const p=curvePt(c,i); if(p.t>=end*0.75) q.push(p); }
  if(q.length<2) return null;
  const dt=(q[q.length-1].t-q[0].t)/60;
  return dt>0?(q[q.length-1].v-q[0].v)/dt:null;
}

/* ── 곡선 결함 판정 — 두 페이지가 함께 쓰는 유일한 판정기 ──
   근거는 CANON.rule 하나다: 승온율은 끝까지 감소해야 한다.
   반환 flaws[] 의 각 항목은 {k, label, at, say} 로, 화면에 그대로 쓸 수 있다. */
function diagnoseCurve(c){
  if(!c||c.length<4) return null;
  const end=curvePt(c,c.length-1);
  const dur=end.t||1, pre=curvePt(c,0).v;
  const rs=rorSeries(c,Math.max(20,Math.min(45,dur*0.08)));
  const tail=rorTail(c);
  const F=CANON.flaw, flaws=[];

  // 크래시 — 승온율이 음수로 꺾임 (건조 구간을 지난 뒤에만 본다)
  const neg=rs.find(p=>p[0]>dur*0.4&&p[1]<F.crash);
  if(neg) flaws.push({k:"crash",label:"크래시",at:neg[0],
    say:"승온율이 음수로 꺾였습니다 — 열이 모자랍니다."});

  // 플릭 — 한 번 내려갔다 다시 오름 (후반부에서만)
  let lowest=Infinity, flick=null;
  rs.forEach(p=>{ if(p[0]<dur*0.5) return;
    if(p[1]<lowest) lowest=p[1];
    else if(!flick&&p[1]-lowest>F.flick) flick={at:p[0],v:p[1],low:lowest}; });
  if(flick) flaws.push({k:"flick",label:"플릭",at:flick.at,
    say:`크랙 이후 승온율이 ${flick.low.toFixed(1)} → ${flick.v.toFixed(1)}℃/분으로 다시 올랐습니다 — 향이 무너집니다.`});

  // 베이킹 — 후반 승온율이 죽음
  if(tail!=null&&tail<F.bake) flaws.push({k:"bake",label:"베이킹 위험",at:dur*0.9,
    say:`후반 승온이 ${tail.toFixed(1)}℃/분으로 ${F.bake} 아래입니다 — 단맛이 빠지고 밋밋해집니다.`});

  return {dur, drop:end.v, pre, tail, ror:rs, flaws,
          // 교과서 구간 경계 (초 단위)
          bounds:{dry:dur*CANON.phase.dry/100,
                  mai:dur*(CANON.phase.dry+CANON.phase.maillard)/100}};
}
/* 배출온도가 어느 배전도 밴드에 앉는가 — 밴드는 겹치므로 가까운 쪽을 고르고 이웃도 알린다 */
function dropBand(drop){
  const ks=Object.keys(CANON.level);
  const d=k=>{ const [lo,hi]=CANON.level[k].dropHint;
    return drop<lo?lo-drop:(drop>hi?drop-hi:0); };
  const inb=ks.filter(k=>d(k)===0);
  const mid=k=>(CANON.level[k].dropHint[0]+CANON.level[k].dropHint[1])/2;
  const best=ks.slice().sort((x,y)=>d(x)-d(y)||Math.abs(drop-mid(x))-Math.abs(drop-mid(y)))[0];
  return {level:best, canon:CANON.level[best], also:inb.filter(k=>k!==best),
          out:d(best)>0?(drop<CANON.level[best].dropHint[0]?"under":"over"):null};
}
