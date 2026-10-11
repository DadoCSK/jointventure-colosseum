"use client";

import { useEffect, useRef, useState } from "react";
import { RotateCcw, RotateCw, Pause, Play } from "lucide-react";

type Vec = [number, number, number];
type Mesh = number[];
const names = ["Propagation", "Vegetative", "Flowering", "Drying", "Processing"];
const add = (a: Vec, b: Vec): Vec => [a[0]+b[0], a[1]+b[1], a[2]+b[2]];
const sub = (a: Vec, b: Vec): Vec => [a[0]-b[0], a[1]-b[1], a[2]-b[2]];
const scale = (a: Vec, n: number): Vec => [a[0]*n, a[1]*n, a[2]*n];
const dot = (a: Vec, b: Vec) => a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross = (a: Vec, b: Vec): Vec => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
const unit = (a: Vec): Vec => scale(a, 1/(Math.hypot(...a)||1));

function triangle(mesh: Mesh, a: Vec, b: Vec, c: Vec, color: Vec, wind = 0) {
  const normal = unit(cross(sub(b,a),sub(c,a)));
  for (const point of [a,b,c]) mesh.push(...point,...normal,...color,wind);
}
function cylinder(mesh: Mesh, start: Vec, end: Vec, bottom: number, top: number, color: Vec, wind=0, sides=12) {
  const axis = unit(sub(end,start));
  const u = unit(cross(axis, Math.abs(axis[1])>.9 ? [1,0,0] : [0,1,0]));
  const v = cross(axis,u);
  const ring = (center: Vec, radius: number, angle: number) => add(center,add(scale(u,Math.cos(angle)*radius),scale(v,Math.sin(angle)*radius)));
  for(let i=0;i<sides;i++) {
    const angle=i/sides*Math.PI*2, next=(i+1)/sides*Math.PI*2;
    const a=ring(start,bottom,angle), b=ring(start,bottom,next), c=ring(end,top,next), d=ring(end,top,angle);
    triangle(mesh,a,b,c,color,wind);triangle(mesh,a,c,d,color,wind);
    triangle(mesh,end,d,c,color,wind);
  }
}
function sphere(mesh: Mesh, center: Vec, size: Vec, color: Vec, wind=0) {
  const point=(i:number,j:number):Vec=>add(center,[Math.sin(i/8*Math.PI)*Math.cos(j/12*Math.PI*2)*size[0],Math.cos(i/8*Math.PI)*size[1],Math.sin(i/8*Math.PI)*Math.sin(j/12*Math.PI*2)*size[2]]);
  for(let i=0;i<8;i++)for(let j=0;j<12;j++) {
    triangle(mesh,point(i,j),point(i+1,j),point(i+1,j+1),color,wind);
    triangle(mesh,point(i,j),point(i+1,j+1),point(i,j+1),color,wind);
  }
}
function leaf(mesh: Mesh, origin: Vec, angle: number, length: number, width: number, color: Vec, droop: number) {
  const direction:Vec=[Math.sin(angle),0,Math.cos(angle)], side:Vec=[Math.cos(angle),0,-Math.sin(angle)];
  const point=(t:number,s:number):Vec=>add(origin,add(scale(direction,t*length),add(scale(side,s*width*Math.sin(Math.PI*t)*(1+.10*Math.sin(t*40))),[0,Math.sin(t*Math.PI)*length*.18-t*t*length*droop-Math.abs(s)*width*.15,0])));
  for(let i=0;i<12;i++) {
    const t=i/12,n=(i+1)/12;
    // A folded central vein gives each leaf a lit upper surface and darker edges.
    for(const s of [-1,1]) {
      const tint=scale(color,.86+.14*Math.sin((t+.2)*Math.PI));
      triangle(mesh,point(t,0),point(n,0),point(n,s),tint,1);
      triangle(mesh,point(t,0),point(n,s),point(t,s),tint,1);
    }
  }
  cylinder(mesh,origin,point(.96,0),.002,.001,scale(color,1.25),1,5);
}
function box(mesh:Mesh, x:number,y:number,z:number,w:number,h:number,d:number,color:Vec) {
  const v:Vec[]=[[x,y,z],[x+w,y,z],[x+w,y+h,z],[x,y+h,z],[x,y,z+d],[x+w,y,z+d],[x+w,y+h,z+d],[x,y+h,z+d]];
  for(const [a,b,c,e] of [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]]) {triangle(mesh,v[a],v[b],v[c],color);triangle(mesh,v[a],v[c],v[e],color);}
}
function specimenMesh(day:number,stage:number):Float32Array {
  const mesh:Mesh=[];
  // A commercial root plug, with no decorative houseplant pot.
  cylinder(mesh,[0,.27,0],[0,.39,0],.12,.12,[.16,.21,.16],0,12);
  const height=.16+Math.min(day,65)/65*1.65;
  const dry=stage===3, processed=stage===4;
  const green:Vec=dry?[.48,.46,.23]:[.22,.47,.18];
  const stem:Vec=dry?[.44,.38,.20]:[.31,.46,.19];
  if(processed) {
    cylinder(mesh,[0,.39,0],[0,.63,0],.019,.012,stem);
    // Harvested material is a demo stage, not a living crop.
    for(let i=0;i<9;i++) sphere(mesh,[Math.sin(i*2.4)*.14,.43+(i%3)*.04,Math.cos(i*2.4)*.14],[.055,.045,.055],[.42,.46,.24]);
    return new Float32Array(mesh);
  }
  const bend=(y:number):Vec=>[Math.sin(y*1.9)*.025,.40+y,Math.sin(y*1.3)*.02];
  for(let i=0;i<16;i++) cylinder(mesh,bend(i/16*height),bend((i+1)/16*height),.014*(1-i/22),.014*(1-(i+1)/22),stem,.20,9);
  const nodes=day<8?1:Math.min(8,2+Math.floor(day/8));
  for(let i=0;i<nodes;i++) {
    const y=height*(.16+i/(nodes+1)*.77), origin=bend(y);
    const size=(.12+Math.min(day,50)/50*.29)*(1-i/(nodes+2)*.65);
    for(let branch=0;branch<2;branch++) {
      const angle=i*2.4+branch*Math.PI;
      const tip=add(origin,[Math.sin(angle)*size*.35,size*.12,Math.cos(angle)*size*.35]);
      cylinder(mesh,origin,tip,.006,.003,stem,.6,6);
      const fingers=day<8?1:day<15?3:5;
      for(let f=0;f<fingers;f++) {
        const offset=f-(fingers-1)/2;
        leaf(mesh,tip,angle+offset*.37,size*(1-Math.abs(offset)*.16),size*(day<8?.32:.16),scale(green,1+(i%3)*.06),dry?.55:.16);
      }
      if(stage===2 && i>nodes*.5) {
        sphere(mesh,tip,[.035,.075,.035],[.43,.56,.24],.6);
        for(let p=0;p<5;p++) sphere(mesh,add(tip,[Math.sin(p*2.4)*.03,p*.012,Math.cos(p*2.4)*.03]),[.007,.014,.007],[.75,.68,.40],.6);
      }
    }
  }
  // New apical leaves keep even the seedling three-dimensional.
  for(let i=0;i<3;i++) leaf(mesh,bend(height),i*Math.PI*2/3,.09+Math.min(day,50)*.0018,.027,scale(green,1.2),.03);
  if(stage===2) sphere(mesh,add(bend(height),[0,.015,0]),[.047,.10,.047],[.45,.58,.26],.7);
  return new Float32Array(mesh);
}
function plantMesh(day:number,stage:number):Float32Array {
  const mesh:Mesh=[];
  // One growing bench and three staged specimens create a canopy preview.
  box(mesh,-.95,.12,-.6,1.9,.12,1.2,[.42,.50,.46]);
  box(mesh,-.88,.24,-.53,1.76,.025,1.06,[.19,.26,.19]);
  for(const x of [-.88,.81]) box(mesh,x,.24,-.6,.07,.12,1.2,[.67,.73,.69]);
  for(const z of [-.6,.53]) box(mesh,-.95,.24,z,1.9,.12,.07,[.67,.73,.69]);
  const specimen=specimenMesh(day,stage);
  for(const x of [-.55,0,.55]) {
    const size=x===0?1:.78;
    for(let i=0;i<specimen.length;i+=10) mesh.push(specimen[i]*size+x,.27+(specimen[i+1]-.27)*size,specimen[i+2]*size+(x===0?.12:-.18),...specimen.slice(i+3,i+10));
  }
  return new Float32Array(mesh);
}
function multiply(a: Float32Array, b: Float32Array) {
  const out=new Float32Array(16);
  for(let col=0;col<4;col++)for(let row=0;row<4;row++)for(let i=0;i<4;i++)out[col*4+row]+=a[i*4+row]*b[col*4+i];
  return out;
}
function camera(aspect: number, yaw: number, day: number) {
  const maturity=Math.max(0,Math.min(day,65)-18)/47, distance=(3.2+maturity*1.3)*Math.max(1,.8/aspect);
  const eye:Vec=[Math.sin(yaw)*distance,2.1+maturity*.4,Math.cos(yaw)*distance], target:Vec=[0,.95+maturity*.2,0];
  const f=unit(sub(target,eye)), s=unit(cross(f,[0,1,0])), u=cross(s,f);
  const view=new Float32Array([s[0],u[0],-f[0],0,s[1],u[1],-f[1],0,s[2],u[2],-f[2],0,-dot(s,eye),-dot(u,eye),dot(f,eye),1]);
  const zoom=1/Math.tan(Math.PI/9);
  const projection=new Float32Array([zoom/aspect,0,0,0,0,zoom,0,0,0,0,-1.0067,-1,0,0,-.20067,0]);
  return multiply(projection,view);
}
const vertexSource=`
attribute vec3 aPosition; attribute vec3 aNormal; attribute vec3 aColor; attribute float aWind;
uniform mat4 uCamera; uniform float uTime;
varying vec3 vColor; varying vec3 vNormal; varying vec3 vPosition;
void main(){vec3 p=aPosition;
  p.x+=sin(uTime*.85+p.y*1.7)*.024*aWind*p.y;
  p.z+=cos(uTime*.65+p.x*3.)*.018*aWind*p.y;
  p.y+=sin(uTime*1.3+p.z*5.)*.007*aWind;
  vColor=aColor; vNormal=aNormal; vPosition=p; gl_Position=uCamera*vec4(p,1.);
}`;
const fragmentSource=`
precision mediump float;
varying vec3 vColor; varying vec3 vNormal; varying vec3 vPosition;
void main(){vec3 n=normalize(vNormal);if(!gl_FrontFacing)n=-n;
  float diffuse=max(dot(n,normalize(vec3(-.6,1.,.8))),0.);
  float rim=max(dot(n,normalize(vec3(.7,.4,-.8))),0.);
  vec3 color=vColor*(.52+diffuse*.65+rim*.13);
  gl_FragColor=vec4(pow(color,vec3(.86)),1.);
}`;

