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
const THEORY_V="8.7";

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
  lossmoist:"Baggenstoss 2008 (ETH Diss 17696) 표 5.1 — 같은 커피를 수분만 5.1/10.0/14.7% 로 바꿔 볶은 실측. "
       +"감량률이 라이트 8.14→12.38→16.04%, 다크 12.37→17.08→21.15% 로 거의 1:1 선형으로 따라 올랐다. "
       +"색도·밀도·유기물 감량의 수분별 차이는 다크에서 사라지지만 감량률만은 남는다",
  early:"Geiger 2004 (ETH Diss 15430) 결론 — 「로스팅 초반의 초기 수분 증발이 콩 부피 팽창의 가장 큰 동력」이며 "
       +"「완만한 승온율과 낮은 초기 수분이 구조 형성에 유리하고, 이는 보관 중 향 보존을 개선할 수 있다」. "
       +"초반을 세게 미는 것이 왜 손해인지에 대한 물리적 근거",
  transfer:"Baggenstoss 2008 §4.3.4 — 드럼 로스터의 시간·온도 곡선을 열풍 유동층으로 옮기는 것은 가능하다. "
       +"다만 「같은 향미를 내려면 로스팅 시간을 줄여서는 안 된다」. "
       +"이 앱이 드럼 기준 교과서 숫자를 IKAWA 에 쓰는 근거이자 그 한계",
  crack:"라오 p.62~63 — 배기온도 승온율(ETROR)이 깊은 골에서 **급격히 다시 오르기 시작하는 순간**이 "
       +"1차 크랙의 객관적 지표. 그 골·반등은 로스팅 중 가장 극적이어야 한다. "
       +"내추럴·디카페인은 신호가 뚜렷하지 않을 수 있다"
};
/* ── 감량률 밴드는 생두 수분에 따라 움직인다 ─────────────
   Baggenstoss 2008 (ETH Diss 17696) 표 5.1. 같은 로부스타를 수분만 바꿔
   (5.10 / 10.04 / 14.70 %) 라이트·다크로 볶은 실측이다.

     라이트  감량률 8.14 → 12.38 → 16.04 %   기울기 (16.04-8.14)/9.60 = 0.82
     다크    감량률 12.37 → 17.08 → 21.15 %   기울기 (21.15-12.37)/9.60 = 0.91

   수분 1%p 당 감량률이 약 <b>0.85%p</b> 따라 움직인다. 거의 1:1 선형이고
   Little 등이 「감량률은 초기 수분의 선형 함수」라 한 것과 맞는다.

   중요한 것은 이 차이가 <b>다크에서도 사라지지 않는다</b>는 점이다.
   같은 표에서 유기물 감량·색도·밀도의 수분별 차이는 다크로 가면 없어지는데
   ("with the exception of roast loss, these differences disappeared in dark roasted coffees")
   감량률만은 끝까지 남는다. 물이 더 빠진 만큼은 그대로 무게에서 빠지기 때문이다.

   그래서 밴드는 배전도와 무관하게 같은 기울기로 옮기고,
   프로파일 보정(총시간·초반 승온율)은 반대로 다크로 갈수록 줄인다. */
const LOSSREF = 10.5;          // 기준 생두 수분 (2층 REF 와 같은 값)
const LOSSK   = 0.85;          // 수분 1%p 당 감량률 %p
function lossBand(cn, moist){
  const base={lo:cn.loss[0], hi:cn.loss[1], d:0, m:null};
  const m=+moist;
  if(!(m>0)||Math.abs(m-LOSSREF)<0.3) return base;
  const d=Math.round(LOSSK*(m-LOSSREF)*10)/10;
  return {lo:+(cn.loss[0]+d).toFixed(1), hi:+(cn.loss[1]+d).toFixed(1), d, m};
}
function lossNote(sh){
  if(!sh||!sh.d) return "";
  return `<span class="pill">생두 수분 ${sh.m}%</span> 기준 ${LOSSREF}% 보다 `
    +`${sh.m>LOSSREF?"높습니다":"낮습니다"} → 감량률 밴드를 <b>${sh.d>0?"+":""}${sh.d}%p</b> 옮겼습니다. `
    +`물이 더 ${sh.d>0?"빠지":"덜 빠지"}는 만큼 감량률도 따라 움직입니다 `
    +`<span class="note">(Baggenstoss 2008 표 5.1 — 수분 1%p 당 ${LOSSK}%p)</span>`;
}
/* 수분이 프로파일에 미치는 영향은 라이트에서 크고 다크로 갈수록 사라진다.
   같은 표에서 색도·밀도·유기물 감량의 수분별 차이가 다크에서 없어졌다. */
