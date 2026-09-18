import * as T from '../vendor/three.module.js';
import { sculpt as S, toon } from './toon-models.js';
const {put,ell,cube,surface,tube,rod,ring,panel,ribbon,batch}=S;
const porcelain='#e5dbe3',shadow='#282035',gold='#d2ae73';
function plate(group,col,points,pos,scale=1){const p=panel(group,col,points,.035);p.position.set(...pos);p.scale.setScalar(scale);return p;}
function mask(group,col,pos,size=1){const g=new T.Group();g.position.set(...pos);g.scale.setScalar(size);group.add(g);
 const face=new T.SphereGeometry(1,32,24),v=face.attributes.position;for(let i=0;i<v.count;i++){const y=v.getY(i);v.setX(i,v.getX(i)*(.85+Math.min(0,y)*.28));}face.computeVertexNormals();put(g,face,porcelain,[0,0,0],[.14,.24,.10]);
 for(const s of [-1,1]){tube(g,shadow,[[s*.023,.035,.092],[s*.07,.032,.083],[s*.108,.048,.071]],.009);tube(g,col,[[s*.067,.015,.09],[s*.062,-.07,.088],[s*.077,-.10,.065]],.003)}
 tube(g,shadow,[[.012,.23,.045],[-.019,.14,.087],[.033,.062,.104],[.01,-.01,.107],[.043,-.078,.09]],.003);tube(g,shadow,[[-.024,-.14,.07],[0,-.147,.075],[.024,-.14,.07]],.003);return g;}
