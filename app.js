const cv=document.getElementById('view'),ctx=cv.getContext('2d'),$=id=>document.getElementById(id);
const sample=`%
O0100 (FANUC LATHE TRAINING)
G21 G18 G40 G99
G97 S500 M03
T0101
( FACING )
G00 X22.0 Z2.0
G01 Z0.0 F0.15
G01 X0.0
G00 X22.0 Z2.0
( TAPER TURNING DIA 20 TO DIA 10 LENGTH 30 )
G00 X22.0 Z1.0
G01 X20.0 Z0.0 F0.12
G01 X10.0 Z-30.0
G00 X22.0
G00 Z3.0
M05
( DRILLING EXAMPLE - CENTER DRILL PATH )
T0202
G97 S700 M03
G00 X0.0 Z2.0
G01 Z-18.0 F0.08
G00 Z2.0
M05
M30
%`;
$('code').value=sample;
let state={x:24,z:5,spindle:false,rpm:0,tool:0,mode:'G00',path:[],idx:0,lines:[],running:false,angle:0,stock:20,profile:[],target:null,last:null};
function parse(){return $('code').value.split(/\r?\n/).map(s=>s.replace(/\(.*?\)/g,'').trim()).filter(s=>s&&!s.startsWith('%')&&!/^O\d+/.test(s));}
function words(line){let o={};for(const m of line.matchAll(/([A-Z])\s*(-?\d+(?:\.\d+)?)/gi))o[m[1].toUpperCase()]=Number(m[2]);return o;}
function load(){state.lines=parse();state.idx=0;state.x=24;state.z=5;state.path=[];state.profile=[];state.spindle=false;state.rpm=0;state.running=false;state.target=null;draw();report('โหลดโปรแกรมแล้ว');}
function report(extra=''){ $('status').textContent=`บรรทัด ${state.idx}/${state.lines.length} | X ${state.x.toFixed(2)}  Z ${state.z.toFixed(2)} | RPM: ${state.spindle?state.rpm:0} | ${extra}`;}
function execute(){
 if(state.idx>=state.lines.length){state.running=false;report('จบโปรแกรม');return false;}
 let line=state.lines[state.idx++],w=words(line);
 if(w.G!==undefined){if([0,1,2,3].includes(w.G))state.mode='G0'+w.G;}
 if(w.M===3||w.M===4)state.spindle=true;if(w.M===5)state.spindle=false;
 if(w.S)state.rpm=w.S;
 if(w.T)state.tool=w.T;
 let nx=w.X!==undefined?w.X:state.x,nz=w.Z!==undefined?w.Z:state.z;
 if(w.X!==undefined||w.Z!==undefined){
   let from={x:state.x,z:state.z},to={x:nx,z:nz};
   state.target={from,to,mode:state.mode,progress:0,feed:w.F||0.12};
 }
 report(line);return true;
}
function tick(){
 if(state.target){let t=state.target,dx=t.to.x-t.from.x,dz=t.to.z-t.from.z,dist=Math.hypot(dx,dz),speed=(t.mode==='G00'?0.9:0.18)*Number($('speed').value);
 t.progress=Math.min(1,t.progress+(dist?speed/dist:1));
 let p=t.progress;state.x=t.from.x+dx*p;state.z=t.from.z+dz*p;
 if(t.mode!=='G00')state.path.push({x:state.x,z:state.z});
 if(p>=1){if(t.mode!=='G00')state.profile.push({x:t.to.x,z:t.to.z});state.target=null;}
 } else if(state.running){if(!execute())return;}
 if(state.spindle)state.angle+=0.18*Number($('speed').value);
 draw();
}
function draw(){
 const W=cv.width,H=cv.height;ctx.clearRect(0,0,W,H);
 // work area and axis
 ctx.fillStyle='#0b1017';ctx.fillRect(0,0,W,H);
 const ox=130,oy=180,scale=17;
 ctx.strokeStyle='#263448';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(60,oy);ctx.lineTo(850,oy);ctx.stroke();
 ctx.fillStyle='#90a6c4';ctx.font='14px sans-serif';ctx.fillText('Z0 / หน้าชิ้นงาน',ox-45,30);ctx.fillText('Z−',780,oy-10);ctx.fillText('แกน X (เส้นผ่านศูนย์กลาง)',10,340);
 // chuck
 ctx.fillStyle='#58677b';ctx.fillRect(55,oy-80,65,160);ctx.fillStyle='#9ba8b8';ctx.fillRect(100,oy-54,32,108);
 // stock cylinder rendered as rotating striped cylinder
 let radius=state.stock*scale/2, len=30*scale;
 ctx.fillStyle='#64788e';ctx.fillRect(ox,oy-radius,len,radius*2);
 ctx.save();ctx.beginPath();ctx.rect(ox,oy-radius,len,radius*2);ctx.clip();
 ctx.translate(ox+len/2,oy);ctx.rotate(state.angle);
 for(let i=-len;i<len*2;i+=26){ctx.strokeStyle=(i%52===0)?'#b8c8d8':'#344b62';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(i,-radius*2);ctx.lineTo(i+90,radius*2);ctx.stroke();}
 ctx.restore();
 // profile overlay
 if(state.profile.length>1){ctx.strokeStyle='#ffb84a';ctx.lineWidth=4;ctx.beginPath();state.profile.forEach((p,i)=>{let x=ox+(-p.z)*scale,y=oy-p.x/2*scale;i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();}
 // hole graphic
 ctx.fillStyle='#0b1017';ctx.fillRect(ox,oy-4,Math.min(18*scale,290),8);
 ctx.strokeStyle='#5ed0ee';ctx.lineWidth=2;ctx.strokeRect(ox,oy-4,Math.min(18*scale,290),8);
 // tool and holder
 let tx=ox+(-state.z)*scale,ty=oy-state.x/2*scale;
 ctx.fillStyle='#e7a83d';ctx.fillRect(tx-10,ty+12,95,18);ctx.fillStyle='#f3d18b';ctx.beginPath();ctx.moveTo(tx,ty);ctx.lineTo(tx+20,ty+12);ctx.lineTo(tx-10,ty+12);ctx.closePath();ctx.fill();
 ctx.fillStyle='#dce7f4';ctx.font='13px monospace';ctx.fillText(`X${state.x.toFixed(1)} Z${state.z.toFixed(1)}`,tx+18,ty-12);
 ctx.fillStyle=state.spindle?'#5ce0a0':'#9aa7b8';ctx.fillText(state.spindle?'● SPINDLE ON':'○ SPINDLE STOP',650,32);
 ctx.fillStyle='#aebbd0';ctx.fillText('ชิ้นงานหมุน (ภาพจำลอง)',300,oy+radius+28);
}
let timer=null;
function start(){if(!state.lines.length)load();state.running=true;if(!timer)timer=setInterval(()=>{if(state.running)tick();},35);report('กำลัง Run');}
$('run').onclick=start;
$('step').onclick=()=>{state.running=false;if(!state.lines.length)load();if(!state.target)execute();tick();};
$('pause').onclick=()=>{state.running=false;report('พัก');};
$('reset').onclick=()=>{state.running=false;load();};
$('load').onclick=load;
$('clear').onclick=()=>{$('code').value='';load();};
$('speed').onchange=()=>draw();
load();draw();setInterval(()=>{if(state.spindle){state.angle+=0.04;draw();}},60);
