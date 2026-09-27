// Actividades interactivas (JavaScript sin framework). Se montan desde components/Widget.tsx.
import * as THREE from 'three';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(n,d)=>{if(d===undefined)d=2;const r=Math.round(n*Math.pow(10,d))/Math.pow(10,d);return r.toLocaleString('es-CO',{maximumFractionDigits:d})};
const num=v=>parseFloat(String(v).replace(/\s/g,'').replace(',','.'));
const shuffle=a=>a.map(x=>[Math.random(),x]).sort((p,q)=>p[0]-q[0]).map(p=>p[1]);
const reduce=window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- element data (Z 1-36) ---------- */
// sym, name, category, EN, radius pm, mass, css color, 3D radius
const RAW=[
['H','Hidrógeno','nm',2.20,53,1,'#E6ECF1',.25],['He','Helio','ng',null,31,4,'#D9FFFF',.3],
['Li','Litio','am',.98,167,6.9,'#CC80FF',.5],['Be','Berilio','at',1.57,112,9,'#C2FF00',.45],['B','Boro','mt',2.04,87,10.8,'#FFB5B5',.42],['C','Carbono','nm',2.55,67,12,'#6B737B',.4],['N','Nitrógeno','nm',3.04,56,14,'#3B6FE0',.4],['O','Oxígeno','nm',3.44,48,16,'#E0433B',.4],['F','Flúor','ha',3.98,42,19,'#7ED957',.38],['Ne','Neón','ng',null,38,20.2,'#B3E3F5',.38],
['Na','Sodio','am',.93,190,23,'#AB5CF2',.55],['Mg','Magnesio','at',1.31,145,24.3,'#8AFF00',.5],['Al','Aluminio','mp',1.61,118,27,'#BFA6A6',.5],['Si','Silicio','mt',1.90,111,28.1,'#F0C8A0',.48],['P','Fósforo','nm',2.19,98,31,'#FF8000',.46],['S','Azufre','nm',2.58,88,32,'#E8D23A',.46],['Cl','Cloro','ha',3.16,79,35.5,'#3CCB5A',.46],['Ar','Argón','ng',null,71,39.9,'#80D1E3',.45],
['K','Potasio','am',.82,243,39.1,'#8F40D4',.6],['Ca','Calcio','at',1.00,194,40.1,'#3DFF00',.58],['Sc','Escandio','tr',1.36,184,45,'#E6E6E6',.5],['Ti','Titanio','tr',1.54,176,47.9,'#BFC2C7',.5],['V','Vanadio','tr',1.63,171,50.9,'#A6A6AB',.5],['Cr','Cromo','tr',1.66,166,52,'#8A99C7',.5],['Mn','Manganeso','tr',1.55,161,54.9,'#9C7AC7',.5],['Fe','Hierro','tr',1.83,156,55.8,'#E06633',.5],['Co','Cobalto','tr',1.88,152,58.9,'#F090A0',.5],['Ni','Níquel','tr',1.91,149,58.7,'#50D050',.5],['Cu','Cobre','tr',1.90,145,63.5,'#C88033',.5],['Zn','Zinc','tr',1.65,142,65.4,'#7D80B0',.5],
['Ga','Galio','mp',1.81,136,69.7,'#C28F8F',.5],['Ge','Germanio','mt',2.01,125,72.6,'#668F8F',.5],['As','Arsénico','mt',2.18,114,74.9,'#BD80E3',.5],['Se','Selenio','nm',2.55,103,79,'#FFA100',.5],['Br','Bromo','ha',2.96,94,79.9,'#A62929',.5],['Kr','Kriptón','ng',3.00,88,83.8,'#5CB8D1',.5]
];
const CAT={nm:['No metal','#5AA469'],ng:['Gas noble','#4F8FD0'],am:['Metal alcalino','#D0564F'],at:['Alcalinotérreo','#D98B3A'],mt:['Metaloide','#8E7CC3'],mp:['Otro metal','#7F8C99'],ha:['Halógeno','#2EA3A0'],tr:['Metal de transición','#C0A03A']};
const EL={};const ELZ=[null];
RAW.forEach((r,i)=>{const e={z:i+1,sym:r[0],name:r[1],cat:r[2],en:r[3],rad:r[4],m:r[5],css:r[6],hex:parseInt(r[6].slice(1),16),r3:r[7]};EL[r[0]]=e;ELZ.push(e)});
const PT=z=>{if(z===1)return[1,1];if(z===2)return[1,18];if(z<=4)return[2,z-2];if(z<=10)return[2,z+8];if(z<=12)return[3,z-10];if(z<=18)return[3,z];if(z<=36)return[4,z-18];};
const GROUP=z=>PT(z)[1];

/* ---------- formulas ---------- */
function parseF(f){const st=[{}];const s=f.replace(/\s/g,'');
  // manual tokenizer
  let i=0;while(i<s.length){const c=s[i];
    if(c==='('){st.push({});i++;continue}
    if(c===')'){i++;let d='';while(i<s.length&&/\d/.test(s[i]))d+=s[i++];const k=+d||1;const top=st.pop();Object.keys(top).forEach(e=>st[st.length-1][e]=(st[st.length-1][e]||0)+top[e]*k);continue}
    if(/[A-Z]/.test(c)){let e=c;i++;if(i<s.length&&/[a-z]/.test(s[i]))e+=s[i++];let d='';while(i<s.length&&/\d/.test(s[i]))d+=s[i++];st[st.length-1][e]=(st[st.length-1][e]||0)+(+d||1);continue}
    i++}
  return st[0]}
const fH=f=>esc(f).replace(/(\d+)/g,'<sub>$1</sub>');
const molarOf=f=>{const c=parseF(f);return Object.keys(c).reduce((s,e)=>s+(EL[e]?EL[e].m:0)*c[e],0)};

/* ---------- molecule library ---------- */
const t=1.09/Math.sqrt(3),rt=Math.PI/180;
const ring=(n,r,o)=>Array.from({length:n},(_,k)=>{const a=o+k*2*Math.PI/n;return[Math.cos(a)*r,Math.sin(a)*r,0]});
const bC=ring(6,1.39,Math.PI/6),bH=ring(6,2.48,Math.PI/6);
const nacl={a:[],b:[]};(function(){const d=2.2,ix={};for(let x=-1;x<=1;x++)for(let y=-1;y<=1;y++)for(let z=-1;z<=1;z++){ix[x+','+y+','+z]=nacl.a.length;nacl.a.push([((x+y+z)&1)?'Na':'Cl',x*d,y*d,z*d])}
  Object.keys(ix).forEach(k=>{const [x,y,z]=k.split(',').map(Number);[[1,0,0],[0,1,0],[0,0,1]].forEach(([a,b,c])=>{const j=ix[(x+a)+','+(y+b)+','+(z+c)];if(j!==undefined)nacl.b.push([ix[k],j,0])})})})();
