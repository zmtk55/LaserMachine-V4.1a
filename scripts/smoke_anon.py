"""Anonymous sign-in test + RLS write."""
import json, urllib.request, time

URL = 'https://pzuyfpquznaxzrlqzxpo.supabase.co'
KEY = 'sb_publishable_OLtNkYQKWxc-26v1zUZLeA_q0zitI0j'

def req(path, method='GET', body=None, token=None):
    h = {'apikey': KEY, 'Content-Type': 'application/json'}
    if token:
        h['Authorization'] = f'Bearer {token}'
    d = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(URL + path, data=d, headers=h, method=method)
    try:
        x = urllib.request.urlopen(r, timeout=30)
        return x.status, x.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

s, b = req('/auth/v1/signup', 'POST', {'data': {}})
print('probe:', s)

# Anonymous sign-in endpoint (GoTrue v2: POST /auth/v1/signup with no email = error;
# correct path is POST /auth/v1/anonymous-signin... actually GoTrue uses /signup body {data} only
# with email; anonymous is POST /auth/v1/anonymous_signin on newer, but also grant_type=anonymous.
# Supabase JS uses: POST {URL}/auth/v1/anonymous-signin? No — it's POST /auth/v1/token?grant_type=...
# Definitive: supabase-js signInAnonymously() calls POST /auth/v1/signup with {"data":{},"gotrue_meta_security":{}}? No.
# It actually calls POST {URL}/auth/v1/anonymous-signin — try variants:
for path in ['/auth/v1/anonymous-signin', '/auth/v1/anon-signin']:
    s, b = req(path, 'POST', {})
    print(f'anon try {path} ->', s, b[:150])
    if s == 200:
        break

try:
    tok = json.loads(b).get('access_token')
except Exception:
    tok = None

if tok:
    phone = f'55{int(time.time()) % 10**10}'
    s2, b2 = req('/rest/v1/customers', 'POST',
                 {'name': 'Smoke Anon', 'phone': phone, 'laser_points': 5}, token=tok)
    print(f'customers insert (RLS): HTTP {s2}', b2[:120])
else:
    print('no anon token')
