import assert from 'node:assert/strict';
import {parseTokenAmount,formatTokenUnits} from '../src/chain/amount.ts';
for(const input of ['', '0','-1','NaN','Infinity','1e3','0.0000001','1.0000000','18446744073709.551616']) assert.equal(parseTokenAmount(input),null,input);
assert.equal(parseTokenAmount('0.000001'),1n);
assert.equal(parseTokenAmount('10000'),10_000_000_000n);
assert.equal(parseTokenAmount('18446744073709.551615'),18446744073709551615n);
assert.equal(formatTokenUnits('1250000'),'1.25');
assert.equal(formatTokenUnits('1'),'0.000001');
console.log('PASS: exact six-decimal token amounts, nonnumeric/negative/zero rejection, and u64 boundaries');