const M={
 H2:{n:'Hidrógeno',f:'H2',g:'Lineal',ang:'180°',pol:'Apolar',a:[['H',-.37,0,0],['H',.37,0,0]],b:[[0,1,1]],lp:[]},
 O2:{n:'Oxígeno',f:'O2',g:'Lineal',ang:'180°',pol:'Apolar',a:[['O',-.6,0,0],['O',.6,0,0]],b:[[0,1,2]],lp:[[0,-.5,.87,0],[0,-.5,-.87,0],[1,.5,.87,0],[1,.5,-.87,0]]},
 N2:{n:'Nitrógeno',f:'N2',g:'Lineal',ang:'180°',pol:'Apolar',a:[['N',-.55,0,0],['N',.55,0,0]],b:[[0,1,3]],lp:[[0,-1,0,0],[1,1,0,0]]},
 HCl:{n:'Cloruro de hidrógeno',f:'HCl',g:'Lineal',ang:'180°',pol:'Polar',a:[['H',1.27,0,0],['Cl',0,0,0]],b:[[0,1,1]],lp:[[1,-.33,.94,0],[1,-.33,-.47,.82],[1,-.33,-.47,-.82]]},
 H2O:{n:'Agua',f:'H2O',g:'Angular',ang:'104,5°',pol:'Polar',a:[['O',0,0,0],['H',.757,-.586,0],['H',-.757,-.586,0]],b:[[0,1,1],[0,2,1]],lp:[[0,0,.57,.82],[0,0,.57,-.82]]},
 CO2:{n:'Dióxido de carbono',f:'CO2',g:'Lineal',ang:'180°',pol:'Apolar',a:[['C',0,0,0],['O',-1.16,0,0],['O',1.16,0,0]],b:[[0,1,2],[0,2,2]],lp:[[1,-.5,0,.87],[1,-.5,0,-.87],[2,.5,0,.87],[2,.5,0,-.87]]},
 NH3:{n:'Amoníaco',f:'NH3',g:'Piramidal trigonal',ang:'107°',pol:'Polar',a:[['N',0,0,0],['H',.94,-.38,0],['H',-.47,-.38,.814],['H',-.47,-.38,-.814]],b:[[0,1,1],[0,2,1],[0,3,1]],lp:[[0,0,1,0]]},
 BF3:{n:'Trifluoruro de boro',f:'BF3',g:'Trigonal plana',ang:'120°',pol:'Apolar',a:[['B',0,0,0]].concat([90,210,330].map(x=>['F',Math.cos(x*rt)*1.31,Math.sin(x*rt)*1.31,0])),b:[[0,1,1],[0,2,1],[0,3,1]],lp:[]},
 CH4:{n:'Metano',f:'CH4',g:'Tetraédrica',ang:'109,5°',pol:'Apolar',a:[['C',0,0,0],['H',t,t,t],['H',t,-t,-t],['H',-t,t,-t],['H',-t,-t,t]],b:[[0,1,1],[0,2,1],[0,3,1],[0,4,1]],lp:[]},
 NaCl:{n:'Cloruro de sodio',f:'NaCl',g:'Red cúbica',ang:'90°',pol:'Iónico',ionic:true,a:nacl.a,b:nacl.b,lp:[]},
 C2H6:{n:'Etano',f:'C2H6',g:'Tetraédrica (cada C)',ang:'109,5°',pol:'Apolar',a:[['C',-.77,0,0],['C',.77,0,0],['H',-1.16,1.03,0],['H',-1.16,-.51,.89],['H',-1.16,-.51,-.89],['H',1.16,-1.03,0],['H',1.16,.51,.89],['H',1.16,.51,-.89]],b:[[0,1,1],[0,2,1],[0,3,1],[0,4,1],[1,5,1],[1,6,1],[1,7,1]],lp:[]},
 C3H8:{n:'Propano',f:'C3H8',g:'Tetraédrica (cada C)',ang:'109,5°',pol:'Apolar',a:[['C',-1.27,-.3,0],['C',0,.55,0],['C',1.27,-.3,0],['H',0,1.2,.88],['H',0,1.2,-.88],['H',-2.17,.32,0],['H',-1.27,-.95,.88],['H',-1.27,-.95,-.88],['H',2.17,.32,0],['H',1.27,-.95,.88],['H',1.27,-.95,-.88]],b:[[0,1,1],[1,2,1],[1,3,1],[1,4,1],[0,5,1],[0,6,1],[0,7,1],[2,8,1],[2,9,1],[2,10,1]],lp:[]},
 C2H4:{n:'Eteno (etileno)',f:'C2H4',g:'Trigonal plana',ang:'120°',pol:'Apolar',a:[['C',-.665,0,0],['C',.665,0,0],['H',-1.23,.92,0],['H',-1.23,-.92,0],['H',1.23,.92,0],['H',1.23,-.92,0]],b:[[0,1,2],[0,2,1],[0,3,1],[1,4,1],[1,5,1]],lp:[]},
 C2H2:{n:'Etino (acetileno)',f:'C2H2',g:'Lineal',ang:'180°',pol:'Apolar',a:[['C',-.6,0,0],['C',.6,0,0],['H',-1.66,0,0],['H',1.66,0,0]],b:[[0,1,3],[0,2,1],[1,3,1]],lp:[]},
 C6H6:{n:'Benceno',f:'C6H6',g:'Hexagonal plana',ang:'120°',pol:'Apolar',a:bC.map(p=>['C'].concat(p)).concat(bH.map(p=>['H'].concat(p))),b:[0,1,2,3,4,5].map(i=>[i,(i+1)%6,i%2?1:2]).concat([0,1,2,3,4,5].map(i=>[i,i+6,1])),lp:[]},
 CH3OH:{n:'Metanol',f:'CH3OH',g:'Tetraédrica y angular',ang:'≈109°',pol:'Polar',a:[['C',-.71,0,0],['O',.71,0,0],['H',1.03,.9,0],['H',-1.07,-1.03,0],['H',-1.07,.51,.89],['H',-1.07,.51,-.89]],b:[[0,1,1],[1,2,1],[0,3,1],[0,4,1],[0,5,1]],lp:[[1,.35,-.55,.76],[1,.35,-.55,-.76]]},
 C2H5OH:{n:'Etanol',f:'C2H5OH',g:'Tetraédrica y angular',ang:'≈109°',pol:'Polar',a:[['C',-1.2,-.2,0],['C',.25,.35,0],['O',1.2,-.65,0],['H',2.05,-.2,0],['H',-1.9,.63,0],['H',-1.35,-.82,.89],['H',-1.35,-.82,-.89],['H',.4,.98,.89],['H',.4,.98,-.89]],b:[[0,1,1],[1,2,1],[2,3,1],[0,4,1],[0,5,1],[0,6,1],[1,7,1],[1,8,1]],lp:[[2,.2,-.6,.77],[2,.2,-.6,-.77]]},
 H2CO:{n:'Metanal (formaldehído)',f:'H2CO',g:'Trigonal plana',ang:'120°',pol:'Polar',a:[['C',0,0,0],['O',1.21,0,0],['H',-.55,.94,0],['H',-.55,-.94,0]],b:[[0,1,2],[0,2,1],[0,3,1]],lp:[[1,.5,.87,0],[1,.5,-.87,0]]},
 C3H6O:{n:'Propanona (acetona)',f:'CH3COCH3',g:'Trigonal plana (C=O)',ang:'120°',pol:'Polar',a:[['C',0,.2,0],['O',0,1.42,0],['C',-1.28,-.6,0],['C',1.28,-.6,0],['H',-2.15,.05,0],['H',-1.3,-1.25,.89],['H',-1.3,-1.25,-.89],['H',2.15,.05,0],['H',1.3,-1.25,.89],['H',1.3,-1.25,-.89]],b:[[0,1,2],[0,2,1],[0,3,1],[2,4,1],[2,5,1],[2,6,1],[3,7,1],[3,8,1],[3,9,1]],lp:[[1,.87,.5,0],[1,-.87,.5,0]]},
 CH3COOH:{n:'Ácido etanoico (acético)',f:'CH3COOH',g:'Trigonal plana (COOH)',ang:'120°',pol:'Polar',a:[['C',-1.3,0,0],['C',.2,0,0],['O',.85,1.05,0],['O',.85,-1.15,0],['H',1.8,-1,0],['H',-1.66,1.02,0],['H',-1.66,-.51,.89],['H',-1.66,-.51,-.89]],b:[[0,1,1],[1,2,2],[1,3,1],[3,4,1],[0,5,1],[0,6,1],[0,7,1]],lp:[]},
 CH3NH2:{n:'Metilamina',f:'CH3NH2',g:'Piramidal (N)',ang:'≈107°',pol:'Polar',a:[['C',-.73,0,0],['N',.74,0,0],['H',1.1,.94,0],['H',1.1,-.47,.81],['H',-1.1,1.02,0],['H',-1.1,-.51,.89],['H',-1.1,-.51,-.89]],b:[[0,1,1],[1,2,1],[1,3,1],[0,4,1],[0,5,1],[0,6,1]],lp:[[1,.3,-.5,-.8]]}
};

/* ---------- ask block (numeric or options) ---------- */
function askBlock(box,asks,onAll){
  if(!asks||!asks.length){return}
  const ok={};
  box.innerHTML='<div class="mono">Responde usando el simulador</div>'+asks.map((a,i)=>a.o?
    '<div class="qcard" style="border-top:0;padding-top:0"><p><b>'+a.q+'</b></p><div class="chips" data-i="'+i+'">'+a.o.map((o,oi)=>'<button class="chip" data-o="'+oi+'">'+o+'</button>').join('')+'</div><div id="'+box.id+'f'+i+'"></div></div>':
    '<div class="cstep"><label for="'+box.id+'i'+i+'"><b>'+a.q+'</b>'+(a.help?'<small>'+a.help+'</small>':'')+'</label><div class="inp"><input id="'+box.id+'i'+i+'" inputmode="decimal" autocomplete="off"><span>'+(a.unit||'')+'</span><button class="btn" data-i="'+i+'">Comprobar</button></div><div class="fbw" id="'+box.id+'f'+i+'"></div></div>').join('');
  const fin=()=>{if(Object.keys(ok).length===asks.length)onAll()};
  box.querySelectorAll('.chips').forEach(c=>c.querySelectorAll('.chip').forEach(b=>b.onclick=()=>{const i=+c.dataset.i,a=asks[i],good=+b.dataset.o===a.a;
    c.querySelectorAll('.chip').forEach(x=>x.setAttribute('aria-pressed',x===b));
    document.getElementById(box.id+'f'+i).innerHTML='<div class="fb '+(good?'ok':'no')+'">'+(good?'Correcto. ':'Todavía no. ')+(good?(a.e||''):(a.h||'Vuelve a mirar el simulador.'))+'</div>';if(good){ok[i]=1;fin()}}));
  box.querySelectorAll('.cstep button').forEach(b=>{const i=+b.dataset.i,a=asks[i],inp=document.getElementById(box.id+'i'+i);
    const check=()=>{const v=num(inp.value),tol=a.tol!==undefined?a.tol:Math.max(.01,Math.abs(a.a)*.03);
      const f=document.getElementById(box.id+'f'+i);
      if(isNaN(v)){f.innerHTML='<div class="fb no">Escribe un número.</div>';return}
      if(Math.abs(v-a.a)<=tol){f.innerHTML='<div class="fb ok">Correcto. '+(a.e||'')+'</div>';ok[i]=1;fin()}else f.innerHTML='<div class="fb no">Todavía no. '+(a.h||'Usa el simulador para comprobarlo.')+'</div>'};
    b.onclick=check;inp.onkeydown=e=>{if(e.key==='Enter')check()}});
}
let uid=0;const nid=()=>'w'+(++uid);

