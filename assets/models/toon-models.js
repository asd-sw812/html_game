import * as T from '../vendor/three.module.js';

// Sculpted parametric surfaces and articulated costume parts. Dimensions are in scene metres.
const V=(x,y,z)=>new T.Vector3(x,y,z);
const ramp=new T.DataTexture(new Uint8Array([70,70,70,255,155,155,155,255,231,231,231,255,255,255,255,255]),4,1);
ramp.magFilter=ramp.minFilter=T.NearestFilter;ramp.needsUpdate=true;
const materials=new Map();
const ink=new T.MeshBasicMaterial({color:'#25283c',side:T.BackSide});ink.userData.shared=true;
ink.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\ntransformed += normal * 0.00125;');};
function outlines(root){root.traverse(o=>{if(!o.isMesh||!o.material.isMeshToonMaterial||o.geometry.attributes.position.count<120)return;const edge=new T.Mesh(o.geometry,ink);edge.castShadow=false;edge.receiveShadow=false;o.add(edge);});}

export function toon(color,emissive=false){const key=color+emissive;if(!materials.has(key)){const m=emissive?new T.MeshBasicMaterial({color}):new T.MeshToonMaterial({color,gradientMap:ramp});m.userData.shared=true;materials.set(key,m)}return materials.get(key)}
const sphere=new T.SphereGeometry(1,28,20),box=new T.BoxGeometry(1,1,1);sphere.userData.shared=box.userData.shared=true;
function put(parent,geometry,material,pos=[0,0,0],scale=[1,1,1]){const m=new T.Mesh(geometry,typeof material==='string'?toon(material):material);m.position.set(...pos);m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m}
const ell=(p,c,pos,scale)=>put(p,sphere,c,pos,scale),cube=(p,c,pos,scale)=>put(p,box,c,pos,scale);
function surface(p,c,points,depth=1,segments=32){const g=new T.LatheGeometry(points.map(([y,r])=>new T.Vector2(r,y)),segments);return put(p,g,c,[0,0,0],[1,1,depth])}
function tube(p,c,points,r=.008,segments=24){return put(p,new T.TubeGeometry(new T.CatmullRomCurve3(points.map(a=>V(...a))),segments,r,6,false),c)}
function rod(p,c,a,b,r=.012,rTop=r){const av=V(...a),bv=V(...b),d=bv.clone().sub(av);const m=put(p,new T.CylinderGeometry(rTop,r,d.length(),12),c);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m}
function ring(p,c,r,thickness,pos,rotation=[0,0,0]){const o=put(p,new T.TorusGeometry(r,thickness,6,64),c,pos);o.rotation.set(...rotation);return o}
function panel(p,c,points,thickness=.008){const shape=new T.Shape();points.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();return put(p,new T.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.002,bevelThickness:.002}),c)}
function ribbon(p,c,points,width=.08,depth=.014,twist=0){const curve=new T.CatmullRomCurve3(points.map(a=>V(...a))),pos=[],uv=[],indices=[],n=24,k=8;
 for(let i=0;i<=n;i++){const t=i/n,a=curve.getPoint(t),tangent=curve.getTangent(t),side=V(0,0,1).cross(tangent).normalize(),normal=tangent.clone().cross(side);const rad=Math.pow(Math.sin(Math.PI*(.10+t*.90)),.55);side.applyAxisAngle(tangent,twist*t);normal.applyAxisAngle(tangent,twist*t);
 for(let j=0;j<k;j++){const theta=j/k*Math.PI*2,v=a.clone().addScaledVector(side,Math.cos(theta)*width*Math.max(.005,rad)).addScaledVector(normal,Math.sin(theta)*depth*Math.max(.04,rad));pos.push(v.x,v.y,v.z);uv.push(t,j/k);if(i<n){const a=i*k+j,b=i*k+(j+1)%k;indices.push(a,b,a+k,b,b+k,a+k)}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return put(p,g,c)}
function pleated(p,col,top,length,r0,r1,fold=16,open=0){const pos=[],idx=[],n=fold*4,rows=10;for(let y=0;y<=rows;y++)for(let j=0;j<=n;j++){const t=y/rows,a=open/2+j/n*(Math.PI*2-open),f=1-Math.sin(j/n*fold*Math.PI*2)*.045*t,r=(r0+(r1-r0)*t*t)*f;pos.push(Math.sin(a)*r,top-length*t,Math.cos(a)*r*.70)}for(let y=0;y<rows;y++)for(let j=0;j<n;j++){const a=y*(n+1)+j,b=a+n+1;idx.push(a,a+1,b,a+1,b+1,b)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();const m=toon(col).clone();m.userData={};m.side=T.DoubleSide;return put(p,g,m)}
function mix(hex,b,k){return '#'+new T.Color(hex).lerp(new T.Color(b),k).getHexString()}
const HAIR=['#e8dbe9','#8da4cc','#272f4c','#ecd6a2','#75998f','#9690b1','#b66a8a','#c8d8e8','#914e63','#4e677d','#aa896d','#e5b5b0'];
export function appearance(c){const i=c.visualIndex||0,male=c.gender==='male';return{index:i,male,hair:HAIR[(i*5+Math.floor(i/8))%HAIR.length],accent:mix(c.visualAccent||'#9bdcef','#ffffff',.12),cloth:['#1d2740','#e2e1e9','#263546','#382c45','#d6d0de','#1c3038'][i%6],inner:['#dae4ef','#263046','#b9c8d9'][i%3],metal:i%3===1?'#b3c7d8':'#d1b783',style:Math.floor(i/4+i%4)%6,hairStyle:male?i%3:(i+Math.floor(i/4))%7,eye:HAIR[(i+5)%HAIR.length],height:(male?1.04:.97)+(i%4)*.012};}
function eyeTexture(a){const cn=document.createElement('canvas');cn.width=1024;cn.height=1024;const ctx=cn.getContext('2d');
 // Face texture is transparent; the shaped face underneath receives toon lighting.
 for(const side of [-1,1]){ctx.save();ctx.translate(512+side*223,407);ctx.scale(side,1);const h=a.male?55:75;
 const eye=new Path2D();eye.moveTo(-145,10);eye.bezierCurveTo(-82,-h,66,-h-5,151,-20);eye.bezierCurveTo(87,53,-52,83,-145,10);ctx.fillStyle='#fff9ff';ctx.fill(eye);ctx.save();ctx.clip(eye);
 const gradient=ctx.createLinearGradient(0,-h,0,80);gradient.addColorStop(0,'#22213c');gradient.addColorStop(.38,a.eye);gradient.addColorStop(1,a.accent);ctx.fillStyle=gradient;ctx.beginPath();ctx.ellipse(17,1,68,91,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#423553';ctx.lineWidth=8;ctx.stroke();ctx.fillStyle='#23233c';ctx.beginPath();ctx.ellipse(18,-14,20,51,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#ffffff60';ctx.lineWidth=8;ctx.beginPath();ctx.arc(17,9,49,.15,2.8);ctx.stroke();
 ctx.fillStyle='#ffffff';ctx.beginPath();ctx.ellipse(-11,-37,19,13,-.5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(49,37,9,7,0,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.strokeStyle='#302d43';ctx.lineWidth=a.male?11:14;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-145,10);ctx.bezierCurveTo(-82,-h,66,-h-5,151,-20);ctx.lineTo(177,-49);ctx.stroke();ctx.lineWidth=4;ctx.strokeStyle='#8f646d';ctx.beginPath();ctx.moveTo(-121,30);ctx.quadraticCurveTo(10,84,120,6);ctx.stroke();
 if(!a.male){for(let j=0;j<3;j++){ctx.lineWidth=6;ctx.beginPath();ctx.moveTo(112+j*15,-35+j*3);ctx.lineTo(139+j*19,-63+j*2);ctx.stroke()}}
 ctx.strokeStyle=mix(a.hair,'#393344',.55);ctx.lineWidth=a.male?12:8;ctx.beginPath();ctx.moveTo(-117,-121);ctx.quadraticCurveTo(-5,-153,118,-125+(a.index%3)*5);ctx.stroke();
 const blush=ctx.createRadialGradient(15,140,0,15,140,102);blush.addColorStop(0,'#e693a434');blush.addColorStop(1,'#e693a400');ctx.fillStyle=blush;ctx.fillRect(-100,70,220,140);ctx.restore();}
 ctx.strokeStyle='#b68387';ctx.lineCap='round';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(507,548);ctx.quadraticCurveTo(500,580,515,583);ctx.stroke();ctx.strokeStyle='#ad7c8c';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(472,729);ctx.quadraticCurveTo(512,739+(a.index%3)*4,551,727);ctx.stroke();ctx.strokeStyle='#fff2ee';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(495,751);ctx.lineTo(527,750);ctx.stroke();
 const tex=new T.CanvasTexture(cn);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;const m=new T.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});m.userData.ownedTexture=tex;return m;}
function sculptHead(parent,a){
 const head=new T.Group();head.position.y=2.085;parent.add(head);const rx=a.male?.153:.149,ry=.193,rz=.151,skin='#f1d6d0';
 const g=new T.SphereGeometry(1,48,36),p=g.attributes.position;for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);const jaw=y<-.15?1-(Math.abs(y)-.15)*.33:1;let zz=z*rz;if(z>.1&&y<.55){zz=rz*(.88+.12*z);zz-=Math.max(0,-y-.25)*.058;zz+=Math.exp(-(x*x*32+(y+.19)**2*45))*.012;}p.setXYZ(i,x*rx*jaw,y*ry,zz)}g.computeVertexNormals();put(head,g,skin);
 for(const s of [-1,1]){ell(head,skin,[s*.148,-.025,0],[.024,.041,.016]);ell(head,'#d7a6a5',[s*.162,-.02,.004],[.008,.019,.010]);}
 const face=new T.PlaneGeometry(.286,.292,40,40),v=face.attributes.position;for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i);const nx=x/rx,ny=y/ry;const z=rz*(.88+.12*Math.sqrt(Math.max(0,1-nx*nx-ny*ny)))-Math.max(0,-ny-.25)*.058+Math.exp(-(nx*nx*32+(ny+.19)**2*45))*.012+.0014;v.setZ(i,z)}face.computeVertexNormals();put(head,face,eyeTexture(a),[0,-.019,0]);
 // Nose is a subtle volume, not a separate spherical bead.
 ell(head,skin,[0,-.04,.148],[.011,.026,.012]);
 const hairRoot=new T.Group();head.add(hairRoot);const scalp=new T.SphereGeometry(1,40,28,0,Math.PI*2,0,Math.PI*.64);put(hairRoot,scalp,a.hair,[0,.030,-.017],[.164,.193,.164]);
 const locks=[],shadow=mix(a.hair,'#30314a',.23),light=mix(a.hair,'#ffffff',.22);
 // Back hair follows the skull, then separates into layered volume strands.
 const long=a.male?.21:[.48,.20,.63,.40,.52,.28,.71][a.hairStyle];
 for(let j=0;j<13;j++){const theta=(1+j/12)*Math.PI,x=Math.cos(theta)*.14,z=Math.sin(theta)*.145-.038;const points=[[x*.4,.185,z*.45],[x*1.12,.015,z*1.05],[x*1.26,-long*.58,z-.008],[x*(1.08+(j%3)*.14),-long-(j%3)*.035,z+.055]];locks.push(ribbon(hairRoot,j%4===0?shadow:a.hair,points,.036,.026,(j%2?1:-1)*.25));}
 const bangCount=9;for(let j=0;j<bangCount;j++){const x=(j-4)*.033,split=a.hairStyle%3===0,tip=split?(.074+Math.abs(j-4)*-.025):(.024+Math.abs(j-4)*.007+(j%3)*.018);const points=[[x*.58,.191,.045],[x*.84,.137,.137],[x+(j<4?-.005:.009),tip,.15]];ribbon(hairRoot,j%4===0?shadow:a.hair,points,.028,.014);if(j%2===0)ribbon(hairRoot,light,[[x*.6,.185,.060],[x*.86,.137,.148],[x,.092,.158]],.004,.002);}
 for(const s of [-1,1]){ribbon(hairRoot,a.hair,[[s*.13,.14,.07],[s*.16,-.02,.07],[s*.14,-.20,.10]],.036,.023);if(!a.male&&[0,4].includes(a.hairStyle)){const t=new T.Group();t.position.set(s*.16,.04,-.08);hairRoot.add(t);locks.push(t);ell(t,a.accent,[0,0,0],[.031,.043,.030]);for(let j=0;j<5;j++)ribbon(t,j%3===0?shadow:a.hair,[[0,0,0],[s*(.10+j*.009),-.15,-.03],[s*(.06+j*.02),-.48-j*.02,.035]],.045,.024,s*.4)}
 if(!a.male){ring(head,a.metal,.017,.003,[s*.159,-.070,.005]);put(head,new T.OctahedronGeometry(.014),a.accent,[s*.159,-.105,.005],[.5,1.4,.5]);}}
 const pin=new T.Group();pin.position.set(a.index%2?.133:-.133,.102,.115);pin.rotation.z=.5;head.add(pin);cube(pin,a.metal,[0,0,0],[.060,.009,.008]);put(pin,new T.OctahedronGeometry(.013),a.accent);
 if(a.hairStyle===5){const hat=new T.Group();hat.position.set(-.014,.173,-.008);hat.rotation.z=-.15;head.add(hat);ell(hat,a.cloth,[0,.02,0],[.17,.067,.15]);ring(hat,a.metal,.135,.007,[0,0,0],[Math.PI/2,0,0]);}
 return {head,locks};
}
function hand(parent,a,sign){const h=new T.Group();parent.add(h);ell(h,a.style===4?a.cloth:'#f1d6d0',[0,-.037,.003],[.031,.045,.016]);for(let j=0;j<4;j++){const x=(j-1.5)*.013,y=-.066;rod(h,'#f1d6d0',[x,y,0],[x,y-.022,.009],.0065);rod(h,'#f1d6d0',[x,y-.022,.009],[x,y-.032,.025],.006);}rod(h,'#f1d6d0',[-sign*.027,-.02,.003],[-sign*.039,-.052,.026],.009);return h;}
function makeWeapon(hand,a,c){const g=new T.Group();g.position.set(0,-.061,.029);hand.add(g);let kind=['blade','rifle','staff','fan','orbit','blade'][a.style];if(c.deckId==='bullet')kind=a.index%4===3?'blade':'rifle';if(['poison','wave','radiance','tree','cleanse'].includes(c.deckId))kind=a.index%4===0?'staff':'orbit';
 if(kind==='blade'){rod(g,a.cloth,[0,-.12,0],[0,.065,0],.016);for(let j=0;j<5;j++)ring(g,a.metal,.018,.002,[0,-.1+j*.027,0],[Math.PI/2,0,0]);const blade=panel(g,'#c5d3ed',[[-.026,.08],[-.028,.67],[.006,.99],[.032,.67],[.026,.08]],.013);blade.position.z=-.009;tube(g,a.accent,[[.015,.13,.009],[.017,.64,.009],[.005,.94,.009]],.004);panel(g,a.metal,[[-.13,.044],[-.11,.068],[.1,.068],[.13,.044],[.08,.020],[-.09,.020]],.025);put(g,new T.OctahedronGeometry(.027),a.accent,[0,.045,.025],[1,.7,.5]);}
 else if(kind==='rifle'){const frame=panel(g,a.cloth,[[-.034,-.08],[-.055,.04],[-.048,.32],[-.033,.42],[.045,.42],[.050,.1],[.025,-.08]],.082);frame.rotation.x=Math.PI/2;rod(g,'#8398b1',[0,.045,.21],[0,.045,.71],.019);rod(g,a.cloth,[0,.045,.54],[0,.045,.69],.032);cube(g,a.inner,[0,.088,.2],[.055,.035,.28]);cube(g,a.accent,[0,.11,.21],[.022,.009,.22]);cube(g,a.cloth,[0,-.075,.12],[.05,.10,.07]);ring(g,a.metal,.022,.005,[0,.095,.24],[0,Math.PI/2,0]);for(let j=0;j<5;j++)cube(g,a.metal,[.037,.03,.15+j*.028],[.009,.018,.008]);}
 else if(kind==='staff'){rod(g,a.cloth,[0,-.49,0],[0,.79,0],.014);for(let j=0;j<4;j++)ring(g,a.metal,.020,.004,[0,-.3+j*.29,0],[Math.PI/2,0,0]);ring(g,a.metal,.14,.012,[0,.80,0]);ring(g,a.accent,.108,.006,[0,.80,0],[0,.4,0]);put(g,new T.OctahedronGeometry(.075),a.accent,[0,.80,0],[.5,1.4,.5]);for(const s of [-1,1])ribbon(g,a.inner,[[s*.11,.84,0],[s*.2,.66,.03],[s*.12,.44,.03]],.034,.006);}
 else if(kind==='fan'){for(let j=0;j<9;j++){const t=(j-4)*.2;rod(g,a.metal,[0,0,0],[Math.sin(t)*.35,Math.cos(t)*.35,0],.005);const leaf=panel(g,j%2?a.inner:a.accent,[[0,0],[Math.sin(t-.11)*.34,Math.cos(t-.11)*.34],[Math.sin(t+.11)*.34,Math.cos(t+.11)*.34]],.004);}}
 else{ring(g,a.metal,.19,.009,[.035,.12,.04]);ring(g,a.accent,.15,.005,[.035,.12,.04],[.5,.3,0]);for(let j=0;j<5;j++){const t=j/5*Math.PI*2;put(g,new T.OctahedronGeometry(.031),a.accent,[Math.cos(t)*.21+.035,Math.sin(t)*.21+.12,.04],[.4,1,.4]);}ell(g,toon(a.accent,true),[.035,.12,.04],[.031,.047,.031]);}
 return {weapon:g,kind};}