export function boss(id){const root=new T.Group(),core=new T.Group();root.add(core);const color=id==='devourer'?'#b75582':id==='observer'?'#b9a0e7':'#ffc47d',bright=toon(color,true),satellites=[];
 if(id==='warden'){
 // A fractured porcelain shrine carried by a narrow articulated chassis.
 const spine=surface(core,shadow,[[.5,.09],[1,.16],[1.5,.13],[1.8,.23],[2.15,.16],[2.35,.045]],.70);
 for(let j=0;j<7;j++){const y=.98+j*.16,w=.34-Math.abs(j-3)*.037;for(const s of [-1,1]){
 const rib=plate(core,porcelain,[[0,.08],[s*w,.03],[s*(w+.09),-.09],[s*.11,-.115]], [s*.055,y,.085]);rib.rotation.z=s*(.12+j*.022);tube(core,gold,[[s*.10,y+.04,.14],[s*.25,y-.02,.16],[s*.31,y-.11,.13]],.004);}}
 mask(core,color,[0,2.25,.10],.93);
 ring(core,bright,.29,.008,[0,2.28,-.07]);
 for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const crown=plate(core,bright,[[-.035,0],[0,.18],[.035,0]],[Math.cos(a)*.29,2.28+Math.sin(a)*.29,-.09]);crown.rotation.z=a-Math.PI/2;}
 for(const s of [-1,1]){const wing=new T.Group();wing.position.set(s*.30,1.96,-.18);wing.rotation.z=s*.12;core.add(wing);satellites.push(wing);for(let j=0;j<6;j++){
  const x=s*j*.10,y=-j*.135;
  const feather=[[0,0],[s*.16,.16],[s*.48,.29],[s*(1.02-j*.045),.73-j*.035],[s*.73,.13],[s*.54,-.12],[s*.20,-.28],[s*.06,-.24]];
  plate(wing,s>0?'#40213e':j%2?'#c09767':'#ead3a3',feather,[x,y,j*.012]);
  tube(wing,bright,feather.concat([feather[0]]).map(([px,py])=>[px+x,py+y,.05+j*.012]),.006);
  tube(wing,gold,[[x+s*.08,y-.10,.055+j*.012],[x+s*.4,y+.12,.055+j*.012],[x+s*.78,y+.42,.055+j*.012]],.005);
 }
 const upper=[s*.15,.94,0],knee=[s*.26,.5,-.02],ankle=[s*.34,.12,.12];rod(core,shadow,upper,knee,.055);rod(core,porcelain,knee,ankle,.045,.055);ell(core,gold,knee,[.06,.06,.06]);plate(core,porcelain,[[0,.17],[s*.105,-.1],[-s*.043,-.2]], [s*.34,.16,.15]);
 mask(core,color,[s*.52,1.62,.17],.52);}
 ring(core,gold,.18,.012,[0,1.54,.245]);put(core,new T.OctahedronGeometry(.16),bright,[0,1.54,.245],[.6,1,.4]);
 }else if(id==='devourer'){
 // Nested nonhuman jaws and petal-shaped ceramic armor, with an empty throat.
 ell(core,shadow,[0,1.48,-.08],[.63,.72,.33]);
 for(let tier=0;tier<3;tier++){const radius=.26+tier*.18,loop=ring(core,tier===1?porcelain:shadow,radius,.039,[0,1.48,.21-tier*.07]);loop.scale.y=1.2;for(let j=0;j<15+tier*4;j++){const a=j/(15+tier*4)*Math.PI*2,tip=put(core,new T.ConeGeometry(.028+tier*.004,.13+tier*.028,6),porcelain,[Math.cos(a)*radius,1.48+Math.sin(a)*radius*1.2,.245-tier*.05]);tip.rotation.z=a+Math.PI/2;}}
 for(let j=0;j<11;j++){const a=j/11*Math.PI*2,petal=new T.Group();petal.position.set(Math.cos(a)*.52,1.48+Math.sin(a)*.59,-.04);petal.rotation.z=a-Math.PI/2;core.add(petal);satellites.push(petal);
 plate(petal,j%3===0?color:porcelain,[[-.14,0],[-.19,.35],[-.10,.65],[.02,.87],[.12,.50],[.14,.08]],[0,0,0]);tube(petal,gold,[[0,.05,.045],[-.07,.32,.044],[.01,.70,.043]],.006);
 const angle=a+.16;tube(core,shadow,[[Math.cos(a)*.4,1.48+Math.sin(a)*.4,-.15],[Math.cos(angle)*1.03,1.46+Math.sin(angle)*.95,-.35],[Math.cos(angle+.3)*1.17,1.1+Math.sin(angle+.3)*1.01,-.12]],.023);}
 for(const s of [-1,1])mask(core,color,[s*.55,1.95,.25],.55);
 put(core,new T.IcosahedronGeometry(.16,2),bright,[0,1.48,-.04],[.7,1,.7]);
 }else{
 // Suspended astrolabe: three independent gyroscopes, lens and orbiting masks.
 ell(core,porcelain,[0,1.55,0],[.45,.27,.19]);ell(core,shadow,[0,1.56,.155],[.34,.175,.050]);ell(core,bright,[0,1.56,.20],[.133,.15,.019]);ell(core,shadow,[0,1.56,.221],[.020,.129,.011]);ell(core,'#fff6ec',[-.048,1.61,.224],[.015,.022,.008]);
 for(let j=0;j<3;j++){const orbit=new T.Group();orbit.position.y=1.55;orbit.rotation.set(.25+j*.67,.1+j*.75,j*.48);core.add(orbit);satellites.push(orbit);ring(orbit,j===1?porcelain:gold,.79+j*.16,.012,[0,0,0]);for(let k=0;k<16;k++){const a=k/16*Math.PI*2,r=.79+j*.16;const bar=cube(orbit,porcelain,[Math.cos(a)*r,Math.sin(a)*r,0],[.012,k%4===0?.07:.034,.017]);bar.rotation.z=a-Math.PI/2;}}
 for(let j=0;j<7;j++){const a=j/7*Math.PI*2;const m=mask(core,color,[Math.cos(a)*.90,1.55+Math.sin(a)*.86,-.05],.54);m.rotation.z=a+.5;}
 for(const s of [-1,1]){ribbon(core,porcelain,[[s*.2,1.33,-.04],[s*.58,.91,-.04],[s*.69,.36,.08]],.14,.028,s*.6);tube(core,gold,[[s*.26,1.22,.02],[s*.52,.9,.02],[s*.65,.43,.13]],.005);}
 }
 const halo=ring(root,toon(color,true),1.40,.006,[0,1.55,-.34]);root.userData={core,halo,satellites,id,modelV2:true};root.scale.setScalar(1.29);batch(root);return root;
}
export function animateBoss(enemy,time,reduced=false){const d=enemy.userData;d.core.position.y=reduced?0:Math.sin(time*.9)*.042;d.halo.rotation.z=reduced?0:time*.04;d.satellites.forEach((g,i)=>{if(d.id==='observer'){g.rotation.z=(reduced?0:time*.13*(i%2?1:-1))+i*.48;}else{g.rotation.x=reduced?0:Math.sin(time*1.2+i)*.045}});}

