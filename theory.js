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
const THEORY_V="9.3";

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
  crashkind:"라오 p.49 — 크래시를 「부드러운 것」과 「급한 것」으로 나누고 고치는 법을 달리 준다. "
       +"급한 것은 「꺾임이 급격하고 거의 90도이며 로스터가 이미 아주 낮은 화력을 골라 둔」 경우로, "
       +"중반 화력을 낮추는 것으로는 못 편다. **각도의 숫자 기준은 주지 않는다** — "
       +"이 앱의 6.0℃/분per분 문턱은 자체 설정이다",
  dtrrisk:"라오 p.49~50 — 「크랙 전에는 원두 온도로, 크랙 뒤에는 DTR 로」 화력을 조절하라. "
       +"「크랙 뒤 원두 온도는 느리고 예측하기 어려워 나쁜 지표지만, DTR 은 크래시와 플릭을 "
       +"예측하는 훌륭한 지표다」. 0~12% 크래시 위험(화력 내리지 말 것), 12~16% 화력 낮추기, "
       +"16~17% 플릭이 거의 항상 나는 구간",
  precrack:"라오 p.46 — 「1차 크랙이 시작되리라 보는 시점의 40~45초 전에 화력을 크게 낮추는 것이 "
       +"좋은 어림」. 또 진단 규칙 둘 — 승온율이 평평해지거나 오르다 크래시하면 화력이 너무 높았던 것, "
       +"크랙 전에 꾸준히 내려가다 크랙 중 정체·평탄해지면 화력이 너무 낮았던 것",
  cvai:"SCA Standard 103-2024 『Coffee Value Assessment: Descriptive Assessment』 §6.2 — "
       +"15점 척도에 LOW·MEDIUM·HIGH 를 0-5-10-15 로 나눈다. "
       +"§4 「강도는 품질이나 선호를 뜻하지 않는다」, §6.1 「개별 성분이 아니라 각 항목의 총 강도를 매긴다」, "
       +"§6.3.1 「그 커피를 가장 잘 나타내는 다섯 개까지 고른다」. 표준 문서를 직접 확인한 값이다",
  inlet:"라오 p.52 — 흡기온도(Inlet Temperature)는 버너에서 드럼으로 들어가는 공기의 온도. "
       +"그는 가스 설정을 <b>입력</b>, 흡기온도를 그 <b>결과</b>로 보고, 원두가 실제로 겪는 것을 "
       +"더 곧게 비추므로 「가스 설정보다 더 관련 있다」고 한다. 큰 기계 중에는 가스가 아니라 "
       +"미리 짜 둔 흡기온도로 관리하는 것도 있다고 덧붙인다. "
       +"IKAWA 프로파일이 바로 이 방식이다 — 우리는 화력이 아니라 <b>공기 온도 곡선</b>을 짠다",
  cool:"Baggenstoss 2008 (ETH Diss 17696) §6 — 「공랭은 여러 분에 걸쳐 많은 찬 공기를 쓰므로 비교적 느리다. "
       +"따라서 냉각 첫 15초 동안 콩 안의 발열 반응이 계속될 수 있다」. "
       +"같은 실험에서 45분간 천천히 식힌 커피는 배전도가 더 깊게 나왔다. "
       +"물 담금질은 훨씬 빠르지만 수분이 올라 보관 안정성을 해친다(§10.4-4). "
       +"**60초 강하 ℃ 기준은 문헌에 없다 — IKAWA 50g 기준으로 이 앱이 잡은 어림이고, "
       +"쓰임은 절대 판정이 아니라 같은 원두 배치끼리의 비교다**",
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
/* ── 판정 규칙이 바뀐 내력 ──────────────────────────
   이 앱은 기록을 저장할 때 판정 결과를 굳혀 두지 않는다. 볼 때마다 <b>그때의 규칙</b>으로
   다시 판정한다. 이론이 좋아지면 옛 배치도 같이 좋아진다는 뜻이라 대체로 이득이지만,
   대가가 있다 — <b>지난주에 「밴드 밖」이던 배치가 오늘 「밴드 안」이 될 수 있다.</b>
   그걸 모르면 자기 로스팅이 달라진 줄 안다.

   그래서 기록에 저장 당시 판본을 남기고(rec.v), 그 뒤에 <b>판정에 영향을 준</b> 변경만
   여기 적어 둔다. 화면 문구나 버그 수정은 넣지 않는다 — 숫자가 달라지는 것만. */
