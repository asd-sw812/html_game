import * as T from './vendor/three.module.js';

// Actual volume meshes, cel-lit materials, joint animation and world-space effects.
// No combat sprite planes. Portraits are rendered once from the same character identity.
const api=window.ArchiveGame;
const roster=api.roster(), byId=new Map(roster.map(c=>[c.id,c]));
const gradient=new T.DataTexture(new Uint8Array([75,75,75,150,150,150,220,220,220,255,255,255]),4,1,T.RGBFormat);
// RGBA is supported consistently by WebGL2 implementations.
gradient.image.data=new Uint8Array([80,80,80,255,150,150,150,255,220,220,220,255,255,255,255,255]);gradient.format=T.RGBAFormat;
gradient.minFilter=gradient.magFilter=T.NearestFilter;gradient.needsUpdate=true;
const mats=new Map();
function mat(color,glow=false){const key=color+':'+glow;if(!mats.has(key))mats.set(key,glow?new T.MeshBasicMaterial({color}):new T.MeshToonMaterial({color,gradientMap:gradient}));return mats.get(key)}
const outline=new T.MeshBasicMaterial({color:0x191b36,side:T.BackSide});
function mesh(g,color,parent,x=0,y=0,z=0,scale=null,ink=false){const m=new T.Mesh(g,mat(color));m.position.set(x,y,z);if(scale)m.scale.set(...scale);m.castShadow=true;m.receiveShadow=true;parent.add(m);if(ink){const edge=new T.Mesh(g,outline);edge.scale.setScalar(1.018);m.add(edge)}return m}
const sphere=new T.SphereGeometry(1,24,16),box=new T.BoxGeometry(1,1,1);
function ell(p,col,pos,size,ink=false){return mesh(sphere,col,p,...pos,size,ink)}
function cube(p,col,pos,size){return mesh(box,col,p,...pos,size)}
function rod(p,col,a,b,r1=.07,r2=r1){const av=new T.Vector3(...a),bv=new T.Vector3(...b),v=bv.clone().sub(av);const m=mesh(new T.CylinderGeometry(r2,r1,v.length(),10),col,p);m.position.copy(av.add(bv).multiplyScalar(.5));m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),v.normalize());return m}
function ring(p,col,r,t,pos,rot=[0,0,0]){const m=mesh(new T.TorusGeometry(r,t,8,72),col,p,...pos);m.rotation.set(...rot);return m}
function strand(p,col,points,width=.10,depth=.06){
 const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v))),vs=[],ids=[],steps=16,sides=6;
 for(let i=0;i<=steps;i++){const t=i/steps,c=curve.getPoint(t),tangent=curve.getTangent(t),normal=new T.Vector3(0,0,1).cross(tangent).normalize(),binormal=tangent.clone().cross(normal).normalize();const taper=Math.max(.025,Math.sin((.15+t*.85)*Math.PI/2)*(1-t)**.45);
 for(let j=0;j<sides;j++){const ang=j/sides*Math.PI*2,v=c.clone().addScaledVector(normal,Math.cos(ang)*width*taper).addScaledVector(binormal,Math.sin(ang)*depth*taper);vs.push(v.x,v.y,v.z);if(i<steps){const a=i*sides+j,b=i*sides+(j+1)%sides;ids.push(a,b,a+sides,b,b+sides,a+sides)}}}
 const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(vs,3));g.setIndex(ids);g.computeVertexNormals();return mesh(g,col,p);
}
function skirt(p,col,y,length,top,bottom,n=16){const v=[],idx=[];for(let k=0;k<2;k++)for(let i=0;i<=n*2;i++){const a=i/(n*2)*Math.PI*2,r=(k?bottom:top)*(i%2?.90:1);v.push(Math.cos(a)*r,y-k*length,Math.sin(a)*r*.72)}for(let i=0;i<n*2;i++){const b=n*2+1;idx.push(i,i+1,i+b,i+1,i+b+1,i+b)}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(v,3));g.setIndex(idx);g.computeVertexNormals();const m=mesh(g,col,p);m.material=mat(col).clone();m.material.side=T.DoubleSide;return m}
const hairColors=['#f0d9ed','#c9dffc','#29334c','#f5e6b5','#a7e8dc','#bdacd9','#df91b6','#e7edf5'];
function character(c){
 const i=c.visualIndex||0,male=c.gender==='male',root=new T.Group(),body=new T.Group();root.add(body);const accent=c.visualAccent||'#94daf7',hair=hairColors[(i*3+Math.floor(i/8))%8],cloth=['#222b4a','#ede7ed','#293b51','#35283f'][i%4],trim='#f6d498',skin='#ffe0d5';
 const stature=male?1.07:1+(i%3)*.025;root.scale.setScalar(stature);
 const hips=new T.Group();body.add(hips);const legs=[];
 for(const sign of [-1,1]){const leg=new T.Group();leg.position.set(sign*.135,1.01,0);hips.add(leg);legs.push(leg);
 ell(leg,skin,[0,-.18,0],[.093,.26,.095]);rod(leg,i%3===0?cloth:'#24283f',[0,-.34,0],[0,-.82,.025],.075,.095);ell(leg,'#20233b',[0,-.85,.075],[.09,.085,.17]);ring(leg,accent,.078,.013,[0,-.40,0],[Math.PI/2,0,0]);}
 if(male){cube(body,cloth,[0,.95,0],[.37,.26,.24]);rod(body,cloth,[-.12,1.05,0],[-.135,.37,0],.10,.11);rod(body,cloth,[.12,1.05,0],[.135,.37,0],.10,.11)}
 else {skirt(body,cloth,1.18,.37,.19,.34,12+i%5);skirt(body,accent,.86,.045,.29,.34,12+i%5);}
 ell(body,cloth,[0,1.37,0],[male?.24:.195,.31,.13],true);
 cube(body,accent,[0,1.13,.025],[.39,.052,.27]);ell(body,trim,[0,1.125,.176],[.042,.039,.014]);
 // Tailored panels, high collar, contrasting lapels, cross-body belt and epaulettes.
 for(const sign of [-1,1]){const lapel=cube(body,'#edf1ff',[sign*.083,1.51,.126],[.082,.26,.025]);lapel.rotation.z=sign*-.26;
 if(i%3!==1){strand(body,cloth,[[sign*.15,1.35,-.08],[sign*.28,.97,-.13],[sign*.39,.57,-.21]],.17,.035);strand(body,accent,[[sign*.2,1.24,-.11],[sign*.30,.85,-.17],[sign*.40,.58,-.21]],.024,.018)}
 ell(body,accent,[sign*.226,1.58,0],[.095,.048,.12]);}
 rod(body,trim,[-.15,1.56,.155],[.15,1.19,.145],.015);rod(body,skin,[0,1.62,0],[0,1.78,0],.06);
 const arms=[];for(const sign of [-1,1]){const arm=new T.Group();arm.position.set(sign*.235,1.57,0);arm.rotation.z=sign*.12;body.add(arm);arms.push(arm);
 rod(arm,cloth,[0,0,0],[sign*.04,-.27,0],.071,.095);rod(arm,skin,[sign*.04,-.27,0],[sign*.03,-.49,.035],.052,.06);rod(arm,cloth,[sign*.03,-.41,.02],[sign*.03,-.52,.04],.06);ell(arm,skin,[sign*.03,-.545,.04],[.055,.066,.045]);}
 const head=new T.Group();head.position.y=1.84;head.scale.setScalar(male?.82:.80);body.add(head);
 ell(head,hair,[0,.08,-.025],[.225,.255,.19],true);
 // Small jaw, large almond eyes and separated colored irises: anime proportions.
 ell(head,skin,[0,0,.027],[.182,.225,.165],true);
 for(const sign of [-1,1]){
 ell(head,skin,[sign*.19,-.035,.012],[.035,.058,.025]);
 const eye=ell(head,'#302c48',[sign*.086,.014,.174],[male?.060:.066,male?.038:.047,.015]);eye.rotation.z=sign*.11;
 ell(head,'#fffaff',[sign*.086,.008,.185],[.054,male?.029:.037,.010]);ell(head,accent,[sign*.087,.002,.194],[.027,male?.032:.037,.008]);ell(head,'#262442',[sign*.087,.008,.200],[.010,.023,.003]);ell(head,'#ffffff',[sign*.079,.020,.205],[.009,.011,.003]);
 rod(head,'#38324c',[sign*.035,.084,.164],[sign*.132,.092,.152],.009);
 ell(head,'#f3a6bc',[sign*.125,-.06,.165],[.032,.010,.003]);
 if(!male)ell(head,trim,[sign*.20,-.09,.01],[.016,.037,.016]);
 }
 ell(head,'#f1b9b2',[0,-.058,.187],[.012,.016,.011]);rod(head,'#a96e89',[-.022,-.116,.152],[.022,-.116,.152],.005);
 for(let j=0;j<7;j++){const x=(j-3)*.058;strand(head,hair,[[x*.8,.23,.05],[x,.15,.16],[x+(j%2?.02:-.03),j%3===0?.005:.06,.184]],.052,.024)}
 const locks=[];for(const sign of [-1,1]){for(let j=0;j<(male?2:4);j++){const len=male?.24:.43+(i%4)*.12+j*.035;locks.push(strand(head,hair,[[sign*(.16+j*.014),.16,-j*.03],[sign*(.23+j*.017),-.15,-.015-j*.03],[sign*(.20+j*.032),-len,.02-j*.04]],.060,.038))}
 if(!male&&i%3===0){ell(head,accent,[sign*.22,.09,-.075],[.068,.064,.043]);strand(head,hair,[[sign*.23,.10,-.08],[sign*.37,-.20,-.1],[sign*.34,-.70,-.02]],.14,.09)}}
 if(i%6===1){const cap=mesh(new T.CylinderGeometry(.18,.22,.065,16),cloth,head,0,.235,-.02);cap.rotation.z=-.14;ell(head,accent,[.10,.22,.16],[.03,.03,.025]);}
 if(i%6===2){ring(head,trim,.24,.012,[0,.18,0],[Math.PI/2,0,0]);}
 if(i%4===2){for(const sign of [-1,1]){ell(body,'#edeaf4',[sign*.27,1.48,0],[.115,.15,.115]);rod(body,accent,[sign*.24,1.35,.115],[sign*.27,1.20,.09],.012);}}
 if(i%4===3){strand(body,accent,[[-.16,1.61,-.04],[-.40,1.32,-.18],[-.55,1.05,-.22]],.13,.025);}
 const ornament=cube(head,accent,[i%2?.16:-.16,.17,.12],[.105,.032,.035]);ornament.rotation.z=.55;
 // Weapon silhouettes vary by deck and slot, keeping identity in both portraits and combat.
 const weapon=new T.Group();arms[1].add(weapon);weapon.position.set(.04,-.51,.04);const type=(Math.floor(i/4)+i%4)%5;
 if(type===0){cube(weapon,'#31354e',[0,.12,.20],[.10,.12,.47]);cube(weapon,accent,[0,.18,.26],[.07,.023,.36]);rod(weapon,'#eee6ef',[0,.12,.3],[0,.12,.66],.026);cube(weapon,'#34334b',[0,0,.09],[.06,.19,.08]);}
 else if(type===1){rod(weapon,trim,[0,-.3,0],[0,.92,0],.022);ring(weapon,accent,.14,.022,[0,.97,0]);ell(weapon,'#e5f6ff',[0,.97,0],[.059,.082,.04]);}
 else if(type===2){const blade=mesh(new T.ConeGeometry(.10,.95,4), '#dbe9ff',weapon,0,.53,0,[.45,1,1]);cube(weapon,trim,[0,.035,0],[.28,.035,.045]);rod(weapon,cloth,[0,-.14,0],[0,.08,0],.025);}
 else if(type===3){const book=cube(weapon,cloth,[.08,.03,.08],[.26,.32,.09]);book.rotation.z=-.3;cube(book,accent,[0,0,.51],[.78,.8,.03]);}
 else{ring(weapon,accent,.20,.022,[0,.17,.1]);for(let j=0;j<3;j++)ell(weapon,trim,[Math.cos(j*2.1)*.20,.17+Math.sin(j*2.1)*.20,.1],[.035,.035,.035]);}
 root.userData={body,head,arms,legs,weapon,c,locks};return root;
}
function boss(id){const r=new T.Group(),core=new T.Group();r.add(core);const col=id==='devourer'?'#ed7c9f':id==='observer'?'#bcabff':'#96e8e9',dark='#292a48',ivory='#f2e5e2';
 // Impossible sculpture: porcelain masks, displaced architectural masses and orbital ribs.
 if(id==='warden'){
 for(let j=0;j<7;j++){const h=2.1-j*.23,w=.64+j*.07;const slab=cube(core,j%2?ivory:dark,[Math.sin(j*1.9)*.23,h,0],[w,.14,.46]);slab.rotation.z=(j%2?1:-1)*.13;}
 for(const s of [-1,1]){rod(core,dark,[s*.32,.8,0],[s*.46,.05,0],.10,.07);for(let j=0;j<4;j++){const m=cube(core,ivory,[s*(.59+j*.12),1.95-j*.22,0],[.28,.35,.28]);m.rotation.z=s*.55;}rod(core,col,[s*.85,1.4,0],[s*1.1,.2,.1],.025);}
 }else if(id==='devourer'){
 const maw=ring(core,ivory,.65,.13,[0,1.45,.0]);maw.scale.y=1.2;ell(core,dark,[0,1.45,-.1],[.70,.9,.30]);
 for(let j=0;j<18;j++){const a=j/18*Math.PI*2, tooth=mesh(new T.ConeGeometry(.09,.34,4),ivory,core,Math.cos(a)*.54,1.45+Math.sin(a)*.65,.18);tooth.rotation.z=a+Math.PI/2;}
 for(let j=0;j<8;j++){const a=j/8*Math.PI*2;strand(core,j%2?col:ivory,[[Math.cos(a)*.55,1.5+Math.sin(a)*.6,-.1],[Math.cos(a)*1.1,1.4+Math.sin(a)*1.0,-.35],[Math.cos(a+.45)*1.6,1.4+Math.sin(a+.45)*1.2,.12]],.13,.10)}
 }else{
 for(let j=0;j<3;j++){const o=ring(core,ivory,.8+j*.22,.025,[0,1.6,0]);o.rotation.set(j*.6,j*.8,j*.4)}
 for(let j=0;j<9;j++){const a=j/9*Math.PI*2,m=cube(core,j%2?ivory:dark,[Math.cos(a),1.6+Math.sin(a),0],[.18,.50,.22]);m.rotation.z=a;}
 const ob=mesh(new T.OctahedronGeometry(.63),dark,core,0,1.6,0);ob.scale.y=1.4;
 }
 ell(core,col,[0,1.65,.32],[.24,.13,.12]);ell(core,'#211f3a',[0,1.65,.43],[.035,.12,.025]);ell(core,'#ffffff',[-.05,1.70,.43],[.03,.025,.025]);
 if(id!=='devourer'){ell(core,ivory,[0,2.2,.09],[.19,.30,.13]);rod(core,dark,[-.12,2.22,.23],[.12,2.22,.23],.014);strand(core,dark,[[0,2.48,.13],[.04,2.31,.23],[-.07,2.01,.18]],.012,.012);}
 const halo=ring(r,col,1.55,.012,[0,1.65,-.3]);r.userData={core,halo};r.scale.setScalar(1.25);return r;
}
function dispose(root){const geometries=new Set(),materials=new Set();root.traverse(o=>{if(o.geometry&&!['SphereGeometry','BoxGeometry'].includes(o.geometry.type))geometries.add(o.geometry);if(o.material&&!Array.from(mats.values()).includes(o.material)&&o.material!==outline)materials.add(o.material)});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());root.removeFromParent()}

