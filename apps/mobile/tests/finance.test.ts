import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateAccount, validateCashMovement } from '../src/financeValidation';
const accounts = [{ id: 'a', status: 'ACTIVE' }, { id: 'b', status: 'INACTIVE' }];
const movement = { accountId: 'a', concept: 'Prueba', type: 'INFLOW', amount: '10.00', date: '2026-10-02' };
test('cash validation rejects nonexistent dates, unsupported types and inactive accounts', () => {
  for (const date of ['2026-02-30', '2026-13-01', '2026-1-1', '']) assert.throws(() => validateCashMovement({ ...movement, date }, accounts));
  assert.equal(validateCashMovement({ ...movement, date: '2024-02-29' }, accounts).date, '2024-02-29');
  assert.throws(() => validateCashMovement({ ...movement, accountId: 'b' }, accounts));
  assert.throws(() => validateCashMovement({ ...movement, type: 'TRANSFER' }, accounts));
});
test('cash validation prevents rounding tiny values to zero and normalizes account fields', () => {
  for (const amount of ['0', '0.001', '-1', '1e2', '']) assert.throws(() => validateCashMovement({ ...movement, amount }, accounts));
  assert.equal(validateCashMovement({ ...movement, amount: '0.01' }, accounts).amount, 0.01);
  assert.deepEqual(validateAccount({ name: ' Caja ', bankName: ' Banco ', iban: ' abcd 1234 ' }), { name: 'Caja', bankName: 'Banco', iban: 'ABCD1234' });
  assert.throws(() => validateAccount({ name: 'Caja', bankName: 'Banco', iban: '123' }));
});