const VLOG = {
  "8.6":["컵 평가에서 <b>산미·단맛의 강도</b>를 따로 받기 시작했습니다. "
        +"그전에는 정동 점수(얼마나 좋은가)를 강도(얼마나 센가)로 잘못 읽어 "
        +"배출점을 반대로 밀 수 있었습니다. 지금은 강도가 없으면 배출점을 건드리지 않습니다"],
  "8.7":["<b>감량률 밴드가 생두 수분을 따라 움직입니다</b> (수분 1%p 당 0.85%p, "
        +"Baggenstoss 2008 표 5.1). 수분이 높은 생두는 예전 밴드로는 "
        +"「예상보다 깊다」고 나왔을 수 있습니다",
         "생두 수분의 <b>프로파일 보정</b>이 배전도가 깊을수록 줄어듭니다 "
        +"(라이트 100% → 미디엄 다크 50%). 같은 자료에서 수분의 영향이 다크로 갈수록 "
        +"사라지는 것이 확인됐습니다"]
};
/* rec.v 이후에 바뀐 것들. 없으면 빈 배열 */
function vSince(v){
  if(!v) return [];
  const num=x=>x.split(".").map(Number);
  const cmp=(a,b)=>{ const A=num(a),B=num(b);
    return (A[0]-B[0])||((A[1]||0)-(B[1]||0)); };
  return Object.keys(VLOG).filter(k=>cmp(k,v)>0).sort(cmp).flatMap(k=>VLOG[k].map(s=>[k,s]));
}
function vNote(v){
  if(!v) return `<p class="note"><span class="pill warn">판본 없음</span> `
    +`판본을 남기기 시작한 v8.8 이전에 저장된 기록입니다. 아래 판정은 <b>지금 규칙</b>으로 다시 계산한 것이라 `
    +`저장하실 때 보셨던 것과 다를 수 있습니다.</p>`;
  const ch=vSince(v);
  if(!ch.length) return "";
  return `<div class="extra" style="margin-top:7px">
    <p class="tagline" style="margin:0 0 5px">저장한 뒤 판정 규칙이 바뀌었습니다
      <span class="pill">v${v} → v${THEORY_V}</span></p>
    <p class="note" style="margin:0 0 4px">이 기록은 <b>지금 규칙</b>으로 다시 판정한 것입니다.
    로스팅이 달라진 게 아니라 <b>보는 눈이 달라진 것</b>입니다.</p>`
    +ch.map(([k,s])=>`<p class="note" style="margin:0 0 3px">· <b>v${k}</b> — ${s}</p>`).join("")
    +`</div>`;
}
/* ── 크래시는 한 종류가 아니다 ────────────────────────
   라오 p.49. 지금까지 이 앱은 「승온율이 음수」면 다 크래시라고만 했다.
   그는 둘로 나누고 <b>고치는 방법이 서로 다르다</b>고 한다.

   · 부드러운 크래시 — 크래시로 들어가기 전에 승온율이 <b>이미 내려가고 있었다</b>.
     「중반 화력을 더 적극적으로 낮추는 것」이 그의 첫 선택.
   · 급한 크래시   — 꺾임이 <b>급격하고 거의 90도</b>이고, 로스터가 크래시 훨씬 전에
     <b>이미 아주 낮은 화력</b>을 골라 둔 경우. 「중반 화력을 낮추는 것만으로는
     못 편다」— 다른 기법(가스 딥, 11장)이 필요하다.

   우리는 열풍기라 「가스」가 「히터 %」다. 판별에 쓰는 값:
     slope  크래시 직전 승온율의 추세 (℃/분 per 분). 음수면 이미 내려오는 중
     bend   꺾임의 급격함 — 직전 추세와 지금 하강 속도의 차이
     heatLo 크래시 전에 이미 히터가 낮았는가 (머신 로그가 있을 때만) */
const CRASH = { bend:6.0, heatLo:45 };   // 꺾임 ℃/분per분 · 히터 %
function crashKind(slope, bend, heatBefore){
  const abrupt = bend >= CRASH.bend;
  const already = slope < -0.5;                       // 들어가기 전부터 내려오고 있었나
  const lowHeat = heatBefore!=null && heatBefore <= CRASH.heatLo;
  if(abrupt && (lowHeat || !already)) return "hard";
  return "soft";
}
/* 라오 p.46 — 크래시·정체의 <b>원인</b>을 곡선 모양에서 되짚는 규칙 둘.
   지금까지는 SRC 문구로만 적어 두고 판정에는 안 쓰고 있었다.
     · 승온율이 평평해지거나 오르다가 크래시  → 화력이 너무 높았다
     · 크랙 전에 꾸준히 내려가다 크랙 중 정체·평탄 → 화력이 너무 낮았다 */
