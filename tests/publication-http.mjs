import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import {spawn} from 'node:child_process';
import assert from 'node:assert/strict';
const article='/articles/missing-data-is-not-zero-traffic';
const title='A Read-Only Website Report That Separates Missing Data from Zero Traffic';
const root=process.cwd();
async function freePort(){const s=net.createServer();await new Promise(r=>s.listen(0,'127.0.0.1',r));const port=s.address().port;await new Promise(r=>s.close(r));return port;}
for(const [instant,visible] of [['2026-10-24T12:00:00+02:00',false],['2027-01-01T12:00:00+01:00',true]]){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'jsde-http-publication-'));let child;
 try{
  await fs.cp(path.join(root,'.next/standalone'),dir,{recursive:true});
  const clock=path.join(dir,'test-clock.cjs');await fs.writeFile(clock,`const R=Date;const offset=R.parse(${JSON.stringify(instant)})-R.now();global.Date=class extends R{constructor(...a){if(a.length)super(...a);else super(R.now()+offset)}static now(){return R.now()+offset}static parse(v){return R.parse(v)}static UTC(...a){return R.UTC(...a)}};`);
  const port=await freePort();child=spawn(process.execPath,['--require',clock,'server.js'],{cwd:dir,env:{...process.env,PORT:String(port),HOSTNAME:'127.0.0.1',NEXT_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
  let response;
  for(let i=0;i<60;i++){try{response=await fetch('http://127.0.0.1:'+port+article);break;}catch{await new Promise(r=>setTimeout(r,100));}}
  assert.ok(response,'standalone server started');assert.equal(response.status,visible?200:404);
  const html=await response.text();assert.equal(html.includes(title),visible,'future metadata/title must stay unavailable');
  if(visible)assert.ok(html.includes('https://jsde.me'+article),'self canonical present');
  const map=await (await fetch('http://127.0.0.1:'+port+'/sitemap.xml')).text();assert.equal(map.includes('https://jsde.me'+article),visible,'sitemap uses the same date gate');
  assert.equal((await fetch('http://127.0.0.1:'+port+'/articles/no-such-article')).status,404);
  console.log('PASS actual standalone HTTP publication: '+instant+' (visible='+visible+')');
 }finally{if(child){child.kill('SIGTERM');await new Promise(resolve=>{if(child.exitCode!==null)resolve();else child.once('exit',resolve);});}await fs.rm(dir,{recursive:true,force:true});}
}
