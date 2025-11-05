import { hc } from 'hono/client';

import type { ServerType } from '@server/main';

const serverClient = hc<ServerType>(`${window.location.origin}/`);
export const serverApi = serverClient.api;
export const serverWsUrl = `${window.location.origin.replace(/^http/, 'ws')}/api`;
