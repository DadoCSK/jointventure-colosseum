"use client";
import { memo, useId, useState } from "react";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import type { FacilityZone } from "./facility-scene";

export const planZones = ["Vegetation Zone", "Flowering Zone A", "Flowering Zone B", "Finished Goods Storage", "General Storage", "Support / Infrastructure"] as const;
export type PlanZone = typeof planZones[number];
export const planToTwin: Record<PlanZone,FacilityZone> = {
  "Vegetation Zone":"Cultivation Zone A", "Flowering Zone A":"Cultivation Zone B", "Flowering Zone B":"Cultivation Zone B",
  "Finished Goods Storage":"Security", "General Storage":"Security", "Support / Infrastructure":"Power",
};
// Operational shapes only: approximate proportions and adjacency traced from the private reference.
// No openings, barriers, access paths, dimensions or device installations are encoded here.
const zoneCodes:Record<PlanZone,string>={"Vegetation Zone":"V","Flowering Zone A":"F1","Flowering Zone B":"F2","Finished Goods Storage":"S1","General Storage":"S2","Support / Infrastructure":"U"};
const areas: {name:PlanZone;path:string;label:[number,number];lines:string[];accessibleName?:string}[] = [
  {name:"General Storage",path:"M30 30H245L735 105V180H145V295H30Z",label:[310,111],lines:["General Storage"]},
  {name:"Flowering Zone A",path:"M315 222H415V422H315Z",label:[365,296],lines:["Flowering","Zone A"]},
  {name:"Flowering Zone B",path:"M445 222H545V422H445Z",label:[495,296],lines:["Flowering","Zone B"]},
  {name:"Vegetation Zone",path:"M580 307H638V406H580Z",label:[609,340],lines:["Vegetation"]},
  {name:"Finished Goods Storage",path:"M145 438H242V555H145Z",label:[193,476],lines:["Finished","Goods","Storage"]},
  {name:"Support / Infrastructure",path:"M716 190H827V555H716Z",label:[771,336],lines:["Support /","Infrastructure"]},
  {name:"Support / Infrastructure",path:"M145 188H242V425H145Z",label:[193,295],lines:["Support"],accessibleName:"Supporting rooms"},
];
const markers: {label:string;system:FacilityZone;x:number;y:number;description:string}[] = [
  {label:"T1",system:"Environmental Sensors",x:365,y:371,description:"Temperature / humidity"},
  {label:"C1",system:"Environmental Sensors",x:495,y:371,description:"CO₂"},
  {label:"H1",system:"HVAC",x:465,y:195,description:"Climate"},
  {label:"I1",system:"Irrigation",x:578,y:454,description:"Irrigation"},
  {label:"P1",system:"Power",x:771,y:430,description:"Power"},
];
function relevant(name:PlanZone,system:FacilityZone) {
  if(system==="Security")return false;
  if(system==="Power")return name==="Support / Infrastructure";
  if(system==="Cultivation Zone A")return name==="Vegetation Zone";
  if(system==="Cultivation Zone B")return name.startsWith("Flowering");
  return name==="Vegetation Zone"||name.startsWith("Flowering");
}
export const FacilityPlan = memo(function FacilityPlan({ room, system, inspectingRoom, onRoom, onSystem }: {
  room:PlanZone;system:FacilityZone;inspectingRoom:boolean;onRoom:(room:PlanZone)=>void;onSystem:(system:FacilityZone)=>void;
}) {
  const id=useId();
  const [zoom,setZoom]=useState(1);
  const width=860/zoom,height=590/zoom;
  const activate=(event:React.KeyboardEvent,action:()=>void)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();action();}};
  return <div className="facility-plan">
    <div className="plan-toolbar"><span>PUBLIC FACILITY PLAN</span><div role="group" aria-label="Floor plan zoom"><button type="button" aria-label="Zoom out floor plan" disabled={zoom===1} onClick={()=>setZoom(value=>Math.max(1,value-.25))}><ZoomOut size={16}/></button><output aria-label="Floor plan zoom level">{Math.round(zoom*100)}%</output><button type="button" aria-label="Zoom in floor plan" disabled={zoom===2} onClick={()=>setZoom(value=>Math.min(2,value+.25))}><ZoomIn size={16}/></button><button type="button" aria-label="Reset floor plan zoom" onClick={()=>setZoom(1)}><RotateCcw size={15}/></button></div></div>
    <svg className="floor-plan-svg" viewBox={`${430-width/2} ${295-height/2} ${width} ${height}`} role="group" aria-labelledby={id}>
      <title id={id}>Public Bavaria operational floor plan. Select a zone or simulated sensor marker.</title>
      <path className="plan-envelope" d="M30 30H245L735 105V180H827V555H716V490H242V555H145V295H30Z"/>
      {areas.map(area=><g key={area.path} role="button" tabIndex={0} aria-label={`${area.accessibleName||area.name} — simulated telemetry`} aria-pressed={inspectingRoom&&room===area.name} aria-controls="system-inspector" data-plan-zone={area.name} className={`plan-zone ${inspectingRoom&&room===area.name?"selected":!inspectingRoom&&relevant(area.name,system)?"system-linked":""}`} onClick={()=>onRoom(area.name)} onKeyDown={event=>activate(event,()=>onRoom(area.name))} onFocus={event=>{if(zoom!==1&&event.currentTarget.matches(":focus-visible"))setZoom(1);}}>
        <path d={area.path}/><text className="plan-full-label" x={area.label[0]} y={area.label[1]} textAnchor="middle">{area.lines.map((line,index)=><tspan key={line} x={area.label[0]} dy={index===0?0:20}>{line}</tspan>)}</text><text className="plan-zone-code" x={area.label[0]} y={area.label[1]+15} textAnchor="middle">{zoneCodes[area.name]}</text>
      </g>)}
      {markers.map(marker=><g key={marker.label} role="button" tabIndex={0} aria-label={`${marker.label} — simulated ${marker.description} marker`} aria-controls="system-inspector" aria-pressed={!inspectingRoom&&system===marker.system} data-plan-marker={marker.label} className={`plan-marker ${!inspectingRoom&&system===marker.system?"selected":""}`} onClick={()=>onSystem(marker.system)} onKeyDown={event=>activate(event,()=>onSystem(marker.system))} onFocus={event=>{if(zoom!==1&&event.currentTarget.matches(":focus-visible"))setZoom(1);}}><circle cx={marker.x} cy={marker.y} r="16"/><text x={marker.x} y={marker.y+4} textAnchor="middle">{marker.label}</text></g>)}
    </svg>
    <span className="plan-sensor-label">SIMULATED SENSOR LAYOUT · Indicative markers</span>
    <div className="plan-room-selector" role="group" aria-label="Operational zones">{planZones.map(name=><button key={name} type="button" aria-pressed={inspectingRoom&&room===name} onClick={()=>onRoom(name)}><span aria-hidden="true">{zoneCodes[name]} · </span>{name}</button>)}</div>
    <div className="plan-marker-selector" role="group" aria-label="Simulated sensor markers">{markers.map(marker=><button key={marker.label} type="button" aria-pressed={!inspectingRoom&&system===marker.system} onClick={()=>onSystem(marker.system)}>{marker.label} · {marker.description}</button>)}</div>
    <p className="plan-note">Based on the real Bavaria facility layout. Sensitive security details are intentionally omitted from this public view.</p>
  </div>;
});
