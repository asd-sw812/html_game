const atlases=Array.from({length:6},(_,i)=>new URL(`./cards/card-atlas-${String(i+1).padStart(2,'0')}.webp`,import.meta.url).href);
export function installCardArt(roster){
 const byId=new Map(roster.map(c=>[c.id,c]));
 function sync(){
  document.querySelectorAll('[data-portrait-id]').forEach(el=>{
   const c=byId.get(el.dataset.portraitId);if(!c||el.querySelector('.illustrated-portrait'))return;
   const i=c.visualIndex,cell=i%16,art=document.createElement('span');
   art.className='illustrated-portrait';art.setAttribute('role','img');
   art.setAttribute('aria-label',`${c.gender==='male'?'남성':'여성'} 캐릭터 2D 일러스트`);
   art.style.setProperty('--card-atlas',`url("${atlases[Math.floor(i/16)]}")`);
   art.style.setProperty('--card-x',`${cell%4/3*100}%`);
   art.style.setProperty('--card-y',`${Math.floor(cell/4)/3*100}%`);
   el.querySelectorAll('img,.loadout-card-empty,.portrait-empty,.party-art-v2').forEach(n=>n.remove());
   el.prepend(art);
  });
 }
 new MutationObserver(sync).observe(document.body,{subtree:true,childList:true});sync();
 return {sync,count:()=>document.querySelectorAll('.illustrated-portrait').length};
}