export function character(c){const a=appearance(c),root=new T.Group(),body=new T.Group();root.add(body);root.scale.setScalar(a.height);const skin='#f1d6d0',arms=[],forearms=[],hands=[],legs=[],shins=[],clothParts=[];
 // Continuous shaped torso and waist; the garments follow these volumes.
 surface(body,a.cloth,[[1.11,.175],[1.20,.185],[1.31,.146],[1.43,.140],[1.56,.182],[1.69,.203],[1.755,.187],[1.80,.076]],.66);
 rod(body,skin,[0,1.78,0],[0,1.95,0],.048,.052);
 const collar=surface(body,a.style===2?a.accent:a.inner,[[1.79,.066],[1.83,.069],[1.87,.059]],.88);
 for(const s of [-1,1]){
 const leg=new T.Group();leg.position.set(s*.105,1.06,0);leg.rotation.z=s*.025;body.add(leg);legs.push(leg);
 surface(leg,a.male||a.style===4?a.cloth:skin,[[-.49,.051],[-.35,.068],[-.15,.091],[.00,.092]],.87,24);
 const shin=new T.Group();shin.position.y=-.49;leg.add(shin);shins.push(shin);ell(shin,skin,[0,0,0],[.049,.055,.046]);
 surface(shin,a.style===2?a.inner:'#263247',[[-.49,.042],[-.40,.045],[-.20,.067],[-.065,.057],[0,.052]],.84,24);
 ell(shin,'#20283a',[0,-.524,.058],[.055,.040,.121]);cube(shin,'#141e30',[0,-.552,.045],[.109,.016,.188]);cube(shin,a.metal,[0,-.55,-.024],[.050,.025,.041]);
 ring(shin,a.metal,.055,.005,[0,-.075,0],[Math.PI/2,0,0]);tube(shin,a.accent,[[s*.041,-.095,.03],[s*.041,-.24,.035],[s*.034,-.42,.03]],.005);
 for(let j=0;j<3;j++){rod(shin,a.metal,[-.020,-.44-j*.025,.052],[.020,-.44-j*.025,.066],.003)}
 const arm=new T.Group();arm.position.set(s*(a.male?.221:.203),1.726,0);arm.rotation.z=s*.16;body.add(arm);arms.push(arm);
 ell(arm,a.cloth,[0,-.037,0],[.074,.083,.074]);surface(arm,a.style===3?skin:a.cloth,[[-.278,.038],[-.20,.045],[-.095,.061],[0,.064]],.9,20);
 const fore=new T.Group();fore.position.set(0,-.287,0);fore.rotation.x=-.09;arm.add(fore);forearms.push(fore);ell(fore,skin,[0,0,0],[.038,.040,.037]);surface(fore,a.style===4?a.cloth:skin,[[-.253,.024],[-.18,.031],[-.08,.041],[0,.037]],.87,20);
 surface(fore,a.inner,[[-.236,.030],[-.205,.036],[-.181,.038]],.95,20);ring(fore,a.metal,.033,.004,[0,-.208,0],[Math.PI/2,0,0]);
 const h=hand(fore,a,s);h.position.y=-.25;hands.push(h);
 if([1,5].includes(a.style)){const sleeve=pleated(fore,a.inner,.04,.30,.044,.096,12);sleeve.rotation.z=s*.04;tube(fore,a.accent,[[s*.046,.04,.025],[s*.061,-.14,.028],[s*.094,-.257,.026]],.005);}
 }
 if(a.male||a.style===4){surface(body,a.cloth,[[1.07,.175],[1.19,.182],[1.26,.175]],.7);}
 else{pleated(body,a.inner,1.21,.28,.176,.269,18);pleated(body,a.cloth,1.24,a.style===5?.43:.25,.183,a.style===5?.30:.28,18,a.style===2?.40:0);pleated(body,a.accent,a.style===5?.845:.995,.018,a.style===5?.294:.275,a.style===5?.30:.28,18);}
 // Tailored, overlapping lapels and ornamental closures replace block-shaped clothing.
 const lapelL=panel(body,a.inner,[[-.16,1.74],[-.058,1.81],[-.018,1.59],[-.072,1.46],[-.13,1.62]],.008);lapelL.position.z=.124;
 const lapelR=panel(body,a.style===2?a.accent:a.inner,[[.157,1.74],[.058,1.81],[.01,1.61],[.079,1.50],[.14,1.63]],.008);lapelR.position.z=.126;
 for(let j=0;j<4;j++)ell(body,a.metal,[.018,1.50-j*.075,.10],[.008,.008,.006]);
 surface(body,a.style===1?a.accent:'#263044',[[1.242,.181],[1.284,.178]],.72);const buckle=ring(body,a.metal,.023,.005,[.035,1.263,.135]);buckle.scale.y=.75;
 const sash=tube(body,a.metal,[[-.152,1.68,.125],[-.057,1.49,.117],[.128,1.26,.113]],.007);
 for(const s of [-1,1]){if([0,2,4].includes(a.style)){const flap=new T.Group();flap.position.set(s*.12,1.38,-.09);body.add(flap);clothParts.push(flap);ribbon(flap,a.cloth,[[0,0,0],[s*.12,-.34,-.055],[s*.14,-.76,-.12]],.12,.011,s*.2);tube(flap,a.metal,[[s*.06,-.09,.01],[s*.16,-.41,-.023],[s*.13,-.71,-.10]],.004);}
 if(a.style===3){const scarf=new T.Group();scarf.position.set(s*.05,1.83,-.07);body.add(scarf);clothParts.push(scarf);ribbon(scarf,a.accent,[[0,0,0],[s*.25,-.12,-.08],[s*.36,-.44,-.15]],.074,.008,s*.2);}
 const brooch=put(body,new T.OctahedronGeometry(.021),a.accent,[s*.174,1.72,.073],[1,.65,.45]);ring(body,a.metal,.029,.003,[s*.174,1.72,.073]);}
 if(a.style===1||a.style===5){for(const s of [-1,1]){const bow=panel(body,a.accent,[[0,1.73],[s*.12,1.78],[s*.105,1.66],[0,1.705]],.009);bow.position.z=.153;}ell(body,a.metal,[0,1.714,.162],[.017,.022,.008]);}
 const {head,locks}=sculptHead(body,a),{weapon,kind}=makeWeapon(hands[1],a,c);
 root.userData={body,head,arms,forearms,hands,legs,shins,weapon,kind,c,appearance:a,locks,clothParts};batch(root);outlines(root);return root;
}

