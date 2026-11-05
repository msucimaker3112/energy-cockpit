/* energy-cockpit: 3D-Optik der Energiefluss-Karte (style: 3d). Isometrische SVG-Zeichnungen aus den Live-Werten, ohne Bibliothek. */
(() => {
const { PAL, TH, nf } = WD;
const C=.866,S=.5;
const P=(x,y,z)=>[(x-y)*C,(x+y)*S-z];
const pts=(a)=>a.map((q)=>P(q[0],q[1],q[2]).map((n)=>n.toFixed(1)).join(',')).join(' ');
const poly=(a,style)=>`<polygon points="${pts(a)}" style="${style}"/>`;
const seg=(a,b,style)=>{const p=P(a[0],a[1],a[2]),q=P(b[0],b[1],b[2]);return `<line x1="${p[0].toFixed(1)}" y1="${p[1].toFixed(1)}" x2="${q[0].toFixed(1)}" y2="${q[1].toFixed(1)}" style="${style}"/>`;};
const grad=(id,a,b,x2=0,y2=1)=>`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0" style="stop-color:${a}"/><stop offset="1" style="stop-color:${b}"/></linearGradient>`;
const glow=(id,col,op)=>`<radialGradient id="${id}"><stop offset="0" style="stop-color:${col};stop-opacity:${op}"/><stop offset="1" style="stop-color:${col};stop-opacity:0"/></radialGradient>`;

/* Speicher: Gehäuse mit Sichtfenster */
function stack(socs,p,pre,large,label){
  const W=118,D=84,REV=30,MX=13;
  const n=socs.length,H=n===1?124:n===2?72:n===3?54:44,GAP=3,BASE=6;
  const chg=p>TH,dis=p<-TH,run=chg||dis,accent=chg?PAL.chg:PAL.bat;
  const dur=Math.max(1.2,3.4-Math.abs(p)/800).toFixed(2)+'s';
  const lampCol=run?accent:'139,151,179';
  const zT=BASE+n*H+(n-1)*GAP,CAPH=5;
  let body='';
  let defs=grad(pre+'hl','var(--hl0)','var(--hl1)')+grad(pre+'hr','var(--hr0)','var(--hr1)')+grad(pre+'ht','var(--ht0)','var(--ht1)',1,1)+glow(pre+'sh','var(--shadow)',1)+glow(pre+'gl',`rgb(${accent})`,.42);
  const ctr=P(W/2,D/2,0);
  body+=`<ellipse cx="${ctr[0]+6}" cy="${ctr[1]+7}" rx="122" ry="68" fill="url(#${pre}sh)"/>`;
  if(run)body+=`<ellipse cx="${ctr[0]}" cy="${ctr[1]+3}" rx="124" ry="70" fill="url(#${pre}gl)"/>`;
  // Füße
  [[8,D-8],[W-8,D-8],[W-8,8]].forEach((f)=>{body+=poly([[f[0]-5,f[1]+4,0],[f[0]+5,f[1]+4,0],[f[0]+5,f[1]+4,BASE],[f[0]-5,f[1]+4,BASE]],'fill:var(--slot)');});

  socs.forEach((soc,k)=>{
    const z0=BASE+k*(H+GAP),z1=z0+H,wz0=z0+(n>=3?7:9),wz1=z1-(n>=3?7:9),wH=wz1-wz0;
    const lvl=soc>0?Math.max(1.5,wH*soc/100):0,top=wz0+lvl,col=soc<20?PAL.imp:soc<40?PAL.pv:accent;
    const x0=MX,x1=W-MX,yB=D-REV;
    // Gehäuse
    body+=poly([[0,D,z0],[W,D,z0],[W,D,z1],[0,D,z1]],`fill:url(#${pre}hl)`);
    body+=poly([[W,D,z0],[W,0,z0],[W,0,z1],[W,D,z1]],`fill:url(#${pre}hr)`);
    if(k<n-1)body+=poly([[0,0,z1],[W,0,z1],[W,D,z1],[0,D,z1]],'fill:var(--hr1)');
    // Lüftungsschlitze an der Seite
    const rows=n===1?7:n===2?4:3;
    for(let r=0;r<rows;r++){const z=z0+H*.5+(r-(rows-1)/2)*(n===1?8:7);body+=poly([[W,D-26,z-1.5],[W,D-66,z-1.5],[W,D-66,z+1.5],[W,D-26,z+1.5]],'fill:var(--slot);fill-opacity:.75');}
    // Statusleiste an der Seite
    body+=`<g class="${run?'d3-lamp':''}">${poly([[W,D-11,z0+H*.22],[W,D-15,z0+H*.22],[W,D-15,z1-H*.22],[W,D-11,z1-H*.22]],`fill:rgb(${lampCol})`)}</g>`;
    // Sichtfenster: Innenraum
    const win=[[x0,D,wz0],[x1,D,wz0],[x1,D,wz1],[x0,D,wz1]];
    defs+=`<clipPath id="${pre}w${k}"><polygon points="${pts(win)}"/></clipPath>`;
    defs+=`<linearGradient id="${pre}f${k}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="rgb(${col})" stop-opacity=".66"/><stop offset="1" stop-color="rgb(${col})"/></linearGradient>`;
    body+=`<g clip-path="url(#${pre}w${k})">`+poly(win,'fill:var(--hole)');
    body+=poly([[x0,yB,wz0],[x1,yB,wz0],[x1,yB,wz1+40],[x0,yB,wz1+40]],'fill:var(--wall)');
    body+=poly([[x0,D,wz0],[x0,yB,wz0],[x0,yB,wz1+40],[x0,D,wz1+40]],'fill:var(--hole)');
    if(lvl>0){
      body+=poly([[x0,yB,top],[x1,yB,top],[x1,D,top],[x0,D,top]],`fill:rgb(${col});fill-opacity:.55`);
      body+=poly([[x0,D,wz0],[x1,D,wz0],[x1,D,top],[x0,D,top]],`fill:url(#${pre}f${k})`);
      body+=seg([x0,D,top],[x1,D,top],'stroke:#fff;stroke-opacity:.75;stroke-width:1.2');
      if(run&&lvl>8){
        defs+=`<clipPath id="${pre}b${k}"><polygon points="${pts([[x0,D,wz0],[x1,D,wz0],[x1,D,top],[x0,D,top]])}"/></clipPath>`;
        body+=`<g clip-path="url(#${pre}b${k})">`+[0,1,2].map((j)=>{const a=P(x0,D,wz0),b=P(x1,D,wz0);return `<line class="d3-band${dis?' rev':''}" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="#fff" stroke-width="2.2" style="--d:${(-lvl).toFixed(1)}px;--dur:${dur};--dl:${(-j/3*parseFloat(dur)).toFixed(2)}s"/>`;}).join('')+'</g>';
      }
    }
    body+='</g>';
    // Skala, Glas und Fensterrahmen
    [.25,.5,.75].forEach((f)=>{const z=wz0+wH*f;body+=seg([x0,D,z],[x0+7,D,z],'stroke:#fff;stroke-opacity:.55;stroke-width:1');});
    body+=poly([[x0+14,D,wz1],[x0+32,D,wz1],[x0+22,D,wz0],[x0+4,D,wz0]],'fill:#fff;fill-opacity:.07');
    body+=`<polygon points="${pts(win)}" style="fill:none;stroke:var(--edge);stroke-width:1.4;stroke-linejoin:round"/>`;
    if(k>0)body+=seg([0,D,z0],[W,D,z0],'stroke:var(--slot);stroke-width:1.6')+seg([W,D,z0],[W,0,z0],'stroke:var(--slot);stroke-width:1.6');
    // Fuge zum nächsten Akku
    if(k<n-1)body+=poly([[4,D-3,z1],[W-3,D-3,z1],[W-3,D-3,z1+GAP],[4,D-3,z1+GAP]],'fill:var(--slot)')+poly([[W-3,D-3,z1],[W-3,4,z1],[W-3,4,z1+GAP],[W-3,D-3,z1+GAP]],'fill:var(--slot)');
    if(large){
      const o=P(0,D,z0),fs=n>=3?17:n===2?20:22;
      body+=`<g transform="matrix(${C},${S},0,1,${o[0].toFixed(1)},${o[1].toFixed(1)})"><text x="${W/2}" y="${-(H/2)+fs*.35}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" stroke="var(--ink)" stroke-width="3.2" paint-order="stroke" style="font-family:inherit;font-variant-numeric:tabular-nums">${soc===null?'—':Math.round(soc)+' %'}</text></g>`;
    }
  });

  // Deckel
  const zC=zT+CAPH;
  body+=poly([[-1.5,D+1.5,zT],[W+1.5,D+1.5,zT],[W+1.5,D+1.5,zC],[-1.5,D+1.5,zC]],`fill:url(#${pre}hl)`);
  body+=poly([[W+1.5,D+1.5,zT],[W+1.5,-1.5,zT],[W+1.5,-1.5,zC],[W+1.5,D+1.5,zC]],`fill:url(#${pre}hr)`);
  body+=poly([[-1.5,-1.5,zC],[W+1.5,-1.5,zC],[W+1.5,D+1.5,zC],[-1.5,D+1.5,zC]],`fill:url(#${pre}ht)`);
  body+=`<polyline points="${pts([[-1.5,D+1.5,zC],[W+1.5,D+1.5,zC],[W+1.5,-1.5,zC]])}" style="fill:none;stroke:var(--edge);stroke-width:1.1"/>`;
  const circ=(r)=>Array.from({length:32},(_,i)=>{const t=i/32*Math.PI*2;return [W/2+Math.cos(t)*r,D/2+Math.sin(t)*r,zC];});
  body+=poly(circ(15),'fill:var(--slot);fill-opacity:.55');
  body+=`<g class="${run?'d3-lamp':''}">${poly(circ(15),`fill:none;stroke:rgb(${lampCol});stroke-width:2.2`)}</g>`;

  const xMin=P(-1.5,D+1.5,0)[0]-6,xMax=P(W+1.5,-1.5,0)[0]+6,yMin=P(-1.5,-1.5,zC)[1]-6,yMax=P(W,D,0)[1]+12;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

/* Solar: aufgeständerte Module, je String eines */
function solar(strs,pre,large,PEAK,label){
  const n=strs.length,PW=50,PD=74,GAP=4,RISE=40,ZF=13,TW=n*PW+(n-1)*GAP;
  const tot=strs.reduce((a,b)=>a+b,0),ratio=Math.min(1,tot/(n*PEAK));
  const zAt=(y)=>ZF+(PD-y)/PD*RISE;
  const Q=(x,y,lift=0)=>[x,y,zAt(y)+lift];
  let defs=glow(pre+'sh','var(--shadow)',1)+glow(pre+'sun','rgb(255,197,61)',.85*Math.sqrt(ratio))+glow(pre+'dsk','#fff4cf',ratio>0?1:0)+grad(pre+'alu','var(--alu0)','var(--alu1)')+
    `<linearGradient id="${pre}cell" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c3f86"/><stop offset=".55" stop-color="#0d2354"/><stop offset="1" stop-color="#091a3f"/></linearGradient>`+
    `<linearGradient id="${pre}lit" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#6fb2ff"/><stop offset="1" stop-color="#2a66d6"/></linearGradient>`;
  let body='';
  const ctr=P(TW/2,PD/2,0);
  body+=`<ellipse cx="${ctr[0]+4}" cy="${ctr[1]+8}" rx="${(TW+PD)*.68}" ry="${(TW+PD)*.34}" fill="url(#${pre}sh)"/>`;
  // Gestell
  const al='stroke:var(--alu1);stroke-width:3;stroke-linecap:round';
  const posts=n<3?[8,TW-8]:[8,TW/2,TW-8];
  body+=seg([0,8,0],[TW,8,0],al)+seg([0,PD-8,0],[TW,PD-8,0],al);
  posts.forEach((x)=>{body+=seg([x,8,0],Q(x,8,-3),al)+seg([x,PD-8,0],Q(x,PD-8,-3),al)+seg([x,PD-8,0],Q(x,8,-3),'stroke:var(--alu1);stroke-width:1.8;stroke-linecap:round;opacity:.8');});
  // Module
  strs.forEach((w,i)=>{
    const x0=i*(PW+GAP),x1=x0+PW,r=Math.min(1,w/PEAK);
    const surf=[Q(x0,0),Q(x1,0),Q(x1,PD),Q(x0,PD)];
    // Rahmen: Vorderkante und rechte Kante
    body+=poly([Q(x0,PD),Q(x1,PD),Q(x1,PD,-4),Q(x0,PD,-4)],`fill:url(#${pre}alu)`);
    body+=poly([Q(x1,PD),Q(x1,0),Q(x1,0,-4),Q(x1,PD,-4)],'fill:var(--alu1)');
    body+=poly(surf,`fill:url(#${pre}cell)`);
    body+=poly(surf,`fill:url(#${pre}lit);fill-opacity:${(.05+r*.62).toFixed(2)}`);
    // Zellen
    const cols=6,rows=10,ins=2.4;
    let lines='';
    for(let c=1;c<cols;c++){const x=x0+ins+(PW-2*ins)*c/cols;lines+=seg(Q(x,ins),Q(x,PD-ins),'stroke:#c9dcff;stroke-opacity:.32;stroke-width:.7');}
    for(let c=1;c<rows;c++){const y=ins+(PD-2*ins)*c/rows;lines+=seg(Q(x0+ins,y),Q(x1-ins,y),'stroke:#c9dcff;stroke-opacity:.32;stroke-width:.7');}
    body+=lines;
    body+=`<polygon points="${pts(surf)}" style="fill:none;stroke:var(--alu0);stroke-width:2;stroke-linejoin:round"/>`;
    if(large){
      const o=P(x0+PW/2,PD/2,zAt(PD/2)),up=[C,-(S+RISE/PD)],fs=11;
      body+=`<g transform="matrix(${C},${S},${(-up[0]).toFixed(3)},${(-up[1]).toFixed(3)},${o[0].toFixed(1)},${o[1].toFixed(1)})"><text x="0" y="${fs*.3}" text-anchor="middle" font-size="${fs}" font-weight="800" fill="#fff" stroke="#061126" stroke-width="3" paint-order="stroke" style="font-family:inherit;font-variant-numeric:tabular-nums">${nf(Math.round(w),0)} W</text></g>`;
    }
  });
  // Reflexion
  if(ratio>.02){
    const full=[Q(0,0),Q(TW,0),Q(TW,PD),Q(0,PD)];
    defs+=`<clipPath id="${pre}sc"><polygon points="${pts(full)}"/></clipPath>`;
    const dist=TW+70,dur=(8-ratio*3).toFixed(1)+'s';
    body+=`<g clip-path="url(#${pre}sc)"><polygon class="d3-sheen" points="${pts([Q(-46,0),Q(-16,0),Q(-40,PD),Q(-70,PD)])}" style="fill:#fff;fill-opacity:${(.1+ratio*.22).toFixed(2)};--dx:${(dist*C).toFixed(1)}px;--dy:${(dist*S).toFixed(1)}px;--dur:${dur}"/></g>`;
  }
  // Sonne
  const xMin=P(0,PD,0)[0]-8,xMax=P(TW,0,0)[0]+8,yMin=P(0,0,ZF+RISE)[1]-30,yMax=P(TW,PD,0)[1]+12;
  let sun='';
  if(ratio>.02)sun=`<circle cx="${xMax-22}" cy="${yMin+24}" r="46" fill="url(#${pre}sun)"/><circle cx="${xMax-22}" cy="${yMin+24}" r="${(5+ratio*5).toFixed(1)}" fill="url(#${pre}dsk)"/>`;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${sun}${body}</svg>`;
}

/* Netz: Zählerschrank mit Sichtfenster */
function meter(grid,pre,large,text,label){
  const W=84,D=46,H=118,BASE=9,CABLE=40;
  const imp=grid>TH,exp=grid<-TH,run=imp||exp,col=imp?PAL.imp:exp?PAL.exp:'139,151,179';
  const speed=Math.max(.35,1.6-Math.abs(grid)/1500).toFixed(2)+'s';
  const z1=BASE+H,zC=z1+4,o=P(0,D,BASE);
  const defs=grad(pre+'hl','var(--hl0)','var(--hl1)')+grad(pre+'hr','var(--hr0)','var(--hr1)')+grad(pre+'ht','var(--ht0)','var(--ht1)',1,1)+glow(pre+'sh','var(--shadow)',1)+glow(pre+'gl',`rgb(${col})`,.4);
  let body='';
  const ctr=P(W/2,D/2,0);
  body+=`<ellipse cx="${ctr[0]+5}" cy="${ctr[1]+6}" rx="88" ry="50" fill="url(#${pre}sh)"/>`;
  if(run)body+=`<ellipse cx="${ctr[0]}" cy="${ctr[1]+3}" rx="92" ry="54" fill="url(#${pre}gl)"/>`;
  // Hausanschluss: Kabel im Boden, die Punkte zeigen die Richtung
  const out=P(W/2,D+CABLE,0),inn=P(W/2,D+1,0);
  body+=`<line x1="${out[0].toFixed(1)}" y1="${out[1].toFixed(1)}" x2="${inn[0].toFixed(1)}" y2="${inn[1].toFixed(1)}" style="stroke:var(--slot);stroke-width:6;stroke-linecap:round"/>`;
  if(run){const a=imp?out:inn,b=imp?inn:out;body+=`<line class="d3-fl" x1="${a[0].toFixed(1)}" y1="${a[1].toFixed(1)}" x2="${b[0].toFixed(1)}" y2="${b[1].toFixed(1)}" stroke="rgb(${col})" style="animation-duration:${speed}"/>`;}
  // Sockel
  body+=poly([[-3,D+3,0],[W+3,D+3,0],[W+3,D+3,BASE],[-3,D+3,BASE]],'fill:var(--hr0)');
  body+=poly([[W+3,D+3,0],[W+3,-3,0],[W+3,-3,BASE],[W+3,D+3,BASE]],'fill:var(--hr1)');
  body+=poly([[-3,-3,BASE],[W+3,-3,BASE],[W+3,D+3,BASE],[-3,D+3,BASE]],'fill:var(--ht1)');
  // Gehäuse
  body+=poly([[0,D,BASE],[W,D,BASE],[W,D,z1],[0,D,z1]],`fill:url(#${pre}hl)`);
  body+=poly([[W,D,BASE],[W,0,BASE],[W,0,z1],[W,D,z1]],`fill:url(#${pre}hr)`);
  for(let r=0;r<3;r++){const z=z1-16-r*6;body+=poly([[W,D-10,z-1.2],[W,D-36,z-1.2],[W,D-36,z+1.2],[W,D-10,z+1.2]],'fill:var(--slot);fill-opacity:.75');}
  // Dach
  body+=poly([[-2,D+3,z1],[W+3,D+3,z1],[W+3,D+3,zC],[-2,D+3,zC]],`fill:url(#${pre}hl)`);
  body+=poly([[W+3,D+3,z1],[W+3,-2,z1],[W+3,-2,zC],[W+3,D+3,zC]],`fill:url(#${pre}hr)`);
  body+=poly([[-2,-2,zC],[W+3,-2,zC],[W+3,D+3,zC],[-2,D+3,zC]],`fill:url(#${pre}ht)`);
  body+=`<polyline points="${pts([[-2,D+3,zC],[W+3,D+3,zC],[W+3,-2,zC]])}" style="fill:none;stroke:var(--edge);stroke-width:1.1"/>`;
  // Tür mit Fenster und Zähler
  const y=(v)=>-H+v;
  let f=`<rect x="5" y="${y(5)}" width="${W-10}" height="${H-10}" rx="2" style="fill:none;stroke:var(--slot);stroke-width:1.2"/>`;
  f+=`<rect x="12" y="${y(12)}" width="${W-24}" height="58" rx="1.5" style="fill:var(--hole);stroke:var(--edge);stroke-width:1.2"/>`;
  f+=`<rect x="16" y="${y(16)}" width="${W-32}" height="50" rx="1.5" fill="#d6dde8"/>`;
  f+=`<rect x="19" y="${y(20)}" width="${W-38}" height="20" rx="1" fill="#0a1410"/>`;
  if(large)f+=`<text x="${W/2}" y="${y(34)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="rgb(${col})" style="font-family:inherit;font-variant-numeric:tabular-nums">${text}</text>`;
  f+=`<circle class="${run?'d3-lamp':''}" cx="24" cy="${y(52)}" r="3" fill="rgb(${col})" style="animation-duration:${speed}"/>`;
  if(large)f+=`<text x="${W-20}" y="${y(55)}" text-anchor="end" font-size="8.5" font-weight="800" fill="#334155" style="font-family:var(--font)">${imp?'+A':exp?'−A':'0'}</text>`;
  f+=`<polygon points="26,${y(12)} 40,${y(12)} 30,${y(70)} 16,${y(70)}" fill="#fff" fill-opacity=".09"/>`;
  f+=`<polygon points="${W/2},-42 ${W/2-12},-20 ${W/2+12},-20" fill="#f5c542" stroke="#1b1b1b" stroke-width="1" stroke-linejoin="round"/><polygon points="${W/2+1.5},-36 ${W/2-3.5},-28 ${W/2-.5},-28 ${W/2-1.5},-23 ${W/2+3.5},-30 ${W/2+.5},-30" fill="#1b1b1b"/>`;
  f+=`<circle cx="${W-11}" cy="-30" r="2.4" style="fill:var(--slot)"/>`;
  body+=`<g transform="matrix(${C},${S},0,1,${o[0].toFixed(1)},${o[1].toFixed(1)})">${f}</g>`;
  const xMin=P(-3,D+3,0)[0]-8,xMax=P(W+3,-3,0)[0]+8,yMin=P(-2,-2,zC)[1]-6,yMax=P(W/2,D+CABLE,0)[1]+10;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

/* Haus: Herkunfts-Ring am Boden, Fenster leuchten mit dem Verbrauch */
function house(home,src,pre,form,detail,label){
  const modern=form==='modern',W=modern?104:96,D=modern?78:76,R=92,cx=W/2,cy=D/2;
  const tot=src.pv+src.bat+src.imp,ratio=Math.min(1,home/2500);
  const lit=home>TH?Math.max(1,Math.round(ratio*5)):0;
  const defs=grad(pre+'wl','var(--wl0)','var(--wl1)')+grad(pre+'wr','var(--wr0)','var(--wr1)')+grad(pre+'rf','var(--rf0)','var(--rf1)')+grad(pre+'on','#ffe9b0','#f5b54e')+grad(pre+'off','#4f6888','#1a2533')+grad(pre+'wd','#a9744a','#6f4629')+glow(pre+'sh','var(--shadow)',1)+glow(pre+'lt','rgb(255,205,120)',.5*Math.sqrt(ratio))+`<radialGradient id="${pre}gr" cx=".38" cy=".3"><stop offset="0" stop-color="#7cab63"/><stop offset="1" stop-color="#2c5a34"/></radialGradient>`;
  const wl=`fill:url(#${pre}wl)`,wr=`fill:url(#${pre}wr)`;
  const FR=modern?'#2b3038':'#f4f1e8';
  const front=(x0,x1,z0,z1,y=D)=>[[x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1]];
  const side=(y0,y1,z0,z1,x=W)=>[[x,y0,z0],[x,y1,z0],[x,y1,z1],[x,y0,z1]];
  const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2];
  // Fenster mit Rahmen, Mittelsprosse und Fensterbank; i bestimmt, ab welchem Verbrauch es leuchtet
  const pane=(i,a)=>poly(a,`fill:url(#${pre}${i<lit?'on':'off'});stroke:${FR};stroke-width:1.5`)+(detail?seg(mid(a[0],a[1]),mid(a[3],a[2]),`stroke:${FR};stroke-width:1.1`):'')+(modern?'':seg(a[0],a[1],'stroke:#f4f1e8;stroke-width:2.6'));
  const blob=(x,y,z,r)=>{const q=P(x,y,z);return `<circle cx="${q[0].toFixed(1)}" cy="${q[1].toFixed(1)}" r="${r}" fill="url(#${pre}gr)"/>`;};
  const box=(x0,x1,y0,y1,z0,z1,t,l,r)=>poly(front(x0,x1,z0,z1,y1),l)+poly(side(y1,y0,z0,z1,x1),r)+poly([[x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1]],t);
  let body='';
  const c=P(cx,cy,0);
  const arc=(a0,a1)=>{const k=Math.max(2,Math.ceil((a1-a0)/.09));return Array.from({length:k+1},(_,i)=>{const t=a0+(a1-a0)*i/k;return [cx+Math.cos(t)*R,cy+Math.sin(t)*R,0];});};
  // Boden und Ring
  body+=`<polygon points="${pts(arc(0,Math.PI*2))}" style="fill:rgba(var(--ov),.035)"/>`;
  body+=`<polyline points="${pts(arc(0,Math.PI*2))}" style="fill:none;stroke:rgba(var(--ov),.1);stroke-width:8"/>`;
  let a=Math.PI*.75;
  [[src.pv,PAL.pv],[src.bat,PAL.bat],[src.imp,PAL.imp]].forEach(([v,col])=>{if(!tot||v<=0)return;const e=a+v/tot*Math.PI*2;body+=`<polyline points="${pts(arc(a,e))}" style="fill:none;stroke:rgb(${col});stroke-width:8"/>`;a=e;});
  body+=`<ellipse cx="${c[0]+5}" cy="${c[1]+6}" rx="80" ry="46" fill="url(#${pre}sh)"/>`;
  if(lit)body+=`<ellipse cx="${c[0]}" cy="${c[1]+4}" rx="88" ry="50" fill="url(#${pre}lt)"/>`;
  // Baum hinter dem Haus, Weg zur Tür
  if(detail){
    const t0=P(-6,D-14,0),t1=P(-6,D-14,62);
    body+=`<line x1="${t0[0].toFixed(1)}" y1="${t0[1].toFixed(1)}" x2="${t1[0].toFixed(1)}" y2="${t1[1].toFixed(1)}" stroke="#5a4030" stroke-width="4"/>`;
    body+=blob(-6,D-14,62,17)+blob(-16,D-8,76,13)+blob(2,D-20,80,14);
    const dx0=modern?76:66,dx1=modern?96:86;
    body+=poly([[dx0,D,0],[dx1,D,0],[dx1,D+36,0],[dx0,D+36,0]],'fill:var(--path)');
  }
  let top;
  if(modern){
    const H1=42,LIP=3,xU=70,yU=58,H2=H1+LIP+33;
    // Sockel und Erdgeschoss
    body+=poly(front(0,W,0,3),'fill:var(--plinth)')+poly(side(D,0,0,3),'fill:var(--plinth)');
    body+=poly(front(0,W,3,H1),wl)+poly(side(D,0,3,H1),wr);
    body+=pane(0,front(7,37,6,37))+pane(1,front(42,70,6,37));
    body+=poly(front(79,96,3,35),`fill:url(#${pre}wd);stroke:${FR};stroke-width:1.3`);
    body+=pane(2,side(68,38,14,36));
    body+=poly(side(30,10,14,36),'fill:#000;fill-opacity:.1');
    // Dachterrasse mit Attika
    body+=box(-1,W+1,-1,D+1,H1,H1+LIP,'fill:var(--terrace)','fill:var(--wl0)','fill:var(--wr1)');
    // Obergeschoss mit Holzverkleidung
    body+=poly(front(6,xU,H1+LIP,H2,yU),wl);
    body+=poly(side(yU,6,H1+LIP,H2,xU),`fill:url(#${pre}wd)`);
    if(detail)for(let y=10;y<yU;y+=7)body+=seg([xU,y,H1+LIP],[xU,y,H2],'stroke:#000;stroke-opacity:.22;stroke-width:.8');
    body+=pane(3,front(13,62,H1+LIP+4,H2-4,yU))+pane(4,side(50,24,H1+LIP+7,H2-6,xU));
    body+=box(4,xU+2,4,yU+2,H2,H2+3,'fill:var(--wr0)','fill:var(--wl0)','fill:var(--wr1)');
    // Glasgeländer
    if(detail){
      body+=poly(front(1,W-1,H1+LIP,H1+LIP+10,D-1),'fill:#cfe6ff;fill-opacity:.18;stroke:#e8f2ff;stroke-opacity:.7;stroke-width:.8');
      body+=poly(side(D-1,1,H1+LIP,H1+LIP+10,W-1),'fill:#cfe6ff;fill-opacity:.1;stroke:#e8f2ff;stroke-opacity:.7;stroke-width:.8');
    }
    top=P(4,4,H2+3)[1];
  }else{
    const H=44,RF=34,OV=6,PL=5,zE=H-OV*RF/(D/2),zR=H+RF;
    const zS=(y)=>zR-(y-D/2)/(D/2)*RF;
    // Rückseite des Dachs, Sockel und Wände
    body+=poly([[-OV,-OV,zE],[W+OV,-OV,zE],[W+OV,D/2,zR],[-OV,D/2,zR]],'fill:var(--rf1)');
    body+=poly(front(0,W,0,PL),'fill:var(--plinth)')+poly(side(D,0,0,PL),'fill:var(--plinth)');
    body+=poly(front(0,W,PL,H),wl);
    body+=poly([[W,D,PL],[W,0,PL],[W,0,H],[W,D/2,zR],[W,D,H]],wr);
    // Schatten unter dem Dachüberstand
    body+=poly(front(0,W,H-5,H),'fill:#000;fill-opacity:.2');
    body+=poly([[W,D,H],[W,D/2,zR],[W,0,H],[W,0,H-6],[W,D/2,zR-6],[W,D,H-6]],'fill:#000;fill-opacity:.22');
    // Fenster und Tür
    body+=pane(0,front(9,29,16,36))+pane(1,front(35,55,16,36));
    body+=pane(2,side(66,46,16,36))+pane(3,side(30,10,16,36));
    body+=pane(4,side(D/2+7,D/2-7,H+2,H+18));
    body+=poly(front(66,86,PL,37),'fill:#f4f1e8');
    body+=poly(front(68,84,PL,35),`fill:url(#${pre}wd)`);
    const hd=P(81,D,20);body+=`<circle cx="${hd[0].toFixed(1)}" cy="${hd[1].toFixed(1)}" r="1.1" fill="#e8d9a8"/>`;
    // Stufe und Vordach
    body+=box(62,90,D,D+9,0,PL,'fill:var(--step)','fill:var(--plinth)','fill:var(--plinth)');
    body+=poly([[63,D,40],[89,D,40],[89,D+8,40],[63,D+8,40]],'fill:var(--wr0)')+poly(front(63,89,38.5,40,D+8),'fill:var(--wl1)')+poly(side(D+8,D,38.5,40,89),'fill:var(--wr1)');
    // Ortgang, Traufe und Dachfläche
    const FB='#efece3';
    body+=poly([[W+OV,-OV,zE],[W+OV,D/2,zR],[W+OV,D/2,zR-3],[W+OV,-OV,zE-3]],`fill:${FB}`);
    body+=poly([[W+OV,D+OV,zE],[W+OV,D/2,zR],[W+OV,D/2,zR-3],[W+OV,D+OV,zE-3]],`fill:${FB}`);
    body+=poly(front(-OV,W+OV,zE-3,zE,D+OV),`fill:${FB}`);
    body+=poly([[-OV,D+OV,zE],[W+OV,D+OV,zE],[W+OV,D/2,zR],[-OV,D/2,zR]],`fill:url(#${pre}rf)`);
    if(detail)for(let i=1;i<9;i++){const t=i/9,y=D+OV-(D/2+OV)*t,z=zE+(zR-zE)*t;body+=seg([-OV,y,z],[W+OV,y,z],'stroke:#000;stroke-opacity:.2;stroke-width:.9');}
    // Dachfenster
    const sk=[[14,D/2+28,zS(D/2+28)],[32,D/2+28,zS(D/2+28)],[32,D/2+10,zS(D/2+10)],[14,D/2+10,zS(D/2+10)]];
    body+=poly(sk,`fill:url(#${pre}off);stroke:#2b3038;stroke-width:1.6`);
    // First
    body+=poly(front(-OV,W+OV,zR-1,zR+1.5,D/2+2),'fill:var(--rf1)');
    // Schornstein: steht auf der vorderen Dachfläche, sein Fuß folgt der Neigung
    const xa=64,xb=75,ya=D/2+5,yb=D/2+15,zt=zR+13;
    body+=poly([[xa,yb,zS(yb)],[xb,yb,zS(yb)],[xb,yb,zt],[xa,yb,zt]],'fill:#a0553f');
    body+=poly([[xb,yb,zS(yb)],[xb,ya,zS(ya)],[xb,ya,zt],[xb,yb,zt]],'fill:#6b3527');
    if(detail)[.25,.5,.75].forEach((f)=>{const z=zS(yb)+(zt-zS(yb))*f;body+=seg([xa,yb,z],[xb,yb,z],'stroke:#000;stroke-opacity:.18;stroke-width:.7');});
    body+=box(xa-1.5,xb+1.5,ya-1.5,yb+1.5,zt,zt+2.5,'fill:#3a3f49','fill:#59606c','fill:#3f4550');
    top=P(xa,ya,zt+3)[1];
  }
  // Büsche vor dem Haus
  if(detail){body+=blob(8,D+9,7,9)+blob(22,D+11,6,8)+blob(W+9,20,7,9)+blob(W+10,36,6,7);}
  const xMin=c[0]-R*1.23-6,xMax=c[0]+R*1.23+6,yMin=Math.min(top,c[1]-R*.71,detail?P(2,D-20,80)[1]-14:0)-6,yMax=c[1]+R*.71+8;
  return `<svg viewBox="${xMin.toFixed(1)} ${yMin.toFixed(1)} ${(xMax-xMin).toFixed(1)} ${(yMax-yMin).toFixed(1)}" role="img" aria-label="${WD.esc(label)}"><defs>${defs}</defs>${body}</svg>`;
}

const css = '.s3d{--hl0:#46536b;--hl1:#262f42;--hr0:#2a3448;--hr1:#161d2b;--ht0:#5a6880;--ht1:#3c485e;--edge:rgba(255,255,255,.34);--slot:#080c14;--hole:#05080f;--wall:#111827;--alu0:#aeb9ca;--alu1:#5c6a80;--ink:#06101f;--shadow:rgba(0,0,0,.6);--rf0:#8a4a3c;--rf1:#54291f;--wl0:#d9d5ca;--wl1:#b4b0a5;--wr0:#8d8a81;--wr1:#6f6c64;--plinth:#4a4d55;--path:rgba(255,255,255,.14);--terrace:#6a6e76;--step:#7c8089}\n:host([data-theme="hell"]) .s3d,:host([data-theme="warm"]) .s3d{--hl0:#fbfcfe;--hl1:#d4dbe6;--hr0:#c2ccd9;--hr1:#9aa6b8;--ht0:#ffffff;--ht1:#e8ecf3;--edge:rgba(255,255,255,.9);--slot:#5d6a7e;--hole:#1a2233;--wall:#2a3448;--alu0:#c9d2de;--alu1:#7d8a9e;--shadow:rgba(15,23,42,.3);--rf0:#a8574a;--rf1:#7c3d33;--wl0:#fffdf7;--wl1:#e4dfd3;--wr0:#bdb8ac;--wr1:#a09b8f;--plinth:#737780;--path:rgba(15,23,42,.14);--terrace:#a7abb3;--step:#b8bcc4}\n.s3d .node{display:grid;grid-template-columns:minmax(0,132px) minmax(0,1fr);column-gap:14px;align-content:center}\n.s3d .node>*{grid-column:2}\n.s3d .node>.o3d{grid-column:1;grid-row:1 / span 7;align-self:center;min-width:0}\n.s3d .o3d svg{display:block;width:100%;height:auto;overflow:visible}\n.s3d .node .ico,.s3d .soc{display:none}\n.s3d .tag{justify-self:start}\n.s3d .soc-row{gap:6px}\n.s3d .soc-row b{white-space:nowrap}\n.s3d.cmp .node{grid-template-columns:52px minmax(0,1fr);column-gap:9px}\n.s3d.cmp .node>*{grid-column:2}\n.s3d.cmp .node>.o3d{grid-column:1;grid-row:1 / span 7}\n.s3d.cmp .node>.o3d svg{height:auto;margin-bottom:0}\n.s3d .node.d3tall{grid-template-columns:minmax(0,1fr)}\n.s3d .node.d3tall>*,.s3d .node.d3tall>.o3d{grid-column:1;grid-row:auto}\n.s3d .node.d3tall>.o3d svg{height:112px;margin-bottom:6px}\n.s3d.cmp .node.d3tall>.o3d svg{height:60px;margin-bottom:4px}\n.s3d .hub{display:flex;flex-direction:column;max-width:340px}\n.wide.s3d .hub{max-width:460px}\n.wide.s3d .layout{row-gap:72px}\n.s3d .hub:before,.s3d .hub>svg{display:none}\n.s3d .hub .o3d svg{position:static;transform:none;height:auto}\n.s3d.cmp .hub{max-width:240px}\n.s3d .core{position:static;order:-1;background:none;border:0;box-shadow:none;animation:none;padding:0;margin-bottom:2px}\n.s3d .core ha-icon{display:none}\n.s3d .hub-wrap .mix{order:-1;margin:0 0 6px}\n.s3d .link[data-l^="r:"]:not(.on){display:none}\n.d3-band{animation:d3rise var(--dur) linear infinite;animation-delay:var(--dl)}\n@keyframes d3rise{0%{transform:translateY(0);opacity:0}12%{opacity:.75}88%{opacity:.75}100%{transform:translateY(var(--d));opacity:0}}\n.d3-band.rev{animation-direction:reverse}\n.d3-lamp{animation:d3lamp 2.2s ease-in-out infinite}\n@keyframes d3lamp{50%{opacity:.4}}\n.d3-sheen{animation:d3sheen var(--dur) ease-in-out infinite}\n@keyframes d3sheen{from{transform:translate(0,0)}to{transform:translate(var(--dx),var(--dy))}}\n.d3-fl{fill:none;stroke-width:2.2;stroke-linecap:round;stroke-dasharray:1.5 11;animation:d3flow 1.1s linear infinite}\n@keyframes d3flow{to{stroke-dashoffset:-12.5}}\n@media (prefers-reduced-motion:reduce){.wrap:not(.anim-on) .d3-band,.wrap:not(.anim-on) .d3-lamp,.wrap:not(.anim-on) .d3-sheen,.wrap:not(.anim-on) .d3-fl{animation:none}.wrap:not(.anim-on) .d3-band,.wrap:not(.anim-on) .d3-sheen{opacity:0}}';
// Überträgt nur die Unterschiede in das vorhandene SVG, damit laufende Animationen nicht neu starten
const tpl = document.createElement('template');
const patch = (a, b) => {
  for (const n of [...a.attributes]) if (!b.hasAttribute(n.name)) a.removeAttribute(n.name);
  for (const n of [...b.attributes]) if (a.getAttribute(n.name) !== n.value) a.setAttribute(n.name, n.value);
  const ca = a.children, cb = [...b.children];
  if (!cb.length && !ca.length) { if (a.textContent !== b.textContent) a.textContent = b.textContent; return; }
  if (ca.length !== cb.length || cb.some((n, i) => n.tagName !== ca[i].tagName)) { a.replaceChildren(...cb); return; }
  cb.forEach((n, i) => patch(ca[i], n));
};
const draw = (el, html) => {
  tpl.innerHTML = html;
  const n = tpl.content.firstElementChild, o = el.firstElementChild;
  if (o && o.tagName === n.tagName) patch(o, n); else el.replaceChildren(n);
};
// Maße des Rings aus house() (R = 92): für den Anschluss der Linien in der Karte
const ring = { w: 2 * (92 * 1.23 + 6), bottom: 92 * 0.71 + 8, rx: 92 * Math.SQRT2 * C, ry: 92 * Math.SQRT2 * S };
WD.D3 = { stack, solar, meter, house, css, draw, ring };
})();