/* ---------- canvas helper ---------- */
function canvasStage(parent,h){
  const st=document.createElement('div');st.className='stage';st.style.cursor='default';if(h)st.style.height=h+'px';
  const cv=document.createElement('canvas');st.appendChild(cv);parent.appendChild(st);
  const ctx=cv.getContext('2d');let W=0,H=0;
  function fit(){const r=st.getBoundingClientRect();const d=Math.min(devicePixelRatio||1,2);W=r.width;H=r.height;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0)}
  fit();window.addEventListener('resize',fit);
  return{st,ctx,get W(){return W},get H(){return H},off(){window.removeEventListener('resize',fit)}};
}
function loop(fn){let id,last=performance.now();const f=now=>{const dt=Math.min(.05,(now-last)/1000);last=now;fn(dt);id=requestAnimationFrame(f)};id=requestAnimationFrame(f);return()=>cancelAnimationFrame(id)}
function slider(id,label,min,max,step,val,unit){return '<div class="slider"><div class="top2"><label for="'+id+'">'+label+'</label><b id="'+id+'v">'+val+' '+unit+'</b></div><input type="range" id="'+id+'" min="'+min+'" max="'+max+'" step="'+step+'" value="'+val+'"></div>'}

/* ---------- 3D ---------- */
function three(stage,onDrag){
  let R;try{R=new THREE.WebGLRenderer({antialias:true,alpha:true})}catch(e){stage.insertAdjacentHTML('beforeend','<div class="nogl">Este equipo no soporta gráficos 3D.</div>');return null}
  R.setPixelRatio(Math.min(devicePixelRatio||1,2));stage.prepend(R.domElement);
  const scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(40,1,.1,200);
  scene.add(new THREE.AmbientLight(0xffffff,.5));const d1=new THREE.DirectionalLight(0xffffff,.85);d1.position.set(4,6,8);scene.add(d1);const d2=new THREE.DirectionalLight(0x88aaff,.3);d2.position.set(-6,-3,-4);scene.add(d2);
  const root=new THREE.Group();scene.add(root);
  const o={R,scene,cam,root,rot:{x:-.3,y:.5},zoom:9,auto:true,labels:[],tick:null};
  let down=null;
  stage.addEventListener('pointerdown',e=>{down=[e.clientX,e.clientY];stage.setPointerCapture(e.pointerId);o.auto=false;stage.style.cursor='grabbing';onDrag&&onDrag()});
  stage.addEventListener('pointermove',e=>{if(!down)return;o.rot.y+=(e.clientX-down[0])*.01;o.rot.x+=(e.clientY-down[1])*.01;down=[e.clientX,e.clientY]});
  const up=()=>{down=null;stage.style.cursor='grab'};stage.addEventListener('pointerup',up);stage.addEventListener('pointercancel',up);
  stage.addEventListener('wheel',e=>{e.preventDefault();o.zoom=Math.max(3,Math.min(26,o.zoom*(e.deltaY>0?1.1:.9)))},{passive:false});
  const fit=()=>{const w=stage.clientWidth,h=stage.clientHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix()};fit();window.addEventListener('resize',fit);
  const v=new THREE.Vector3();
  const stop=loop(dt=>{if(o.auto&&!reduce)o.rot.y+=.25*dt;root.rotation.set(o.rot.x,o.rot.y,0);cam.position.set(0,0,o.zoom);cam.lookAt(0,0,0);if(o.tick&&!reduce)o.tick(dt);R.render(scene,cam);
    const w=stage.clientWidth,h=stage.clientHeight;o.labels.forEach(l=>{const p=l.obj.getWorldPosition(v).project(cam);l.d.style.left=((p.x+1)/2*w)+'px';l.d.style.top=((1-p.y)/2*h)+'px';l.d.hidden=p.z>1})});
  o.clear=()=>{root.traverse(x=>{if(x.geometry)x.geometry.dispose();if(x.material)x.material.dispose()});while(root.children.length)root.remove(root.children[0]);o.labels.forEach(l=>l.d.remove());o.labels=[];o.tick=null};
  o.label=(obj,txt)=>{const d=document.createElement('div');d.className='lab';d.textContent=txt;stage.appendChild(d);o.labels.push({obj,d})};
  o.dispose=()=>{stop();window.removeEventListener('resize',fit);o.clear();R.dispose()};
  return o;
}
function buildMol(o,m,showLp){
  o.clear();const SC=1.35;const c=m.a.reduce((s,x)=>[s[0]+x[1],s[1]+x[2],s[2]+x[3]],[0,0,0]).map(v=>v/m.a.length);
  const P=m.a.map(a=>new THREE.Vector3((a[1]-c[0])*SC,(a[2]-c[1])*SC,(a[3]-c[2])*SC));
  m.a.forEach((a,i)=>{const E=EL[a[0]];let r=E.r3;if(m.ionic)r=a[0]==='Na'?.42:.72;
    const s=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),new THREE.MeshStandardMaterial({color:E.hex,roughness:.4}));s.position.copy(P[i]);o.root.add(s);
    if(m.a.length<=12)o.label(s,m.ionic?(a[0]==='Na'?'Na⁺':'Cl⁻'):a[0])});
  m.b.forEach(([i,j,k])=>{const a=P[i],b=P[j],dir=b.clone().sub(a),len=dir.length();dir.normalize();
    let pp=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,0,1));if(pp.length()<.1)pp=new THREE.Vector3().crossVectors(dir,new THREE.Vector3(0,1,0));pp.normalize();
    const n=Math.max(1,k);for(let q=0;q<n;q++){const off=pp.clone().multiplyScalar(k>1?(q-(n-1)/2)*.16:0);
      const cy=new THREE.Mesh(new THREE.CylinderGeometry(k===0?.025:.06,k===0?.025:.06,len,12),new THREE.MeshStandardMaterial({color:k===0?0x55636E:0xA9B4BE,roughness:.6}));
      cy.position.copy(a.clone().add(b).multiplyScalar(.5).add(off));cy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir);o.root.add(cy)}});
  if(showLp)m.lp.forEach(([i,x,y,z])=>{const d=new THREE.Vector3(x,y,z).normalize();const l=new THREE.Mesh(new THREE.SphereGeometry(.2,20,14),new THREE.MeshStandardMaterial({color:0x7FB2EA,transparent:true,opacity:.45,emissive:0x1A3A66}));
    l.scale.set(1,2,1);l.position.copy(P[i].clone().add(d.clone().multiplyScalar(.62)));l.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d);o.root.add(l)});
  o.zoom=Math.max(5,(Math.max(...P.map(p=>p.length()))+.8)*3.2);o.auto=true;
}

/* ================= widgets ================= */
const W={};

W.mol3d=(el,s,done)=>{
  const id=nid();const seen=new Set();let cur=s.mols[0];let lp=!!s.lp;
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="tabs" role="tablist">'+s.mols.map(k=>'<button class="tab" role="tab" data-k="'+k+'">'+fH(M[k].f)+'</button>').join('')+'</div>'+
    '<div class="split"><div class="stage" id="'+id+'"><span class="hint">Arrastra para girar · rueda o pellizco para acercar</span></div><div class="w"><h3 id="'+id+'n"></h3><dl class="facts" id="'+id+'f"></dl><div class="legend" id="'+id+'l"></div>'+
    (s.lpToggle!==false?'<label class="row" style="font-size:.9rem"><input type="checkbox" id="'+id+'lp" '+(lp?'checked':'')+'> Mostrar pares libres</label>':'')+'<p class="mono" id="'+id+'p"></p></div></div></div>';
  const st=el.querySelector('#'+id);
  const mark=()=>{seen.add(cur);el.querySelectorAll('.tab').forEach(b=>b.classList.toggle('seen',seen.has(b.dataset.k)));el.querySelector('#'+id+'p').textContent='Modelos explorados: '+seen.size+' de '+s.mols.length;if(seen.size===s.mols.length)done()};
  const o=three(st,mark);
  const show=k=>{cur=k;const m=M[k],c=parseF(m.f);el.querySelectorAll('.tab').forEach(b=>b.setAttribute('aria-selected',b.dataset.k===k));
    el.querySelector('#'+id+'n').innerHTML=m.n+' · '+fH(m.f);
    el.querySelector('#'+id+'f').innerHTML='<dt>Átomos</dt><dd>'+Object.keys(c).map(e=>c[e]+' '+EL[e].name.toLowerCase()).join(', ')+'</dd><dt>Geometría</dt><dd>'+m.g+'</dd><dt>Ángulo</dt><dd>'+m.ang+'</dd><dt>Polaridad</dt><dd>'+m.pol+'</dd><dt>Masa molar</dt><dd>'+fmt(molarOf(m.f==='CH3COCH3'?'C3H6O':m.f),1)+' g/mol</dd>';
    el.querySelector('#'+id+'l').innerHTML=Object.keys(c).map(e=>'<span><i class="dot" style="background:'+EL[e].css+'"></i>'+EL[e].name+'</span>').join('')+(m.lp.length?'<span><i class="dot" style="background:#7FB2EA"></i>Par libre</span>':'');
    if(o)buildMol(o,m,lp)};
  el.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{show(b.dataset.k);mark()});
  const lpc=el.querySelector('#'+id+'lp');if(lpc)lpc.onchange=()=>{lp=lpc.checked;show(cur)};
  show(cur);el.querySelector('#'+id+'p').textContent='Gira o cambia de molécula para explorar';
  if(!o){seen.add(cur)}
  return()=>{o&&o.dispose()};
};