// Merge static meshes within each joint by material; retain the articulated hierarchy.
function batch(root){root.traverse(group=>{if(!group.isGroup)return;const map=new Map();for(const m of [...group.children]){if(!m.isMesh||m.children.length)continue;m.updateMatrix();const key=m.material.uuid;if(!map.has(key))map.set(key,[]);map.get(key).push(m)}for(const meshes of map.values()){if(meshes.length<2)continue;const positions=[],normals=[],uvs=[];for(const m of meshes){const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);if(g.attributes.uv)uvs.push(...g.attributes.uv.array);else uvs.push(...new Array(g.attributes.position.count*2).fill(0));g.dispose();if(!m.geometry.userData.shared)m.geometry.dispose();m.removeFromParent()}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));put(group,g,meshes[0].material);}})}
export function release(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)gs.add(o.geometry);if(o.material&&!o.material.userData.shared)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>{m.userData.ownedTexture?.dispose();m.dispose()});root.removeFromParent();}

export function pose(model,time,cast=null,reduced=false){const d=model.userData;if(!d.arms)return;const t=reduced?0:time;
 d.body.position.y=reduced?0:Math.sin(t*1.65)*.006;d.body.rotation.set(0,0,0);d.head.rotation.set(0,Math.sin(t*.6)*.018,Math.sin(t*.8)*.012);
 d.arms.forEach((a,i)=>a.rotation.set(i===1?-.10:.045,0,(i===0?1:-1)*.14));d.forearms.forEach((f,i)=>f.rotation.x=i===1?-.20:-.08);d.legs.forEach((l,i)=>{l.rotation.x=i===0?-.035:.045;l.rotation.z=(i===0?-1:1)*.025});d.shins.forEach(s=>s.rotation.x=.035);
 d.clothParts.forEach((p,i)=>p.rotation.x=reduced?0:Math.sin(t*1.8+i)*.035);
 if(!cast)return;const phase=cast.phase,wind=cast.windup,hit=Math.max(0,Math.min(1,(phase-wind)/.20)),prepare=Math.min(1,phase/wind),recover=Math.max(0,1-(phase-wind-.20)/(1-wind-.20));const effort=phase<wind?prepare:Math.max(0,recover);
 if(cast.support||d.kind==='staff'||d.kind==='orbit'){d.arms[1].rotation.x=-effort*.9;d.arms[0].rotation.z=.14+effort*.6;d.forearms[1].rotation.x=-effort*.65;d.head.rotation.y=-effort*.14;}
 else if(d.kind==='rifle'){d.arms[1].rotation.x=-effort*1.25;d.forearms[1].rotation.x=-effort*.26;d.arms[0].rotation.x=-effort*1.05;d.arms[0].rotation.z=effort*-.26;d.forearms[0].rotation.x=-effort*.55;d.body.rotation.y=effort*.20;}
 else{d.arms[1].rotation.x=phase<wind?-prepare*1.9:(-.9+hit*1.8)*recover;d.arms[1].rotation.z=-.14-effort*.55;d.forearms[1].rotation.x=-effort*.65;d.body.rotation.y=phase<wind?-prepare*.28:(.38-hit*.14)*recover;d.legs[0].rotation.x=-effort*.22;d.shins[0].rotation.x=effort*.25;}
}
export const sculpt={put,ell,cube,surface,tube,rod,ring,panel,ribbon,pleated,batch};
