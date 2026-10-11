import { test, expect } from '@playwright/test';
const openPlan=async(page:import('@playwright/test').Page)=>page.getByRole('button',{name:'Floor Plan',exact:true}).click();
const room=async(page:import('@playwright/test').Page,name:string)=>page.locator('.floor-plan-svg').getByRole('button',{name:`${name} — simulated telemetry`,exact:true}).click();

test('floor plan uses sanitized geometry, preserves twin instance and shares system selection',async({page})=>{
  const errors:string[]=[],requests:string[]=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>requests.push(r.url()));
  await page.goto('/facility');
  await page.getByRole('button',{name:'Pause simulation',exact:true}).click();
  await expect(page.getByRole('button',{name:'Resume simulation',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.getByRole('button',{name:'Resume simulation',exact:true}).click();
  await expect(page.getByRole('button',{name:'Digital Twin',exact:true})).toHaveAttribute('aria-pressed','true');
  await page.locator('.facility-scene').evaluate(el=>el.setAttribute('data-original','yes'));
  await page.locator('.zone-selector').getByRole('button',{name:'Climate',exact:true}).click();await openPlan(page);
  await expect(page.locator('#zone-detail-title')).toHaveText('HVAC');
  await expect(page.locator('[data-plan-marker="H1"]')).toHaveAttribute('aria-pressed','true');
  await expect(page.locator('.floor-plan-svg')).toBeVisible();
  await expect(page.getByText('Based on the real Bavaria facility layout. Sensitive security details are intentionally omitted from this public view.')).toBeVisible();
  await expect(page.locator('.floor-plan-svg image')).toHaveCount(0);
  const markup=await page.locator('.facility-plan').innerHTML();
  expect(markup).not.toMatch(/RC3|GITTER|FENSTER|TRESOR|PASSAGE|PRIZEMLJE|<image|<foreignObject/i);
  expect(requests.some(url=>/PRIZEMLJE/i.test(url))).toBe(false);
  await room(page,'Vegetation Zone');await expect(page.locator('#zone-detail-title')).toHaveText('Vegetation Zone');
  await page.getByRole('button',{name:'Digital Twin',exact:true}).click();
  await expect(page.locator('.facility-scene')).toHaveAttribute('data-original','yes');
  await expect(page.locator('[data-zone="Cultivation Zone A"]').first()).toHaveAttribute('aria-pressed','true');
  await openPlan(page);await expect(page.locator('#zone-detail-title')).toHaveText('Vegetation Zone');
  await page.locator('.zone-selector').getByRole('button',{name:'Security',exact:true}).click();
  await expect(page.locator('.zone-state')).toHaveText('Planned');
  await expect(page.locator('.plan-marker.selected')).toHaveCount(0);await expect(page.locator('.plan-zone.system-linked')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('all operational zones and markers update the shared inspector with explicit profiles',async({page})=>{
  await page.goto('/facility');await page.getByRole('button',{name:'Pause simulation',exact:true}).click();await openPlan(page);
  await room(page,'Vegetation Zone');
  await expect(page.locator('.zone-details dd').nth(0)).toHaveText(await page.locator('[data-sensor="temperature"]').innerText());
  await expect(page.locator('.zone-details dd').nth(1)).toHaveText(await page.locator('[data-sensor="humidity"]').innerText());
  await expect(page.locator('.zone-details dd').nth(2)).toHaveText(await page.locator('[data-sensor="lighting"]').innerText());
  for(const name of ['Flowering Zone A','Flowering Zone B']){await room(page,name);await expect(page.locator('#zone-detail-title')).toHaveText(name);await expect(page.locator('.zone-details dd').nth(1)).toHaveText('23.8 °C');await expect(page.locator('.zone-details dd').nth(2)).toHaveText('52%');await expect(page.locator('.zone-details dd').nth(3)).toHaveText('940 ppm');}
  for(const name of ['Finished Goods Storage','General Storage','Support / Infrastructure']){await room(page,name);await expect(page.locator('.zone-state')).toHaveText('Planned');}
  for(const [marker,system] of [['T1','Environmental Sensors'],['C1','Environmental Sensors'],['H1','HVAC'],['I1','Irrigation'],['P1','Power']]){await page.locator(`[data-plan-marker="${marker}"]`).focus();await page.keyboard.press('Enter');await expect(page.locator('#zone-detail-title')).toHaveText(system);}
  await expect(page.getByText('SIMULATED SENSOR LAYOUT · Indicative markers')).toBeVisible();
});

for(const width of [320,390,768,1440])test(`public plan is usable at ${width}px with keyboard selection and contained zoom`,async({page})=>{
  await page.setViewportSize({width,height:1000});await page.emulateMedia({reducedMotion:'reduce'});await page.goto('/facility');
  await page.getByRole('button',{name:'Floor Plan',exact:true}).focus();await page.keyboard.press('Space');
  await page.locator('.plan-room-selector').getByRole('button',{name:/Flowering Zone B/}).click();
  await expect(page.locator('#zone-detail-title')).toHaveText('Flowering Zone B');
  await page.getByRole('button',{name:'Zoom in floor plan',exact:true}).click();await expect(page.getByLabel('Floor plan zoom level')).toHaveText('125%');
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.getByRole('button',{name:'Reset floor plan zoom',exact:true}).click();await expect(page.getByLabel('Floor plan zoom level')).toHaveText('100%');
  await page.locator('.plan-marker-selector').getByRole('button',{name:'P1 · Power',exact:true}).focus();await page.keyboard.press('Enter');await expect(page.locator('#zone-detail-title')).toHaveText('Power');
});