export function GrowthModel({ day, stage, paused }: { day: number; stage: number; paused: boolean }) {
  const canvasRef=useRef<HTMLCanvasElement>(null);
  const settings=useRef({day,stage,paused,moving:true,yaw:.5});
  const drag=useRef<number|null>(null);
  const [contextVersion,setContextVersion]=useState(0);
  const [moving,setMoving]=useState(true);
  // Keep the WebGL context mounted when changing days, telemetry or appearance.
  useEffect(()=>{settings.current.day=day;settings.current.stage=stage;settings.current.paused=paused;settings.current.moving=moving;},[day,stage,paused,moving]);
  useEffect(()=>{
    const canvas=canvasRef.current;
    if(!canvas)return;
    const gl=canvas.getContext("webgl",{alpha:true,antialias:true,preserveDrawingBuffer:false});
    if(!gl){canvas.dataset.modelUnavailable="true";return;}
    const shaders:WebGLShader[]=[];
    const compile=(type:number,source:string)=>{
      const shader=gl.createShader(type);
      if(!shader)throw Error("3D shader unavailable");
      shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);
      if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error("3D shader unavailable");
      return shader;
    };
    const program=gl.createProgram(),buffer=gl.createBuffer();
    let frame=0;
    const reduced=window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible=!document.hidden,lost=false,inView=true;
    const observer=new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;},{rootMargin:"120px"});
    observer.observe(canvas);
    const visibility=()=>{visible=!document.hidden;};
    const lose=(event:Event)=>{event.preventDefault();lost=true;canvas.dataset.modelUnavailable="true";};
    const restore=()=>{delete canvas.dataset.modelUnavailable;setContextVersion(value=>value+1);};
    document.addEventListener("visibilitychange",visibility);
    canvas.addEventListener("webglcontextlost",lose);
    canvas.addEventListener("webglcontextrestored",restore);
    try {
      if(!program||!buffer)throw Error("3D unavailable");
      gl.attachShader(program,compile(gl.VERTEX_SHADER,vertexSource));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragmentSource));gl.linkProgram(program);
      if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error("3D unavailable");
      gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
      for(const [name,size,offset] of [["aPosition",3,0],["aNormal",3,12],["aColor",3,24],["aWind",1,36]] as const) {
        const location=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(location);gl.vertexAttribPointer(location,size,gl.FLOAT,false,40,offset);
      }
      gl.enable(gl.DEPTH_TEST);gl.clearColor(0,0,0,0);
      const cameraLocation=gl.getUniformLocation(program,"uCamera"),timeLocation=gl.getUniformLocation(program,"uTime");
      let last=0,time=0,displayDay=settings.current.day,meshKey="",renderKey="",vertices=0;
      const draw=(now:number)=>{
        if(lost)return;
        if(last && now-last<1000/30){frame=requestAnimationFrame(draw);return;}
        const delta=last?Math.min((now-last)/1000,.05):0;last=now;
        const state=settings.current;
        if(visible && (inView || !canvas.dataset.modelReady)) {
          const animate=!reduced.matches && state.moving && !state.paused;
          if(animate)time+=delta;
          displayDay=reduced.matches?state.day:displayDay+(state.day-displayDay)*Math.min(delta*9,1);
          if(Math.abs(displayDay-state.day)<.03)displayDay=state.day;
          const key=`${displayDay.toFixed(1)}:${state.stage}`;
          if(key!==meshKey){const mesh=plantMesh(Number(displayDay.toFixed(1)),state.stage);gl.bufferData(gl.ARRAY_BUFFER,mesh,gl.STATIC_DRAW);vertices=mesh.length/10;meshKey=key;canvas.dataset.modelDay=String(state.day);}
          const ratio=Math.min(window.devicePixelRatio||1,1.5),width=Math.max(1,Math.round(canvas.clientWidth*ratio)),height=Math.max(1,Math.round(canvas.clientHeight*ratio));
          if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
          const nextRender=`${meshKey}:${state.yaw}:${width}:${height}:${time}`;
          if(nextRender!==renderKey){
          gl.viewport(0,0,width,height);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
          gl.uniformMatrix4fv(cameraLocation,false,camera(width/height,state.yaw,displayDay));gl.uniform1f(timeLocation,time);
          gl.drawArrays(gl.TRIANGLES,0,vertices);
          canvas.dataset.modelReady="true";renderKey=nextRender;
          }
        }
        frame=requestAnimationFrame(draw);
      };
      frame=requestAnimationFrame(draw);
    } catch {canvas.dataset.modelUnavailable="true";}
    return ()=>{observer.disconnect();cancelAnimationFrame(frame);document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("webglcontextlost",lose);canvas.removeEventListener("webglcontextrestored",restore);gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(shader=>gl.deleteShader(shader));};
  // Recreate GPU resources only after an actual context restoration.
  },[contextVersion]);
  return <div className="growth-model-viewer">
    <div className="model-caption"><span>3D CANOPY PREVIEW</span><span>SIMULATED</span></div>
    <canvas ref={canvasRef} className="growth-plant growth-canvas" role="img" tabIndex={0}
      aria-label={`Simulated ${names[stage].toLowerCase()} 3D plant model, day ${day}`}
      aria-describedby="growth-model-help"
      onPointerDown={event=>{drag.current=event.clientX;event.currentTarget.setPointerCapture(event.pointerId);}}
      onPointerMove={event=>{if(drag.current!==null){settings.current.yaw+=(event.clientX-drag.current)*.012;drag.current=event.clientX;}}}
      onPointerUp={()=>{drag.current=null;}} onPointerCancel={()=>{drag.current=null;}}
      onKeyDown={event=>{if(event.key==="ArrowLeft"||event.key==="ArrowRight"){event.preventDefault();settings.current.yaw+=event.key==="ArrowLeft"?-.18:.18;}}}
    />
    <div className="model-fallback" role="status">3D preview unavailable on this device.<br/>Use the growth-stage controls to explore the simulation.</div>
    <div className="model-controls"><button type="button" className="btn btn-ghost" aria-label="Rotate model left" onClick={()=>{settings.current.yaw-=.35;}}><RotateCcw size={16}/></button><span id="growth-model-help">Drag or use arrow keys to rotate</span><button type="button" className="btn btn-ghost" aria-label="Rotate model right" onClick={()=>{settings.current.yaw+=.35;}}><RotateCw size={16}/></button><button type="button" className="btn btn-ghost" aria-label={moving?"Pause plant motion":"Resume plant motion"} aria-pressed={!moving} onClick={()=>setMoving(value=>!value)}>{moving?<Pause size={15}/>:<Play size={15}/>}</button></div>
  </div>;
}