function heatBlame(slope, stalled){
  if(stalled) return {k:"low",
    d:"크랙 전에는 꾸준히 내려오다 <b>크랙 중에 정체</b>했습니다. "
     +"라오는 이것을 <b>화력이 너무 낮았던</b> 신호로 읽습니다 (p.46) — "
     +"크랙에 들어갈 때 열이 모자랐다는 뜻입니다."};
  if(slope>=-0.5) return {k:"high",
    d:"크래시 직전에 승온율이 <b>평평하거나 오히려 올랐습니다</b>. "
     +"라오는 이것을 <b>화력이 너무 높았던</b> 신호로 읽습니다 (p.46) — "
     +"크랙 전에 미리 낮췄어야 할 열이 남아 있다가 한꺼번에 꺾인 것입니다."};
  return null;
}
const CRASHSAY = {
  soft:{ name:"부드러운 크래시",
    d:"크래시로 들어가기 <b>전부터 승온율이 이미 내려오고 있었습니다</b>. "
     +"라오는 이런 크래시를 「부드러운(soft) 크래시」라 부르고, "
     +"<b>중반 화력을 더 일찍·더 과감히 낮추는 것</b>을 첫 해법으로 듭니다 (p.49). "
     +"곡선을 미리 눕혀 두면 크랙에서 꺾일 일이 줄어듭니다." },
  hard:{ name:"급한 크래시",
    d:"꺾임이 <b>급격합니다</b>. 라오는 이런 것을 「급한(hard) 크래시」라 부르며 "
     +"<b>중반 화력을 낮추는 것만으로는 펴지지 않는다</b>고 합니다 (p.49). "
     +"크랙 <b>40~45초 전에 화력을 크게 낮추는 것</b>(p.46)이 이 앱에서 쓸 수 있는 대응입니다 — "
     +"그가 권하는 가스 딥은 수동 조작이라 프로파일로는 흉내내기 어렵습니다." }
};
/* ── 발달 구간의 위험은 DTR 을 따라 움직인다 ──────────────
   라오 p.49~50. 여기서 DTR 은 <b>배출 목표가 아니라 시간축</b>이다.
   그는 크랙 전에는 원두 온도로, 크랙 뒤에는 DTR 로 화력을 조절하라고 한다 —
   「크랙 뒤 원두 온도는 느리고 예측하기 어려워 나쁜 지표다. 반면 DTR 은
   크래시와 플릭을 예측하는 훌륭한 지표다」.

     0~12%  크랙의 전반부. 수분이 왈칵 나와 표면을 식힌다 → <b>크래시 위험이 높다.
            이 구간에서는 화력을 내리지 말 것.</b>
     12~16% 크랙이 잦아들며 크래시 위험이 사라지고 플릭 위험이 올라온다
            → 화력을 적극적으로 낮춘다 (12%에 절반, 14%에 또 절반, 16%에 또 절반)
     16~17% 가스 딥을 쓰지 않으면 <b>플릭은 거의 항상 여기서 난다</b> */