export function environment(scene){
 const stage=new T.Group();scene.add(stage);const moving=[];
 const floor=put(stage,new T.CylinderGeometry(9.5,9.8,.38,96),'#9a304c',[0,-.23,-2]);floor.receiveShadow=true;
 const rim=toon('#dcad86',true);
 for(let j=0;j<4;j++)ring(stage,j===3?rim:'#ac7c70',3.4+j*1.7,j===3?.018:.009,[0,-.022,-2],[Math.PI/2,0,0]);
 for(let j=0;j<48;j++){
  const a=j/48*Math.PI*2,r=8.5;const mark=cube(stage,j%4? '#886067':rim,[Math.sin(a)*r,-.019,Math.cos(a)*r-2],[.019,.011,j%4?.13:.30]);mark.rotation.y=a;
 }
 for(let j=0;j<12;j++){
  const a=j/12*Math.PI*2;tube(stage,'#473440',[[Math.sin(a)*3.4,-.017,Math.cos(a)*3.4-2],[Math.sin(a)*8.5,-.017,Math.cos(a)*8.5-2]],.011);
 }
 // Raised enamel discs and engraved arcs give the fighters grounded positions.
 for(const [x,z,r] of [[2.25,-3,2.0],[-1.5,1.7,1.15]]){
  put(stage,new T.CylinderGeometry(r,r,.03,72),'#ae435e',[x,-.017,z]);
  ring(stage,'#e9a1ab',r-.1,.014,[x,.004,z],[Math.PI/2,0,0]);
  ring(stage,'#d96f87',r-.24,.009,[x,.005,z],[Math.PI/2,0,0]);
 }
 // Luminous suspended strands and flower-shaped lanterns cross the middle depth.
 const light=toon('#efdaff',true),deep='#694266';
 for(let j=0;j<7;j++){
  const x=-9+j*3,z=-7-Math.sin(j*.8)*1.4,h=2.4+(j%3)*.38;
  const post=new T.Group();post.position.set(x,0,z);stage.add(post);
  cube(post,deep,[0,h/2,0],[.18,h,.2]);cube(post,'#b888a8',[0,.12,0],[.42,.24,.42]);
  ring(post,'#e8b9cd',.18,.025,[0,h-.1,0],[Math.PI/2,0,0]);
  for(let k=0;k<5;k++){const a=k/5*Math.PI*2;put(post,new T.OctahedronGeometry(.13),light,[Math.cos(a)*.15,h+.22+Math.sin(a)*.15,0],[1,1,.5]);}
  if(j<6){const nx=x+3,nz=-7-Math.sin((j+1)*.8)*1.4,nh=2.4+((j+1)%3)*.38;
   for(let k=0;k<3;k++)tube(stage,k===1?'#edd3ec':'#a993ca',[[x,h-k*.12,z],[x+.75,h-.65-k*.12,z+.06],[x+1.5,(h+nh)/2-.85-k*.12,(z+nz)/2],[nx-.75,nh-.65-k*.12,nz+.06],[nx,nh-k*.12,nz]],k===1?.016:.011);
  }
 }
 // Three depth layers of abstract archive ruins. They are actual scene geometry.
 for(let layer=0;layer<3;layer++)for(let j=0;j<25;j++){
  const x=(j-12)*1.75,z=-15-layer*5-(j%3)*.7,h=.7+((j*13+layer*7)%17)*.28;
  const g=new T.Group();g.position.set(x,-.3,z);stage.add(g);
  const shade=['#512244','#783452','#9e4368'][layer];
  cube(g,shade,[0,h/2,0],[.35+(j%3)*.15,h,.75]);
  const crown=put(g,new T.ConeGeometry(.28,h*.18,4),shade,[0,h+h*.09,0]);crown.rotation.z=(j%3-1)*.2;
  cube(g,shade,[-.30,h*.37,.15],[.18,h*.75,.4]);
  if(j%3===0)cube(g,'#a45255',[.1,h*.68,.385],[.018,h*.45,.012]);
 }
 for(const [x,z,h,tilt] of [[-6,-7,10,.07],[-11,-17,15,-.08],[7.5,-12,12,-.04],[13,-22,18,.06]]){
  const tower=new T.Group();tower.position.set(x,-.5,z);tower.rotation.z=tilt;stage.add(tower);
  cube(tower,'#352135',[0,h/2,0],[.80,h,1.12]);cube(tower,'#51283c',[.52,h*.44,.08],[.19,h*.88,.86]);
  cube(tower,'#b55e5e',[-.35,h*.45,.57],[.025,h*.83,.016]);
  for(let k=0;k<6;k++)cube(tower,'#422238',[.2+(k%2)*.3,h*.12+k*.9,.6],[.25,.9,.22]);
 }
 // Floating slabs, broken halos and a warm horizon establish scale without a room-like ceiling.
 for(let j=0;j<16;j++){
  const shard=cube(stage,'#593348',[(j%2?1:-1)*(5+j*.37),2.7+(j%5)*1.3,-8-(j%6)*1.5],[.12,.6+(j%3)*.4,.27]);
  shard.rotation.set(.1,j*.6,.15);moving.push(shard);
 }
 const celestial=new T.Group();celestial.position.set(3.5,5.7,-23);stage.add(celestial);
 ring(celestial,toon('#ffce93',true),3.7,.018,[0,0,0]);ring(celestial,'#ba7668',4.05,.014,[0,0,-.1]);
 for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const mark=cube(celestial,rim,[Math.cos(a)*3.7,Math.sin(a)*3.7,0],[.012,.16,.012]);mark.rotation.z=a-Math.PI/2;}
 for(let j=0;j<22;j++){
  const a=j*2.399,r=5+(j%5)*.8;const shard=put(stage,new T.OctahedronGeometry(.015+(j%3)*.012),toon('#f8c59a',true),[Math.sin(a)*r,.6+(j%8)*.54,-6-Math.cos(a)*r]);moving.push(shard);
 }
 const sky=new T.Mesh(new T.SphereGeometry(46,32,20),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#481923')},horizon:{value:new T.Color('#dc725d')}},vertexShader:'varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:`
 varying vec3 vWorld;uniform vec3 top;uniform vec3 horizon;
 float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
 float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(hash(i),hash(i+vec2(1,0)),f.x),mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x),f.y);}
 float cloudNoise(vec2 p){return noise(p)*.53+noise(p*2.1)*.26+noise(p*4.3)*.13+noise(p*8.7)*.08;}
 void main(){vec3 d=normalize(vWorld);float h=clamp(d.y*.95+.14,0.,1.);vec3 color=mix(horizon,top,pow(h,.62));
 float curve=d.y*.9+d.x*.20+sin(d.x*5.)*.04;
 float cloud=(1.-smoothstep(0.,.020,abs(curve-.48)))*smoothstep(-.5,.8,d.x);
 float cloud2=1.-smoothstep(0.,.014,abs(curve-.63));
 float mist=cloudNoise(d.xy*vec2(9.,14.)+vec2(1.3,2.1));
 float glow=exp(-length((d.xy-vec2(.24,.28))*vec2(1.5,2.0))*2.4);
 color=mix(color,vec3(.92,.18,.48),glow*.62);
 color+=vec3(.55,.17,.29)*smoothstep(.45,.78,mist)*glow;
 color+=vec3(.42,.18,.30)*(cloud*.35+cloud2*.15);
 gl_FragColor=vec4(color,1.);
 #include <colorspace_fragment>
 }`}));sky.renderOrder=-10;stage.add(sky);
 batch(stage);return {stage,moving,sky,update(time,reduced){if(!reduced){celestial.rotation.z=time*.006;moving.forEach((m,i)=>{m.rotation.y=time*.05+i;});}}};
}