W.atom=(el,s,done)=>{
  const id=nid();const A=Object.assign({p:3,n:4,e:3},s.start||{});const got=new Set();
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="split"><div class="stage" id="'+id+'"><span class="hint">Modelo de Bohr simplificado</span></div><div class="w" id="'+id+'c"></div></div><div class="w" id="'+id+'m"></div></div>';
  const st=el.querySelector('#'+id);const o=three(st);
  function shells(e){const out=[];[2,8,8,18].forEach(c=>{if(e>0){out.push(Math.min(c,e));e-=c}});return out}
  function build(){if(!o)return;o.clear();const N=A.p+A.n,Rn=.26*Math.cbrt(Math.max(N,1))+.05;let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
    const ty=[];for(let i=0;i<A.p;i++)ty.push('p');for(let i=0;i<A.n;i++)ty.push('n');const ord=ty.map(x=>[rnd(),x]).sort((a,b)=>a[0]-b[0]).map(x=>x[1]);
    ord.forEach((k,i)=>{const y=N===1?0:1-2*(i+.5)/N,rr=Math.sqrt(1-y*y),th=i*2.39996,rad=Rn*Math.cbrt((i+1)/N);const m=new THREE.Mesh(new THREE.SphereGeometry(.2,18,12),new THREE.MeshStandardMaterial({color:k==='p'?0xE0564B:0x9AA5AF,roughness:.45}));m.position.set(Math.cos(th)*rr*rad,y*rad,Math.sin(th)*rr*rad);o.root.add(m)});
    const sh=shells(A.e),els=[];sh.forEach((cnt,si)=>{const r=1.4+si*.95,g=new THREE.Group();g.rotation.set(si*.5+.3,si*.9,0);g.add(new THREE.Mesh(new THREE.TorusGeometry(r,.012,8,96),new THREE.MeshBasicMaterial({color:0x3C5570})));
      for(let k=0;k<cnt;k++){const em=new THREE.Mesh(new THREE.SphereGeometry(.11,14,10),new THREE.MeshStandardMaterial({color:0x7FB2EA,emissive:0x2A5A90}));const a0=k*2*Math.PI/cnt;em.position.set(Math.cos(a0)*r,Math.sin(a0)*r,0);g.add(em);els.push({m:em,r,a:a0,s:.9/(si+1)})}o.root.add(g)});
    o.tick=dt=>els.forEach(x=>{x.a+=x.s*dt;x.m.position.set(Math.cos(x.a)*x.r,Math.sin(x.a)*x.r,0)});o.zoom=Math.max(6,(1.4+sh.length*.95)*3.1)}
  function card(){const E=ELZ[A.p],Am=A.p+A.n,q=A.p-A.e;const sup=q===0?'':(Math.abs(q)>1?Math.abs(q):'')+(q>0?'+':'−');
    const ctl=(k,lab,col)=>'<div class="ctrl"><label><i class="dot" style="background:'+col+'"></i>'+lab+'</label><div class="stepper"><button data-k="'+k+'" data-d="-1" aria-label="Quitar '+lab+'">−</button><output>'+A[k]+'</output><button data-k="'+k+'" data-d="1" aria-label="Agregar '+lab+'">+</button></div></div>';
    el.querySelector('#'+id+'c').innerHTML='<h3>'+(E?E.name+'-'+Am+(sup?' <span style="color:var(--accent)">('+E.sym+'<sup>'+sup+'</sup>)</span>':''):'Sin protones no hay elemento')+'</h3>'+ctl('p','Protones','#E0564B')+ctl('n','Neutrones','#9AA5AF')+ctl('e','Electrones','#7FB2EA')+
      '<dl class="facts"><dt>Z (protones)</dt><dd>'+A.p+'</dd><dt>A (p + n)</dt><dd>'+Am+'</dd><dt>Carga</dt><dd>'+(q>0?'+':'')+q+(q===0?' (neutro)':q>0?' (catión)':' (anión)')+'</dd><dt>Capas</dt><dd>'+(shells(A.e).join(', ')||'—')+'</dd></dl>';
    el.querySelectorAll('#'+id+'c .stepper button').forEach(b=>b.onclick=()=>{const k=b.dataset.k;A[k]=Math.max(0,Math.min(k==='p'?20:k==='n'?24:22,A[k]+ +b.dataset.d));build();card();check()})}
  function missions(){el.querySelector('#'+id+'m').innerHTML='<span class="mono">Misiones</span>'+s.targets.map((m,i)=>'<div class="citem '+(got.has(i)?'right':'')+'"><span>'+(got.has(i)?'✓ ':'')+m.label+'</span></div>').join('')}
  function check(){s.targets.forEach((m,i)=>{if(!got.has(i)&&A.p===m.p&&A.n===m.n&&A.e===m.e)got.add(i)});missions();if(got.size===s.targets.length)done()}
  build();card();missions();
  return()=>{o&&o.dispose()};
};

