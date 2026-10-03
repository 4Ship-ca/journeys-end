import {byId} from '../../data';
const cache=new Map<string,{expires:number;data:unknown}>();
async function get(url:string){const r=await fetch(url,{headers:{'User-Agent':'WorthTheDetour/1.0 (+https://4ship.ca)'},signal:AbortSignal.timeout(9000)});if(!r.ok)throw new Error('Source unavailable');return r;}
export async function GET(request:Request){
 const u=new URL(request.url);const id=u.searchParams.get('id')||'warplane';const p=byId[id];if(!p)return Response.json({error:'Unknown location'},{status:400});
 const hit=cache.get(id);if(hit&&hit.expires>Date.now())return Response.json(hit.data);
 const checkedAt=new Date().toISOString();
 const [wx,site]=await Promise.allSettled([p.lat!==undefined?get(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${p.lat}&lon=${p.lon}`).then(r=>r.json() as Promise<any>):Promise.resolve(null),get(p.source).then(r=>r.text())]);
 let weather=null;
 if(wx.status==='fulfilled'&&wx.value?.properties?.timeseries){const v=wx.value;weather={updatedAt:v.properties.meta.updated_at,points:v.properties.timeseries.slice(0,100).map((x:any)=>({time:x.time,temp:x.data.instant.details.air_temperature,wind:Math.round(x.data.instant.details.wind_speed*3.6),symbol:x.data.next_1_hours?.summary?.symbol_code??x.data.next_6_hours?.summary?.symbol_code??''}))};}
 let notices:string[]=[];
 if(site.status==='fulfilled'){const clean=site.value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ').replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ').replace(/<[^>]+>/g,' ').replace(/&nbsp;|&#160;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ');const match=clean.match(/.{0,35}\b(?:temporarily closed|closure|closed today|cancelled|canceled|maintenance)\b.{0,85}/gi)||[];notices=match.slice(0,2).map(s=>s.split(' ').slice(0,12).join(' '));}
 const data={checkedAt,source:p.source,sourceFetched:site.status==='fulfilled',access:'unconfirmed',notices,weather,weatherError:weather?null:p.lat?'Weather is unavailable. Try again later.':'Choose a mapped place for a local forecast.'};
 cache.set(id,{expires:Date.now()+15*60*1000,data});return Response.json(data,{headers:{'Cache-Control':'private, max-age=60'}});
}