const DTRRISK = [
  {lo:0,  hi:12, k:"crash", t:"크래시 위험 구간",
   d:"1차 크랙 전반부입니다. 수분이 왈칵 나오며 콩 표면을 식혀 승온율이 꺾이기 쉽습니다. "
    +"라오는 <b>이 구간에서 화력을 내리지 말라</b>고 합니다 (p.50)."},
  {lo:12, hi:16, k:"flick", t:"화력을 낮출 구간",
   d:"크랙이 잦아들어 크래시 위험이 지나갔습니다. 이제부터는 <b>플릭</b>이 위험입니다 — "
    +"라오의 표준 패턴은 <b>12%에 화력 절반, 14%에 또 절반, 16%에 또 절반</b>입니다 (p.49)."},
  {lo:16, hi:100, k:"flickzone", t:"플릭이 나는 구간",
   d:"라오는 「가스 딥을 쓰지 않으면 플릭은 <b>거의 항상 16~17% DTR</b> 에서 난다」고 합니다 (p.50). "
    +"여기까지 화력을 못 낮췄다면 배출을 앞당기는 편이 낫습니다."}
];
function dtrRisk(pct){
  if(pct==null||!isFinite(pct)) return null;
  return DTRRISK.find(r=>pct>=r.lo&&pct<r.hi)||null;
}
/* ── CVA 서술 평가의 강도 눈금 ────────────────────────
   SCA Standard 103-2024 §6.2 「Rating Intensity」. 15점 척도이고
   눈금 위에 <b>LOW · MEDIUM · HIGH</b> 세 구획이 0-5-10-15 로 표시된다.

   표준이 두 번 못박는 것이 있고, 둘 다 오해하기 쉬운 대목이다.

   ① <b>「Intensity does not imply quality or desirability」</b> (§4 용어 정의)
      — 세다고 좋은 것이 아니다. 좋고 나쁨은 정동 평가(Standard 104)가 맡는다.
   ② <b>구성 요소가 아니라 그 항목 <u>전체</u>가 얼마나 센가</b> (§6.1)
      — 「초콜릿 강도」를 매기는 게 아니라 「프래그런스 전체가 얼마나 센가」다.
      표준의 예: 과일향이 강하고 초콜릿이 옅은 커피라면, 성분을 따지지 말고
      <b>향 전체의 세기</b> 하나를 매긴다. */
const CVAI = { lo:[0,5], mid:[5,10], hi:[10,15] };
function cvaBand(v){
  if(v==null||!(v>0)) return null;
  return v<5?{n:"낮음",c:""}:v<10?{n:"중간",c:""}:{n:"높음",c:""};
}
const CVANOTE = "SCA 103 §6.2 — <b>강도는 좋고 나쁨이 아닙니다</b>. "
  +"「세다」와 「좋다」는 다른 축이고, 좋고 나쁨은 위의 정동 평가가 맡습니다. "
  +"또 <b>성분이 아니라 그 항목 전체가 얼마나 센가</b>를 매깁니다 — "
  +"「초콜릿이 얼마나 센가」가 아니라 「향 전체가 얼마나 센가」입니다.";
/* §6.3.1 — CATA 목록에서는 「그 커피를 가장 잘 나타내는 <b>다섯 개까지</b>」 고른다.
   많이 고를수록 좋은 게 아니라, 고르는 행위 자체가 판단이다. */
const CATAMAX = 5;
/* ── 냉각도 로스팅의 일부다 ──────────────────────────
   Baggenstoss 2008 §6. 배출로 로스팅이 끝나지 않는다.

   · 「공랭은 여러 분에 걸쳐 많은 양의 찬 공기를 쓰므로 비교적 느리다. 따라서
     <b>냉각 첫 15초 동안 콩 안의 발열 반응이 계속될 수 있다</b>」 (Eggers 인용)
   · 같은 실험에서 45분에 걸쳐 천천히 식힌 커피는 <b>배전도가 실제로 더 깊어졌다</b>
   · 물 담금질은 230→100℃ 를 1초 안에 끝내지만 <b>수분이 올라가 보관 안정성이 나빠진다</b>.
     그의 결론 §10.4-4 는 「담금질이 수분을 올려서는 안 된다」이다.

   IKAWA 는 공랭이라 수분이 오를 일은 없다 — 그건 이 기계의 이점이다.
   대신 <b>느린 편</b>이므로 배출 온도가 같아도 냉각이 느렸던 배치는 조금 더 깊다.
   그래서 배치끼리 견줄 때 냉각 속도를 함께 봐야 한다.

   숫자 기준은 문헌에 없다. 아래 값은 <b>이 앱이 IKAWA 50g 기준으로 잡은 어림</b>이고,
   쓰임은 절대 판정이 아니라 <b>같은 원두 배치끼리의 비교</b>다. */
