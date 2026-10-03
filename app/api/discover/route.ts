async function get(url:string):Promise<any>{const r=await fetch(url,{headers:{'User-Agent':'WorthTheDetour/1.0 (+https://4ship.ca)'},signal:AbortSignal.timeout(10000)});if(!r.ok)throw Error('Source unavailable');return r.json();}
export async function GET(request:Request){
const u=new URL(request.url);let q=(u.searchParams.get('q')||'aviation').trim().slice(0,100);const day=u.searchParams.get('day');
if(day){if(!/^\d{2}-\d{2}$/.test(day))return Response.json({error:'Invalid date'},{status:400});try{const d=await get('https://en.wikipedia.org/api/rest_v1/feed/onthisday/events/'+day.replace('-','/'));const events=(d.events||[]).filter((x:any)=>/aircraft|aviation|flight|airport|spacecraft|satellite|automobile|railway|motor|NASA|air force/i.test(x.text)).slice(0,8).map((x:any)=>({year:x.year,text:x.text,url:x.pages?.[0]?.content_urls?.desktop?.page||'https://en.wikipedia.org'}));return Response.json({events,checkedAt:new Date().toISOString()});}catch{return Response.json({events:[],error:'Anniversary source unavailable. Try a subject instead.'});}}
q=q.replace(/["\\{}:]/g,' ');const aq=encodeURIComponent(q+' AND (mediatype:movies OR mediatype:texts)');
const [ar,wi]=await Promise.allSettled([get(`https://archive.org/advancedsearch.php?q=${aq}&fl[]=identifier&fl[]=title&fl[]=year&rows=5&output=json`),get(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(q)}&srlimit=4&format=json`)]);
const archive=ar.status==='fulfilled'?(ar.value.response?.docs||[]).map((d:any)=>({title:d.title,url:'https://archive.org/details/'+encodeURIComponent(d.identifier),type:'Internet Archive',year:d.year})):[];
const background=wi.status==='fulfilled'?(wi.value.query?.search||[]).map((d:any)=>({title:d.title,url:'https://en.wikipedia.org/?curid='+d.pageid,type:'Background · Wikipedia'})):[];
return Response.json({results:[...archive,...background],partial:ar.status==='rejected'||wi.status==='rejected',checkedAt:new Date().toISOString()});
}