function moistW(level){
  return {light:1.0, mlight:0.85, medium:0.7, mdark:0.5}[level] ?? 0.85;
}
const GRADE = {
  meas:{n:"측정", c:"ok",   d:"물리적으로 잰 값입니다 — 기계와 사람에 무관합니다. 어긋나면 이쪽을 먼저 믿으세요."},
  phys:{n:"물리", c:"ok",   d:"물리에서 따라 나옵니다. 원두는 열원 온도로 수렴하므로 승온율은 자연히 줄어듭니다."},
  mach:{n:"기계", c:"",     d:"이 기계의 센서 기준값입니다. IKAWA 는 배기 공기 온도를 재므로 드럼 로스터의 값과 그대로 비교할 수 없습니다."},
  conv:{n:"관행", c:"warn", d:"현장에서 널리 쓰이지만 관능 실험으로 검증된 바는 약합니다. 가르치는 사람마다 값이 다릅니다."},
  est :{n:"추정", c:"warn", d:"방향은 물리에서 나오지만 크기는 이 앱의 추정입니다. 기록이 쌓이면 실측이 이 값을 덮어씁니다."}
};
/* 무엇이 어느 등급인가 */
const CANONG = {
  loss:"meas", agtron:"meas", lossmoist:"meas",
  rule:"phys",
  drop:"mach", pre:"mach",
  dtr:"conv", phase:"conv", flaw:"conv",
  fix:"est"
};
/* ── 저자들이 갈리는 지점 ─────────────────────────────
   같은 실무 진영 안에서도 정면으로 갈리는 대목이 있다. 한쪽만 보여주면
   그게 정설인 것처럼 읽힌다. 그래서 양쪽을 나란히 적고 판단은 사용자에게 맡긴다. */
const DEBATE = {
  phase:{ q:"메일라아드 구간 시간을 관리해야 하는가",
    a:{who:"스콧 라오 (Best Practices p.65)",
       say:"관리하지 않는다. 구간을 늘리면 중반 승온율이 눕어 오히려 <b>베이킹 위험이 커진다</b>. "
          +"그 시간에 매끄럽게 감소하는 승온율을 맞추는 편이 낫다"},
    b:{who:"Rob Hoos (Modulating the Flavor Profile)",
       say:"이 구간을 바꾸는 것이 책 전체의 주제. 건조·발달·최종온도를 고정하고 "
          +"메일라아드 시간만 바꾼 실험에서 <b>길수록 바디와 복합성이 늘었다</b>고 보고한다"},
    mine:"이 앱은 구간 비율(50/30/20)을 <b>표시만</b> 하고 그것으로 프로파일을 고치지는 않습니다. "
        +"두 사람이 갈리는 곳이라 어느 쪽으로도 밀지 않습니다." },
  dtr:{ q:"DTR 을 지표로 써야 하는가",
    a:{who:"스콧 라오 (p.33)",
       say:"DTR 을 널리 알린 사람. <b>20~25%</b>를 권하되 「균형의 지표일 뿐」이며 "
          +"<b>배출은 색도로 판단</b>하라고 못박는다"},
    b:{who:"Rob Hoos",
       say:"책에서 <b>DTR 이라는 말을 한 번도 쓰지 않는다</b>(development time 은 46회, DTR 은 0회). "
          +"비율이 아니라 <b>절대 초</b>로 다루고, 10초 안팎의 차이는 컵에서 구별하기 어렵다고 본다"},
    mine:"라오의 20~25%를 표시하되 배출 판단에는 쓰지 않습니다. "
        +"크랙을 못 찍은 배치에서는 DTR 자체가 추정이라 더 약합니다." },
  drop:{ q:"배출 시점은 무엇으로 판단하는가",
    a:{who:"스콧 라오 (p.33, p.70)",
       say:"<b>색도</b>가 완성도의 더 나은 지표. 감량률은 「같은 원두·같은 수분에서 배치끼리 견주는」 용도"},
    b:{who:"Schenker (ETH 2000) · Baggenstoss (ETH 2008)",
       say:"Schenker 는 배전도를 <b>로스팅 손실과 색도 두 가지</b>로 잡고 "
          +"<b>색은 신뢰도가 낮은 지표</b>라고 명시한다. Baggenstoss 는 실측으로 못을 박는다 — "
          +"<b>「같은 색을 다른 시간·온도로 만들면 향과 물성이 같지 않다」</b>(§4.3.4). "
          +"즉 색은 도착점을 알려줄 뿐 <b>어떻게 왔는지는 못 알려준다</b>"},
    mine:"둘 다 표시하고, 색도계가 없으면 감량률을 우선하도록 안내합니다. "
        +"어느 쪽이든 <b>색만으로는 부족</b>하다는 것이 실측 쪽 결론이라, 앱은 곡선 모양을 함께 봅니다." }
};
function debateTag(k){
  const d=DEBATE[k]; if(!d) return "";
  const txt=`이견 \u2014 ${d.q}\n\n\u00b7 ${d.a.who}\n  ${d.a.say}\n\n\u00b7 ${d.b.who}\n  ${d.b.say}\n\n\u2192 ${d.mine}`
    .replace(/<[^>]+>/g,"").replace(/"/g,"&quot;");
  return `<span class="pill warn" style="cursor:help" title="${txt}">이견 있음</span>`;
}
function debateBox(k){
  const d=DEBATE[k]; if(!d) return "";
  return `<div class="extra" style="margin-top:7px">
    <p class="tagline" style="margin:0 0 5px">이견 \u2014 ${d.q}</p>
    <p class="note" style="margin:0 0 4px">\u00b7 <b>${d.a.who}</b> \u2014 ${d.a.say}</p>
    <p class="note" style="margin:0 0 4px">\u00b7 <b>${d.b.who}</b> \u2014 ${d.b.say}</p>
    <p class="note" style="margin:0"><b>이 앱은</b> \u2014 ${d.mine}</p></div>`;
}
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