let renderer,scene,camera,stage,party=[],enemy,lastKey='',current=null,animation=null,particles=[],lastTime=0;
const portraits=new Map(),pending=new Set();
const reduced=()=>api.snapshot().reduced;
function init(){
 const canvas=document.createElement('canvas');canvas.id='archive3d';canvas.setAttribute('aria-label','카툰 렌더링 3D 전투 장면');document.body.prepend(canvas);
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}catch(e){canvas.remove();console.error('3D renderer unavailable',e);const note=document.createElement('div');note.className='render-error';note.textContent='3D 장면을 표시할 수 없습니다. 브라우저의 하드웨어 가속을 켠 뒤 다시 열어 주세요.';document.body.append(note);return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
 renderer.outputColorSpace=T.SRGBColorSpace;scene=new T.Scene();scene.background=new T.Color('#25233f');scene.fog=new T.Fog('#25233f',17,43);
 camera=new T.PerspectiveCamera(35,1,.1,90);camera.position.set(0,3.35,11);camera.lookAt(0,1.15,-.6);
 scene.add(new T.HemisphereLight('#eff2ff','#666083',2.1));const sun=new T.DirectionalLight('#ffe9ef',3.3);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9});sun.shadow.bias=-.001;scene.add(sun);const rim=new T.DirectionalLight('#a8dfff',2.2);rim.position.set(3,4,-7);scene.add(rim);
 stage=new T.Group();scene.add(stage);
 mesh(new T.CylinderGeometry(9,9,.25,64),'#777a9e',stage,0,-.19,-2);
 for(let j=0;j<4;j++)ring(stage,j%2?'#c5b8e2':'#a5d9eb',2+j*1.6,.018,[0,-.048,-2],[Math.PI/2,0,0]);
 for(let x=-12;x<=12;x+=3)for(let z=-18;z<=6;z+=3){const tile=cube(stage,(x+z)%2?'#676e93':'#747fa5',[x,-.38,z],[2.97,.20,2.97]);}
 for(let j=0;j<12;j++){const a=Math.PI*(.06+j/11*.88),x=Math.cos(a)*11,z=-Math.sin(a)*10-5;cube(stage,'#434762',[x,3,z],[.8,7,1]);cube(stage,'#a9a1c5',[x,6.4,z],[1.5,.18,1.4]);cube(stage,'#b9ddf0',[x,3,z+.52],[.09,5.7,.06]);}
 for(let j=0;j<5;j++){const arc=ring(stage,j%2?'#b6b0d2':'#586080',5+j*.48,.13,[0,3,-12-j*.6]);arc.scale.x=1.16;}
 for(let j=0;j<24;j++){const shard=mesh(new T.OctahedronGeometry(.18+(j%4)*.06),'#a9aed7',stage,Math.sin(j*2.4)*10,2+j%5,-6-j%9);shard.rotation.set(j,j*.3,j*.9);}
 const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix()};addEventListener('resize',resize);resize();
 window.Archive3D={ready:true,cast,effects,reset,stats:()=>({roster:roster.length,male:roster.filter(c=>c.gender==='male').length,portraits:portraits.size,particles:particles.length,drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles})};
 document.body.classList.add('toon-ready');new MutationObserver(syncPortraits).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});syncPortraits();requestAnimationFrame(frame);
}
const portraitScene=new T.Scene();portraitScene.add(new T.HemisphereLight('#ffffff','#897da8',2.4));const portraitLight=new T.DirectionalLight('#fff0f0',3);portraitLight.position.set(-3,4,6);portraitScene.add(portraitLight);const portraitCam=new T.PerspectiveCamera(28,420/620,.1,20);portraitCam.position.set(0,1.50,4.7);portraitCam.lookAt(0,1.15,0);
function syncPortraits(){if(!renderer)return;document.querySelectorAll('[data-portrait-id]').forEach(el=>{const id=el.dataset.portraitId;if(!el.getClientRects().length)return;if(el.querySelector('img.toon-portrait'))return;if(portraits.has(id))mountPortrait(el,portraits.get(id));else if(byId.has(id))pending.add(id)})}
function mountPortrait(el,url){const img=document.createElement('img');img.className='toon-portrait';img.alt='캐릭터 카드';img.src=url;el.querySelectorAll('img,.loadout-card-empty,.portrait-empty,.party-art-v2').forEach(n=>n.remove());el.prepend(img);}
function makePortrait(id){const c=byId.get(id),model=character(c);model.rotation.y=-.18+(c.visualIndex%3)*.18;model.userData.arms[0].rotation.z=.28;model.userData.arms[1].rotation.z=-.28;portraitScene.add(model);portraitScene.background=new T.Color(c.visualAccent).multiplyScalar(.35);
 const target=new T.WebGLRenderTarget(420,620);const previous=renderer.getRenderTarget();renderer.setRenderTarget(target);renderer.render(portraitScene,portraitCam);const pixels=new Uint8Array(420*620*4);renderer.readRenderTargetPixels(target,0,0,420,620,pixels);renderer.setRenderTarget(previous);
 const cn=document.createElement('canvas');cn.width=420;cn.height=620;const ctx=cn.getContext('2d'),data=ctx.createImageData(420,620);for(let y=0;y<620;y++)data.data.set(pixels.subarray((619-y)*420*4,(620-y)*420*4),y*420*4);ctx.putImageData(data,0,0);
 portraits.set(id,cn.toDataURL('image/webp',.90));target.dispose();dispose(model);syncPortraits();}
