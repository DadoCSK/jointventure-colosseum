import { test, expect } from '@playwright/test';

const select = async (page: import('@playwright/test').Page, name: string) => page.locator('.zone-selector').getByRole('button', { name, exact:true }).click();

test('facility stays mounted while each subsystem highlights and autoplays its diagnostic clip', async ({ page }) => {
  const errors:string[]=[];
  page.on('pageerror',error=>errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await page.goto('/facility');
  await page.getByRole('button',{name:'Pause simulation',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resume simulation',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Resume simulation',exact:true}).click();
  await page.locator('.facility-scene').evaluate(element=>element.setAttribute('data-instance','original'));
  for (const [name,zone,clip] of [['Zone A','Cultivation Zone A','cultivation'],['Climate','HVAC','hvac'],['Lighting','Lighting','cultivation'],['Irrigation','Irrigation','irrigation'],['Power','Power','power'],['Environment','Environmental Sensors','sensors']]) {
    await select(page,name);
    await expect(page.locator('.facility-scene')).toBeVisible();
    await expect(page.locator('.facility-scene')).toHaveAttribute('data-instance','original');
    await expect(page.locator(`.scene-zone[data-zone="${zone}"]`).first()).toHaveAttribute('aria-pressed','true');
    await expect(page.locator('#zone-detail-title')).toHaveText(zone);
    const video=page.locator('video');
    await video.scrollIntoViewIfNeeded();
    await expect(video).toHaveAttribute('src',`/animations/${clip}.mp4`);
    await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
    expect(await video.evaluate((v:HTMLVideoElement)=>({muted:v.muted,loop:v.loop,controls:v.controls,inline:v.playsInline}))).toEqual({muted:true,loop:true,controls:false,inline:true});
    await expect(video).toHaveAttribute('aria-hidden','true');
  }
  await select(page,'Security');
  await expect(page.locator('video')).toHaveCount(0);
  await expect(page.locator('.zone-state')).toHaveText('Planned');
  expect(errors).toEqual([]);
});

test('shared telemetry and pause/resume stay consistent in the scene, inspector and systems', async ({ page })=>{
  await page.goto('/facility');
  await select(page,'Climate');
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
  await page.getByRole('button',{name:'Pause simulation',exact:true}).click();
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  const cooling=(await page.locator('[data-sensor="hvac"]').innerText()).split(' · ')[1];
  await expect(page.locator('.zone-details dd').first()).toHaveText(cooling);
  await expect(page.locator('.zone-details dd').last()).toHaveText(await page.locator('[data-sensor="temperature"]').innerText());
  await expect(page.locator('[data-system="hvac"]')).toHaveText(`Cooling ${cooling}`);
  await select(page,'Environment');
  for(const [i,key] of ['temperature','humidity','co2','vpd'].entries())await expect(page.locator('.zone-details dd').nth(i)).toHaveText(await page.locator(`[data-sensor="${key}"]`).innerText());
  await page.getByRole('button',{name:'Resume simulation',exact:true}).click();
  await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.paused)).toBe(false);
});

test('loop retains fixed dimensions and offscreen playback pauses',async({page})=>{
  await page.goto('/facility');
  const video=page.locator('video');
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.readyState)).toBeGreaterThanOrEqual(2);
  const before=await video.boundingBox();
  await video.evaluate((v:HTMLVideoElement)=>{v.currentTime=v.duration-.2;});
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeLessThan(2);
  const after=await video.boundingBox();
  expect(after!.height).toBe(before!.height);expect(after!.width).toBe(before!.width);
  await page.locator('.trend-chart').scrollIntoViewIfNeeded();
  await expect.poll(()=>video.evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
});

for(const width of [320,390,768,1440])test(`inspector fits ${width}px; reduced motion keeps only the selected poster`,async({page})=>{
  await page.setViewportSize({width,height:900});await page.emulateMedia({reducedMotion:'reduce'});
  const requests:string[]=[];page.on('request',request=>{if(request.url().includes('.mp4'))requests.push(request.url());});
  await page.goto('/facility');
  await page.locator('.zone-selector').getByRole('button',{name:'Climate',exact:true}).focus();await page.keyboard.press('Enter');
  await expect(page.locator('#zone-detail-title')).toHaveText('HVAC');
  await expect(page.locator('.facility-scene')).toBeVisible();
  expect(await page.locator('video').evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
  expect(requests).toEqual([]);
  if(width===1440){
    await page.emulateMedia({reducedMotion:'no-preference'});
    await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.currentTime)).toBeGreaterThan(.1);
    await page.emulateMedia({reducedMotion:'reduce'});
    await expect.poll(()=>page.locator('video').evaluate((v:HTMLVideoElement)=>v.paused)).toBe(true);
    expect(requests.every(url=>url.endsWith('/animations/hvac.mp4'))).toBe(true);
  }
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(width<=768){const scene=await page.locator('.facility-scene').boundingBox(), selector=await page.locator('.zone-selector').boundingBox(), inspector=await page.locator('.system-inspector').boundingBox();expect(selector!.y).toBeGreaterThan(scene!.y+scene!.height);expect(inspector!.y).toBeGreaterThan(selector!.y+selector!.height);}
});

test('unavailable animation preserves the facility and textual readings',async({page})=>{
  await page.route('**/animations/hvac.mp4',route=>route.abort());await page.goto('/facility');await select(page,'Climate');
  await expect(page.getByRole('status').filter({hasText:'Visualization unavailable'})).toBeVisible();
  await expect(page.locator('.facility-scene')).toBeVisible();await expect(page.locator('.zone-details dd').first()).toContainText('%');
  await select(page,'Power');await expect(page.locator('video')).toHaveAttribute('src','/animations/power.mp4');
});