const COOL = { fast:60, slow:35, hot:15 };   // 60초간 강하 ℃ · 발열 지속 초
function coolSay(d60){
  if(d60==null||!isFinite(d60)) return null;
  if(d60>=COOL.fast) return {k:"fast", n:"빠름",
    d:`배출 뒤 60초에 <b>${Math.round(d60)}℃</b> 내려갔습니다. 잘 식었습니다.`};
  if(d60>=COOL.slow) return {k:"ok", n:"보통",
    d:`배출 뒤 60초에 <b>${Math.round(d60)}℃</b> 내려갔습니다. 무난합니다.`};
  return {k:"slow", n:"느림",
    d:`배출 뒤 60초에 <b>${Math.round(d60)}℃</b>밖에 안 내려갔습니다. `
     +`Baggenstoss 는 천천히 식힌 커피가 <b>배전도가 더 깊어졌다</b>고 보고합니다 — `
     +`배출 온도가 같아도 이 배치는 조금 더 깊게 나올 수 있습니다. `
     +`팬을 더 돌리거나 원두를 넓게 펴서 식히세요.`};
}
const COOLNOTE = "배출로 로스팅이 끝나지 않습니다 — <b>첫 15초 동안 콩 안의 발열 반응이 계속됩니다</b>. "
  +"다만 IKAWA 는 <b>공랭</b>이라 물 담금질처럼 수분이 올라 보관 중 향이 무너지는 일은 없습니다.";
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
  crashkind:"conv", dtrrisk:"conv", precrack:"conv", cvai:"meas",
  size:"conv", dens:"conv", moist:"conv", form:"conv", early:"conv", transfer:"conv", inlet:"mach",
  crack:"conv", flick:"conv", crash:"conv", dur:"conv", cool:"est",
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
    a:{who:"스콧 라오 (p.33, p.49~50)",
       say:"DTR 을 널리 알린 사람. <b>20~25%</b>를 권하되 「균형의 지표일 뿐」이며 "
          +"<b>배출은 색도로 판단</b>하라고 못박는다. 정작 그가 DTR 을 실제로 쓰는 곳은 따로 있다 — "
          +"<b>발달 구간에서 화력을 언제 낮출지 재는 시간축</b>이다. "
          +"「크랙 뒤 원두 온도는 나쁜 지표지만 DTR 은 크래시와 플릭을 예측하는 훌륭한 지표다」"},
    b:{who:"Rob Hoos",
       say:"책에서 <b>DTR 이라는 말을 한 번도 쓰지 않는다</b>(development time 은 46회, DTR 은 0회). "
          +"비율이 아니라 <b>절대 초</b>로 다루고, 10초 안팎의 차이는 컵에서 구별하기 어렵다고 본다"},
    mine:"라오의 20~25%를 표시하되 배출 판단에는 쓰지 않습니다. "
        +"대신 <b>그가 실제로 쓰는 용법</b>(발달 구간의 화력 시간축)은 그대로 씁니다 — "
        +"이건 Hoos 도 반대하지 않는 쓰임입니다. "
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
/* 여기까지 오는 동안 출처를 열아홉 군데 적어 뒀는데, 그중 열셋은 화면에서 닿을 길이 없었다.
   딱지(gradeTag)가 붙은 항목만 툴팁으로 보였기 때문이다. 적어만 두고 안 보여 주면
   「근거가 있다」는 말이 검증 불가능한 주장이 된다. 그래서 전부 한자리에 편다. */
const SRCNAME = {
  loss:"감량률", dtr:"DTR", dur:"총시간", rule:"승온율 규칙", phase:"구간 비율",
  drop:"배출온도", crack:"1차 크랙 추정", flick:"플릭", crash:"크래시",
  size:"알 크기", dens:"밀도", moist:"생두 수분", form:"물성 → 프로파일 공식",
  lossmoist:"감량률 × 생두 수분", early:"초반 승온율", transfer:"드럼 → 열풍 이식",
  inlet:"흡기온도 — IKAWA 프로파일의 정체", cool:"냉각 속도",
  crashkind:"크래시 두 종류", dtrrisk:"DTR 위험 지도", precrack:"크랙 직전 화력",
  cvai:"CVA 강도 눈금"
};
/* ── 이 앱이 쓴 자료의 권리 관계 ──────────────────────
   저작권은 <b>표현</b>을 보호하고 <b>사실과 아이디어</b>는 보호하지 않는다.
   그래서 「감량률은 수분에 비례한다」 같은 사실이나 「크래시는 두 종류다」 같은 착상은
   우리 말로 다시 써서 쓰면 된다. 문제가 되는 것은 문장을 그대로 옮기는 일이고,
   자료마다 조건이 다르므로 여기 적어 둔다. 상용화한다면 이 표를 먼저 보라. */
