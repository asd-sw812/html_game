import * as T from '../vendor/three.module.js';
const V=(x=0,y=0,z=0)=>new T.Vector3(x,y,z),temp=new T.Object3D();
const PALETTES={bullet:'#f6cf86',poison:'#98cc8b',counter:'#a9d9f1',follow:'#bcaaf9',freeze:'#a0e3ff',lifesteal:'#de8bb9',bounce:'#f0b998',hp:'#ee919b',speed:'#a9eadd',debuff:'#c9a3ee',ult:'#ddb0f3',enhance:'#efb5d6',skill:'#adbef5',execute:'#c48db9',crit:'#f5d1b0',cleanse:'#ccebe5',burn:'#f5a681',bleed:'#eb929e',electric:'#eaddac',defense:'#b4cadf',radiance:'#f5e4b8',wave:'#8fd5ea',tree:'#b8d599',wind:'#b1e6d8'};
const FAMILIES={bullet:'ballistic',poison:'mist',counter:'guard',follow:'prism',freeze:'crystal',lifesteal:'vortex',bounce:'prism',hp:'vortex',speed:'wind',debuff:'rune',ult:'rune',enhance:'prism',skill:'rune',execute:'crystal',crit:'ballistic',cleanse:'guard',burn:'fire',bleed:'crystal',electric:'electric',defense:'guard',radiance:'radiant',wave:'wave',tree:'petal',wind:'wind'};
export class CombatFX{
 constructor(scene){this.scene=scene;this.items=[];this.effects=[];this.seed=7419;this.limit=220;this.reduced=false;
 const geometry=new T.OctahedronGeometry(1);geometry.setAttribute('aOpacity',new T.InstancedBufferAttribute(new Float32Array(this.limit),1));const material=new T.MeshBasicMaterial({color:'#ffffff',transparent:true,depthWrite:false,blending:T.AdditiveBlending});
 material.onBeforeCompile=shader=>{shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nattribute float aOpacity;varying float vOpacity;').replace('#include <begin_vertex>','#include <begin_vertex>\nvOpacity=aOpacity;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying float vOpacity;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vOpacity;');};
 this.mesh=new T.InstancedMesh(geometry,material,this.limit);this.mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);this.mesh.frustumCulled=false;this.mesh.count=0;scene.add(this.mesh);this.light=new T.PointLight('#d3eaff',0,6,2);scene.add(this.light);this.flash=0;
 }
 rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
 point(model,height=1.25){return model.position.clone().add(V(0,height,0));}
 particle(position,color,velocity,life,size=[.025,.055,.025],gravity=.5){if(this.items.length>=this.limit)return;this.items.push({position:position.clone(),color:new T.Color(color),velocity:velocity.clone(),life,total:life,size:V(...size),gravity,rotation:V(this.rand()*6,this.rand()*6,this.rand()*6)});}
 shape(geometry,color,origin,life,scale=1){if(this.effects.length>=32){geometry.dispose();return null;}const mat=new T.MeshBasicMaterial({color,transparent:true,opacity:.8,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide});const o=new T.Mesh(geometry,mat);o.position.copy(origin);o.scale.setScalar(scale);this.scene.add(o);this.effects.push({object:o,life,total:life,scale,expand:0,spin:0});return this.effects.at(-1);}
 ring(origin,color,r=.5,flat=false,life=.55){const effect=this.shape(new T.TorusGeometry(r,.008,6,64),color,origin,life);if(effect){effect.object.rotation.x=flat?Math.PI/2:0;effect.expand=1.4;}return effect;}
 trail(start,end,color,bend=0,thickness=.016,life=.23){const mid=start.clone().lerp(end,.5);mid.y+=bend;const curve=new T.CatmullRomCurve3([start,mid,end]);return this.shape(new T.TubeGeometry(curve,18,thickness,5,false),color,V(),life);}
 cast(model,meta,reduced){this.reduced=reduced;if(reduced)return;const color=meta.boss?'#e7a5c7':PALETTES[meta.deck]||'#aecff5',p=this.point(model,.1);
 if(meta.support||meta.tier===2){const e=this.ring(p,color,meta.tier===2?.58:.36,true,meta.windup/1000+.25);if(e){e.expand=.35;e.spin=.20;}}
 if(meta.tier===2){for(let j=0;j<24;j++){const a=j/24*Math.PI*2,position=p.clone().add(V(Math.cos(a)*.6,.02,Math.sin(a)*.6));this.particle(position,color,V(-Math.cos(a)*.15,1.1,-Math.sin(a)*.15),.50,[.012,.042,.012],0);}}
 }
 impact(model,event,meta,source,deck,reduced){this.reduced=reduced;const p=this.point(model,event.side==='enemy'?1.65:1.35),color=meta?.boss?'#e7a5c7':PALETTES[deck]||'#bdd5f0',family=FAMILIES[deck]||'rune',tier=meta?.tier||0;
 if(event.kind==='damage'&&(event.amount>0||event.shield>0)){
 this.light.color.set(color);this.light.position.copy(p);this.flash=Math.max(this.flash,reduced?.06:.19);
 const count=reduced?6:tier===2?54:24;for(let j=0;j<count;j++){const a=this.rand()*Math.PI*2,speed=.7+this.rand()*2.2,velocity=V(Math.cos(a)*speed,(this.rand()-.24)*3,Math.sin(a)*speed),size=['ballistic','electric'].includes(family)?[.008,.12,.008]:family==='crystal'?[.035,.14,.020]:[.020,.035,.018];this.particle(p,color,velocity,.35+this.rand()*.5,size,family==='fire'?-.5:.6);}
 if(reduced)return;
 if(source&&!event.dot){const start=this.point(source,1.45);if(family==='electric'){const pts=[];for(let i=0;i<=12;i++){const q=start.clone().lerp(p,i/12);if(i>0&&i<12){q.y+=(this.rand()-.5)*.38;q.z+=(this.rand()-.5)*.3;}pts.push(q);}this.shape(new T.TubeGeometry(new T.CatmullRomCurve3(pts),42,.012,5,false),color,V(),.21);}else if(['ballistic','radiant'].includes(family)){this.trail(start,p,color,0,.012);}else this.trail(start,p,color,['wave','mist','petal'].includes(family)?.65:.25,.012,.30);}
 if(['wave','wind','vortex'].includes(family)){for(let j=0;j<3;j++){const r=this.ring(p.clone().add(V(0,(j-1)*.23,0)),color,.30+j*.16,family==='wave',.7);if(r){r.spin=(j%2?1:-1)*1.2;r.expand=1.5;}}}
 if(['rune','prism','radiant','guard'].includes(family)){const e=this.shape(new T.IcosahedronGeometry(.38,0),color,p,.45);if(e){e.object.material.wireframe=true;e.expand=1.2;e.spin=.8;}}
 if(['crystal','petal'].includes(family)){for(let j=0;j<7;j++){const a=j/7*Math.PI*2;const o=this.shape(new T.ConeGeometry(.075,.6,4),color,p.clone().add(V(Math.cos(a)*.35,-.7,Math.sin(a)*.35)),.48);if(o){o.object.rotation.z=Math.cos(a)*.45;o.expand=.15;}}}
 if(family==='mist'||family==='fire'){for(let j=0;j<5;j++){const e=this.ring(p.clone().add(V(0,-.5+j*.18,0)),color,.12+j*.08,true,.60);if(e)e.expand=1.9;}}
 }else if(['heal','buff','shield'].includes(event.kind)){
 const col=event.kind==='heal'?'#a9eccd':'#b8d2ef';if(event.kind==='shield'){const e=this.shape(new T.IcosahedronGeometry(.68,1),col,this.point(model,1.05),reduced?.3:.9);if(e)e.object.material.wireframe=true;}
 for(let j=0;j<(reduced?1:3);j++)this.ring(this.point(model,.3+j*.35),col,.35,true,.7);for(let j=0;j<(reduced?3:12);j++){const a=this.rand()*6.283;this.particle(this.point(model,.2).add(V(Math.cos(a)*.4,0,Math.sin(a)*.4)),col,V(0,.8+this.rand()*.6,0),.9,[.014,.05,.014],0);}
 }
 }
 update(dt){for(let i=this.items.length-1;i>=0;i--){const p=this.items[i];p.life-=dt;if(p.life<=0){this.items.splice(i,1);continue;}p.velocity.y-=p.gravity*dt;p.position.addScaledVector(p.velocity,dt);p.rotation.x+=dt*.6;p.rotation.z+=dt*.5;}
 this.items.forEach((p,i)=>{temp.position.copy(p.position);temp.rotation.set(p.rotation.x,p.rotation.y,p.rotation.z);temp.scale.copy(p.size).multiplyScalar(.7+.3*p.life/p.total);temp.updateMatrix();this.mesh.setMatrixAt(i,temp.matrix);this.mesh.setColorAt(i,p.color);this.mesh.geometry.attributes.aOpacity.setX(i,Math.min(1,p.life/p.total*2));});this.mesh.count=this.items.length;this.mesh.instanceMatrix.needsUpdate=true;if(this.mesh.instanceColor)this.mesh.instanceColor.needsUpdate=true;this.mesh.geometry.attributes.aOpacity.needsUpdate=true;
 for(let i=this.effects.length-1;i>=0;i--){const e=this.effects[i];e.life-=dt;if(e.life<=0){e.object.geometry.dispose();e.object.material.dispose();e.object.removeFromParent();this.effects.splice(i,1);continue;}const f=1-e.life/e.total;e.object.material.opacity=(1-f)*.76;e.object.scale.setScalar(e.scale*(1+f*e.expand));e.object.rotation.y+=dt*e.spin;}
 this.flash=Math.max(0,this.flash-dt);this.light.intensity=this.reduced?0:this.flash*10;
 }
 reset(){this.items=[];this.mesh.count=0;for(const e of this.effects){e.object.geometry.dispose();e.object.material.dispose();e.object.removeFromParent()}this.effects=[];this.flash=0;this.light.intensity=0;}
 stats(){return{particles:this.items.length,effectMeshes:this.effects.length}};
}

