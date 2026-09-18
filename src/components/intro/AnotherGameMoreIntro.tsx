import React,{useEffect,useState} from 'react';
import {Animated,View} from 'react-native';
import Svg,{Defs,G,Image as SvgImage,Mask,Path,Rect,Text as SvgText} from 'react-native-svg';
import {introAssets,SceneProps,shared,tween,useIntroSize} from './shared';
import {STUDIO_DURATION,studioTraces,traceWindow,pointAlong} from './studioTraceTimeline';
import {wordmarkLetters,wordmarkTargets} from './studioWordmark';

function EmblemToWordmark({progress,reducedMotion}:SceneProps){
 const [ms,setMs]=useState(0);
 useEffect(()=>{const listener=progress.addListener(({value})=>setMs(value*STUDIO_DURATION));return ()=>progress.removeListener(listener);},[progress]);
 const frames=studioTraces.map(trace=>traceWindow(trace,ms,reducedMotion));
 const sourceVisible=frames.some((f,i)=>f.erased<studioTraces[i].sourceLength);
 const accentOpacity=Math.max(0,Math.min(1,(ms-4850)/250))*(1-Math.max(0,Math.min(1,(ms-6550)/500)));
 return <Svg width="100%" height="100%" viewBox="-180 -140 360 280">
  <Defs>
   <Mask id="remaining-emblem" x={-120} y={-120} width={240} height={240} maskUnits="userSpaceOnUse">
    <Rect x={-120} y={-120} width={240} height={240} fill="white"/>
    {studioTraces.map((trace,i)=>frames[i].erased>0&&<Path key={i} d={trace.sourceD} fill="none" stroke="black" strokeWidth={trace.eraseWidth}
     strokeLinecap="round" strokeLinejoin="round" strokeDasharray={[frames[i].erased,trace.sourceLength+1]}/>) }
   </Mask>
   {wordmarkTargets.map((_,targetIndex)=><Mask key={targetIndex} id={`letter-${targetIndex}`} x={-180} y={-140} width={360} height={280} maskUnits="userSpaceOnUse">
    {studioTraces.map((trace,i)=>{
     if(trace.targetIndex!==targetIndex)return null;
     const f=frames[i];const tail=Math.max(0,f.tail-trace.targetStart);const head=Math.max(0,f.head-trace.targetStart);
     return head>tail?<Path key={i} d={trace.targetD} fill="none" stroke="white" opacity={f.opacity} strokeWidth={24}
      strokeLinecap="square" strokeLinejoin="round" strokeDasharray={[head-tail,trace.targetLength+1]} strokeDashoffset={-tail}/>:null;
    })}
   </Mask>)}
  </Defs>
  {/* Opacity stays at 1 after entrance. The original disappears only where a
      contour's tail has passed; the source geometry is sampled from this PNG. */}
  {sourceVisible&&<SvgImage testID="studio-original-logo" href={introAssets.studio} x={-120} y={-120} width={240} height={240} mask="url(#remaining-emblem)"/>}
  {studioTraces.map((trace,i)=>{
   const f=frames[i];const from=Math.max(trace.sourceLength,f.tail);const to=Math.min(trace.targetStart,f.head);
   const head=pointAlong(trace,f.head);
   return <G key={i} opacity={f.opacity}>
    {to>from&&<Path d={trace.d} fill="none" stroke={trace.red?'#ed182b':'#f5f5f5'} strokeWidth={f.width} strokeLinecap="butt"
     strokeDasharray={[to-from,trace.length+1]} strokeDashoffset={-from}/>}
    {f.accent>0&&<Rect x={head.x-1.3} y={head.y-1.3} width={2.6} height={2.6} fill="#ef182c" opacity={f.accent}/>}
   </G>;
  })}
  {wordmarkLetters.map((letter,i)=><G key={i} mask={`url(#letter-${i})`}>
   <Path d={letter.d} transform={`translate(${letter.x} ${letter.y})`} fill="#f5f5f5" fillRule="evenodd"/>
  </G>)}
  <G opacity={accentOpacity}>
   {wordmarkLetters.map((letter,i)=>letter.letter==='A'?<Path key={i} d={`M${letter.x+12} ${letter.y+35} L${letter.x+17} ${letter.y+25} L${letter.x+22} ${letter.y+35} Z`} fill="#ed182b"/>:
    letter.redSquare?<Rect key={i} x={letter.x+13} y={letter.y+14} width={7} height={8} fill="#ed182b"/>:null)}
  </G>
  <Path d="M-126 51 H-72" stroke="#f5f5f5" strokeWidth={1} mask={`url(#letter-${wordmarkLetters.length})`}/>
  <Path d="M72 51 H126" stroke="#f5f5f5" strokeWidth={1} mask={`url(#letter-${wordmarkLetters.length+1})`}/>
  <G mask={`url(#letter-${wordmarkLetters.length+2})`}>
   <SvgText x={4} y={56} textAnchor="middle" fill="#f5f5f5" fontFamily="sans-serif" fontSize={15} letterSpacing={9} fontWeight="400">STUDIO</SvgText>
  </G>
 </Svg>;
}
export function AnotherGameMoreIntro({progress,reducedMotion}:SceneProps){
 const s=useIntroSize();
 return <View style={shared.scene} accessible accessibilityLabel="Another Game More Studio">
  <Animated.View style={{width:360*s,height:280*s,opacity:tween(progress,[0,600/STUDIO_DURATION,1],[0,1,1])}}>
   <EmblemToWordmark progress={progress} reducedMotion={reducedMotion}/>
  </Animated.View>
 </View>;
}
