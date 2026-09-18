// Run: npm install --no-save playwright && npx playwright install chromium
//      node tests/visual-runtime-smoke.cjs
// Optional: ARCHIVE_TEST_CHROMIUM=/path/to/chromium
const assert=require('node:assert/strict');
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const name=decodeURIComponent(req.url.split('?')[0]);const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
 fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);return res.end();}res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.html')?'text/html':file.endsWith('.webp')?'image/webp':file.endsWith('.vrm')?'model/gltf-binary':'text/plain');res.end(data);});
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({executablePath:process.env.ARCHIVE_TEST_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  const capture=async name=>{if(process.env.ARCHIVE_CAPTURE_DIR){fs.mkdirSync(process.env.ARCHIVE_CAPTURE_DIR,{recursive:true});await page.screenshot({path:path.join(process.env.ARCHIVE_CAPTURE_DIR,name+'.png')});}};
  page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&/shader|VALIDATE_STATUS|WebGLProgram/i.test(m.text()))errors.push(m.text());});
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  page.setDefaultTimeout(90000);
  await page.waitForFunction(()=>window.Archive3D?.ready);
  const roster=await page.evaluate(()=>ArchiveGame.roster());assert.equal(roster.length,96);assert.equal(new Set(roster.map(c=>c.id)).size,96);assert.equal(roster.filter(c=>c.gender==='male').length,19);
  await page.waitForFunction(()=>document.querySelectorAll('.loadout-card-art .loadout-card-empty').length===4);
  await capture('formation');
  await page.evaluate(()=>startBattle());
  await page.waitForFunction(()=>Archive3D.stats().drawCalls>0&&Archive3D.stats().models===4&&!Archive3D.stats().loading);
  await page.waitForTimeout(500);
  assert.equal(await page.evaluate(()=>Archive3D.stats().quality),'handmade-anime-v5');
  assert.equal(await page.evaluate(()=>Archive3D.stats().visibleModels),4,'All four party characters must remain in the 3D battlefield');
  await capture('battle');
  const score=await page.evaluate(()=>state.score);
  await page.locator('.skill[data-skill="0"]').click();
  assert.equal(await page.evaluate(()=>state.score),score,'Selecting a skill must not deal damage');
  assert.equal(await page.evaluate(()=>Archive3D.stats().particles),0,'Selecting a skill must not emit hit effects');
  await page.locator('.skill[data-skill="0"]').click();
  await page.waitForFunction(()=>state.score>0&&!VFX.busy);
  const confirmedScore=await page.evaluate(()=>state.score);
  const mainStats=await page.evaluate(()=>Archive3D.stats());assert.ok(mainStats.drawCalls<600,'Draw-call budget exceeded');
  // Exercise all effect families, including reduced-motion support and zero-damage events.
  await page.evaluate(()=>{
   Archive3D.reset();const keys=ArchiveGame.roster().filter(c=>c.id.endsWith('_0')).map(c=>c.deckId);
   for(const deck of keys)Archive3D.effects([{kind:'damage',id:state.boss.id,side:'enemy',amount:100}],{deck,tier:1,index:0,boss:false});
   for(const kind of ['shield','heal','buff'])Archive3D.effects([{kind,id:state.players[0].id,side:'player',amount:100}],{deck:'cleanse',tier:1,index:0,support:true});
  });
  const burst=await page.evaluate(()=>Archive3D.stats());assert.ok(burst.particles<=220);assert.ok(burst.effectMeshes<=32);
  await page.waitForTimeout(250);
  const bossStats=[];
  for(const id of ['devourer','observer','warden']){
   await page.evaluate(id=>{returnSelect();selectedBossId=id;startBattle();},id);
   await page.waitForTimeout(60);await page.waitForFunction(()=>Archive3D.stats().models===4&&!Archive3D.stats().loading);assert.equal(await page.evaluate(()=>ArchiveGame.snapshot().bossId),id);bossStats.push(await page.evaluate(()=>Archive3D.stats()));
  }
  const original=bossStats.at(-1);
  await page.evaluate(()=>{returnSelect();startBattle();});await page.waitForTimeout(60);await page.waitForFunction(()=>Archive3D.stats().models===4&&!Archive3D.stats().loading);
  const repeated=await page.evaluate(()=>Archive3D.stats());assert.ok(repeated.geometries<=original.geometries+4,'Model geometry leaked across restarts');assert.ok(repeated.textures<=original.textures+1,'Face textures leaked across restarts');
  await page.setViewportSize({width:844,height:390});await page.waitForTimeout(300);
  const bounds=await page.evaluate(()=>['.skill-panel','.party-grid','.boss-card'].map(s=>{const r=document.querySelector(s).getBoundingClientRect();return {selector:s,x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));
  for(const b of bounds){assert.ok(b.x>=0&&b.y>=0&&b.right<=845&&b.bottom<=391,`${b.selector} exceeds mobile viewport`);}
  await capture('mobile');
  await page.evaluate(()=>{if(!VFX.reduced)document.getElementById('vfxToggle').click();Archive3D.effects([{kind:'shield',id:state.players[0].id,side:'player',amount:100}],{deck:'defense',tier:1,index:0,support:true});});
  await page.waitForTimeout(250);await page.evaluate(()=>returnSelect());
  const end=await page.evaluate(()=>Archive3D.stats());assert.equal(end.particles,0);assert.equal(end.effectMeshes,0);assert.deepEqual(errors,[]);
  await page.setViewportSize({width:1280,height:800});
  await page.evaluate(()=>{selectedDeckId='poison';startBattle();});
  await page.waitForFunction(()=>Archive3D.stats().models===4&&!Archive3D.stats().loading);
  await page.evaluate(()=>{state.currentId=state.players.find(p=>p.gender==='male').id;render();});
  await page.waitForTimeout(500);await capture('male-model');
  assert.deepEqual(errors,[],'Male model must also render without shader errors');
  console.log(JSON.stringify({roster:{total:96,male:19,female:77},scoreAfterConfirmedSkill:confirmedScore,drawCalls:mainStats.drawCalls,triangles:mainStats.triangles,mobileBounds:bounds,geometryAfterRestart:repeated.geometries,errors},null,2));
 }finally{await browser.close();server.close();}
})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
