import * as T from '../vendor/three.module.js';
import {GLTFLoader} from '../vendor/GLTFLoader.js';
import {VRMLoaderPlugin,VRMUtils} from '../vendor/three-vrm.module.js';

// Real skinned anime meshes, painted facial textures and MToon materials.
// Source models and redistribution terms: ../characters/LICENSE.md.
const loader=new GLTFLoader();
loader.register(parser=>new VRMLoaderPlugin(parser));
const files=new Map();
const archetypes=['aurora','amber','lune','velvet'];
export function modelKey(c){return c.gender==='male'?'noctis':archetypes[c.visualIndex%4];}
function bytes(key){
 if(!files.has(key))files.set(key,fetch(new URL(`../characters/${key}.vrm`,import.meta.url)).then(r=>{if(!r.ok)throw new Error(`Model ${key}: ${r.status}`);return r.arrayBuffer();}).catch(e=>{files.delete(key);throw e;}));
 return files.get(key);
}
export function preloadCharacters(chars){return Promise.allSettled([...new Set(chars.map(modelKey))].map(bytes));}
export async function character(c){
 const key=modelKey(c),data=await bytes(key);
 const gltf=await loader.parseAsync(data.slice(0),'');
 const vrm=gltf.userData.vrm;
 if(!vrm)throw new Error(`Missing VRM humanoid: ${key}`);
 VRMUtils.removeUnnecessaryVertices(gltf.scene);
 VRMUtils.combineSkeletons(gltf.scene);
 VRMUtils.combineMorphs(vrm);
 VRMUtils.rotateVRM0(vrm);
 const root=new T.Group();root.add(vrm.scene);
 const box=new T.Box3().setFromObject(vrm.scene),height=box.max.y-box.min.y;
 vrm.scene.scale.setScalar(3.05/height);
 vrm.scene.position.y=-box.min.y*vrm.scene.scale.x;
 root.userData={id:c.id,vrm,key,deck:c.deckId,appearance:{height:1},baseY:vrm.humanoid.getNormalizedBoneNode('hips').position.y};
 vrm.scene.traverse(o=>{
  if(!o.isMesh)return;
  o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;
  for(const m of [o.material].flat()){
   if(m.isMToonMaterial){
    m.shadingToonyFactor=.93;m.shadingShiftFactor=-.08;
    m.outlineWidthFactor=Math.min(m.outlineWidthFactor||.0015,.0020);
    m.outlineColorFactor?.set('#403345');
    // Preserve painted skin / eyes. Tint only the outfit, very subtly.
    if(/cloth|onepiece|tops|bottoms|coat/i.test(m.name))m.color.lerp(new T.Color(c.visualAccent||'#ffffff'),.12);
   }
  }
 });
 pose(root,0,null,true,0);
 vrm.springBoneManager?.reset();
 return root;
}
function rotation(vrm,name,x=0,y=0,z=0){const node=vrm.humanoid.getNormalizedBoneNode(name);if(node)node.rotation.set(x,y,z);}
export function pose(root,time,action=null,reduced=false,dt=1/60){
 const {vrm,baseY}=root.userData;if(!vrm)return;
 const breathe=reduced?0:Math.sin(time*1.8)*.007;
 const hips=vrm.humanoid.getNormalizedBoneNode('hips');hips.position.y=baseY+breathe;
 let reach=0,strike=0;
 if(action?.prepared){reach=.38;}
 else if(action){const p=action.phase,w=Math.max(.12,action.windup||.4);reach=p<w?Math.sin(p/w*Math.PI/2):Math.cos(Math.min(1,(p-w)/(1-w))*Math.PI/2);strike=p>w?Math.sin((p-w)/(1-w)*Math.PI):0;}
 rotation(vrm,'hips',0,-.08,0);
 rotation(vrm,'spine',.025+strike*.08,-reach*.12,breathe);
 rotation(vrm,'chest',0,reach*.22,0);
 rotation(vrm,'neck',0,.04,0);
 rotation(vrm,'head',-.015,-.25+reach*.12,-.035);
 rotation(vrm,'leftUpperArm',-.12-reach*.40,0,1.10-reach*.6);
 const rifle=root.userData.deck==='bullet'&&!action?.support;
 rotation(vrm,'rightUpperArm',-.30-reach*(rifle?1.10:.85),-reach*.20,-1.08+reach*.68);
 rotation(vrm,'leftLowerArm',-.22,0,.12+reach*.35);
 rotation(vrm,'rightLowerArm',-.28-reach*.32,0,-.10);
 rotation(vrm,'leftHand',0,.06,-.04);
 rotation(vrm,'rightHand',0,-.12,.05);
 rotation(vrm,'leftUpperLeg',-.045-strike*.08,0,-.025);
 rotation(vrm,'rightUpperLeg',.045+strike*.07,0,.04);
 rotation(vrm,'leftLowerLeg',.055+strike*.1,0,0);
 rotation(vrm,'rightLowerLeg',.02,0,0);
 const reaction=root.userData.reaction;
 if(reaction&&reaction.until>performance.now()){const k=Math.sin((reaction.until-performance.now())/650*Math.PI);if(reaction.kind==='damage'){rotation(vrm,'spine',-.12*k,.08*k,0);vrm.expressionManager?.setValue('angry',k*.45);}else{vrm.expressionManager?.setValue('happy',k*.2);}}else{vrm.expressionManager?.setValue('angry',0);vrm.expressionManager?.setValue('happy',0);}
 const blink=reduced?0:Math.max(0,1-Math.abs((time%4.8)-4.55)/.095);
 vrm.expressionManager?.setValue('blink',blink);
 vrm.update(Math.min(dt,.04));
}
export function releaseCharacter(root){
 if(!root)return;root.removeFromParent();
 if(root.userData.vrm)VRMUtils.deepDispose(root.userData.vrm.scene);
}
