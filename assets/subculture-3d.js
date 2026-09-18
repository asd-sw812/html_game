import * as T from './vendor/three.module.js';
import {character,pose,releaseCharacter,preloadCharacters} from './models/anime-characters.js';
import {release} from './models/toon-models.js';
import {boss,animateBoss,environment} from './models/archive-stage.js?v=anime-v4';
import {CombatFX,BloomPass} from './models/combat-fx.js';
import {installCardArt} from './card-art.js';
const api=window.ArchiveGame,roster=api.roster(),byId=new Map(roster.map(c=>[c.id,c]));
const cards=installCardArt(roster);preloadCharacters(roster.slice(0,4));
let renderer,scene,camera,world,fx,bloom,enemy,party=[],animation=null,lastKey='',lastTime=0;
let lost=false,lastDraw={calls:0,triangles:0},generation=0,activeId=null,loading=false,loadError='';
const reduced=()=>api.snapshot().reduced;
const loadingLabel=document.createElement('div');loadingLabel.className='model-loading';loadingLabel.setAttribute('role','status');document.body.append(loadingLabel);
function modelStatus(value,message=''){
 loading=value;loadError=message;document.body.classList.toggle('models-loading',value);
 loadingLabel.hidden=!value&&!message;loadingLabel.textContent=message||'캐릭터를 불러오는 중…';
}
function reset(){if(animation)animation.model.position.copy(animation.base);animation=null;fx?.reset();}
async function syncBattle(s){
 const key=s.battle?s.players.map(p=>p.id).join(',')+':'+s.bossId+':'+s.battleRevision:'';if(key===lastKey)return;
 lastKey=key;const ticket=++generation;reset();party.forEach(releaseCharacter);party=[];
 if(enemy)release(enemy);enemy=null;activeId=null;
 if(!s.battle){modelStatus(false);return;}
 enemy=boss(s.bossId);enemy.position.set(2.15,.05,-3.0);enemy.scale.multiplyScalar(.84);scene.add(enemy);
 const tint=s.bossId==='devourer'?'#64183e':s.bossId==='observer'?'#39245e':'#501338';
 scene.background.set(tint);scene.fog.color.copy(scene.background);world.sky.material.uniforms.top.value.set(tint);
 world.sky.material.uniforms.horizon.value.set(s.bossId==='observer'?'#c971b2':'#ef6489');modelStatus(true);
 const loaded=await Promise.allSettled(s.players.map(p=>character(byId.get(p.id)||p)));
 const models=loaded.filter(x=>x.status==='fulfilled').map(x=>x.value);
 if(ticket!==generation){models.forEach(releaseCharacter);return;}
 party=models;
 // Keep the whole four-person formation in the 3D scene. The active unit is
 // brought forward and enlarged in frame(), while the other three remain in
 // the staggered line visible in the reference battle composition.
 for(const model of party){model.rotation.y=2.10;model.visible=true;scene.add(model);}
 const failed=loaded.find(x=>x.status==='rejected');
 if(failed){console.error('Anime character loading failed',failed.reason);modelStatus(false,'캐릭터를 불러오지 못했습니다. 화면을 새로고침해 주세요.');}else modelStatus(false);
}
function cast(actor,meta){
 if(!enemy)return;const model=actor.side==='enemy'?enemy:party.find(p=>p.userData.id===actor.id);if(!model)return;
 animation={model,start:performance.now(),duration:meta.total,windup:meta.windup,tier:meta.tier,support:meta.support,base:model.position.clone(),boss:actor.side==='enemy',deck:meta.deck,index:actor.index};fx.cast(model,meta,reduced());
}
function effects(events,meta){
 if(!enemy||!api.snapshot().battle)return;
 const s=api.snapshot(),source=meta?.boss?enemy:party.find(p=>p.userData.id===s.players[meta?.index]?.id)||party.find(p=>p.userData.id===s.activeId);
 for(const event of events){const target=event.side==='enemy'?enemy:party.find(p=>p.userData.id===event.id);if(target){if(target.userData.vrm)target.userData.reaction={kind:event.kind,until:performance.now()+650};fx.impact(target,event,meta,source,meta?.deck||s.deckId,reduced());}}
}
function frame(time){
 requestAnimationFrame(frame);if(document.hidden||lost){lastTime=time;return;}
 const dt=Math.min((time-lastTime)/1000,.05);lastTime=time;const s=api.snapshot();syncBattle(s);if(!s.battle)return;
 const t=time/1000;
 // Hold the active model through the complete cast and impact sequence.
 if(!animation&&s.players.some(p=>p.id===s.activeId))activeId=s.activeId;
 if(!s.players.some(p=>p.id===activeId&&!p.dead))activeId=s.players.find(p=>!p.dead)?.id;
 const halfWidth=(8.3-1.7)*Math.tan(34*Math.PI/360)*camera.aspect;
 const activeIndex=Math.max(0,s.players.findIndex(p=>p.id===activeId));
 const formation=[
  [-2.35,.48,.62],[-1.55,.28,.70],[-.75,.10,.78],[.05,-.08,.86]
 ];
 if(enemy)enemy.position.x=halfWidth*.67;
 for(let i=0;i<party.length;i++){
  const p=party[i],player=s.players.find(x=>x.id===p.userData.id);
  p.visible=!!player&&!player.dead;
  if(!p.visible)continue;
  const action=animation?.model===p?{phase:Math.min(1,(time-animation.start)/animation.duration),windup:animation.windup/animation.duration,support:animation.support}:null;
  const [x,z,depth]=formation[i]||[-1+i*.8,0,.75];
  const isActive=p.userData.id===activeId;
  if(animation?.model!==p){
   p.position.set(isActive?x-.18:x,z+(isActive?.42:0),depth+(isActive?.22:0));
  }
  p.scale.setScalar(isActive?1.14:.82);
  pose(p,t+i,action|| (s.preparedId===p.userData.id?{prepared:true}:null),reduced(),dt);
 }
 if(enemy)animateBoss(enemy,t,reduced());world.update(t,reduced());let zoom=0;
 if(animation){const a=animation,progress=Math.min(1,(time-a.start)/a.duration),swing=Math.sin(progress*Math.PI);
  if(!reduced()){if(!a.support){a.model.position.x=a.base.x+swing*(a.boss?-.34:.48);a.model.position.z=a.base.z-swing*(a.boss?-.18:.28);}if(a.tier===2)zoom=swing;}
  if(progress>=1){a.model.position.copy(a.base);animation=null;}
 }
 fx.update(dt);camera.position.set(-.15+zoom*.14,2.75,camera.aspect<1.2?12:8.3-zoom*.38);camera.lookAt(0,1.55,-1.0);
 bloom.render(scene,camera,reduced());lastDraw=bloom.lastInfo;
}
function init(){
 const canvas=document.createElement('canvas');canvas.id='archive3d';canvas.setAttribute('aria-label','애니메이션풍 3D 전투 장면');document.body.prepend(canvas);
 try{renderer=new T.WebGLRenderer({canvas,antialias:true,alpha:false,powerPreference:'high-performance'});}
 catch(e){canvas.remove();console.error('3D renderer unavailable',e);modelStatus(false,'3D 장면을 표시할 수 없습니다. 브라우저의 하드웨어 가속을 켜 주세요.');return;}
 renderer.setPixelRatio(Math.min(devicePixelRatio,innerWidth<1000?1.25:1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;
 scene=new T.Scene();scene.background=new T.Color('#360d25');scene.fog=new T.Fog('#360d25',18,46);camera=new T.PerspectiveCamera(34,1,.1,90);
 scene.add(new T.HemisphereLight('#fff4f3','#655273',1.55));
 const sun=new T.DirectionalLight('#fff5ef',1.35);sun.position.set(-3,8,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-8,right:8,top:8,bottom:-8});sun.shadow.bias=-.001;scene.add(sun);
 const rim=new T.DirectionalLight('#e4c3fc',.65);rim.position.set(3,4,-6);scene.add(rim);
 world=environment(scene);fx=new CombatFX(scene);bloom=new BloomPass(renderer);
 const resize=()=>{renderer.setSize(innerWidth,innerHeight);camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();bloom.resize(Math.round(innerWidth*renderer.getPixelRatio()),Math.round(innerHeight*renderer.getPixelRatio()));};addEventListener('resize',resize);resize();
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();lost=true;document.body.classList.remove('toon-ready');});
 canvas.addEventListener('webglcontextrestored',()=>{lost=false;document.body.classList.add('toon-ready');resize();});
 window.Archive3D={ready:true,cast,effects,reset,screenPoint(id){const p=enemy&&api.snapshot().players.every(p=>p.id!==id)?enemy:party.find(p=>p.userData.id===id&&p.visible);if(!p)return null;const v=p.position.clone().add(new T.Vector3(0,p===enemy?1.5:1.8,0)).project(camera);return {x:(v.x+1)*innerWidth/2,y:(1-v.y)*innerHeight/2};},stats:()=>({roster:roster.length,male:roster.filter(c=>c.gender==='male').length,portraits:cards.count(),models:party.length,loading,loadError,...fx.stats(),quality:'skinned-anime-v4',visibleModels:party.filter(p=>p.visible).length,activeModel:activeId,battleRevision:api.snapshot().battleRevision,modelKeys:party.map(p=>p.userData.key),drawCalls:lastDraw.calls,triangles:lastDraw.triangles,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures})};
 document.body.classList.add('toon-ready');modelStatus(false);requestAnimationFrame(frame);
}
init();