W.classify=(el,s,done)=>{
  const pick={};const items=s.shuffle===false?s.items:shuffle(s.items);
  el.innerHTML='<div class="w"><p>'+s.prompt+'</p><div class="cls">'+items.map((it,i)=>'<div class="citem" data-i="'+i+'"><span>'+it[0]+'</span><div class="bins">'+s.bins.map((b,bi)=>'<button data-b="'+bi+'" aria-pressed="false">'+b+'</button>').join('')+'</div></div>').join('')+'</div><div class="row"><button class="btn" id="ck">Comprobar</button><span id="ckr" class="mono"></span></div><div id="ckf"></div></div>';
  el.querySelectorAll('.citem').forEach(r=>r.querySelectorAll('.bins button').forEach(b=>b.onclick=()=>{pick[r.dataset.i]=+b.dataset.b;r.classList.remove('right','wrong');r.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',x===b))}));
  el.querySelector('#ck').onclick=()=>{let n=0;el.querySelectorAll('.citem').forEach(r=>{const i=+r.dataset.i,ok=pick[i]===items[i][1];if(ok)n++;r.classList.toggle('right',ok);r.classList.toggle('wrong',pick[i]!==undefined&&!ok)});
    el.querySelector('#ckr').textContent=n+' de '+items.length+' correctas';
    el.querySelector('#ckf').innerHTML=n===items.length?'<div class="fb ok">¡Todo correcto! '+(s.e||'')+'</div>':'<div class="fb no">Revisa las que están en rojo o sin elegir y vuelve a comprobar.</div>';
    if(n===items.length)done()};
};

W.order=(el,s,done)=>{
  const items=shuffle(s.items.map((x,i)=>({x,i})));let seq=[];
  function render(){el.innerHTML='<div class="w"><p>'+s.prompt+'</p><div class="split"><div class="w"><span class="mono">Toca en orden</span><div class="ord">'+items.map((it,k)=>'<button data-k="'+k+'" '+(seq.includes(k)?'disabled':'')+'><b>'+(seq.includes(k)?seq.indexOf(k)+1:'·')+'</b><span>'+it.x+'</span></button>').join('')+'</div></div>'+
    '<div class="w"><span class="mono">Tu orden</span><ol style="margin:0;padding-left:1.3em;display:flex;flex-direction:column;gap:4px">'+seq.map(k=>'<li>'+items[k].x+'</li>').join('')+'</ol><div class="row"><button class="btn ghost" id="orr">Reiniciar</button></div><div id="orf"></div></div></div></div>';
    el.querySelectorAll('.ord button').forEach(b=>b.onclick=()=>{seq.push(+b.dataset.k);render();if(seq.length===items.length)check()});
    el.querySelector('#orr').onclick=()=>{seq=[];render()}}
  function check(){const wrong=seq.map((k,p)=>items[k].i===p?null:p+1).filter(x=>x);const f=el.querySelector('#orf');
    if(!wrong.length){f.innerHTML='<div class="fb ok">¡Orden correcto! '+(s.e||'')+'</div>';done()}else f.innerHTML='<div class="fb no">Hay errores en las posiciones '+wrong.join(', ')+'. Reinicia e intenta de nuevo.</div>'}
  render();
};

W.balance=(el,s,done)=>{
  const id=nid();const okSet=new Set();let ri=0,co=[];
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+(s.rx.length>1?'<div class="tabs">'+s.rx.map((r,i)=>'<button class="tab" data-i="'+i+'">'+(r.name||'Reacción '+(i+1))+'</button>').join('')+'</div>':'')+'<p class="mono" id="'+id+'x"></p><div class="bal" id="'+id+'b"></div><div class="count"><table><thead><tr><th>Elemento</th><th>Reactivos</th><th>Productos</th><th>Estado</th></tr></thead><tbody id="'+id+'t"></tbody></table></div><div id="'+id+'f"></div><div class="row"><button class="btn ghost" id="'+id+'h">Pista</button><button class="btn ghost" id="'+id+'r">Reiniciar</button></div><div id="'+id+'hh"></div></div>';
  const mini=f=>{const c=parseF(f);let d='';Object.keys(c).forEach(e=>{for(let i=0;i<c[e];i++)d+='<i class="dot" style="background:'+(EL[e]?EL[e].css:'#999')+'"></i>'});return '<span class="mini">'+d+'</span>'};
  function load(i){ri=i;const r=s.rx[i];co=r.r.concat(r.p).map(()=>1);el.querySelectorAll('.tab').forEach(b=>{b.setAttribute('aria-selected',+b.dataset.i===i);b.classList.toggle('seen',okSet.has(+b.dataset.i))});
    el.querySelector('#'+id+'x').textContent=r.ctx||'';el.querySelector('#'+id+'hh').innerHTML='';render()}
  function render(){const r=s.rx[ri],all=r.r.concat(r.p);let h='';all.forEach((f,i)=>{if(i===r.r.length)h+='<span class="sym">→</span>';else if(i>0)h+='<span class="sym">+</span>';
      h+='<div class="sp"><div class="stepper"><button data-i="'+i+'" data-d="-1" aria-label="Menos">−</button><output>'+co[i]+'</output><button data-i="'+i+'" data-d="1" aria-label="Más">+</button></div><span class="fm">'+fH(f)+'</span><div class="minis">'+mini(f).repeat(co[i])+'</div></div>'});
    el.querySelector('#'+id+'b').innerHTML=h;
    el.querySelectorAll('#'+id+'b .stepper button').forEach(b=>b.onclick=()=>{const i=+b.dataset.i;co[i]=Math.max(1,Math.min(15,co[i]+ +b.dataset.d));render()});
    const L={},Rr={},els=[];all.forEach((f,i)=>{const c=parseF(f);Object.keys(c).forEach(e=>{if(!els.includes(e))els.push(e);const sd=i<r.r.length?L:Rr;sd[e]=(sd[e]||0)+c[e]*co[i]})});
    let ok=true;el.querySelector('#'+id+'t').innerHTML=els.map(e=>{const q=L[e]===Rr[e];if(!q)ok=false;return '<tr><td><i class="dot" style="background:'+(EL[e]?EL[e].css:'#999')+'"></i> '+(EL[e]?EL[e].name:e)+'</td><td>'+L[e]+'</td><td>'+Rr[e]+'</td><td class="'+(q?'okc':'noc')+'">'+(q?'Igual':'Falta')+'</td></tr>'}).join('');
    const g=co.reduce((a,b)=>{while(b){[a,b]=[b,a%b]}return a});const f=el.querySelector('#'+id+'f');
    if(ok&&g>1)f.innerHTML='<div class="fb info">Está balanceada, pero puedes dividir todo entre '+g+'. Usa los enteros más pequeños.</div>';
    else if(ok){f.innerHTML='<div class="fb ok">¡Balanceada! Los mismos átomos antes y después: la masa se conserva.</div>';okSet.add(ri);el.querySelectorAll('.tab').forEach(b=>b.classList.toggle('seen',okSet.has(+b.dataset.i)));if(okSet.size===s.rx.length)done();else if(s.rx.length>1)f.innerHTML+='<div class="fb info" style="margin-top:6px">Sigue con la siguiente reacción ('+okSet.size+' de '+s.rx.length+').</div>'}
    else f.innerHTML=''}
  let hn=0;el.querySelector('#'+id+'h').onclick=()=>{const r=s.rx[ri];const all=r.r.concat(r.p);const hints=r.hints||['Empieza por el elemento que aparece en menos sustancias.','Deja el oxígeno y el hidrógeno para el final.','Solución: '+all.map((f,i)=>r.c[i]+' '+f).join(', ')];
    el.querySelector('#'+id+'hh').innerHTML='<div class="fb info">'+hints.slice(0,++hn).join('<br>')+'</div>';if(hn>=hints.length)hn=hints.length-1};
  el.querySelector('#'+id+'r').onclick=()=>load(ri);
  el.querySelectorAll('.tab').forEach(b=>b.onclick=()=>{hn=0;load(+b.dataset.i)});
  load(0);
};

W.calc=(el,s,done)=>{
  const id=nid();const tries=s.steps.map(()=>0);
  el.innerHTML='<div class="w"><p>'+s.prompt+'</p>'+(s.data?'<p class="mono">'+s.data+'</p>':'')+s.steps.map((st,i)=>'<div class="cstep" id="'+id+'s'+i+'" aria-disabled="'+(i>0)+'"><label for="'+id+'i'+i+'"><b>'+(i+1)+'. '+st.q+'</b><small>'+(st.help||'')+'</small></label><div class="inp"><input id="'+id+'i'+i+'" inputmode="decimal" autocomplete="off" '+(i>0?'disabled':'')+'><span>'+(st.unit||'')+'</span><button class="btn" data-i="'+i+'" '+(i>0?'disabled':'')+'>Comprobar</button></div><div class="fbw" id="'+id+'f'+i+'"></div></div>').join('')+'</div>';
  const check=i=>{const st=s.steps[i],v=num(el.querySelector('#'+id+'i'+i).value),f=el.querySelector('#'+id+'f'+i);if(isNaN(v)){f.innerHTML='<div class="fb no">Escribe un número.</div>';return}
    const tol=st.tol!==undefined?st.tol:Math.max(.01,Math.abs(st.ans)*.02);
    if(Math.abs(v-st.ans)<=tol){f.innerHTML='<div class="fb ok">Correcto. '+st.how+'</div>';const n=el.querySelector('#'+id+'s'+(i+1));if(n){n.setAttribute('aria-disabled','false');n.querySelectorAll('input,button').forEach(x=>x.disabled=false);n.querySelector('input').focus()}else done()}
    else{tries[i]++;f.innerHTML='<div class="fb no">Todavía no. '+(tries[i]>=2?'Así se hace: '+st.how:(st.help||''))+'</div>'}};
  el.querySelectorAll('.cstep button').forEach(b=>b.onclick=()=>check(+b.dataset.i));
  el.querySelectorAll('.cstep input').forEach((x,i)=>x.onkeydown=e=>{if(e.key==='Enter')check(i)});
};

W.ptable=(el,s,done)=>{
  const id=nid();let prop='cat',sel=null;const found=new Set();const tasks=s.find||[];
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="chips" id="'+id+'m"><button class="chip" data-p="cat">Familias</button><button class="chip" data-p="en">Electronegatividad</button><button class="chip" data-p="rad">Radio atómico</button></div><div class="pt"><div class="ptg" id="'+id+'g"></div></div><div class="split"><div id="'+id+'c" class="w"></div><div id="'+id+'t" class="w"></div></div></div>';
  function color(e){if(prop==='cat')return CAT[e.cat][1];const v=prop==='en'?e.en:e.rad;if(v===null)return '#56636F';const [lo,hi]=prop==='en'?[.8,4]:[30,245];const x=Math.max(0,Math.min(1,(v-lo)/(hi-lo)));
    const h=prop==='en'?(210-x*200):(200-x*170);return 'hsl('+h+',60%,'+(62-x*18)+'%)'}
  function grid(){let h='';for(let r=1;r<=4;r++)for(let c=1;c<=18;c++){const e=ELZ.find(x=>x&&PT(x.z)[0]===r&&PT(x.z)[1]===c);
      h+=e?'<button data-z="'+e.z+'" aria-pressed="'+(sel===e.z)+'" style="background:'+color(e)+';color:#0F1519" title="'+e.name+'"><small>'+e.z+'</small>'+e.sym+'</button>':'<span></span>'}
    el.querySelector('#'+id+'g').innerHTML=h;el.querySelectorAll('#'+id+'m .chip').forEach(b=>b.setAttribute('aria-pressed',b.dataset.p===prop));
    el.querySelectorAll('#'+id+'g button').forEach(b=>b.onclick=()=>{sel=+b.dataset.z;grid();card();test()})}
  function card(){const e=ELZ[sel];if(!e){el.querySelector('#'+id+'c').innerHTML='<p class="mono">Toca un elemento</p>'+(prop==='cat'?'<div class="legend">'+Object.keys(CAT).map(k=>'<span><i class="dot" style="background:'+CAT[k][1]+'"></i>'+CAT[k][0]+'</span>').join('')+'</div>':'<p style="font-size:.9rem;color:var(--muted)">'+(prop==='en'?'Más oscuro = más electronegativo. Los gases nobles casi no forman enlaces (gris).':'Más oscuro = átomo más grande.')+'</p>');return}
    const [p,g]=PT(e.z);el.querySelector('#'+id+'c').innerHTML='<h3>'+e.name+' ('+e.sym+')</h3><dl class="facts"><dt>Número atómico</dt><dd>'+e.z+'</dd><dt>Masa atómica</dt><dd>'+fmt(e.m,1)+' u</dd><dt>Periodo</dt><dd>'+p+'</dd><dt>Grupo</dt><dd>'+g+'</dd><dt>Familia</dt><dd>'+CAT[e.cat][0]+'</dd><dt>Electronegatividad</dt><dd>'+(e.en===null?'—':fmt(e.en))+'</dd><dt>Radio atómico</dt><dd>'+e.rad+' pm</dd></dl>'}
  function tlist(){if(!tasks.length)return;el.querySelector('#'+id+'t').innerHTML='<span class="mono">Retos</span>'+tasks.map((t,i)=>'<div class="citem '+(found.has(i)?'right':'')+'"><span>'+(found.has(i)?'✓ ':'')+t.q+'</span></div>').join('')}
  function test(){const e=ELZ[sel];tasks.forEach((t,i)=>{if(!found.has(i)&&[].concat(t.a).includes(e.sym))found.add(i)});tlist();if(tasks.length?found.size===tasks.length:true)done()}
  el.querySelectorAll('#'+id+'m .chip').forEach(b=>b.onclick=()=>{prop=b.dataset.p;grid();card()});
  grid();card();tlist();
};

W.config=(el,s,done)=>{
  const id=nid();let Z=s.start||8;
  const ORD=[['1s',2],['2s',2],['2p',6],['3s',2],['3p',6],['4s',2],['3d',10],['4p',6]];
  const SUP=n=>String(n).split('').map(d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join('');
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+slider(id+'z','Número atómico (Z)',1,36,1,Z,'')+'<div class="split"><div class="w"><h3 id="'+id+'n"></h3><div class="cfg" id="'+id+'c"></div><div class="boxes" id="'+id+'b"></div></div><dl class="facts" id="'+id+'f"></dl></div><div id="'+id+'a" class="w"></div></div>';
  function render(){const e=ELZ[Z];let left=Z;const parts=[];ORD.forEach(([o,c])=>{if(left>0){const k=Math.min(c,left);parts.push([o,k,c]);left-=k}});
    el.querySelector('#'+id+'zv').textContent=Z;el.querySelector('#'+id+'n').textContent=e.name+' ('+e.sym+')';
    el.querySelector('#'+id+'c').innerHTML=parts.map(p=>p[0]+'<sup>'+p[1]+'</sup>').join(' ');
    el.querySelector('#'+id+'b').innerHTML=parts.map(([o,k,c])=>{const n=c/2,cells=Array.from({length:n},()=>'');for(let i=0;i<k;i++){const j=i<n?i:i-n;cells[j]+=i<n?'↑':'↓'}return '<div class="orb"><div class="cells">'+cells.map(x=>'<span>'+x+'</span>').join('')+'</div><small>'+o+'</small></div>'}).join('');
    const nmax=Math.max(...parts.map(p=>+p[0][0]));const val=parts.filter(p=>+p[0][0]===nmax).reduce((a,p)=>a+p[1],0);
    const [per,grp]=PT(Z);
    el.querySelector('#'+id+'f').innerHTML='<dt>Electrones</dt><dd>'+Z+'</dd><dt>Nivel más externo</dt><dd>n = '+nmax+'</dd><dt>Electrones de valencia</dt><dd>'+(grp>=3&&grp<=12?'(metal de transición)':val)+'</dd><dt>Periodo</dt><dd>'+per+'</dd><dt>Grupo</dt><dd>'+grp+'</dd><dt>Último subnivel</dt><dd>'+parts[parts.length-1][0]+'</dd>'+(Z===24||Z===29?'<dt>Ojo</dt><dd>Excepción real: '+(Z===24?'4s¹ 3d⁵':'4s¹ 3d¹⁰')+'</dd>':'')}
  el.querySelector('#'+id+'z').oninput=e=>{Z=+e.target.value;render()};
  render();askBlock(el.querySelector('#'+id+'a'),s.ask,done);if(!s.ask)done();
};

/* ---- simulators ---- */
W.states=(el,s,done)=>{
  const id=nid();let T=25,place=0;const PL=[{n:'Bogotá (2.600 m)',bp:92,p:'560 mmHg'},{n:'Cartagena (nivel del mar)',bp:100,p:'760 mmHg'}];
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="chips" id="'+id+'p">'+PL.map((p,i)=>'<button class="chip" data-i="'+i+'">'+p.n+'</button>').join('')+'</div><div id="'+id+'s"></div>'+slider(id+'t','Temperatura del agua',-30,130,1,T,'°C')+'<div class="readout" id="'+id+'r"></div><div class="w" id="'+id+'a"></div></div>';
  const C=canvasStage(el.querySelector('#'+id+'s'),260);const N=42;const P=Array.from({length:N},(_,i)=>({x:Math.random(),y:Math.random(),vx:Math.random()-.5,vy:Math.random()-.5,gx:(i%7+1)/8,gy:.45+Math.floor(i/7)*.09}));
  const state=()=>T<0?'Sólido (hielo)':T<PL[place].bp?'Líquido':'Gaseoso (vapor)';
  function ro(){el.querySelector('#'+id+'tv').textContent=T+' °C';el.querySelectorAll('#'+id+'p .chip').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.i===place));
    el.querySelector('#'+id+'r').innerHTML='<div><b>'+state()+'</b><span>Estado</span></div><div><b>'+PL[place].bp+' °C</b><span>Ebullición aquí</span></div><div><b>'+PL[place].p+'</b><span>Presión atmosférica</span></div>'}
  el.querySelector('#'+id+'t').oninput=e=>{T=+e.target.value;ro()};el.querySelectorAll('#'+id+'p .chip').forEach(b=>b.onclick=()=>{place=+b.dataset.i;ro()});
  const stop=loop(dt=>{const W_=C.W,H_=C.H,ctx=C.ctx;ctx.clearRect(0,0,W_,H_);const st=T<0?0:T<PL[place].bp?1:2;const sp=.05+Math.max(0,T+30)/160*.5;
    P.forEach(p=>{if(st===0){const j=.004+(T+30)/30*.006;p.x+= (p.gx-p.x)*.2+(Math.random()-.5)*j;p.y+=(p.gy-p.y)*.2+(Math.random()-.5)*j}
      else{p.x+=p.vx*sp*dt*(st===2?2.2:1);p.y+=p.vy*sp*dt*(st===2?2.2:1)+(st===1?.02*dt:0);const top=st===1?.42:.03;
        if(p.x<.03||p.x>.97)p.vx*=-1;if(p.y<top){p.y=top;p.vy=Math.abs(p.vy)}if(p.y>.97){p.y=.97;p.vy=-Math.abs(p.vy)}p.x=Math.max(.03,Math.min(.97,p.x));if(Math.random()<.02){p.vx=Math.random()-.5;p.vy=Math.random()-.5}}
      ctx.beginPath();ctx.fillStyle=st===0?'#A9D6F5':st===1?'#4F9BE0':'#CFE3F3';ctx.arc(p.x*W_,p.y*H_,7,0,6.3);ctx.fill()});
    ctx.fillStyle='#9AA8B3';ctx.font='12px IBM Plex Sans, sans-serif';ctx.fillText('Moléculas de agua (H₂O)',10,18)});
  ro();askBlock(el.querySelector('#'+id+'a'),s.ask,done);
  return()=>{stop();C.off()};
};

W.density=(el,s,done)=>{
  const id=nid();const MAT=s.materials||[['Corcho',.24],['Madera de pino',.5],['Hielo',.92],['Plástico PET',1.38],['Aluminio',2.7],['Hierro',7.87],['Oro',19.3]];let mi=1,V=50;
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="chips" id="'+id+'m">'+MAT.map((m,i)=>'<button class="chip" data-i="'+i+'">'+m[0]+'</button>').join('')+'</div><div class="split"><div class="stage" style="cursor:default;height:260px"><svg id="'+id+'v" viewBox="0 0 300 240" width="100%" height="100%" role="img" aria-label="Recipiente con agua"></svg></div><div class="w">'+slider(id+'vol','Volumen del bloque',10,200,5,V,'cm³')+'<div class="readout" id="'+id+'r"></div></div></div><div class="w" id="'+id+'a"></div></div>';
  function render(){const [n,d]=MAT[mi],m=d*V;el.querySelector('#'+id+'volv').textContent=V+' cm³';el.querySelectorAll('#'+id+'m .chip').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.i===mi));
    const side=20+Math.cbrt(V)*9,wl=110;const floats=d<1;const sub=floats?side*d:side;const y=floats?wl-(side-sub):220-side;
    el.querySelector('#'+id+'v').innerHTML='<rect x="40" y="40" width="220" height="185" rx="6" fill="none" stroke="#56636F" stroke-width="3"/><rect x="42" y="'+wl+'" width="216" height="113" fill="#2E86AB" opacity=".45"/><line x1="42" y1="'+wl+'" x2="258" y2="'+wl+'" stroke="#7FB2EA" stroke-width="2"/>'+
      '<rect x="'+(150-side/2)+'" y="'+y+'" width="'+side+'" height="'+side+'" rx="3" fill="#E7B460" stroke="#1B1408" stroke-width="1.5"/><text x="150" y="30" text-anchor="middle" fill="#E6ECF0" font-size="13">'+n+(floats?' flota':' se hunde')+'</text><text x="252" y="'+(wl-6)+'" text-anchor="end" fill="#9AA8B3" font-size="11">Agua: 1 g/cm³</text>';
    el.querySelector('#'+id+'r').innerHTML='<div><b>'+fmt(m,1)+' g</b><span>Masa</span></div><div><b>'+fmt(d)+' g/cm³</b><span>Densidad = m ÷ V</span></div>'}
  el.querySelector('#'+id+'vol').oninput=e=>{V=+e.target.value;render()};el.querySelectorAll('#'+id+'m .chip').forEach(b=>b.onclick=()=>{mi=+b.dataset.i;render()});
  render();askBlock(el.querySelector('#'+id+'a'),s.ask,done);
};

