import contours from './studioEmblemContours.json';
import { Point, wordmarkTargets } from './studioWordmark';
export type { Point } from './studioWordmark';
export const STUDIO_DURATION=7400;
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const ease=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
function geometry(points:Point[]){
 const distances=[0];
 for(let i=1;i<points.length;i++)distances.push(distances[i-1]+Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y));
 return {points,distances,length:distances[distances.length-1],d:points.map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')};
}
function route(a:Point,b:Point){
 const corner={x:a.x,y:b.y};
 const radius=Math.min(8,Math.abs(b.y-a.y)/2,Math.abs(b.x-a.x)/2);
 if(radius<1)return [a,b];
 const before={x:a.x,y:b.y-Math.sign(b.y-a.y)*radius};
 const after={x:a.x+Math.sign(b.x-a.x)*radius,y:b.y};
 return [a,...Array.from({length:9},(_,i)=>{const t=i/8;return {x:(1-t)**2*before.x+2*(1-t)*t*corner.x+t*t*after.x,y:(1-t)**2*before.y+2*(1-t)*t*corner.y+t*t*after.y};}),b];
}
// All 56 paths come from skeletons of the source bitmap, including filled areas.
// Nearest target matching gives neighboring features coherent travel directions.
const available=contours.tracks.map((source,index)=>({source,index}));
const assignments:Record<number,number>={};
for(let i=0;i<contours.tracks.length;i++){
 const targetIndex=i%wordmarkTargets.length;
 const destination=wordmarkTargets[targetIndex][0];
 available.sort((a,b)=>{
  const pa=a.source.points[a.source.points.length-1];const pb=b.source.points[b.source.points.length-1];
  return Math.hypot(pa[0]-destination.x,pa[1]-destination.y)-Math.hypot(pb[0]-destination.x,pb[1]-destination.y);
 });
 const chosen=available.shift()!;assignments[chosen.index]=targetIndex;
}
export const studioTraces=contours.tracks.map((source,index)=>{
 const targetIndex=assignments[index];const target=wordmarkTargets[targetIndex];
 const points=source.points.map(([x,y])=>({x,y}));const sourceGeometry=geometry(points);
 const prefix=points.concat(route(points[points.length-1],target[0]).slice(1));
 return {...geometry(prefix.concat(target.slice(1))),sourceD:sourceGeometry.d,sourceLength:sourceGeometry.length,
  eraseWidth:source.eraseWidth,red:source.red,pullDuration:650+Math.min(1,sourceGeometry.length/300)*1100,targetStart:geometry(prefix).length,targetD:geometry(target).d,
  targetLength:geometry(target).length,targetIndex,delay:(index%7)*50};
});
export type StudioTrace=typeof studioTraces[number];
export function traceWindow(trace:StudioTrace,ms:number,reduced=false){
 const t=ms-trace.delay;
 const release=1100+trace.pullDuration;
 const arrival=release+950;
 let head=mix(0,trace.sourceLength,ease((t-1100)/trace.pullDuration));
 if(t>=release)head=mix(trace.sourceLength,trace.targetStart,ease((t-release)/950));
 if(t>=arrival)head=mix(trace.targetStart,trace.length,ease((t-arrival)/1000));
 const tail=t<arrival?Math.max(0,head-16):mix(Math.max(0,trace.targetStart-16),trace.targetStart,ease((t-arrival)/230));
 const exitTail=t<6250?tail:mix(trace.targetStart,trace.length,ease((t-6250)/650));
 return {head:reduced?trace.length:head,tail:reduced?trace.targetStart:exitTail,
  erased:reduced?(ms>=1850?trace.sourceLength:0):Math.min(trace.sourceLength,tail),
  opacity:reduced?clamp((ms-1900)/500)*(1-clamp((ms-6800)/500)):1-clamp((t-6900)/100),
  accent:!reduced && t>=1100 && (t<arrival+1000||t>=6250)? .85:0,width:4.2};
}
export function pointAlong(trace:StudioTrace,length:number):Point{
 const value=Math.max(0,Math.min(trace.length,length));const next=trace.distances.findIndex(v=>v>=value);
 if(next<=0)return trace.points[0];
 const span=trace.distances[next]-trace.distances[next-1];const t=span?(value-trace.distances[next-1])/span:0;
 return {x:mix(trace.points[next-1].x,trace.points[next].x,t),y:mix(trace.points[next-1].y,trace.points[next].y,t)};
}
