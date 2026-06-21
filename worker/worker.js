function cr() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const mt = request.method;
    if (mt === 'OPTIONS') return new Response(null, { status: 204, headers: cr() });
    try {
      if (path === '/upload' && mt === 'POST') return await up(request, env);
      if (path === '/download' && mt === 'GET') return await dl(url, env);
      if (path === '/my/list' && mt === 'GET') return await ml(env);
      if (path === '/admin/list' && mt === 'GET') return await al(env);
      if (path === '/admin/delete' && mt === 'DELETE') return await adel(url, env);
      return new Response(JSON.stringify({ error: '404' }), { status: 404, headers: cr() });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: cr() });
    }
  }
};

async function ba(env) {
  var r = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { 'Authorization': 'Basic ' + btoa(env.B2_KEY_ID + ':' + env.B2_APP_KEY) }
  });
  var d = await r.json();
  if (!r.ok) throw new Error(JSON.stringify(d));
  return { t: d.authorizationToken, a: d.apiUrl + '/b2api/v2', dl: d.downloadUrl, id: d.accountId };
}

async function gb(env, a) {
  var r = await fetch(a.a + '/b2_list_buckets', {
    method: 'POST',
    headers: { 'Authorization': a.t, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketName: env.B2_BUCKET, accountId: a.id })
  });
  var d = await r.json();
  if (!d.buckets || !d.buckets.length) throw new Error('bucket ' + env.B2_BUCKET + ' not found');
  return d.buckets[0].bucketId;
}

function sq(env, p, b, m) {
  var h = { 'apikey': env.SUPABASE_ANON, 'Authorization': 'Bearer ' + env.SUPABASE_ANON, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  var o = { method: m || 'GET', headers: h };
  if (b) o.body = b;
  return fetch(env.SUPABASE_URL + '/rest/v1/' + p, o);
}

function g6() { var x = '0123456789', r = ''; for (var i = 0; i < 6; i++) r += x[Math.floor(Math.random() * 10)]; return r; }

async function up(req, env) {
  var fd = await req.formData();
  var f = fd.get('file');
  if (!f) return new Response(JSON.stringify({ error: 'no file' }), { status: 400, headers: cr() });

  var a = await ba(env);
  var bid = await gb(env, a);

  var ur = await fetch(a.a + '/b2_get_upload_url', {
    method: 'POST',
    headers: { 'Authorization': a.t, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bid })
  });
  var ud = await ur.json();
  if (!ur.ok) return new Response(JSON.stringify({ error: ud }), { status: 500, headers: cr() });

  var code = g6();
  var ext = f.name.split('.').pop();
  var fn = code + '.' + ext;
  var buf = await f.arrayBuffer();

  var up2 = await fetch(ud.uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': ud.authorizationToken, 'X-Bz-File-Name': fn, 'Content-Type': 'application/octet-stream', 'X-Bz-Content-Sha1': 'do_not_verify' },
    body: buf
  });
  var uj = await up2.json();
  if (!up2.ok) return new Response(JSON.stringify({ error: uj }), { status: 500, headers: cr() });

  var note = fd.get('note') || '';
  await sq(env, '/fileshare', JSON.stringify({ code, note: note, filename: f.name, filesize: f.size, filetype: f.type || ext, storage_path: fn, uploaded_by: 'user' }), 'POST');

  return new Response(JSON.stringify({ success: true, code }), { headers: cr() });
}

async function dl(url, env) {
  var c = url.searchParams.get('code');
  if (!c) return new Response(JSON.stringify({ error: 'no code' }), { status: 400, headers: cr() });
  var r = await sq(env, '/fileshare?code=eq.' + c + '&select=*');
  var d = await r.json();
  if (!d || !d.length) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: cr() });
  var a = await ba(env);
  var bid = await gb(env, a);
  var ar = await fetch(a.a + '/b2_get_download_authorization', {
    method: 'POST', headers: { 'Authorization': a.t, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bid, fileNamePrefix: d[0].storage_path, validDurationInSeconds: 3600 })
  });
  var ad = await ar.json();
  return new Response(JSON.stringify({ success: true, code: c, filename: d[0].filename, filesize: d[0].filesize, url: a.dl + '/file/' + env.B2_BUCKET + '/' + d[0].storage_path + '?Authorization=' + encodeURIComponent(ad.authorizationToken) }), { headers: cr() });
}

async function ml(env) { var r = await sq(env, '/fileshare?order=created_at.desc'); var d = await r.json(); return new Response(JSON.stringify(d || []), { headers: cr() }); }
async function al(env) { var r = await sq(env, '/fileshare?order=created_at.desc'); var d = await r.json(); return new Response(JSON.stringify(d || []), { headers: cr() }); }
async function adel(url, env) { var id = url.searchParams.get('id'); if (!id) return new Response(JSON.stringify({ error: 'no id' }), { status: 400, headers: cr() }); await sq(env, '/fileshare?id=eq.' + id, null, 'DELETE'); return new Response(JSON.stringify({ success: true }), { headers: cr() }); }