W.gas=(el,s,done)=>{
  const id=nid();let T=300,V=10;const n=1,Rg=.082;
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div id="'+id+'s"></div><div class="split"><div class="w">'+slider(id+'t','Temperatura',100,600,10,T,'K')+slider(id+'v','Volumen del recipiente',2,20,1,V,'L')+'</div><div class="readout" id="'+id+'r"></div></div><div class="w" id="'+id+'a"></div></div>';
  const C=canvasStage(el.querySelector('#'+id+'s'),240);const P=Array.from({length:40},()=>({x:Math.random(),y:Math.random(),a:Math.random()*6.28}));let hits=0,rate=0,acc=0;
  function ro(){const p=n*Rg*T/V;el.querySelector('#'+id+'tv').textContent=T+' K ('+(T-273)+' °C)';el.querySelector('#'+id+'vv').textContent=V+' L';
    el.querySelector('#'+id+'r').innerHTML='<div><b>'+fmt(p)+' atm</b><span>Presión (P = nRT ÷ V)</span></div><div><b>'+Math.round(rate)+'</b><span>Choques contra las paredes por segundo</span></div><div><b>1 mol</b><span>Cantidad de gas</span></div>'}
  el.querySelector('#'+id+'t').oninput=e=>{T=+e.target.value;ro()};el.querySelector('#'+id+'v').oninput=e=>{V=+e.target.value;ro()};
  const stop=loop(dt=>{const W_=C.W,H_=C.H,ctx=C.ctx;ctx.clearRect(0,0,W_,H_);const bw=(.25+.75*(V-2)/18)*(W_-40),bx=20,by=20,bh=H_-40;const sp=.9*Math.sqrt(T/300);
    ctx.strokeStyle='#7FB2EA';ctx.lineWidth=2;ctx.strokeRect(bx,by,bw,bh);ctx.fillStyle='#56636F';ctx.fillRect(bx+bw,by,6,bh);
    P.forEach(p=>{p.x+=Math.cos(p.a)*sp*dt*300/bw;p.y+=Math.sin(p.a)*sp*dt*300/bh;if(p.x<0||p.x>1){p.a=Math.PI-p.a;p.x=Math.max(0,Math.min(1,p.x));hits++}if(p.y<0||p.y>1){p.a=-p.a;p.y=Math.max(0,Math.min(1,p.y));hits++}
      ctx.beginPath();ctx.fillStyle='#E7B460';ctx.arc(bx+6+p.x*(bw-12),by+6+p.y*(bh-12),5,0,6.3);ctx.fill()});
    acc+=dt;if(acc>1){rate=hits/acc;hits=0;acc=0;ro()}});
  ro();askBlock(el.querySelector('#'+id+'a'),s.ask,done);
  return()=>{stop();C.off()};
};

