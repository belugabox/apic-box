import type { ServerType } from '@shared';
import { hc } from 'hono/client';

const serverClient = hc<ServerType>(`${window.location.origin}/`);
export const serverApi = serverClient.api;
export const serverWsUrl = `${window.location.origin.replace(/^http/, 'ws')}/api`;
