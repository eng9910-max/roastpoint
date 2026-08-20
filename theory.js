/* 로스트포인트 — 공용 이론
   기록장(index.html)과 스튜디오(studio.html)가 같은 기준으로 말하도록 여기 한 곳에 모은다.
   예전에는 두 페이지가 각자 판정을 갖고 있어 「발달 구간」이 75%부터이기도 하고
   80%부터이기도 했고, 플릭을 찾는 방식도 서로 달랐다.

   용어를 갈라 쓴다 —
     · 교과서 구간 : 건조 / 메일라아드 / 발달   (CANON.phase 의 50·30·20%)
     · 측정 창     : 초반 / 중반 / 후반          (곡선 특성을 재려고 잡은 0~40·40~75·75~100%)
   둘은 목적이 다르므로 이름도 다르게 부른다. */
"use strict";
/* 판본 — 기록장·스튜디오가 「지금 쓰는 판정 코드가 몇 판인가」를 확인할 수 있게 박아 둔다.
   서비스워커가 옛 theory.js 를 계속 내주는 바람에 화면은 새것이고 판정만 옛것인 상태로
   돌던 적이 있다. 눈으로는 절대 못 알아챈다. 그래서 숫자로 맞춰 본다. */
const THEORY_V="8.5";

/* ── 1층 : 교과서 상수 ───────────────────────────────
   SCA 로스팅 커리큘럼과 로스팅 문헌에서 통용되는 값. 임의로 손대지 않는다.
   주의 — 교과서의 절대 시간은 드럼(10~14분) 기준이라 쓰지 않는다.
   IKAWA 50g은 5~7분이므로 비율만 가져오고 시간은 실측에서 잡는다. */
const CANON = {
  /* DTR 은 배전도별로 나누지 않는다. 라오(Coffee Roasting: Best Practices, p.33)는
     『커피 로스터스 컴패니언』에서 제안한 **20~25% 하나의 범위**를 유지하며,
     아주 밝은 북유럽식 로스팅은 그보다 낮게 나온다고 인정한다.
     예전에는 우리가 배전도별로 4개 밴드를 만들어 뒀는데 그건 출처가 없는 값이었다. */
  level: {
    light : {name:"라이트",       loss:[11,13], dtr:[20,25], dropHint:[198,203]},
    mlight: {name:"미디엄 라이트", loss:[12,14], dtr:[20,25], dropHint:[201,205]},
    medium: {name:"미디엄",       loss:[13,15], dtr:[20,25], dropHint:[204,208]},
    mdark : {name:"미디엄 다크",   loss:[15,17], dtr:[20,25], dropHint:[207,211]}
  },
  phase:{ dry:50, maillard:30, dev:20 },     // 전체 시간 대비 %
  rule :"승온율은 끝까지 감소해야 한다 (크래시·플릭은 결함)",
  /* 결함 판정 기준 — 두 페이지가 이 숫자를 함께 쓴다 */
  flaw :{ bake:1.0, crash:0, flick:1.2 }
};
const LVNAME = {light:"라이트", mlight:"미디엄 라이트", medium:"미디엄", mdark:"미디엄 다크"};

/* ── 근거 등급 ────────────────────────────────────────
   1층을 통째로 「교과서 · 고정」이라고 부르던 것은 정직하지 않았다.
   같은 1층 안에서도 감량률과 DTR 은 단단함이 전혀 다르다.
   감량률은 물이 빠진 무게라 기계와 사람에 무관하지만, DTR 20~25% 같은 값은
   현장 합의일 뿐이고 관능 실험으로 검증된 바가 약하다 — 이 분야에서 널리 쓰이는
   지표를 정리한 저자 자신도 나중에 「진단 도구지 목표가 아니다」로 물러섰다.
   그래서 기준마다 등급을 달아, 어긋났을 때 무엇을 먼저 의심할지 알 수 있게 한다. */
