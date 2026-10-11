"use client";
import { useId, memo, type ReactNode } from "react";
export const zoneNames = ["Cultivation Zone A", "Cultivation Zone B", "HVAC", "Irrigation", "Lighting", "Security", "Power", "Environmental Sensors"] as const;
export type FacilityZone = typeof zoneNames[number];
const p = (x: number, y: number, z = 0) => [490 + (x-y)*.85, 170 + (x+y)*.4-z*.9];
const point = (x: number, y: number, z = 0) => p(x,y,z).join(",");
function Face({ coords, fill }: { coords: number[][]; fill: string }) { return <polygon points={coords.map(v=>point(v[0],v[1],v[2]||0)).join(" ")} fill={fill} stroke="#81968e" strokeOpacity=".25" strokeWidth=".7"/>; }
function Box({ x,y,z=0,w,d,h,fill="#a5b8b0" }: { x:number;y:number;z?:number;w:number;d:number;h:number;fill?:string }) {return <g><Face coords={[[x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h]]} fill="#4b6059"/><Face coords={[[x,y+d,z],[x+w,y+d,z],[x+w,y+d,z+h],[x,y+d,z+h]]} fill="#698178"/><Face coords={[[x,y,z+h],[x+w,y,z+h],[x+w,y+d,z+h],[x,y+d,z+h]]} fill={fill}/></g>;}
function Plant({ x, y, small }: { x:number; y:number; small:boolean }) {
  const [cx,cy]=p(x,y,31);
  return <g transform={`translate(${cx},${cy}) scale(${small?.66:1})`}><ellipse rx="12" ry="5" fill="#17291e" opacity=".45"/><g className="twin-foliage"><path d="M0 0 L0 -35" stroke="#91b789" strokeWidth="2"/>{[-1,1].map(side=><g key={side} transform={`scale(${side},1)`}><path d="M0 -7 Q-19 -6 -22 -20 Q-5 -22 0 -7 M0 -17 Q-17 -19 -18 -32 Q-2 -31 0 -17 M0 -27 Q-9 -34 -7 -45 Q4 -37 0 -27" fill={side===1?"#7ba76b":"#4e8056"}/><path d="M0 -7 L-17 -17 M0 -17 L-14 -28" stroke="#acc59a" strokeWidth=".6"/></g>)}</g></g>;
}
export const FacilityScene = memo(function FacilityScene({ selected, onSelect, paused }: { selected:FacilityZone;onSelect:(zone:FacilityZone)=>void;paused:boolean }) {
  const id=useId();
  const zone=(name:FacilityZone,children:ReactNode)=><g role="button" tabIndex={0} aria-label={`Inspect ${name}`} aria-pressed={selected===name} onClick={()=>onSelect(name)} onKeyDown={event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();onSelect(name);}}} className={`scene-zone ${selected===name?"selected":""}`}>{children}</g>;
  return <svg viewBox="100 0 840 580" className={`facility-scene ${paused?"scene-paused":""}`} role="group" aria-labelledby={id}>
    <title id={id}>Simulated digital twin: planned cultivation rows, lights, HVAC, irrigation, power, security and environmental sensors. Select a zone to inspect.</title>
    <defs><pattern id={`${id}-grid`} width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="matrix(.85 .4 -.85 .4 490 170)"><path d="M32 0H0V32" fill="none" stroke="#72877f" strokeOpacity=".08"/></pattern></defs>
    <rect x="100" width="840" height="580" fill={`url(#${id}-grid)`}/>
    <ellipse cx="535" cy="432" rx="315" ry="65" fill="#050c0a" opacity=".35"/>
    <Box x={-18} y={-18} w={475} d={366} h={12} z={-12} fill="#34483f"/>
    <Face coords={[[0,0,0],[440,0,0],[440,0,150],[0,0,150]]} fill="#3d5149"/>
    <Face coords={[[0,0,0],[0,330,0],[0,330,150],[0,0,150]]} fill="#283c34"/>
    {Array.from({length:9},(_,i)=><path key={i} d={`M${point(i*55,0,0)} L${point(i*55,330,0)}`} stroke="#597267" strokeWidth=".7" opacity=".3"/>)}
    {[48,145,242,339].map((x,row)=><g key={x}>{zone(row<2?"Cultivation Zone A":"Cultivation Zone B",<g key={x}><Box x={x} y={48} w={54} d={245} h={22} fill={selected===(row<2?"Cultivation Zone A":"Cultivation Zone B")?"#829f77":"#617960"}/>{Array.from({length:7},(_,i)=><Plant key={i} x={x+27} y={67+i*32} small={row>1}/>)}</g>)}</g>)}
    {zone("Irrigation",<g><path d={`M${point(30,308,25)} L${point(415,308,25)} L${point(415,35,25)}`} fill="none" stroke="#8cb7a8" strokeWidth="4"/>{[75,172,269,366].map(x=><path key={x} d={`M${point(x,308,25)} L${point(x,52,25)}`} fill="none" stroke="#a3c4ae" strokeWidth="1.2" className="irrigation-flow"/>)}<Box x={405} y={265} w={35} d={42} h={47} fill="#9ea9a0"/></g>)}
    {zone("Lighting",<g>{[75,172,269,366].map(x=><g key={x}>{[70,265].map(y=><path key={y} d={`M${point(x,y,155)} L${point(x,y,128)}`} stroke="#a7b8b0" strokeWidth="1"/>)}<Box x={x-10} y={40} z={119} w={20} d={255} h={5} fill="#dce4d6"/><path d={`M${point(x,45,118)} L${point(x,287,118)}`} stroke="#e0dfb0" strokeWidth="3" className="grow-light"/></g>)}</g>)}
    {zone("HVAC",<g><Box x={292} y={4} z={72} w={120} d={33} h={42} fill="#b7c6bf"/>{[318,375].map(x=>{const [cx,cy]=p(x,38,93);return <g key={x} transform={`translate(${cx},${cy})`}><circle r="12" fill="#253e36" stroke="#a1b6aa"/><g className="twin-fan"><path d="M0 0Q-15 -16 0 -10Q15 -16 10 0Q15 16 0 10Q-15 16 -10 0Z" fill="#8aaba0"/></g></g>})}<path d={`M${point(294,19,132)} L${point(18,19,132)} L${point(18,285,132)}`} fill="none" stroke="#849a90" strokeWidth="12"/><path d={`M${point(294,19,132)} L${point(18,19,132)} L${point(18,285,132)}`} fill="none" stroke="#b0c0b7" strokeWidth="2"/></g>)}
    {zone("Power",<g><Box x={8} y={220} z={10} w={24} d={60} h={76} fill="#a1afa7"/><path d={`M${point(20,281,67)} l-6 12h8l-6 12`} stroke="#dbe0bf" strokeWidth="2" fill="none"/></g>)}
    {zone("Security",<g><Box x={4} y={312} z={124} w={22} d={14} h={12} fill="#bfc9c3"/><circle cx={p(20,328,131)[0]} cy={p(20,328,131)[1]} r="4" fill="#172c23"/></g>)}
    {zone("Environmental Sensors",<g>{[[125,130],[319,175]].map(([x,y])=><g key={x}><path d={`M${point(x,y,0)} L${point(x,y,94)}`} stroke="#98a9a1" strokeWidth="2"/><circle cx={p(x,y,94)[0]} cy={p(x,y,94)[1]} r="6" fill="#b7d2b4" stroke="#edf4e4" strokeWidth="1.5" className="sensor-point"/></g>)}</g>)}
    <g fill="#aabdb2" fontSize="10" letterSpacing="2"><text x={p(105,343)[0]} y={p(105,343)[1]+25}>ZONE A</text><text x={p(300,343)[0]} y={p(300,343)[1]+25}>ZONE B</text></g>
    <text x="510" y="555" textAnchor="middle" fill="#9eafa6" fontSize="10" letterSpacing="1.5">ILLUSTRATIVE LAYOUT · NOT A SITE SURVEY</text>
  </svg>;
});