W.ph=(el,s,done)=>{
  const id=nid();const SUB=s.subs||[['Jugo gástrico',1.5],['Limón',2.2],['Vinagre',2.9],['Gaseosa',3.2],['Café',5],['Leche',6.6],['Agua pura',7],['Sangre',7.4],['Bicarbonato en agua',8.3],['Jabón de manos',10],['Leche de magnesia',10.5],['Amoníaco de limpieza',11.5],['Blanqueador (hipoclorito)',12.5],['Soda cáustica',14]];let si=1;
  const IND=p=>p<3?'#D7263D':p<5?'#E75480':p<6.5?'#8E44AD':p<7.5?'#5B3FA0':p<9?'#2E86AB':p<11?'#1B998B':p<12.5?'#2E9E5B':'#E4D96F';
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="chips" id="'+id+'m">'+SUB.map((x,i)=>'<button class="chip" data-i="'+i+'">'+x[0]+'</button>').join('')+'</div><div class="phbar"><i id="'+id+'k"></i></div><div class="phticks">'+Array.from({length:15},(_,i)=>'<span>'+i+'</span>').join('')+'</div><div class="split"><div class="readout" id="'+id+'r"></div><div class="row"><svg width="90" height="130" viewBox="0 0 90 130" role="img" aria-label="Tubo con indicador de repollo morado"><path d="M30 8 v90 a15 15 0 0 0 30 0 v-90" fill="none" stroke="#9AA8B3" stroke-width="3"/><path id="'+id+'tube" d="M32 50 v48 a13 13 0 0 0 26 0 v-48 z"/></svg><p style="font-size:.88rem;color:var(--muted);max-width:26ch">Color del indicador de repollo morado</p></div></div><div class="w" id="'+id+'a"></div></div>';
  function render(){const [n,p]=SUB[si];el.querySelectorAll('#'+id+'m .chip').forEach(b=>b.setAttribute('aria-pressed',+b.dataset.i===si));el.querySelector('#'+id+'k').style.left=(p/14*100)+'%';
    const e=Math.round(p);const H='1 × 10'+('⁻'+String(e).split('').map(d=>'⁰¹²³⁴⁵⁶⁷⁸⁹'[d]).join(''));
    el.querySelector('#'+id+'r').innerHTML='<div><b>'+fmt(p,1)+'</b><span>pH de '+n.toLowerCase()+'</span></div><div><b>'+(p<6.95?'Ácido':p<=7.05?'Neutro':'Básico')+'</b><span>Carácter</span></div><div><b>≈ '+H+'</b><span>[H⁺] en mol/L</span></div>';
    el.querySelector('#'+id+'tube').setAttribute('fill',IND(p))}
  el.querySelectorAll('#'+id+'m .chip').forEach(b=>b.onclick=()=>{si=+b.dataset.i;render()});
  render();askBlock(el.querySelector('#'+id+'a'),s.ask,done);
};

W.conc=(el,s,done)=>{
  const id=nid();let g=10,V=250;
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div class="split"><div class="stage" style="cursor:default;height:250px"><svg id="'+id+'v" viewBox="0 0 300 240" width="100%" height="100%" role="img" aria-label="Vaso con solución de sal"></svg></div><div class="w">'+slider(id+'g','Sal (NaCl) disuelta',0,200,1,g,'g')+slider(id+'vol','Volumen de solución',100,500,50,V,'mL')+'<div class="readout" id="'+id+'r"></div></div></div><div class="w" id="'+id+'a"></div></div>';
  function render(){const pv=g/V*100,Mo=(g/58.5)/(V/1000),sat=g>V*.36;el.querySelector('#'+id+'gv').textContent=g+' g';el.querySelector('#'+id+'volv').textContent=V+' mL';
    const h=40+V/500*150,y=220-h,al=Math.min(.85,.1+pv/40);
    let cr='';if(sat){const ex=Math.min(40,Math.round((g-V*.36)/3));for(let i=0;i<ex;i++)cr+='<rect x="'+(80+((i*37)%140))+'" y="'+(208-(i%4)*5)+'" width="6" height="6" fill="#F4F6F8" transform="rotate(45 '+(83+((i*37)%140))+' '+(211-(i%4)*5)+')"/>'}
    el.querySelector('#'+id+'v').innerHTML='<path d="M70 20 v195 a10 10 0 0 0 10 10 h140 a10 10 0 0 0 10 -10 v-195" fill="none" stroke="#9AA8B3" stroke-width="3"/><rect x="72" y="'+y+'" width="156" height="'+(h+3)+'" fill="#7FB2EA" opacity="'+al+'"/>'+cr+'<text x="150" y="14" text-anchor="middle" fill="#E6ECF0" font-size="12">'+(sat?'Solución saturada: sobra sal sin disolver':'Solución de NaCl')+'</text>';
    el.querySelector('#'+id+'r').innerHTML='<div><b>'+fmt(pv,1)+' %</b><span>% m/v (g por 100 mL)</span></div><div><b>'+fmt(Mo)+' M</b><span>Molaridad (mol/L)</span></div><div><b>'+fmt(g/58.5,3)+'</b><span>Moles de NaCl</span></div>'}
  el.querySelector('#'+id+'g').oninput=e=>{g=+e.target.value;render()};el.querySelector('#'+id+'vol').oninput=e=>{V=+e.target.value;render()};
  render();askBlock(el.querySelector('#'+id+'a'),s.ask,done);
};