/* 값마다 어디서 왔는지 — 등급만으로는 「누가 그렇게 말했나」를 알 수 없다 */
const SRC = {
  dtr  :"라오 『Coffee Roasting: Best Practices』 p.33 — 20~25%, 배전도 구분 없음. "
       +"「균형 잡힌 로스팅의 지표일 뿐」이며 배출 판단은 색도로 하라고 명시",
  loss :"측정법은 라오 p.70 (green−roasted)/green. 다만 그는 **배전도별 절대 밴드를 주지 않고** "
       +"「같은 원두·같은 수분에서 비교하라」고 한다. 밴드 숫자는 SCA 통용값과 "
       +"Schenker 박사논문(미디엄 = 손실 15%)에서 온 것",
  dur  :"Schenker 박사논문 — 미디엄 배전도의 최적 시간 6분 이상. "
       +"라오 p.26 — 샘플 로스터의 6~7분 배치는 훌륭할 수 있고, 생산기 기준(10~12분)을 "
       +"샘플 로스터에 일반화할 수 없다",
  rule :"라오 p.32 — 매끄럽게 감소하는 승온율은 「좋은 로스팅의 전제일 수는 있으나 보증은 아니다」. "
       +"곡선만으로 발달 부족을 알아낼 방법은 아직 없다고 밝힌다",
  phase:"라오 p.65 — 메일라아드 구간 시간 관리를 하지 않는다는 입장. "
       +"구간을 늘리면 중반 승온율이 눕어 오히려 베이킹 위험이 커진다고 본다. "
       +"반면 Rob Hoos 는 그 구간을 바꿔가며 실험한다 — 두 저자가 갈린다",
  size :"라오 p.2 — 「알 크기와 수분에 집중하라. 이 둘이 크게 변해서 최적 설정에 가장 큰 영향을 준다」. "
       +"같은 농장 케냐 AA 는 가스 80%, 피베리는 65% 로 같은 배전도에 맞춘다는 예를 든다",
  dens :"라오 p.3 — 밀도가 높으면 열이 더 든다. 다만 「고지대 스페셜티만 다루는 로스터는 밀도 추적에 "
       +"느슨해도 된다. 가스 설정을 바꿀 만큼 변하는 일이 드물다」. "
       +"또 우리가 쓰는 부피밀도(g/L)는 「편하지만 부정확하다 — 알 크기와 모양이 충전율에 영향을 준다」",
  moist:"라오 p.2~3 — 생두 수분은 보통 8~12%. 그 아래는 속 빈 짚 같은 맛이 나기 쉽고, "
       +"12% 위는 미생물 번식 위험. 수분이 많으면 수증기가 콩 표면을 식히고 열풍을 튕겨내 열전달을 방해한다. "
       +"수분활성도(aw)는 0.53~0.59 가 좋지만 「로스팅 에너지 조절에 쓸 지혜는 없다」고 그가 밝힌다",
  flick:"라오 p.30 — 플릭은 로스팅 끝에 승온율이 다시 오르는 것. 크래시 뒤에 오는 게 보통이지만 "
       +"크래시 없이도 생기고, 가스를 낮추거나 꺼도 생긴다. **숫자 기준은 주지 않고** "
       +"「플릭이 클수록 영향도 크다」고만 한다",
  crash:"라오 p.30 — 크래시는 베이킹을 부른다. 다만 「북유럽식 예외」가 있다 — "
       +"충분히 늦거나 완만한 크래시는 그래프가 시사하는 만큼 베이크된 맛을 내지 않는다. "
       +"깊은 층의 발달을 바꿀 시간이 없었기 때문이라는 것이 그의 추정",
  form :"라오 p.4 — 「낯선 원두를 어떻게 볶을지 예측하는 간단한 공식은 없다」. "
       +"대신 샘플 로스팅 데이터 · 물성 측정 · 비슷한 원두를 볶아 본 경험을 합치라고 한다. "
       +"이 앱의 2층은 그 「비슷한 원두 찾기」의 출발점일 뿐 예측 공식이 아니다",
  crack:"라오 p.62~63 — 배기온도 승온율(ETROR)이 깊은 골에서 **급격히 다시 오르기 시작하는 순간**이 "
       +"1차 크랙의 객관적 지표. 그 골·반등은 로스팅 중 가장 극적이어야 한다. "
       +"내추럴·디카페인은 신호가 뚜렷하지 않을 수 있다"
};
const GRADE = {
  meas:{n:"측정", c:"ok",   d:"물리적으로 잰 값입니다 — 기계와 사람에 무관합니다. 어긋나면 이쪽을 먼저 믿으세요."},
  phys:{n:"물리", c:"ok",   d:"물리에서 따라 나옵니다. 원두는 열원 온도로 수렴하므로 승온율은 자연히 줄어듭니다."},
  mach:{n:"기계", c:"",     d:"이 기계의 센서 기준값입니다. IKAWA 는 배기 공기 온도를 재므로 드럼 로스터의 값과 그대로 비교할 수 없습니다."},
  conv:{n:"관행", c:"warn", d:"현장에서 널리 쓰이지만 관능 실험으로 검증된 바는 약합니다. 가르치는 사람마다 값이 다릅니다."},
  est :{n:"추정", c:"warn", d:"방향은 물리에서 나오지만 크기는 이 앱의 추정입니다. 기록이 쌓이면 실측이 이 값을 덮어씁니다."}
};
/* 무엇이 어느 등급인가 */
const CANONG = {
  loss:"meas", agtron:"meas",
  rule:"phys",
  drop:"mach", pre:"mach",
  dtr:"conv", phase:"conv", flaw:"conv",
  fix:"est"
};
function gradeTag(k){
  const g=GRADE[CANONG[k]||k]; if(!g) return "";
  const s=SRC[k]?"\n\n출처 — "+SRC[k]:"";
  return `<span class="pill ${g.c}" title="${(g.d+s).replace(/"/g,"&quot;")}">${g.n}</span>`;
}
/* 출처를 본문에 적을 때 */
function srcNote(k){ return SRC[k]?`<span class="note">출처 — ${SRC[k]}</span>`:""; }


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
