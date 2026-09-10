import { apiRequest } from './api';

export interface QueueItem {
  id: string;
  entity: 'triage' | 'vitals' | 'referral';
  action: 'CREATE' | 'UPDATE';
  payload: any;
  createdAt: string;
}

const STORAGE_KEY = 'arogyapath_offline_queue';

export function getOfflineQueue(): QueueItem[] {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

export function queueOfflineAction(entity: QueueItem['entity'], action: QueueItem['action'], payload: any) {
  const queue = getOfflineQueue();
  const newItem: QueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    entity,
    action,
    payload,
    createdAt: new Date().toISOString(),
  };
  queue.push(newItem);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  return newItem;
}

export function clearOfflineQueue() {
  localStorage.removeItem(STORAGE_KEY);
}

export async function syncOfflineQueue(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  try {
    const payload = {
      items: queue.map(q => ({
        clientTxId: q.id,
        entity: q.entity,
        action: q.action,
        payload: q.payload,
      })),
    };

    const res = await apiRequest('/sync', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    clearOfflineQueue();
    return { synced: res.data?.processed || queue.length, failed: 0 };
  } catch (err) {
    console.error('Offline sync failed:', err);
    return { synced: 0, failed: queue.length };
  }
}
