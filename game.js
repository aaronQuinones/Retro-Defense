const canvas=document.querySelector('#field'),ctx=canvas.getContext('2d');
const statusEl=document.querySelector('#status'),statsEl=document.querySelector('#stats'),scoreEl=document.querySelector('#score');
const W=960,H=540,LEFT=65,RIGHT=895,TOP=45,BOTTOM=495,LOS=510;
let defenders=[],offense=[],ball=null,selected=0,phase='ready',clock=0,playTime=0,downs=1,yards=10,home=0,away=0;
const stats={tackles:0,sacks:0,ints:0};const keys=new Set();
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
function player(x,y,team,role){return {x,y,team,role,speed:team==='D'?170:120,hasBall:false};}
function setup(){
 defenders=[];offense=[];ball=null;playTime=0;phase='ready';selected=0;
 for(let i=0;i<11;i++){
  const y=TOP+45+i*36;
  let x=i<4?LOS+22:i<7?LOS+90:LOS+175;
  defenders.push(player(x,y,'D',i<4?'DL':i<7?'LB':'DB'));
 }
 const ys=[115,190,270,350,425];
 for(let i=0;i<5;i++)offense.push(player(LOS-15,ys[i],'O','OL'));
 offense.push(player(LOS-85,270,'O','QB'));
 offense.push(player(LOS-115,315,'O','RB'));
 for(let i=0;i<4;i++)offense.push(player(LOS-30,[80,160,380,460][i],'O','WR'));
 statusEl.textContent='Press ENTER to start play';updateHud();
}
function updateHud(){statsEl.textContent=`Tackles: ${stats.tackles} | Sacks: ${stats.sacks} | INT: ${stats.ints}`;scoreEl.textContent=`AWAY ${away} — HOME ${home} | Down ${downs} & ${yards}`;}
function start(){if(phase!=='ready'&&phase!=='over')return;if(phase==='over')setup();phase='live';playTime=0;const qb=offense.find(p=>p.role==='QB');qb.hasBall=true;statusEl.textContent='PLAY LIVE — stop the offense!';}
function endPlay(message,gain=0){phase='over';statusEl.textContent=message+' — ENTER for next play';if(gain>=yards){downs=1;yards=10;}else{yards=Math.max(1,yards-gain);downs++;if(downs>4){downs=1;yards=10;statusEl.textContent+=' | TURNOVER ON DOWNS';}}updateHud();}
function next(){setup();}
function switchPlayer(){const target=ball&&ball.carrier?ball.carrier:offense.find(p=>p.hasBall)||offense.find(p=>p.role==='QB');const candidates=defenders.map((p,i)=>({i,d:dist(p,target)})).sort((a,b)=>a.d-b.d);const idx=candidates.findIndex(c=>c.i===selected);selected=candidates[(idx+1)%candidates.length].i;}
function moveToward(p,target,dt,speed=p.speed){const dx=target.x-p.x,dy=target.y-p.y,len=Math.hypot(dx,dy)||1;p.x+=dx/len*Math.min(len,speed*dt);p.y+=dy/len*Math.min(len,speed*dt);}
function update(dt){if(phase!=='live')return;playTime+=dt;
 const qb=offense.find(p=>p.role==='QB'),rb=offense.find(p=>p.role==='RB'),wr=offense.filter(p=>p.role==='WR');
 const active=defenders[selected];let dx=0,dy=0;if(keys.has('arrowleft')||keys.has('a'))dx--;if(keys.has('arrowright')||keys.has('d'))dx++;if(keys.has('arrowup')||keys.has('w'))dy--;if(keys.has('arrowdown')||keys.has('s'))dy++;const len=Math.hypot(dx,dy)||1;active.x+=dx/len*active.speed*dt;active.y+=dy/len*active.speed*dt;
 for(const p of defenders){if(p===active)continue;let target=offense.find(o=>o.hasBall)||qb;if(ball&&ball.carrier)target=ball.carrier;if(ball&&!ball.carrier)target=ball;moveToward(p,target,dt,p.speed*.58);}
 for(let i=0;i<wr.length;i++){wr[i].x=clamp(wr[i].x+105*dt,LEFT+10,RIGHT-10);}
 if(qb.hasBall){if(playTime>1.6&&playTime<1.6+dt){if(Math.random()<.35){qb.hasBall=false;rb.hasBall=true;statusEl.textContent='RUN PLAY!';}else{qb.hasBall=false;const receiver=wr[Math.floor(Math.random()*wr.length)];ball={x:qb.x,y:qb.y,target:receiver,carrier:null};statusEl.textContent='PASS IN THE AIR!';}}}
 if(rb.hasBall)moveToward(rb,{x:RIGHT,y:rb.y+Math.sin(playTime*3)*20},dt,115);
 if(ball&&!ball.carrier){moveToward(ball,ball.target,dt,440);for(const d of defenders){if(dist(d,ball)<20){d.hasBall=true;ball=null;stats.ints++;home+=7;endPlay('INTERCEPTION! PICK SIX!');return;}}if(dist(ball,ball.target)<15){ball.target.hasBall=true;ball=null;statusEl.textContent='COMPLETION — MAKE THE TACKLE!';}}
 const carrier=offense.find(p=>p.hasBall);
 if(carrier){for(const d of defenders){if(dist(d,carrier)<19){const sack=carrier.role==='QB';stats.tackles++;if(sack)stats.sacks++;const gain=Math.max(0,Math.round((carrier.x-LOS)/8));endPlay(sack?'QUARTERBACK SACK!':'TACKLE!',gain);return;}}if(carrier.x>=RIGHT-25){away+=7;endPlay('OFFENSIVE TOUCHDOWN!',10);return;}}
 if(playTime>9){endPlay('PLAY WHISTLED DEAD');return;}
 for(const p of [...defenders,...offense]){p.x=clamp(p.x,LEFT+8,RIGHT-8);p.y=clamp(p.y,TOP+8,BOTTOM-8);}
}
function drawField(){ctx.fillStyle='#287342';ctx.fillRect(0,0,W,H);ctx.fillStyle='#23673b';for(let i=0;i<10;i++)if(i%2===0)ctx.fillRect(LEFT+i*83,TOP,83,BOTTOM-TOP);ctx.fillStyle='#1a4b82';ctx.fillRect(LEFT,TOP,50,BOTTOM-TOP);ctx.fillStyle='#7b2e35';ctx.fillRect(RIGHT-50,TOP,50,BOTTOM-TOP);ctx.strokeStyle='#e5e8d8';ctx.lineWidth=3;ctx.strokeRect(LEFT,TOP,RIGHT-LEFT,BOTTOM-TOP);ctx.lineWidth=1;for(let x=LEFT+50;x<RIGHT-50;x+=76){ctx.beginPath();ctx.moveTo(x,TOP);ctx.lineTo(x,BOTTOM);ctx.stroke();ctx.fillStyle='#e5e8d8';ctx.font='bold 15px monospace';ctx.textAlign='center';ctx.fillText(String(Math.round((x-LEFT)/7.6)%50),x,TOP+35);}ctx.strokeStyle='#ffdc57';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(LOS,TOP);ctx.lineTo(LOS,BOTTOM);ctx.stroke();}
function drawPlayer(p){ctx.fillStyle='#07121d';ctx.fillRect(p.x-11,p.y-9,22,22);ctx.fillStyle=p.team==='D'?'#64b8ff':'#ff7272';ctx.fillRect(p.x-10,p.y-12,20,20);ctx.fillStyle='#f8f3df';ctx.fillRect(p.x-5,p.y-8,10,5);if(p.hasBall){ctx.fillStyle='#663819';ctx.fillRect(p.x+7,p.y+2,11,7);}if(p===defenders[selected]){ctx.strokeStyle='#ffe15e';ctx.lineWidth=3;ctx.strokeRect(p.x-15,p.y-17,30,32);ctx.fillStyle='#ffe15e';ctx.beginPath();ctx.moveTo(p.x,p.y-27);ctx.lineTo(p.x-7,p.y-36);ctx.lineTo(p.x+7,p.y-36);ctx.fill();}}
function render(){drawField();offense.forEach(drawPlayer);defenders.forEach(drawPlayer);if(ball){ctx.fillStyle='#5e341a';ctx.beginPath();ctx.ellipse(ball.x,ball.y,9,5,0,0,Math.PI*2);ctx.fill();}if(phase!=='live'){ctx.fillStyle='#07121dcc';ctx.fillRect(275,220,410,90);ctx.fillStyle='#fff';ctx.font='bold 20px monospace';ctx.textAlign='center';ctx.fillText(phase==='ready'?'PRESS ENTER TO SNAP':'PLAY OVER — PRESS ENTER',480,272);}}
let last=performance.now();function loop(now){const dt=Math.min((now-last)/1000,.04);last=now;update(dt);render();requestAnimationFrame(loop);}window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key))e.preventDefault();if(!e.repeat&&key===' '&&phase==='live')switchPlayer();if(!e.repeat&&key==='enter'){if(phase==='over'){next();start();}else start();}if(!e.repeat&&key==='r'){home=away=0;downs=1;yards=10;stats.tackles=stats.sacks=stats.ints=0;setup();}keys.add(key);});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());setup();requestAnimationFrame(loop);
