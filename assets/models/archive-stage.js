import * as T from '../vendor/three.module.js';
import { sculpt as S, toon } from './toon-models.js';
const {put,ell,cube,surface,tube,rod,ring,panel,ribbon,batch}=S;
const porcelain='#d9d9e4',shadow='#222b49',gold='#b8a97d';
function plate(group,col,points,pos,scale=1){const p=panel(group,col,points,.035);p.position.set(...pos);p.scale.setScalar(scale);return p;}
function mask(group,col,pos,size=1){const g=new T.Group();g.position.set(...pos);g.scale.setScalar(size);group.add(g);
 const face=new T.SphereGeometry(1,32,24),v=face.attributes.position;for(let i=0;i<v.count;i++){const y=v.getY(i);v.setX(i,v.getX(i)*(.85+Math.min(0,y)*.28));}face.computeVertexNormals();put(g,face,porcelain,[0,0,0],[.14,.24,.10]);
 for(const s of [-1,1]){tube(g,shadow,[[s*.023,.035,.092],[s*.07,.032,.083],[s*.108,.048,.071]],.009);tube(g,col,[[s*.067,.015,.09],[s*.062,-.07,.088],[s*.077,-.10,.065]],.003)}
 tube(g,shadow,[[.012,.23,.045],[-.019,.14,.087],[.033,.062,.104],[.01,-.01,.107],[.043,-.078,.09]],.003);tube(g,shadow,[[-.024,-.14,.07],[0,-.147,.075],[.024,-.14,.07]],.003);return g;}
export function boss(id){const root=new T.Group(),core=new T.Group();root.add(core);const color=id==='devourer'?'#b75582':id==='observer'?'#b9a0e7':'#a2d9e6',bright=toon(color,true),satellites=[];
 if(id==='warden'){
 // A fractured porcelain shrine carried by a narrow articulated chassis.
 const spine=surface(core,shadow,[[.5,.09],[1,.16],[1.5,.13],[1.8,.23],[2.15,.16],[2.35,.045]],.70);
 for(let j=0;j<7;j++){const y=.98+j*.16,w=.34-Math.abs(j-3)*.037;for(const s of [-1,1]){
 const rib=plate(core,porcelain,[[0,.08],[s*w,.03],[s*(w+.09),-.09],[s*.11,-.115]], [s*.055,y,.085]);rib.rotation.z=s*(.12+j*.022);tube(core,gold,[[s*.10,y+.04,.14],[s*.25,y-.02,.16],[s*.31,y-.11,.13]],.004);}}
 mask(core,color,[0,2.25,.10],.93);
 for(const s of [-1,1]){const wing=new T.Group();wing.position.set(s*.38,1.90,-.10);wing.rotation.z=s*.30;core.add(wing);satellites.push(wing);for(let j=0;j<5;j++){const x=s*j*.135;plate(wing,j%2?porcelain:'#8996b4',[[0,0],[s*.145,.25],[s*.22,-.17-j*.07],[s*.075,-.51-j*.05]], [x,-j*.12,j*.012]);tube(wing,gold,[[x+s*.04,-j*.12,.05],[x+s*.10,-.32-j*.15,.045],[x+s*.075,-.48-j*.17,.043]],.004);}
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

export function environment(scene){const stage=new T.Group();scene.add(stage);const moving=[];
 // Expansive archive promenade with a platform, recessed inlay and repeated architecture.
 const floor=put(stage,new T.CylinderGeometry(8.8,9.1,.35,96),'#676d90',[0,-.205,-2]);floor.receiveShadow=true;
 for(let j=0;j<5;j++)ring(stage,j%2===0?toon('#879bb6',true):'#bbc1d0',2.4+j*1.34,.009,[0,-.023,-2],[Math.PI/2,0,0]);
 for(let j=0;j<40;j++){const a=j/40*Math.PI*2,x=Math.sin(a)*8.2,z=Math.cos(a)*8.2-2;const mark=cube(stage,'#b2b8d1',[x,-.018,z],[.017,.012,j%5===0?.30:.12]);mark.rotation.y=a;}
 for(let j=0;j<12;j++){const a=j/12*Math.PI*2;const points=[];for(let k=0;k<4;k++){const r=2.7+k*1.8;points.push([Math.cos(a)*r,-.016,Math.sin(a)*r-2])}tube(stage,'#47526e',points,.008);}
 for(let z=-15;z<=3;z+=3.4){for(const s of [-1,1]){const column=new T.Group();column.position.set(s*9,0,z);stage.add(column);cube(column,'#3f4967',[0,2.7,0],[.55,5.4,.64]);cube(column,'#8892ae',[0,.18,0],[.94,.36,.94]);cube(column,'#a6adc2',[0,5.41,0],[1.0,.14,1.0]);cube(column,'#bec4d8',[0,5.54,0],[.78,.13,.8]);for(const k of [-1,1])cube(column,'#697797',[k*.21,2.8,.325],[.025,4.8,.015]);cube(column,toon('#b6d0e3',true),[0,2.8,.328],[.035,4.65,.012]);
 const cross=new T.Group();cross.position.set(s*6.2,0,z);stage.add(cross);const a=ring(cross,'#6a7493',2.8,.075,[0,4.75,0]);a.scale.y=.87;cube(stage,'#465572',[s*9,5.7,z],[.8,.3,3.6]);}}
 for(let j=0;j<3;j++){const ring1=ring(stage,'#6e7793',4.0+j*.33,.08,[0,4.15,-13-j*.8]);ring1.scale.x=1.45;}
 const celestial=new T.Group();celestial.position.set(0,4.3,-15);stage.add(celestial);ring(celestial,toon('#d1c3e5',true),2.2,.008,[0,0,0]);ring(celestial,'#9698b6',1.95,.028,[0,0,0],[.5,.1,0]);moving.push(celestial);
 for(let j=0;j<36;j++){const a=j*2.399,r=5+(j%4)*1.3;const shard=put(stage,new T.OctahedronGeometry(.025+(j%3)*.025),toon(j%2?'#a4c7dc':'#cfbddd',true),[Math.sin(a)*r,1.3+(j%7)*.57,-5-Math.cos(a)*r]);moving.push(shard);}
 const sky=new T.Mesh(new T.SphereGeometry(46,40,24),new T.ShaderMaterial({side:T.BackSide,depthWrite:false,uniforms:{top:{value:new T.Color('#171e3b')},horizon:{value:new T.Color('#6c718f')}},vertexShader:'varying vec3 vWorld;void main(){vWorld=(modelMatrix*vec4(position,1.)).xyz;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'varying vec3 vWorld;uniform vec3 top;uniform vec3 horizon;void main(){float h=clamp(normalize(vWorld).y*.9+.20,0.,1.);gl_FragColor=vec4(mix(horizon,top,pow(h,.55)),1.);#include <colorspace_fragment> }'.replace(';#include',';\n#include').replace('> }','>\n}')}));sky.renderOrder=-10;stage.add(sky);
 batch(stage);return {stage,moving,sky,update(time,reduced){if(!reduced){celestial.rotation.z=time*.022;moving.slice(1).forEach((m,i)=>m.rotation.y=time*.14+i)}}};}