function syncBattle(s){const key=s.battle?s.players.map(p=>p.id).join(',')+':'+s.bossId:'';if(key===lastKey)return;lastKey=key;party.forEach(dispose);party=[];if(enemy)dispose(enemy);enemy=null;reset();if(!s.battle)return;
 s.players.forEach((p,i)=>{const model=character(byId.get(p.id)||p);model.userData.id=p.id;model.position.set(-2.8+i*.76,0,1.0+i*.38);model.rotation.y=.55;scene.add(model);party.push(model)});enemy=boss(s.bossId);enemy.position.set(2.3,0,-2.5);scene.add(enemy);
 scene.background.set(s.bossId==='devourer'?'#39273e':s.bossId==='observer'?'#282449':'#252f49');scene.fog.color.copy(scene.background);}
function cast(actor,meta){if(!enemy)return;const model=actor.side==='enemy'?enemy:party.find(p=>p.userData.id===actor.id);if(!model)return;animation={model,start:performance.now(),duration:meta.total,windup:meta.windup,tier:meta.tier,support:meta.support,base:model.position.clone(),boss:actor.side==='enemy'};}
function reset(){if(animation)animation.model.position.copy(animation.base);animation=null;for(const p of particles)dispose(p.object);particles=[];}
function effectObject(object,origin,velocity,lifetime,rotation=0){object.position.copy(origin);scene.add(object);particles.push({object,velocity,life:lifetime,total:lifetime,rotation});}
function effects(events,meta){if(!enemy||!api.snapshot().battle)return;for(const event of events){const target=event.side==='enemy'?enemy:party.find(p=>p.userData.id===event.id);if(!target)continue;const origin=target.position.clone().add(new T.Vector3(0,1.35,0));const theme=meta?.deck||api.snapshot().deckId,accent=meta?.boss?'#f798c1':byId.get(api.snapshot().activeId)?.visualAccent||'#a9e6ff';
 if(event.kind==='damage'&&event.amount>0){const count=reduced()?5:meta?.tier===2?42:19;for(let j=0;j<count&&particles.length<180;j++){
 let geometry;if(['freeze','tree'].includes(theme))geometry=new T.ConeGeometry(.05,.45,4);else if(theme==='bullet')geometry=new T.CylinderGeometry(.012,.012,.48,5);else if(['wave','radiance','mental'].includes(theme))geometry=new T.TorusGeometry(.10,.008,4,12);else geometry=new T.OctahedronGeometry(.04+(j%3)*.02);
 const material=new T.MeshBasicMaterial({color:accent,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending});const o=new T.Mesh(geometry,material),a=j*2.399,v=new T.Vector3(Math.cos(a)*(1+j%4),Math.sin(a)*2.5+.8,Math.sin(j*1.4)*2);effectObject(o,origin,v,.55+(j%4)*.1,2);}
 if(['wave','radiance','poison','electric'].includes(theme)){for(let j=0;j<(reduced()?1:3);j++){const o=new T.Mesh(new T.TorusGeometry(.45+j*.18,.014,6,48),new T.MeshBasicMaterial({color:accent,transparent:true,depthWrite:false,blending:T.AdditiveBlending}));o.rotation.x=theme==='wave'?Math.PI/2:0;effectObject(o,origin,new T.Vector3(0,.2+j*.2,0),.65,.4)}}
 }else if(['buff','heal','shield'].includes(event.kind)){const col=event.kind==='heal'?'#9cf0d2':'#afc7ff';for(let j=0;j<2;j++){const o=new T.Mesh(new T.TorusGeometry(.48,.017,6,48),new T.MeshBasicMaterial({color:col,transparent:true,depthWrite:false}));o.rotation.x=Math.PI/2;effectObject(o,target.position.clone().add(new T.Vector3(0,.15+j*.3,0)),new T.Vector3(0,1,0),.9,0)}}
 }}
