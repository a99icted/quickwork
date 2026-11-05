import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = (await readFile(new URL('../src/lib/api.js', import.meta.url), 'utf8'))
  .replace('import.meta.env.VITE_API_URL', 'undefined');
let moduleId = 0;
const response = (status, data = null) => ({ status, ok: status >= 200 && status < 300, json: async () => data });

async function client(handler) {
  const events = [];
  const stored = new Map([['token', 'legacy-token']]);
  globalThis.localStorage = { removeItem: (key) => stored.delete(key) };
  globalThis.window = { dispatchEvent: (event) => events.push(event.type) };
  globalThis.fetch = handler;
  const api = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}#${moduleId++}`);
  assert.equal(stored.has('token'), false);
  return { ...api, events };
}

test('parallel expired requests share one refresh and retry with the new access token', async () => {
  let refreshCount = 0;
  const api = await client(async (url, options) => {
    assert.equal(options.credentials, 'include');
    if (url.endsWith('/auth/refresh')) {
      refreshCount++;
      await new Promise((resolve) => setImmediate(resolve));
      return response(200, { access_token: 'replacement' });
    }
    return options.headers.Authorization === 'Bearer replacement'
      ? response(200, { id: 1 }) : response(401);
  });
  api.setAccessToken('expired');
  const result = await Promise.all([api.api('/user/me'), api.api('/company/me'), api.api('/uwe/getworks')]);
  assert.equal(refreshCount, 1);
  assert.deepEqual(result, [{ id: 1 }, { id: 1 }, { id: 1 }]);
  assert.deepEqual(api.events, []);
});

test('invalid refresh ends the session with no retry loop', async () => {
  const calls = [];
  const api = await client(async (url) => { calls.push(url); return response(401); });
  api.setAccessToken('expired');
  await assert.rejects(api.api('/user/me'), { status: 401 });
  assert.deepEqual(calls, ['/api/user/me', '/api/auth/refresh']);
  assert.deepEqual(api.events, ['qw:unauthorized']);
});

test('temporary refresh errors preserve the session for a later retry', async () => {
  let failed = true;
  const api = await client(async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      if (failed) throw new Error('offline');
      return response(200, { access_token: 'new' });
    }
    return options.headers.Authorization === 'Bearer new' ? response(200, { id: 1 }) : response(401);
  });
  api.setAccessToken('expired');
  await assert.rejects(api.api('/user/me'), { status: 0 });
  assert.deepEqual(api.events, []);
  failed = false;
  assert.deepEqual(await api.api('/user/me'), { id: 1 });
});

test('page reload restores session through cookie and concurrent restores share a refresh', async () => {
  let refreshCount = 0;
  const api = await client(async (url, options) => {
    if (url.endsWith('/auth/refresh')) {
      refreshCount++;
      assert.equal(options.headers.Authorization, undefined);
      await new Promise((resolve) => setImmediate(resolve));
      return response(200, { access_token: 'restored' });
    }
    if (url.includes('/work/?')) return response(200, []);
    if (url.endsWith('/work/options')) return response(200, {});
    assert.equal(options.headers.Authorization, 'Bearer restored');
    if (url.endsWith('/user/me')) return response(200, { id: 1 });
    if (url.endsWith('/company/me')) return response(200, null);
    return response(200, []);
  });
  const sessions = await Promise.all([api.loadSession(), api.loadSession()]);
  assert.equal(refreshCount, 1);
  assert.equal(sessions[0].user.id, 1);
  assert.equal(sessions[1].user.id, 1);
});

test('logout waits for rotation, then revokes the replacement and clears access', async () => {
  const calls = [];
  const api = await client(async (url, options) => {
    calls.push(url);
    if (url.endsWith('/auth/refresh')) {
      await new Promise((resolve) => setImmediate(resolve));
      return response(200, { access_token: 'replacement' });
    }
    if (url.endsWith('/auth/logout')) return response(204);
    assert.equal(options.headers.Authorization, undefined);
    return response(200, {});
  });
  api.setAccessToken('old');
  await Promise.all([api.refreshAccessToken(), api.endSession()]);
  await api.api('/public');
  assert.deepEqual(calls, ['/api/auth/refresh', '/api/auth/logout', '/api/public']);
});