const RIGHTS = [
  {n:"SCA Standard 103 · 105 (2024~25)", by:"Specialty Coffee Association",
   lic:"표준 본문은 「SCA의 <b>동의와 출처 표시</b>가 있으면 부분·전체 재현 가능」. "
      +"CVA <b>양식</b>은 따로 「수정 없이 복제·배포 가능」이라고 적혀 있다",
   use:"규칙을 <b>우리 말로 설명</b>하고 눈금과 개수 같은 <b>사실</b>만 옮겼습니다. "
      +"양식은 <b>수정해서</b> 쓰므로(항목을 줄이고 향미를 13종으로 묶음) "
      +"「SCA 양식」이 아니라 <b>「SCA 103을 따른 것」</b>이라고 부릅니다. "
      +"<b>상용화 시 SCA에 문의를 권합니다</b> — 짧은 번역 인용이 몇 군데 있습니다"},
  {n:"Schenker 2000 · Geiger 2004 · Baggenstoss 2008", by:"ETH Zürich 박사논문",
   lic:"<b>In Copyright — Non-Commercial Use Permitted</b>. "
      +"문서 자체의 <b>비상업적</b> 이용만 허락된다",
   use:"논문 파일을 앱에 넣지 않았고 표·그림을 옮기지 않았습니다. "
      +"표 5.1 의 수치를 <b>읽어서 기울기를 직접 계산</b>했습니다 — 측정값 자체는 사실입니다. "
      +"<b>상용화해도 논문을 배포하지만 않으면 됩니다</b>"},
  {n:"Coffee Roasting: Best Practices", by:"Scott Rao",
   lic:"일반 저작권. 폴더의 PDF 는 <b>무단 스캔본</b>으로 보인다",
   use:"근거는 <b>정품 한국어판</b>에 두시는 것이 맞습니다. "
      +"앱에는 쪽 번호와 짧은 인용만 있고 본문을 옮기지 않았습니다"},
  {n:"Modulating the Flavor Profile of Coffee", by:"Rob Hoos",
   lic:"일반 저작권. 폴더의 PDF 는 <b>무단 복제본</b>으로 보인다",
   use:"<b>정품 구입을 권합니다</b>(74쪽 독립 출판물, 3만원대). "
      +"앱에는 「DTR 을 쓰지 않는다」 같은 <b>사실</b>만 들어 있습니다"},
  {n:"WCR Sensory Lexicon 2.0", by:"World Coffee Research",
   lic:"<b>All rights reserved</b>. 무료로 내려받게 하지만 재배포 허락은 적혀 있지 않다",
   use:"<b>앱에 넣지 않았습니다.</b> 향미 용어의 <b>정의문</b>이 이 자료의 핵심이고 "
      +"그걸 옮기는 것이 가장 위험합니다. 앱의 향미 낱말은 커피 업계의 "
      +"<b>일반 어휘</b>로 따로 짰습니다"},
  {n:"IKAWA Pro V2", by:"IKAWA Ltd.",
   lic:"상표. 통신 규약은 상호운용 목적의 해석",
   use:"제품명이 아니라 <b>「IKAWA Pro V2 호환」</b>처럼 가리키는 데만 씁니다. "
      +"로고를 쓰지 않고 제휴·인증을 주장하지 않습니다"}
];
function rightsAll(){
  return `<p class="note" style="margin:0 0 7px">저작권은 <b>표현</b>을 보호하고
    <b>사실과 아이디어</b>는 보호하지 않습니다. 이 앱의 숫자는 대부분 사실이라
    우리 말로 다시 쓴 것이고, 문장을 그대로 옮긴 곳은 전부 출처를 밝힌 <b>짧은 인용</b>입니다.
    그래도 자료마다 조건이 다르므로 적어 둡니다.
    <b>법률 자문은 아닙니다 — 상용화하신다면 변호사에게 이 표를 보여 주세요.</b></p>`
    +RIGHTS.map(r=>`<p class="note" style="margin:0 0 8px">
      <b>${r.n}</b> <span class="note">· ${r.by}</span><br>
      권리 — ${r.lic}<br>이 앱은 — ${r.use}</p>`).join("");
}
function srcAll(){
  const ks=Object.keys(SRC);
  return `<p class="note" style="margin:0 0 6px">이 앱이 숫자를 가져온 곳을 <b>전부</b> 적었습니다
    (${ks.length}군데). 책·논문·표준을 직접 확인한 것만 올렸고,
    <b>출처가 없는 값은 「이 앱의 추정」이라고 밝혀 두었습니다.</b></p>`
    +ks.map(k=>{
      const g=GRADE[CANONG[k]||"est"];
      return `<p class="note" style="margin:0 0 7px">
        <span class="pill ${g?g.c:""}">${g?g.n:"추정"}</span>
        <b>${SRCNAME[k]||k}</b> — ${SRC[k]}</p>`;
    }).join("");
}
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
