import * as T from '../vendor/three.module.js';

// Geometry helpers for abstract bosses, architecture and props only.
// Playable characters are skinned VRM assets in anime-characters.js.
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
// Merge static meshes within each joint by material; retain the articulated hierarchy.
function batch(root){root.traverse(group=>{if(!group.isGroup)return;const map=new Map();for(const m of [...group.children]){if(!m.isMesh||m.children.length)continue;m.updateMatrix();const key=m.material.uuid;if(!map.has(key))map.set(key,[]);map.get(key).push(m)}for(const meshes of map.values()){if(meshes.length<2)continue;const positions=[],normals=[],uvs=[];for(const m of meshes){const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);if(g.attributes.uv)uvs.push(...g.attributes.uv.array);else uvs.push(...new Array(g.attributes.position.count*2).fill(0));g.dispose();if(!m.geometry.userData.shared)m.geometry.dispose();m.removeFromParent()}const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(positions,3));g.setAttribute('normal',new T.Float32BufferAttribute(normals,3));g.setAttribute('uv',new T.Float32BufferAttribute(uvs,2));put(group,g,meshes[0].material);}})}
export function release(root){const gs=new Set(),ms=new Set();root.traverse(o=>{if(o.geometry&&!o.geometry.userData.shared)gs.add(o.geometry);if(o.material&&!o.material.userData.shared)ms.add(o.material)});gs.forEach(g=>g.dispose());ms.forEach(m=>{m.userData.ownedTexture?.dispose();m.dispose()});root.removeFromParent();}

export const sculpt={put,ell,cube,surface,tube,rod,ring,panel,ribbon,pleated,batch};