// Small bloom pass: half-resolution bright extraction and two separable blur passes.
export class BloomPass{
 constructor(renderer){this.renderer=renderer;this.target=new T.WebGLRenderTarget(1,1,{samples:2});this.a=new T.WebGLRenderTarget(1,1,{depthBuffer:false});this.b=new T.WebGLRenderTarget(1,1,{depthBuffer:false});this.scene=new T.Scene();this.camera=new T.OrthographicCamera(-1,1,1,-1,0,1);const vertex='varying vec2 uv1;void main(){uv1=uv;gl_Position=vec4(position.xy,0.,1.);}';
 this.extract=new T.ShaderMaterial({uniforms:{src:{value:null}},vertexShader:vertex,fragmentShader:'varying vec2 uv1;uniform sampler2D src;void main(){vec3 c=texture2D(src,uv1).rgb;float l=max(c.r,max(c.g,c.b));gl_FragColor=vec4(c*smoothstep(.75,1.,l),1.);}'});
 this.blur=new T.ShaderMaterial({uniforms:{src:{value:null},axis:{value:new T.Vector2()}},vertexShader:vertex,fragmentShader:'varying vec2 uv1;uniform sampler2D src;uniform vec2 axis;void main(){vec3 c=texture2D(src,uv1).rgb*.227027;c+=(texture2D(src,uv1+axis*1.384615).rgb+texture2D(src,uv1-axis*1.384615).rgb)*.316216;c+=(texture2D(src,uv1+axis*3.230769).rgb+texture2D(src,uv1-axis*3.230769).rgb)*.070270;gl_FragColor=vec4(c,1.);}'});
 this.combine=new T.ShaderMaterial({uniforms:{src:{value:null},glow:{value:null},strength:{value:.14}},vertexShader:vertex,fragmentShader:'varying vec2 uv1;uniform sampler2D src;uniform sampler2D glow;uniform float strength;void main(){vec3 c=texture2D(src,uv1).rgb+texture2D(glow,uv1).rgb*strength;float v=smoothstep(.9,.22,length((uv1-.5)*vec2(.9,1.)));c*=.89+.11*v;gl_FragColor=vec4(c,1.);\n#include <colorspace_fragment>\n}'});
 this.quad=new T.Mesh(new T.PlaneGeometry(2,2),this.extract);this.scene.add(this.quad);}
 resize(w,h){this.target.setSize(w,h);this.a.setSize(Math.max(1,w>>1),Math.max(1,h>>1));this.b.setSize(Math.max(1,w>>1),Math.max(1,h>>1));}
 pass(material,target){this.quad.material=material;this.renderer.setRenderTarget(target);this.renderer.render(this.scene,this.camera);}
 render(scene,camera,reduced){const r=this.renderer;r.setRenderTarget(this.target);r.render(scene,camera);this.lastInfo={calls:r.info.render.calls,triangles:r.info.render.triangles};this.extract.uniforms.src.value=this.target.texture;this.pass(this.extract,this.a);this.blur.uniforms.src.value=this.a.texture;this.blur.uniforms.axis.value.set(1/this.a.width,0);this.pass(this.blur,this.b);this.blur.uniforms.src.value=this.b.texture;this.blur.uniforms.axis.value.set(0,1/this.b.height);this.pass(this.blur,this.a);this.combine.uniforms.src.value=this.target.texture;this.combine.uniforms.glow.value=this.a.texture;this.combine.uniforms.strength.value=reduced?.06:.13;this.pass(this.combine,null);}
}
