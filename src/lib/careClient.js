import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

let manager;
let provider;
const demoKey = 'secondyouth.care.demoKey';
export const sharingKey = 'secondyouth.care.sharing';
const returnKey = 'secondyouth.care.return';
const inviteKey = 'secondyouth.care.invite';

export function captureCareInvite() {
  const token = location.hash.match(/^#\/caregiver\/([A-Za-z0-9_-]{43})$/)?.[1];
  if (token) {
    sessionStorage.setItem(inviteKey, token);
    history.replaceState(null, '', location.pathname + location.search + '#/caregiver');
  }
  return sessionStorage.getItem(inviteKey);
}

function demoToken() {
  let token = localStorage.getItem(demoKey);
  if (!token) {
    token = btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))))
      .replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    localStorage.setItem(demoKey, token);
  }
  return token;
}

export async function careRequest(path, { method = 'GET', token, invite, body } = {}) {
  const response = await fetch('/api/care/' + path, {
    method,
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
    headers: {
      ...(token && { authorization: 'Bearer ' + token }),
      ...(invite && { 'x-care-invite': invite }),
      ...(body && { 'content-type': 'application/json' }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw Object.assign(new Error(payload?.error?.message || 'Care sharing is unavailable.'), { status: response.status });
  }
  return response.status === 204 ? null : response.json();
}

async function getProvider() {
  if (!provider) provider = await careRequest('config');
  if (provider.mode === 'oidc' && !manager) {
    manager = new UserManager({
      authority: provider.issuer,
      client_id: provider.clientId,
      redirect_uri: location.origin + location.pathname,
      response_type: 'code',
      ...(provider.resource && { resource: provider.resource }),
      scope: provider.scope,
      userStore: new WebStorageStateStore({ store: sessionStorage }),
      automaticSilentRenew: false,
      loadUserInfo: false,
    });
  }
  return provider;
}

export async function careIdentity() {
  const config = await getProvider();
  if (config.mode === 'demo') {
    const token = demoToken();
    return { scope: 'demo:' + token, token, demo: true };
  }
  const user = await manager.getUser();
  if (!user || user.expired) return null;
  return { scope: 'oidc:' + config.issuer + ':' + user.profile.sub, token: user.access_token };
}

export async function signInForCare() {
  await getProvider();
  sessionStorage.setItem(returnKey, location.hash || '#/care');
  await manager.signinRedirect();
}

export async function completeCareSignIn() {
  const params = new URLSearchParams(location.search);
  if (!params.has('state') || !(params.has('code') || params.has('error'))) return;
  const returnRoute = sessionStorage.getItem(returnKey);
  if (!returnRoute) return;
  try {
    await getProvider();
    await manager.signinRedirectCallback();
  } catch {
    sessionStorage.setItem('secondyouth.care.signInError', 'Sign-in could not be completed. Try again.');
  } finally {
    sessionStorage.removeItem(returnKey);
    history.replaceState(null, '', location.pathname + returnRoute);
  }
}
