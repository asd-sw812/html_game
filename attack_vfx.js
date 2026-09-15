// Attack impact VFX module
(() => {
  const STYLE_ID='attack-vfx-style';
  const LAYER_ID='attack-vfx-layer';
  function setup(){
    if(!document.getElementById(STYLE_ID)){
      const s=document.createElement('style');
      s.id=STYLE_ID;
      s.textContent=`#${LAYER_ID}{position:fixed;inset:0;z-index:999;pointer-events:none;overflow:hidden}.attack-impact{position:absolute;width:190px;height:190px;translate:-50% -50%;pointer-events:none;mix-blend-mode:screen}.attack-impact:before{content:"";position:absolute;inset:28%;border:3px solid #fff2bd;border-radius:50%;box-shadow:0 0 18px #ffc85e;animation:impactRing .42s ease-out forwards}.attack-impact:after{content:"";position:absolute;left:10%;top:49%;width:80%;height:6px;border-radius:999px;background:linear-gradient(90deg,transparent,#fff 16%,#ffd36d 48%,#ff765f 76%,transparent);box-shadow:0 0 12px #fff,0 0 22px #ffac45;transform:rotate(-28deg) scaleX(.12);animation:impactSlash .34s ease-out forwards}.attack-impact.crit{width:235px;height:235px;filter:brightness(1.25)}.attack-impact.dot:after{display:none}@keyframes impactRing{0%{opacity:0;transform:scale(.15)}20%{opacity:1}100%{opacity:0;transform:scale(2.7)}}@keyframes impactSlash{0%{opacity:0;transform:rotate(-28deg) scaleX(.12)}20%{opacity:1}100%{opacity:0;transform:rotate(-28deg) scaleX(1.18)}}`;
      document.head.appendChild(s);
    }
    if(!document.getElementById(LAYER_ID)){
      const l=document.createElement('div');l.id=LAYER_ID;document.body.appendChild(l);
    }
  }
  function impact(target,opt={}){
    setup();
    const targetEl=target&&target.side==='enemy'?(document.querySelector('.boss-figure')||document.querySelector('.boss-panel')):null;
    if(!targetEl)return;
    const r=targetEl.getBoundingClientRect();
    const e=document.createElement('div');
    e.className='attack-impact'+(opt.crit?' crit':'')+(opt.dot?' dot':'');
    e.style.left=(r.left+r.width*.5)+'px';e.style.top=(r.top+r.height*.48)+'px';
    document.getElementById(LAYER_ID).appendChild(e);
    setTimeout(()=>e.remove(),550);
  }
  window.AttackVFX={impact};
})();
