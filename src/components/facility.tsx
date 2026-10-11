"use client";
import { useEffect, useState, useId, useSyncExternalStore, useCallback } from "react";
import dynamic from "next/dynamic";
import { Thermometer, Droplets, Wind, Sun, Fan, ShieldCheck, Activity, Sprout, Zap } from "lucide-react";
import { FacilityPlan, planToTwin, type PlanZone } from "./facility-plan";
import { SystemPreview } from "./facility-media";
import { FacilityScene, zoneNames, type FacilityZone } from "./facility-scene";
const GrowthModel = dynamic(() => import("./growth-model").then(mod => mod.GrowthModel), { ssr:false, loading:()=> <div className="growth-loading" role="status">Preparing simulated cultivation preview…</div> });
const stages = ["Propagation", "Vegetative", "Flowering", "Drying", "Processing"];
const stageDays = [1, 18, 45, 55, 60];
const targets = ["25°C · 70% RH", "24°C · 61% RH", "23°C · 50% RH", "19°C · 55% RH", "Controlled storage"];
function stageFor(day:number) { return day<=7?0:day<=28?1:day<=52?2:day<=59?3:4; }
const trends = [
  { label:"Temperature", unit:"°C", base:24.3, amplitude:.9, min:22, max:27, phase:0 },
  { label:"Humidity", unit:"%", base:61, amplitude:4, min:50, max:70, phase:1 },
  { label:"CO₂", unit:"ppm", base:812, amplitude:65, min:650, max:950, phase:2 },
];
function subscribeChartWidth(notify:()=>void) {
  const media=window.matchMedia("(max-width: 540px)");
  media.addEventListener("change",notify);
  return()=>media.removeEventListener("change",notify);
}
function Trend({ label,unit,base,amplitude,min,max,phase }: typeof trends[number]) {
  const id=useId();
  const narrow=useSyncExternalStore(subscribeChartWidth,()=>window.matchMedia("(max-width: 540px)").matches,()=>false);
  const right=narrow?470:880, midpoint=narrow?220:437;
  const values=Array.from({length:49},(_,i)=>base+amplitude*Math.sin(i/48*Math.PI*2+phase)+amplitude*.18*Math.sin(i/48*Math.PI*4));
  const points=values.map((value,i)=>`${(30+i/48*(right-30)).toFixed(2)},${(180-(value-min)/(max-min)*140).toFixed(2)}`).join(" ");
  return <svg viewBox={`0 0 ${right+40} 220`} role="img" aria-labelledby={id} className="trend-chart"><title id={id}>{`${label}: simulated 24h telemetry, range ${Math.min(...values).toFixed(1)} to ${Math.max(...values).toFixed(1)} ${unit}`}</title>
    {[40,110,180].map((y,i)=><g key={y}><line x1="30" y1={y} x2={right} y2={y} className="chart-grid"/><text x="32" y={y-8}>{(max-i*(max-min)/2).toFixed(label==="Temperature"?1:0)} {unit}</text></g>)}
    <polygon points={`30,180 ${points} ${right},180`} fill="var(--chart-ink)" opacity=".06"/>
    <polyline points={points} className="chart-line"/><text x="30" y="210">00:00</text><text x={midpoint} y="210">12:00</text><text x={right-30} y="210">24:00</text>
  </svg>;
}
export function FacilityDashboard() {
  const [elapsed,setElapsed]=useState(0), [paused,setPaused]=useState(false);
  const [selected,setSelected]=useState<FacilityZone>("Cultivation Zone A");
  const [view,setView]=useState<"twin"|"plan">("twin");
  const [room,setRoom]=useState<PlanZone>("Vegetation Zone"), [inspectingRoom,setInspectingRoom]=useState(false);
  const selectSystem=useCallback((zone:FacilityZone)=>{setSelected(zone);setInspectingRoom(false);if(zone==="Cultivation Zone A")setRoom("Vegetation Zone");if(zone==="Cultivation Zone B")setRoom(current=>current.startsWith("Flowering")?current:"Flowering Zone A");},[]);
  const selectRoom=useCallback((zone:PlanZone)=>{setRoom(zone);setInspectingRoom(true);setSelected(planToTwin[zone]);},[]);
  const [day,setDay]=useState(18), [trend,setTrend]=useState(0);
  useEffect(()=>{
    if(paused)return;
    // A deterministic continuous curve, never hardware or external data.
    const timer=setInterval(()=>{if(!document.hidden)setElapsed(value=>value+.2);},200);
    return()=>clearInterval(timer);
  },[paused]);
  const phase=elapsed/22;
  const temperature=(24.3+.6*Math.sin(phase)).toFixed(1), humidity=(61+2.5*Math.sin(phase*.75)).toFixed(0), co2=(812+32*Math.sin(phase*.6)).toFixed(0);
  const lighting=(78+2*Math.sin(phase*.5)).toFixed(0), cooling=(42+5*Math.sin(phase*.8)).toFixed(0), power=(68+3*Math.sin(phase*.4)).toFixed(0);
  const remaining=102-Math.floor(elapsed)%102, nextCycle=`${Math.floor(remaining/60).toString().padStart(2,"0")}:${(remaining%60).toString().padStart(2,"0")}`;
  const vpd=(1.12+.05*Math.sin(phase)).toFixed(2);
  const zoneIcons={"Cultivation Zone A":Sprout,"Cultivation Zone B":Sprout,HVAC:Fan,Irrigation:Droplets,Lighting:Sun,Security:ShieldCheck,Power:Zap,"Environmental Sensors":Activity};
  const zoneLabels={"Cultivation Zone A":"Zone A","Cultivation Zone B":"Zone B",HVAC:"Climate",Irrigation:"Irrigation",Lighting:"Lighting",Security:"Security",Power:"Power","Environmental Sensors":"Environment"};
  const SelectedIcon=zoneIcons[selected];
  const metrics=[
    {label:"Temperature",value:`${temperature} °C`,icon:Thermometer,sensor:"temperature"},
    {label:"Humidity",value:`${humidity}%`,icon:Droplets,sensor:"humidity"},
    {label:"CO₂",value:`${co2} ppm`,icon:Wind,sensor:"co2"},
    {label:"VPD",value:`${vpd} kPa`,icon:Activity,sensor:"vpd"},
    {label:"Lighting",value:`${lighting}%`,icon:Sun,sensor:"lighting"},
    {label:"HVAC",value:`Cooling · ${cooling}%`,icon:Fan,sensor:"hvac"},
    {label:"Environment",value:"Stable",icon:ShieldCheck,sensor:"environment"},
  ];
  const details:Record<FacilityZone,[string,string][]>={
    "Cultivation Zone A":[["Environment",`${temperature}°C · ${humidity}% RH`],["CO₂",`${co2} ppm`],["Demo stage","Vegetative"],["Layout","Illustrative cultivation rows"]],
    "Cultivation Zone B":[["Environment",`${temperature}°C · ${humidity}% RH`],["CO₂",`${co2} ppm`],["Demo stage","Propagation"],["Layout","Illustrative nursery rows"]],
    HVAC:[["Cooling",`${cooling}%`],["Target temperature","24°C"],["Airflow","Simulated normal"],["Zone temperature",`${temperature} °C`]],
    Irrigation:[["Next demo cycle",nextCycle],["Flow","Normal"],["Method","Drip irrigation"]],
    Lighting:[["Output",`${lighting}%`],["Demo schedule","18h on · 6h off"],["Type","Horticultural lighting"],["Control","Simulated dimming"]],
    Security:[["Installation","Planned"],["Coverage","Illustrative access points"],["Hardware","Not connected"],["Facility","Pre-operational"]],
    Power:[["Simulated load",`${power}%`],["Supply","Simulated normal"],["Distribution","Planned infrastructure"],["Metering","Demo only"]],
    "Environmental Sensors":[["Temperature",`${temperature} °C`],["Humidity",`${humidity}%`],["CO₂",`${co2} ppm`],["VPD",`${vpd} kPa`],["Environment","Stable"]],
  };
  // Zone-specific profiles share the same phase/clock; they are not separate sensor feeds.
  const flowering={temperature:(23.8+.4*Math.sin(phase)).toFixed(1),humidity:(52+2*Math.sin(phase*.75)).toFixed(0),co2:(940+25*Math.sin(phase*.6)).toFixed(0)};
  const stored={temperature:(19.4+.3*Math.sin(phase)).toFixed(1),humidity:(48+1.5*Math.sin(phase*.75)).toFixed(0)};
  const roomDetails:Record<PlanZone,[string,string][]>={
    "Vegetation Zone":[["Temperature",`${temperature} °C`],["Humidity",`${humidity}%`],["Lighting",`${lighting}%`],["HVAC","Simulated Online"],["Growth preview",`${stages[stageFor(day)]} · Day ${day}`]],
    "Flowering Zone A":[["Stage","Flowering · Day 36"],["Temperature",`${flowering.temperature} °C`],["Humidity",`${flowering.humidity}%`],["CO₂",`${flowering.co2} ppm`],["Lighting","100%"],["Environment","Stable"]],
    "Flowering Zone B":[["Stage","Flowering · Day 36"],["Temperature",`${flowering.temperature} °C`],["Humidity",`${flowering.humidity}%`],["CO₂",`${flowering.co2} ppm`],["Lighting","100%"],["Environment","Stable"]],
    "Finished Goods Storage":[["Temperature",`${stored.temperature} °C`],["Humidity",`${stored.humidity}%`],["Security","Planned"]],
    "General Storage":[["Climate","Standard"],["Inventory","Not active"]],
    "Support / Infrastructure":[["Simulated load",`${power}%`],["Allocation","Illustrative systems"],["Rooms","Supporting functions"]],
  };
  const showRoom=inspectingRoom;
  const inspectorTitle=showRoom?room:selected;
  const planned=showRoom?(room.includes("Storage")||room==="Support / Infrastructure"):selected==="Security";
  const inspectorDetails=showRoom?roomDetails[room]:details[selected];
  const stage=stageFor(day), height=stage===4?"Harvested":`~${Math.round(10+Math.min(day,45)/45*110)} cm`;
  const ops=[
    {name:"HVAC",icon:Fan,status:"Simulated Online",value:`Cooling ${cooling}%`,load:Number(cooling)},
    {name:"Lighting",icon:Sun,status:"Simulated Online",value:`Output ${lighting}%`,load:Number(lighting)},
    {name:"Irrigation",icon:Droplets,status:"Simulated Online",value:`Next demo cycle ${nextCycle}`,load:null},
    {name:"Environment",icon:Activity,status:"Simulated Stable · Vegetation",value:`${temperature}°C · ${humidity}% · ${co2} ppm`,load:null},
    {name:"Power",icon:Zap,status:"Simulated Normal",value:`Simulated load ${power}%`,load:Number(power)},
    {name:"Security",icon:ShieldCheck,status:"Planned",value:"Pre-operational",load:null},
  ];
  return <div className={paused?"digital-twin simulation-paused":"digital-twin"}>
    <section className="twin-hero" aria-labelledby="twin-title">
      <div className="twin-toolbar"><div><span className="twin-status"><i/> SIMULATED DIGITAL TWIN</span><h2 id="twin-title">Inside the planned facility</h2></div><button className="twin-pause" aria-pressed={paused} onClick={()=>setPaused(value=>!value)}>{paused?"Resume simulation":"Pause simulation"}</button></div>
      <div className="facility-view-toggle" role="group" aria-label="Facility view"><button type="button" aria-pressed={view==="twin"} onClick={()=>setView("twin")}>Digital Twin</button><button type="button" aria-pressed={view==="plan"} onClick={()=>setView("plan")}>Floor Plan</button></div>
      <div className="twin-workspace">
        <div className="twin-viewport">
          <div hidden={view!=="twin"}><FacilityScene selected={selected} onSelect={selectSystem} paused={paused||view!=="twin"}/></div>
          <div hidden={view!=="plan"}><FacilityPlan room={room} system={selected} inspectingRoom={inspectingRoom} onRoom={selectRoom} onSystem={selectSystem}/></div>
          <span className="telemetry-reference">Vegetation reference · Simulated telemetry</span>
          <div className="twin-readings" aria-label="Simulated facility telemetry">{metrics.slice(0,6).map(metric=><div key={metric.sensor}><metric.icon size={13}/><span>{metric.label}</span><strong key={metric.value} data-sensor={metric.sensor}>{metric.value}</strong></div>)}</div>
          <div className="twin-environment"><span className="twin-dot"/> Simulated environment <strong data-sensor="environment">Stable</strong></div>
        </div>
        <div className="zone-selector" role="group" aria-label="Facility systems">{zoneNames.map(name=>{const Icon=zoneIcons[name];return <button key={name} type="button" aria-pressed={name===selected} aria-controls="system-inspector" onClick={()=>selectSystem(name)}><Icon size={14}/>{zoneLabels[name]}</button>;})}</div>
        <aside id="system-inspector" className="zone-details system-inspector" aria-labelledby="zone-detail-title">
          <header><SelectedIcon size={18}/><div><span className="twin-kicker">SYSTEM INSPECTOR</span><h3 id="zone-detail-title">{inspectorTitle}</h3></div><span className={planned?"zone-state planned":"zone-state"}><i className="twin-dot"/>{planned?"Planned":"Simulated Online"}</span></header>
          {!showRoom&&<SystemPreview zone={selected} paused={paused}/>}
          <dl>{inspectorDetails.map(([label,value])=><div key={label}><dt>{label}</dt><dd key={value}>{value}</dd></div>)}</dl>
          <span className="inspector-source">{showRoom?"Simulated zone profile · Pre-operational":selected==="Security"?"Pre-operational · Installation planned":"Simulated telemetry · Illustrative system render"}</span>
        </aside>
      </div>
      <div className="twin-footnote"><span>Planned Bavaria facility · Pre-operational</span><span>{paused?"Simulation paused":"Demo readings · gently updating"} · No hardware connected</span></div>
    </section>
    <section className="environment-trends" aria-labelledby="trends-title"><div className="section-caption"><span>02 / ENVIRONMENT HISTORY DEMO</span><h2 id="trends-title">Environment · Last 24 Hours</h2><span className="simulation-badge">Simulated 24h telemetry</span></div><div className="trend-tabs" role="tablist" aria-label="Environment metric">{trends.map((item,index)=><button key={item.label} id={`trend-tab-${index}`} role="tab" aria-selected={trend===index} aria-controls="environment-chart" tabIndex={trend===index?0:-1} data-trend={index} onClick={()=>setTrend(index)} onKeyDown={event=>{if(["ArrowRight","ArrowLeft","Home","End"].includes(event.key)){event.preventDefault();const next=event.key==="Home"?0:event.key==="End"?2:(index+(event.key==="ArrowRight"?1:2))%3;setTrend(next);event.currentTarget.parentElement?.querySelector<HTMLButtonElement>(`[data-trend="${next}"]`)?.focus();}}}>{item.label}</button>)}</div><div id="environment-chart" role="tabpanel" aria-labelledby={`trend-tab-${trend}`} tabIndex={0}><Trend {...trends[trend]}/></div></section>
    <section className="cultivation-panel cultivation-twin" aria-labelledby="cycle-title"><div className="section-caption"><span>03 / PRODUCTION PREVIEW</span><h2 id="cycle-title">Cultivation cycle</h2><span className="simulation-badge">SIMULATED GROWTH CYCLE</span></div>
      <ol className="cycle-stepper">{stages.map((label,index)=><li key={label}><button type="button" aria-pressed={index===stage} onClick={()=>setDay(stageDays[index])}><span>{String(index+1).padStart(2,"0")}</span>{label}</button></li>)}</ol>
      <div className="cultivation-stage"><div className="cycle-insight"><span className="eyebrow">ILLUSTRATIVE CANOPY</span><span className="cycle-day" aria-live="polite">{stages[stage]} · Day {day}</span><h3>{stages[stage]}</h3><strong className="growth-age">Day {day}<span>/ 60</span></strong><dl><div><dt>Demo plant height</dt><dd>{height}</dd></div><div><dt>Illustrative target</dt><dd>{targets[stage]}</dd></div><div><dt>Tracking</dt><dd>Simulated only</dd></div></dl></div><GrowthModel day={day} stage={stage} paused={paused}/></div>
      <div className="cycle-scrubber"><label htmlFor="growth-day">Explore growth <span>Day {day}</span></label><input id="growth-day" type="range" min="1" max="60" value={day} onChange={event=>setDay(Number(event.target.value))}/><div className="growth-day-buttons">{[1,14,28,45,60].map(value=><button key={value} className="btn btn-ghost" aria-pressed={day===value} onClick={()=>setDay(value)}>Day {value}</button>)}</div><small>Illustrative stages and targets · no actual plant tracking</small></div>
    </section>
    <section className="operations-section" aria-labelledby="systems-title"><div className="section-caption"><span>04 / OPERATIONS PREVIEW</span><h2 id="systems-title">Facility systems</h2><span className="simulation-badge">SIMULATED TELEMETRY</span></div><ul className="operations-strip">{ops.map(system=><li key={system.name}><system.icon size={18}/><h3>{system.name}</h3><span className="operation-state">{system.status}</span><strong data-system={system.name.toLowerCase()}>{system.value}</strong>{system.load!==null&&<div className="operation-gauge" aria-hidden="true"><span style={{width:`${system.load}%`}}/></div>}</li>)}</ul></section>
  </div>;
}
