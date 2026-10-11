const SCALE = BigInt(1_000_000);
const MAX = BigInt('18446744073709551615');
export function parseTokenAmount(value: string): bigint | null {
  if(value.trim().length>26) return null;
  if (!/^\d+(?:\.\d{1,6})?$/.test(value.trim())) return null;
  const [whole, fraction = ''] = value.trim().split('.');
  const units = BigInt(whole) * SCALE + BigInt(fraction.padEnd(6, '0'));
  return units > BigInt(0) && units <= MAX ? units : null;
}
export function formatTokenUnits(value: string): string {
  const units = BigInt(value);
  const fraction = (units % SCALE).toString().padStart(6, '0').replace(/0+$/, '');
  return `${(units / SCALE).toLocaleString('en-US')}${fraction ? `.${fraction}` : ''}`;
}

const SOL_SCALE = BigInt(1_000_000_000);
export function parseSolAmount(value:string):bigint|null {
  const text=value.trim();
  if(text.length>30 || !/^\d+(?:\.\d{1,9})?$/.test(text))return null;
  const [whole,fraction='']=text.split('.');
  const lamports=BigInt(whole)*SOL_SCALE+BigInt(fraction.padEnd(9,'0'));
  return lamports>BigInt(0)&&lamports<=MAX?lamports:null;
}
export function formatSolLamports(value:string):string {
  const lamports=BigInt(value),fraction=(lamports%SOL_SCALE).toString().padStart(9,'0').replace(/0+$/,'');
  return `${(lamports/SOL_SCALE).toLocaleString('en-US')}${fraction?`.${fraction}`:''}`;
}
