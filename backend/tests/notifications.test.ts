import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({ rows: [] as any[] }));
vi.mock('../src/modules/usuarios/models/User.js', () => ({ getUserModel: () => ({ exists: async (filter: any) => filter.companyId === 'co-1' && filter.branchId === 'br-1' && filter._id === 'user-1' && filter.isActive }) }));
vi.mock('../src/modules/notificaciones/models/Notification.js', () => ({ getNotificationModel: () => ({
  find: (filter: any) => { const query: any = { sort: () => query, lean: () => query, exec: async () => state.rows.filter((r) => r.companyId === filter.companyId && r.branchId === filter.branchId && r.userId === filter.userId) }; return query; },
  create: async (input: any) => { const row = { ...input, _id: (state.rows.length + 1).toString(16).padStart(24,'0'), toObject() { return { ...this }; } }; state.rows.push(row); return row; },
  findOneAndUpdate: (filter: any, update: any) => { const query: any = { lean: () => query, exec: async () => { const row = state.rows.find((r) => r._id === filter._id && r.companyId === filter.companyId && r.branchId === filter.branchId && r.userId === filter.userId && r.channel === filter.channel && filter.status.$in.includes(r.status)); if (row) row.status = update.$set.status; return row ?? null; } }; return query; }
}) }));

import { createNotification, listNotifications, markNotificationRead } from '../src/modules/notificaciones/notificationService.js';

describe('notification domain', () => {
  beforeEach(() => { state.rows.length = 0; });
  it('lists only the signed-in user notifications in their tenant', async () => {
    await createNotification({ companyId: 'co-1', branchId: 'br-1', actorUserId: 'admin-1', userId: 'user-1', title: 'Aviso', message: 'Contenido', channel: 'IN_APP' });
    state.rows.push({ _id: 'other', companyId: 'co-1', branchId: 'br-1', userId: 'user-2', title: 'Privado', message: 'Otro usuario', channel: 'IN_APP', status: 'SENT' });
    expect(await listNotifications('co-1', 'br-1', 'user-1')).toHaveLength(1);
  });
  it('validates recipient tenant and leaves external channels pending', async () => {
    const notification = await createNotification({ companyId: 'co-1', branchId: 'br-1', actorUserId: 'admin-1', userId: 'user-1', title: 'Correo', message: 'Contenido', channel: 'EMAIL' });
    expect(notification.status).toBe('PENDING');
    expect(notification.isRead).toBe(false);
  });
  it('marks a notification as read only for its owner', async () => {
    const notification = await createNotification({ companyId: 'co-1', branchId: 'br-1', actorUserId: 'admin-1', userId: 'user-1', title: 'Aviso', message: 'Contenido', channel: 'IN_APP' });
    const updated = await markNotificationRead('co-1', 'br-1', 'user-1', String(notification.id));
    expect(updated.isRead).toBe(true);
  });
});

it('read state cannot consume pending external delivery or another owner inbox',async()=>{
 state.rows.length=0;
 const external=await createNotification({companyId:'co-1',branchId:'br-1',actorUserId:'admin-1',userId:'user-1',title:'Pending',message:'Message',channel:'EMAIL'});
 await expect(markNotificationRead('co-1','br-1','user-1',String(external.id))).rejects.toMatchObject({statusCode:404});
 expect(state.rows[0].status).toBe('PENDING');
 await expect(markNotificationRead('co-1','br-1','user-1','bad')).rejects.toMatchObject({statusCode:400});
 const own=await createNotification({companyId:'co-1',branchId:'br-1',actorUserId:'admin-1',userId:'user-1',title:'Own',message:'Message',channel:'IN_APP'});
 await expect(markNotificationRead('co-1','br-1','user-2',String(own.id))).rejects.toMatchObject({statusCode:404});
 expect((await markNotificationRead('co-1','br-1','user-1',String(own.id))).status).toBe('READ');
 expect((await markNotificationRead('co-1','br-1','user-1',String(own.id))).status).toBe('READ');
});
