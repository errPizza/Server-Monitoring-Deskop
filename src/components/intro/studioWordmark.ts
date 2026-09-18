export type Point = { x: number; y: number };
export const points = (...v: number[]): Point[] => Array.from({length:v.length/2},(_,i)=>({x:v[i*2],y:v[i*2+1]}));
const polygon=(...v:number[])=>points(...v).map((p,i)=>`${i?'L':'M'}${p.x} ${p.y}`).join(' ')+' Z';
// Custom filled, chamfered letterforms adapted to the supplied brand reference.
// Red A counters and the square in MORE's O are separate brand accents.
const glyphs:Record<string,{w:number;d:string;spine:Point[]}>={
 A:{w:34,d:polygon(0,36,13,0,21,0,34,36,24,36,17,16,10,36),spine:points(5,36,17,4,29,36)},
 N:{w:34,d:polygon(0,36,0,0,10,0,24,21,24,0,34,0,34,36,24,36,10,15,10,36),spine:points(5,36,5,5,29,31,29,0)},
 O:{w:32,d:polygon(4,0,28,0,32,4,32,32,28,36,4,36,0,32,0,4)+' '+polygon(11,9,10,10,10,26,11,27,21,27,22,26,22,10,21,9),spine:points(16,4,27,4,27,31,5,31,5,4,16,4)},
 T:{w:32,d:polygon(0,0,32,0,32,10,21,10,21,36,11,36,11,10,0,10),spine:points(0,5,32,5,16,5,16,36)},
 H:{w:32,d:polygon(0,0,10,0,10,13,22,13,22,0,32,0,32,36,22,36,22,23,10,23,10,36,0,36),spine:points(5,0,5,36,5,18,27,18,27,0,27,36)},
 E:{w:30,d:polygon(0,0,30,0,30,9,10,9,10,14,27,14,27,22,10,22,10,27,30,27,30,36,0,36),spine:points(30,4,5,4,5,18,27,18,5,18,5,31,30,31)},
 R:{w:32,d:polygon(0,36,0,0,27,0,32,5,32,18,26,24,34,36,22,36,14,24,10,24,10,36)+' '+polygon(10,8,10,16,21,16,23,14,23,10,21,8),spine:points(5,36,5,4,27,4,27,20,5,20,19,20,29,36)},
 G:{w:34,d:polygon(5,0,34,0,34,10,12,10,10,12,10,25,12,27,24,27,24,22,17,22,17,14,34,14,34,31,29,36,5,36,0,31,0,5),spine:points(34,5,5,5,5,31,29,31,29,18,17,18)},
 M:{w:36,d:polygon(0,36,0,0,11,0,18,13,25,0,36,0,36,36,26,36,26,16,18,28,10,16,10,36),spine:points(5,36,5,5,18,20,31,5,31,36)},
};
export const wordmarkLetters=['ANOTHER','GAME MORE'].flatMap((word,row)=>{
 const widths=word.split('').map(c=>c===' '?14:glyphs[c].w);
 const total=widths.reduce((a,b)=>a+b,0)+(word.length-1)*2;
 let x=-total/2;
 return word.split('').flatMap((c,i)=>{
  const left=x;x+=widths[i]+2;if(c===' ')return [];
  return [{letter:c,x:left,y:row*43-52,d:glyphs[c].d,redSquare:row===1&&c==='O',
   spine:glyphs[c].spine.map(p=>({x:p.x+left,y:p.y+row*43-52}))}];
 });
});
// Letter trajectories plus the two rules and the spaced STUDIO reveal.
export const wordmarkTargets=[...wordmarkLetters.map(g=>g.spine),points(-126,51,-72,51),points(72,51,126,51),points(-67,51,67,51)];
