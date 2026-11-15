const canvas=document.getElementById('view'),ctx=canvas.getContext('2d');
const $=id=>document.getElementById(id);
let commands=[],index=0,playing=false,last=0,acc=0,x=40,z=0,tool={x:40,z:0},speed=5;
let profile=[{z:0,r:20},{z:-60,r:20}],rot=0;
const scale=6.1, cx=500, cy=230;
function parse(){
  const lines=$('program').value.split(/\r?\n/); const out=[];
  for(let n=0;n<lines.length;n++){
    let s=lines[n].trim().toUpperCase(); if(!s||s.startsWith(';'))continue;
    if(s==='HOME'){out.push({type:'HOME',line:n+1});continue}
    let m=s.match(/^(MOVE|CUT)\s+X\s*=\s*(-?\d+(?:\.\d+)?)\s+Z\s*=\s*(-?\d+(?:\.\d+)?)$/);
    if(!m)throw new Error(`บรรทัด ${n+1}: รูปแบบไม่ถูกต้อง — ใช้ MOVE/CUT X=ตัวเลข Z=ตัวเลข`);
    let X=Number(m[2]),Z=Number(m[3]);
    if(!Number.isFinite(X)||!Number.isFinite(Z)||X<0||X>80||Z>10||Z< -100)throw new Error(`บรรทัด ${n+1}: ค่าต้องอยู่ในช่วง X 0–80 และ Z -100 ถึง 10`);
    out.push({type:m[1],x:X,z:Z,line:n+1});
  }
  return out;
}
function reset(){
  playing=false;index=0;x=40;z=0;tool={x:40,z:0};profile=[{z:0,r:20},{z:-60,r:20}];rot=0;
  $('status').textContent='พร้อมฝึก';$('message').textContent='รีเซ็ตแล้ว พร้อมเริ่มใหม่';updateRead();draw();
}
function updateRead(){$('xread').textContent=x.toFixed(1);$('zread').textContent=z.toFixed(1);$('lineNo').textContent=`${index} / ${commands.length}`;}
function interpolateCut(nx,nz){
  // Visual-only stock silhouette: reduce the radius over the traversed Z interval.
  const r=Math.max(2,Math.min(20,nx/2));
  const lo=Math.min(z,nz),hi=Math.max(z,nz);
  let next=[];
  for(const p of profile){if(p.z<lo||p.z>hi)next.push(p)}
  next.push({z:lo,r},{z:hi,r}); next.sort((a,b)=>b.z-a.z);
  const compact=[];for(const p of next){if(!compact.length||Math.abs(compact[compact.length-1].z-p.z)>.01)compact.push(p);else compact[compact.length-1].r=Math.min(compact[compact.length-1].r,p.r)}
  profile=compact;
}
function execute(c){
  if(c.type==='HOME'){x=40;z=0;tool={x,z};return}
  if(c.type==='CUT')interpolateCut(c.x,c.z);
  x=c.x;z=c.z;tool={x,z};
}
function next(){
  if(index>=commands.length){playing=false;$('status').textContent='จบโปรแกรม';$('message').textContent='จำลองครบทุกคำสั่งแล้ว';return}
  const c=commands[index++];execute(c);$('status').textContent=c.type;$('message').textContent=`กำลังแสดงบรรทัด ${c.line}: ${c.type}`;updateRead();draw();
}
function start(){
  try{commands=parse();}catch(e){$('message').textContent=e.message;$('status').textContent='คำสั่งผิด';return}
  if(!commands.length){$('message').textContent='ยังไม่มีคำสั่งให้จำลอง';return}
  if(index>=commands.length)reset();
  playing=true;$('status').textContent='กำลังจำลอง';last=0;
}
function draw(){
  const w=canvas.width,h=canvas.height;ctx.clearRect(0,0,w,h);
  // machine bed
  ctx.fillStyle='#172733';ctx.fillRect(35,350,930,45);
  ctx.fillStyle='#344c5b';ctx.fillRect(70,365,860,12);
  // chuck
  ctx.fillStyle='#8295a1';ctx.fillRect(120,cy-85,38,170);ctx.fillStyle='#526a78';ctx.fillRect(158,cy-62,32,124);
  // stock axis and rotating body
  const left=190, right=left+60*scale, ytop=cy-20*scale, ybot=cy+20*scale;
  ctx.save();ctx.translate(left,cy);ctx.rotate(Math.sin(rot)*.035);
  ctx.fillStyle='#9aaab4';ctx.beginPath();ctx.moveTo(0,-20*scale);
  for(const p of profile)ctx.lineTo((Math.abs(p.z))*scale,-p.r*scale);
  ctx.lineTo(60*scale,-profile[profile.length-1].r*scale);
  ctx.lineTo(60*scale,profile[profile.length-1].r*scale);
  for(const p of [...profile].reverse())ctx.lineTo(Math.abs(p.z)*scale,p.r*scale);
  ctx.closePath();ctx.fill();ctx.strokeStyle='#d2e0e7';ctx.lineWidth=3;ctx.stroke();
  // rotational highlight
  ctx.strokeStyle='#e8f2f6';ctx.globalAlpha=.45;ctx.beginPath();ctx.ellipse(0,0,12,20*scale,0,0,Math.PI*2);ctx.stroke();
  ctx.restore();
  // axis
  ctx.setLineDash([8,7]);ctx.strokeStyle='#6d8b9b';ctx.beginPath();ctx.moveTo(100,cy);ctx.lineTo(920,cy);ctx.stroke();ctx.setLineDash([]);
  // tool holder and insert, mapped to tool coords
  const tx=left+Math.max(0,Math.min(60,-z))*scale;
  const ty=cy-(x/2)*scale;
  ctx.fillStyle='#596f7c';ctx.fillRect(tx-18,ty+8,100,35);
  ctx.fillStyle='#e4b65c';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+22,ty+10);ctx.lineTo(tx+8,ty+20);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#f0cc7c';ctx.lineWidth=2;ctx.stroke();
  // labels
  ctx.fillStyle='#d5e4eb';ctx.font='20px sans-serif';ctx.fillText('หัวจับ',75,115);ctx.fillText('ชิ้นงานจำลอง',420,95);ctx.fillText('มีดกลึง',tx+75,ty+28);
  ctx.fillStyle='#91a8b5';ctx.font='16px sans-serif';ctx.fillText('แกน Z',850,cy-12);ctx.fillText('แกน X',65,cy-105);
  // spindle indicator
  ctx.fillStyle='#a9f28f';ctx.font='bold 18px sans-serif';ctx.fillText('SPINDLE  ↻',770,55);
  ctx.fillStyle='#a9f28f';ctx.beginPath();ctx.arc(920,48,10,0,Math.PI*2);ctx.fill();
}
function frame(t){
  if(!last)last=t;const dt=Math.min(100,t-last);last=t;
  if(playing){rot+=dt*.008*speed;acc+=dt*speed/850;if(acc>=1){acc=0;next()}}
  else rot+=dt*.001;
  draw();requestAnimationFrame(frame);
}
$('run').onclick=start;
$('pause').onclick=()=>{playing=false;$('status').textContent='หยุดชั่วคราว';$('message').textContent='หยุดชั่วคราวแล้ว กดเริ่มจำลองเพื่อทำต่อ';};
$('step').onclick=()=>{try{if(!commands.length)commands=parse();playing=false;next()}catch(e){$('message').textContent=e.message}};
$('reset').onclick=reset;
$('load').onclick=()=>{$('program').value=`; ตัวอย่างเส้นทางฝึกแบบภาพ\nHOME\nMOVE X=40 Z=0\nCUT X=30 Z=0\nCUT X=30 Z=-25\nCUT X=24 Z=-25\nCUT X=24 Z=-50\nMOVE X=45 Z=-50\nHOME`;commands=[];reset()};
$('clear').onclick=()=>{$('program').value='';commands=[];reset()};
$('speed').oninput=e=>{speed=Number(e.target.value);$('speedVal').textContent=speed+'x'};
try{if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js'))}catch(e){}
reset();requestAnimationFrame(frame);