function frame(time){requestAnimationFrame(frame);if(document.hidden){lastTime=time;return}const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;const s=api.snapshot();syncBattle(s);
 if(pending.size&&!s.battle){const id=pending.values().next().value;pending.delete(id);makePortrait(id);}
 if(!s.battle)return;current=party.find(p=>p.userData.id===s.activeId);const t=time/1000;
 party.forEach((p,i)=>{const d=p.userData;d.body.position.y=reduced()?0:Math.sin(t*1.7+i)*.017;d.head.rotation.z=reduced()?0:Math.sin(t*.8+i)*.015;d.arms[0].rotation.z=.12;d.arms[1].rotation.z=-.12;const record=s.players.find(a=>a.id===d.id);p.visible=!record?.dead;const active=p===current;p.scale.setScalar((d.c.gender==='male'?1.07:1+(d.c.visualIndex%3)*.025)*(active?1.04:.9));});
 if(enemy){enemy.userData.core.position.y=reduced()?0:Math.sin(t*1.2)*.075;enemy.userData.halo.rotation.z=reduced()?0:t*.08;}
 if(animation){const a=animation,elapsed=time-a.start,progress=Math.min(1,elapsed/a.duration),swing=Math.sin(progress*Math.PI);if(!reduced()){if(a.model.userData.arms){a.model.userData.arms[1].rotation.x=-swing*1.3;a.model.userData.arms[1].rotation.z=-.12-swing*.55;a.model.userData.body.rotation.y=swing*.35;}
 if(!a.support){a.model.position.x=a.base.x+swing*(a.boss?-.40:.52);a.model.position.z=a.base.z-swing*(a.boss?-.25:.35);}}
 if(progress>=1){a.model.position.copy(a.base);if(a.model.userData.arms){a.model.userData.arms[1].rotation.x=0;a.model.userData.body.rotation.y=0;}animation=null;}}
 for(let i=particles.length-1;i>=0;i--){const p=particles[i];p.life-=dt;if(p.life<=0){dispose(p.object);particles.splice(i,1);continue;}p.object.position.addScaledVector(p.velocity,dt);p.object.rotation.z+=p.rotation*dt;p.object.material.opacity=p.life/p.total;p.object.scale.setScalar(1+(1-p.life/p.total)*.8);}
 camera.position.x=!reduced()&&animation?.tier===2?Math.sin((time-animation.start)/animation.duration*Math.PI)*.22:0;camera.lookAt(0,1.15,-.6);renderer.render(scene,camera);
}
init();
