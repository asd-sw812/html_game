import * as T from './vendor/three.module.js';
import {character,pose,release} from './models/toon-models.js';
import {boss,animateBoss,environment} from './models/archive-stage.js';
import {CombatFX,BloomPass} from './models/combat-fx.js';

const api=window.ArchiveGame;
const roster=api.roster(),byId=new Map(roster.map(c=>[c.id,c]));
const portraits=new Map(),pending=new Set();
let renderer,scene,camera,world,fx,bloom,enemy,party=[],animation=null,lastKey='',lastTime=0;
let lost=false,raf=0,lastDraw={calls:0,triangles:0},activeLayout=null;
const reduced=()=>api.snapshot().reduced;

function syncPortraits(){
 if(!renderer||lost)return;
 document.querySelectorAll('[data-portrait-id]').forEach(el=>{
  const id=el.dataset.portraitId;
  if(!el.getClientRects().length||el.querySelector('img.toon-portrait'))return;
  if(portraits.has(id))mountPortrait(el,portraits.get(id));else if(byId.has(id))pending.add(id);
 });
}
function mountPortrait(el,url){
 const img=document.createElement('img');img.className='toon-portrait';img.alt='캐릭터 카드';img.src=url;
 el.querySelectorAll('img,.loadout-card-empty,.portrait-empty,.party-art-v2').forEach(n=>n.remove());el.prepend(img);
}
const portraitScene=new T.Scene();
portraitScene.add(new T.HemisphereLight('#fff5f5','#797698',1.25));
const portraitLight=new T.DirectionalLight('#fff0f0',1.6);portraitLight.position.set(-3,4,6);portraitScene.add(portraitLight);
const portraitRim=new T.DirectionalLight('#bfd8ef',.7);portraitRim.position.set(3,3,-2);portraitScene.add(portraitRim);
const portraitCam=new T.PerspectiveCamera(28,420/620,.1,20);portraitCam.position.set(0,1.73,4.5);portraitCam.lookAt(0,1.18,0);
function makePortrait(id){
 const c=byId.get(id),model=character(c);model.rotation.y=-.16+(c.visualIndex%3)*.16;
 pose(model,0);model.userData.arms[0].rotation.z=.14;model.userData.arms[1].rotation.z=-.16;
 portraitScene.add(model);portraitScene.background=new T.Color(c.visualAccent).multiplyScalar(.20);
 const target=new T.WebGLRenderTarget(420,620);target.texture.colorSpace=T.SRGBColorSpace;
 const previous=renderer.getRenderTarget();
 try{
  renderer.setRenderTarget(target);renderer.render(portraitScene,portraitCam);
  const pixels=new Uint8Array(420*620*4);renderer.readRenderTargetPixels(target,0,0,420,620,pixels);
  const cn=document.createElement('canvas');cn.width=420;cn.height=620;const ctx=cn.getContext('2d'),data=ctx.createImageData(420,620);
  for(let y=0;y<620;y++)data.data.set(pixels.subarray((619-y)*420*4,(620-y)*420*4),y*420*4);
  ctx.putImageData(data,0,0);portraits.set(id,cn.toDataURL('image/webp',.94));
 }finally{renderer.setRenderTarget(previous);target.dispose();release(model);}
 syncPortraits();
}
function reset(){
 if(animation)animation.model.position.copy(animation.base);
 animation=null;fx?.reset();
}
function syncBattle(s){
 const key=s.battle?s.players.map(p=>p.id).join(',')+':'+s.bossId:'';
 if(key===lastKey)return;
 lastKey=key;reset();party.forEach(release);party=[];
 if(enemy)release(enemy);enemy=null;activeLayout=null;
 if(!s.battle)return;
 s.players.forEach((p,i)=>{
  const model=character(byId.get(p.id)||p);model.userData.id=p.id;
  model.position.set(-3+i*.8,0,.3);model.rotation.y=.38;scene.add(model);party.push(model);
 });
 enemy=boss(s.bossId);enemy.position.set(2.3,0,-2.5);scene.add(enemy);
 const tint=s.bossId==='devourer'?'#32213e':s.bossId==='observer'?'#282442':'#252f49';
 scene.background.set(tint);scene.fog.color.copy(scene.background);
 world.sky.material.uniforms.top.value.set(tint);
}
function cast(actor,meta){
 if(!enemy)return;
 const model=actor.side==='enemy'?enemy:party.find(p=>p.userData.id===actor.id);
 if(!model)return;
 animation={model,start:performance.now(),duration:meta.total,windup:meta.windup,tier:meta.tier,support:meta.support,base:model.position.clone(),boss:actor.side==='enemy',deck:meta.deck,index:actor.index};
 fx.cast(model,meta,reduced());
}
function effects(events,meta){
 if(!enemy||!api.snapshot().battle)return;
 const s=api.snapshot(),source=meta?.boss?enemy:party[meta?.index]||party.find(p=>p.userData.id===s.activeId);
 for(const event of events){
  const target=event.side==='enemy'?enemy:party.find(p=>p.userData.id===event.id);
  if(target)fx.impact(target,event,meta,source,meta?.deck||s.deckId,reduced());
 }
}
function frame(time){
 raf=requestAnimationFrame(frame);
 if(document.hidden||lost){lastTime=time;return;}
 const dt=Math.min((time-lastTime)/1000,.12);lastTime=time;
 const s=api.snapshot();syncBattle(s);
 if(pending.size&&!s.battle){const id=pending.values().next().value;pending.delete(id);makePortrait(id);}
 if(!s.battle)return;
 const t=time/1000;
 if(!animation)activeLayout=s.activeId;
 let back=0;
 for(let i=0;i<party.length;i++){
  const p=party[i],d=p.userData,isActive=d.id===activeLayout;
  const castInfo=animation?.model===p?{phase:Math.min(1,(time-animation.start)/animation.duration),windup:animation.windup/animation.duration,support:animation.support}:null;
  pose(p,t+i,castInfo,reduced());p.visible=!s.players.find(a=>a.id===d.id)?.dead;
  const dest=isActive?new T.Vector3(-2.10,0,1.0):new T.Vector3(-3.45+back++*.86,0,-.65);
  if(animation?.model!==p)p.position.lerp(dest,reduced()?1:Math.min(1,dt*5));
  p.scale.setScalar(d.appearance.height*(isActive?1.12:.84));
 }
 if(enemy)animateBoss(enemy,t,reduced());world.update(t,reduced());
 let zoom=0;
 if(animation){
  const a=animation,progress=Math.min(1,(time-a.start)/a.duration),swing=Math.sin(progress*Math.PI);
  if(!reduced()){
   if(!a.support){a.model.position.x=a.base.x+swing*(a.boss?-.36:.40);a.model.position.z=a.base.z-swing*(a.boss?-.22:.27);}
   if(a.tier===2)zoom=swing;
  }
  if(progress>=1){a.model.position.copy(a.base);animation=null;}
 }
 fx.update(dt);camera.position.set(zoom*.12,3.35,11-zoom*.45);camera.lookAt(0,1.15,-.6);
 bloom.render(scene,camera,reduced());lastDraw=bloom.lastInfo;
}
function init(){
 const canvas=document.createElement('canvas');canvas.id='archive3d';canvas.setAttribute('aria-label','카툰 렌더링 3D 전투 장면');document.body.prepend(canvas);
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
 catch(e){canvas.remove();console.error('3D renderer unavailable',e);const note=document.createElement('div');note.className='render-error';note.textContent='3D 장면을 표시할 수 없습니다. 브라우저의 하드웨어 가속을 켠 뒤 다시 열어 주세요.';document.body.append(note);return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<1000?1.25:1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
 scene=new T.Scene();scene.background=new T.Color('#25233f');scene.fog=new T.Fog('#25233f',17,43);
 camera=new T.PerspectiveCamera(35,1,.1,90);camera.position.set(0,3.35,11);camera.lookAt(0,1.15,-.6);
 scene.add(new T.HemisphereLight('#eff2ff','#514d73',1.25));
 const sun=new T.DirectionalLight('#ffe9ef',1.85);sun.position.set(-4,9,6);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-9,right:9,top:9,bottom:-9});sun.shadow.bias=-.001;scene.add(sun);
 const rim=new T.DirectionalLight('#a8dfff',.9);rim.position.set(3,4,-7);scene.add(rim);
 world=environment(scene);fx=new CombatFX(scene);bloom=new BloomPass(renderer);
 const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();bloom.resize(Math.round(innerWidth*renderer.getPixelRatio()),Math.round(innerHeight*renderer.getPixelRatio()));};
 addEventListener('resize',resize);resize();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;document.body.classList.remove('toon-ready');});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;document.body.classList.add('toon-ready');resize();});
 window.Archive3D={ready:true,cast,effects,reset,stats:()=>({roster:roster.length,male:roster.filter(c=>c.gender==='male').length,portraits:portraits.size,...fx.stats(),quality:'sculpted-v2',drawCalls:lastDraw.calls,triangles:lastDraw.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
 document.body.classList.add('toon-ready');new MutationObserver(syncPortraits).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});syncPortraits();raf=requestAnimationFrame(frame);
}
init();
