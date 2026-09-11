
const http=require('http'),fs=require('fs'),path=require('path'),WebSocket=require('ws');
const PORT=process.env.PORT||3000;
const symbols=['R_10','R_15','R_25','R_30','R_50','R_75','R_100'];
const names={R_10:'Volatility 10 Index',R_15:'Volatility 15 Index',R_25:'Volatility 25 Index',R_30:'Volatility 30 Index',R_50:'Volatility 50 Index',R_75:'Volatility 75 Index',R_100:'Volatility 100 Index'};
const server=http.createServer((req,res)=>{const f=req.url==='/'?path.join(__dirname,'public/index.html'):path.join(__dirname,'public',req.url);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}res.writeHead(200,{'Content-Type':f.endsWith('.html')?'text/html':'text/plain'});res.end(d)})});
const wss=new WebSocket.Server({server}),clients=new Set(),latest={};
function send(o){const s=JSON.stringify(o);for(const c of clients)if(c.readyState===1)c.send(s)}
function connect(){const d=new WebSocket('wss://api.derivws.com/trading/v1/options/ws/public');d.on('open',()=>{send({status:'Conectado a Deriv'});symbols.forEach(s=>d.send(JSON.stringify({ticks:s,subscribe:1}))) });d.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}if(m.errors){send({status:'ERROR Deriv: '+m.errors[0].message});return}if(m.error){send({status:'ERROR Deriv: '+m.error.message});return}if(m.tick){const s=m.tick.symbol;latest[s]=m.tick.quote;send({status:'TICK RECIBIDO',symbol:s,name:names[s]||s,quote:m.tick.quote,epoch:m.tick.epoch})}});d.on('error',()=>send({status:'ERROR WebSocket'}));d.on('close',()=>{send({status:'Desconectado; reintentando'});setTimeout(connect,3000)})}
wss.on('connection',c=>{clients.add(c);c.send(JSON.stringify({status:'Conectado a Deriv',symbols:names}));c.on('close',()=>clients.delete(c))});connect();server.listen(PORT,()=>console.log('Listening on '+PORT));
