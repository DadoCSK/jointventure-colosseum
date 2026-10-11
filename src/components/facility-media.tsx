"use client";
import { useEffect, useRef, useState } from "react";
import type { FacilityZone } from "./facility-scene";
const zoneClips: Partial<Record<FacilityZone,string>> = {
  "Cultivation Zone A":"cultivation", "Cultivation Zone B":"cultivation", Lighting:"cultivation",
  HVAC:"hvac", Irrigation:"irrigation", Power:"power", "Environmental Sensors":"sensors",
};
function AmbientClip({ id, paused }: { id:string; paused:boolean }) {
  const ref=useRef<HTMLVideoElement>(null);
  const [failed,setFailed]=useState(false);
  const [softening,setSoftening]=useState(false);
  useEffect(()=>{
    const video=ref.current;
    if(!video)return;
    const motion=window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible=false;
    // Source is assigned only when visible, so inactive/offscreen clips are not fetched.
    const sync=()=>{
      if(paused||motion.matches||!visible||document.hidden){video.pause();return;}
      if(!video.hasAttribute("src"))video.setAttribute("src",`/animations/${id}.mp4`);
      void video.play().catch(()=>{ /* Autoplay refusal leaves the descriptive poster intact. */ });
    };
    const observer=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;sync();});
    observer.observe(video);
    motion.addEventListener("change",sync);document.addEventListener("visibilitychange",sync);
    return()=>{observer.disconnect();motion.removeEventListener("change",sync);document.removeEventListener("visibilitychange",sync);video.pause();};
  },[id,paused]);
  return <div className={`system-visual ${softening?"loop-softening":""}`} style={{backgroundImage:`url(/animations/${id}.jpg)`}}>
    {failed?<div className="system-video-error" role="status">Visualization unavailable. System readings remain available.</div>:
      <video ref={ref} poster={`/animations/${id}.jpg`} autoPlay={!paused} loop muted playsInline preload="none" width={1280} height={720} aria-hidden="true" tabIndex={-1}
        onError={()=>setFailed(true)} onTimeUpdate={event=>{const video=event.currentTarget;setSoftening(Number.isFinite(video.duration)&&video.duration-video.currentTime<.35||video.currentTime<.2);}}/>}
    <span className="system-visual-label" aria-hidden="true">SUBSYSTEM PREVIEW</span>
  </div>;
}
export function SystemPreview({ zone, paused }: { zone:FacilityZone; paused:boolean }) {
  const id=zoneClips[zone];
  // Planned infrastructure is represented by text, never an invented video placeholder.
  if(!id)return null;
  return <AmbientClip key={id} id={id} paused={paused}/>;
}
