// DreaMax 网盘 Worker
// 需要的环境变量（已在 Cloudflare 中设置）：
// B2_KEY_ID, B2_APP_KEY, B2_BUCKET, SUPABASE_URL, SUPABASE_ANON, ADMIN_USERS, HF_TOKEN

addEventListener('fetch', function(ev) {
  ev.respondWith(handle(ev));
});

async function handle(ev) {
  var req = ev.request;
  var url = new URL(req.url);
  var path = url.pathname;
  var mt = req.method;
  var h = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  if (mt === 'OPTIONS') return new Response(null, { status: 204, headers: h });

  try {
    if (path === '/upload' && mt === 'POST') return await up(req, h);
    if (path === '/download' && mt === 'GET') return await dl(url, h);
    if (path === '/my/list' && mt === 'GET') return await ml(h);
    if (path === '/admin/list' && mt === 'GET') return await al(h);
    if (path === '/admin/delete' && mt === 'DELETE') return await adel(url, h);
    if (path === '/hf-rewrite' && mt === 'POST') return await hr(req, h);
    return new Response(JSON.stringify({ e: '404' }), { status: 404, headers: h });
  } catch (e) {
    return new Response(JSON.stringify({ e: e.message }), { status: 500, headers: h });
  }
}

async function b2_auth() {
  var r = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { 'Authorization': 'Basic ' + btoa(B2_KEY_ID + ':' + B2_APP_KEY) }
  });
  var d = await r.json();
  if (!r.ok) throw new Error('b2');
  return { t: d.authorizationToken, api: d.apiUrl + '/b2api/v2', dl: d.downloadUrl };
}

function sb(path, body, method) {
  var hd = {
    'apikey': SUPABASE_ANON,
    'Authorization': 'Bearer ' + SUPABASE_ANON,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  var op = { method: method || 'GET', headers: hd };
  if (body) op.body = body;
  return fetch(SUPABASE_URL + '/rest/v1/' + path, op);
}

function make6() {
  var x = '0123456789', r = '';
  for (var i = 0; i < 6; i++) r += x[Math.floor(Math.random() * 10)];
  return r;
}

async function getBid(ba) {
  var r = await fetch(ba.api + '/b2_list_buckets', { method: 'POST', headers: { 'Authorization': ba.t, 'Content-Type': 'application/json' }, body: '{"bucketName":"' + B2_BUCKET + '"}' });
  var d = await r.json();
  if (!d.buckets || !d.buckets.length) throw new Error('bucket');
  return d.buckets[0].bucketId;
}

async function up(req, h) {
  var fd = await req.formData();
  var f = fd.get('file');
  if (!f) return new Response(JSON.stringify({ e: 'no file' }), { status: 400, headers: h });
  var code = make6();
  var ext = f.name.split('.').pop();
  var fn = code + '.' + ext;
  var buf = await f.arrayBuffer();
  var ba = await b2_auth();
  var id = await getBid(ba);
  var ur = await fetch(ba.api + '/b2_get_upload_url', { method: 'POST', headers: { 'Authorization': ba.t, 'Content-Type': 'application/json' }, body: '{"bucketId":"' + id + '"}' });
  var ud = await ur.json();
  if (!ur.ok) return new Response(JSON.stringify({ e: 'url' }), { status: 500, headers: h });
  var up2 = await fetch(ud.uploadUrl, {
    method: 'POST',
    headers: { 'Authorization': ud.authorizationToken, 'X-Bz-File-Name': fn, 'Content-Type': 'application/octet-stream', 'X-Bz-Content-Sha1': 'do_not_verify' },
    body: buf
  });
  if (!up2.ok) return new Response(JSON.stringify({ e: 'b2' }), { status: 500, headers: h });
  await sb('/fileshare', JSON.stringify({ code: code, filename: f.name, filesize: f.size, filetype: f.type || ext, storage_path: fn, uploaded_by: 'user' }), 'POST');
  return new Response(JSON.stringify({ ok: true, code: code }), { headers: h });
}

async function dl(url, h) {
  var c = url.searchParams.get('code');
  if (!c) return new Response(JSON.stringify({ e: 'no code' }), { status: 400, headers: h });
  var r = await sb('/fileshare?code=eq.' + c + '&select=*');
  var d = await r.json();
  if (!d || !d.length) return new Response(JSON.stringify({ e: '404' }), { status: 404, headers: h });
  var ba = await b2_auth();
  var id = await getBid(ba);
  var ar = await fetch(ba.api + '/b2_get_download_authorization', {
    method: 'POST',
    headers: { 'Authorization': ba.t, 'Content-Type': 'application/json' },
    body: '{"bucketId":"' + id + '","fileNamePrefix":"' + d[0].storage_path + '","validDurationInSeconds":3600}'
  });
  var ad = await ar.json();
  return new Response(JSON.stringify({ fn: d[0].filename, sz: d[0].filesize, url: ba.dl + '/file/' + B2_BUCKET + '/' + d[0].storage_path + '?Authorization=' + ad.authorizationToken }), { headers: h });
}

async function ml(h) {
  var r = await sb('/fileshare?order=created_at.desc');
  var d = await r.json();
  return new Response(JSON.stringify(d || []), { headers: h });
}

async function al(h) {
  var r = await sb('/fileshare?order=created_at.desc');
  var d = await r.json();
  return new Response(JSON.stringify(d || []), { headers: h });
}

async function adel(url, h) {
  var id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ e: 'no id' }), { status: 400, headers: h });
  var r = await sb('/fileshare?id=eq.' + id + '&select=*');
  var d = await r.json();
  if (d && d.length && d[0].storage_path) {
    var ba = await b2_auth();
    var bid = await getBid(ba);
    await fetch(ba.api + '/b2_delete_file_version', {
      method: 'POST',
      headers: { 'Authorization': ba.t, 'Content-Type': 'application/json' },
      body: '{"fileName":"' + d[0].storage_path + '","fileId":""}'
    }).catch(function() {});
  }
  await sb('/fileshare?id=eq.' + id, null, 'DELETE');
  return new Response(JSON.stringify({ ok: true }), { headers: h });
}

async function hr(req, h) {
  return new Response(JSON.stringify({ e: 'no' }), { status: 500, headers: h });
}