W.rate=(el,s,done)=>{
  const id=nid();let T=25,c=15,cat=false;
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<div id="'+id+'s"></div><div class="split"><div class="w">'+slider(id+'t','Temperatura',10,90,5,T,'°C')+slider(id+'c','Concentración (partículas de cada reactivo)',5,30,1,c,'')+'<label class="row"><input type="checkbox" id="'+id+'k"> Agregar catalizador</label></div><div class="readout" id="'+id+'r"></div></div><div class="w" id="'+id+'a"></div></div>';
  const C=canvasStage(el.querySelector('#'+id+'s'),240);let P=[];let eff=0,acc=0,rate=0,tot=0;
  function spawn(){P=[];for(let i=0;i<c*2;i++)P.push({x:Math.random(),y:Math.random(),a:Math.random()*6.28,k:i%2,prod:0})}
  function ro(){el.querySelector('#'+id+'tv').textContent=T+' °C';el.querySelector('#'+id+'cv').textContent=c+' + '+c;el.querySelector('#'+id+'r').innerHTML='<div><b>'+fmt(rate,1)+'</b><span>Choques efectivos por segundo (velocidad)</span></div><div><b>'+(cat?'Menor':'Normal')+'</b><span>Energía de activación</span></div>'}
  el.querySelector('#'+id+'t').oninput=e=>{T=+e.target.value;ro()};el.querySelector('#'+id+'c').oninput=e=>{c=+e.target.value;spawn();ro()};el.querySelector('#'+id+'k').onchange=e=>{cat=e.target.checked;ro()};
  spawn();
  const stop=loop(dt=>{const W_=C.W,H_=C.H,ctx=C.ctx;ctx.clearRect(0,0,W_,H_);const sp=.18*Math.sqrt((T+273)/298);const Ea=cat?.35:.75;
    P.forEach(p=>{p.x+=Math.cos(p.a)*sp*dt;p.y+=Math.sin(p.a)*sp*dt*W_/H_;if(p.x<0||p.x>1){p.a=Math.PI-p.a;p.x=Math.max(0,Math.min(1,p.x))}if(p.y<0||p.y>1){p.a=-p.a;p.y=Math.max(0,Math.min(1,p.y))}if(p.prod>0)p.prod-=dt});
    for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const a=P[i],b=P[j];if(a.k===b.k||a.prod>0||b.prod>0)continue;const dx=(a.x-b.x)*W_,dy=(a.y-b.y)*H_;if(dx*dx+dy*dy<140){
      const energy=Math.random()*((T+273)/363);if(energy>Ea*.9){a.prod=b.prod=1.2;eff++;tot++}else{const t_=a.a;a.a=b.a;b.a=t_}}}
    P.forEach(p=>{ctx.beginPath();ctx.fillStyle=p.prod>0?'#6FD19A':p.k?'#E7B460':'#7FB2EA';ctx.arc(p.x*W_,p.y*H_,p.prod>0?7:5,0,6.3);ctx.fill()});
    ctx.fillStyle='#9AA8B3';ctx.font='12px IBM Plex Sans, sans-serif';ctx.fillText('Azul y amarillo: reactivos · Verde: choque efectivo',10,18);
    acc+=dt;if(acc>1.5){rate=eff/acc;eff=0;acc=0;ro()}});
  ro();askBlock(el.querySelector('#'+id+'a'),s.ask,done);
  return()=>{stop();C.off()};
};

W.equil=(el,s,done)=>{
  const id=nid();let st={a:1,b:3,c:0},T=0,Vf=1;const K=()=>T?0.4:4;
  el.innerHTML='<div class="w">'+(s.prompt?'<p>'+s.prompt+'</p>':'')+'<p style="font:600 1.2rem Bricolage Grotesque,sans-serif">N₂ + 3 H₂ ⇌ 2 NH₃ <span class="mono" style="font-size:.7rem">reacción exotérmica</span></p><div class="eqbars"><div><span id="'+id+'va"></span><i id="'+id+'a"></i></div><div><span id="'+id+'vb"></span><i id="'+id+'b" style="background:#9AA5AF"></i></div><div><span id="'+id+'vc"></span><i id="'+id+'c" style="background:var(--ok)"></i></div></div><div class="eqlabels"><span>N₂</span><span>H₂</span><span>NH₃</span></div>'+
    '<div class="row"><button class="btn ghost" data-x="addN">Agregar N₂</button><button class="btn ghost" data-x="remC">Retirar NH₃</button><button class="btn ghost" data-x="P">'+'Aumentar presión'+'</button><button class="btn ghost" data-x="T">Calentar</button><button class="btn ghost" data-x="reset">Reiniciar</button></div><div id="'+id+'m"></div><div class="w" id="'+id+'q"></div></div>';
  function solve(){const f=x=>{const a=st.a-x,b=st.b-3*x,c=st.c+2*x;return c*c-K()*a*b*b*b};let lo=-st.c/2,hi=Math.min(st.a,st.b/3);for(let i=0;i<60;i++){const m=(lo+hi)/2;if(f(m)>0)hi=m;else lo=m}const x=(lo+hi)/2;return x}
  function draw(){const mx=Math.max(3.2,st.a,st.b,st.c);[['a',st.a],['b',st.b],['c',st.c]].forEach(([k,v])=>{el.querySelector('#'+id+k).style.height=(v/mx*85+2)+'%';el.querySelector('#'+id+'v'+k).textContent=fmt(v)+' M'})}
  function relax(msg,dir){const x=solve();const from={...st};const to={a:st.a-x,b:st.b-3*x,c:st.c+2*x};let k=0;
    el.querySelector('#'+id+'m').innerHTML='<div class="fb info">'+msg+'</div>';draw();
    const steps=reduce?1:20;const iv=setInterval(()=>{k++;const f=k/steps;st={a:from.a+(to.a-from.a)*f,b:from.b+(to.b-from.b)*f,c:from.c+(to.c-from.c)*f};draw();if(k>=steps){clearInterval(iv);st=to;draw();
      if(dir)el.querySelector('#'+id+'m').innerHTML+='<div class="fb ok" style="margin-top:6px">El equilibrio se desplazó hacia '+(x>0?'los productos (→, se forma más NH₃)':'los reactivos (←, se descompone NH₃)')+'.</div>'}},40)}
  const ACT={addN:()=>{st.a+=1;relax('Agregaste N₂. El sistema intenta consumir el exceso.',1)},remC:()=>{st.c=Math.max(0,st.c*.3);relax('Retiraste NH₃. El sistema intenta reponerlo.',1)},
    P:()=>{st={a:st.a*2,b:st.b*2,c:st.c*2};relax('Duplicaste la presión (mitad del volumen). Hay 4 moléculas de gas a la izquierda y 2 a la derecha.',1)},
    T:()=>{if(T){relax('Ya está caliente.',0);return}T=1;relax('Calentaste. Como la reacción libera calor, el calor actúa como un “producto” extra.',1)},
    reset:()=>{st={a:1,b:3,c:0};T=0;relax('Sistema reiniciado y en equilibrio.',0)}};
  el.querySelectorAll('[data-x]').forEach(b=>b.onclick=()=>ACT[b.dataset.x]());
  st={a:1,b:3,c:0};const x=solve();st={a:1-x,b:3-3*x,c:2*x};draw();
  askBlock(el.querySelector('#'+id+'q'),s.ask,done);
};

export function mountWidget(el,spec,done){let fired=false;const d=()=>{if(!fired){fired=true;done()}};const f=W[spec.type];if(!f){el.textContent='Actividad no disponible';return null}return f(el,spec,d)||null}

// Utilidades compartidas con las escenas de "Aprende" y los minijuegos.
export { THREE, esc, fmt, num, shuffle, reduce, RAW, CAT, EL, ELZ, PT, GROUP, parseF, fH, molarOf, M, askBlock, nid, canvasStage, loop, slider, three, buildMol };
