// DreaMax 网盘 Worker
// 环境变量通过 env.xxx 读取，已在 Cloudflare 中设置

addEventListener('fetch', function(ev) {
  ev.respondWith(handle(ev));
});

async function handle(ev) {
  var req = ev.request;
  var url = new URL(req.url);
  var path = url.pathname;
  var mt = req.method;
  var hd = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization'
  };
  if (mt === 'OPTIONS') return new Response(null, { status: 204, headers: hd });

  try {
    if (path === '/upload' && mt === 'POST') return await doUpload(req, hd);
    if (path === '/download' && mt === 'GET') return await doDownload(url, hd);
    if (path === '/my/list' && mt === 'GET') return await doMyList(hd);
    if (path === '/admin/list' && mt === 'GET') return await doAdminList(hd);
    if (path === '/admin/delete' && mt === 'DELETE') return await doAdminDelete(url, hd);
    return new Response(JSON.stringify({ error: '404' }), { status: 404, headers: hd });
  } catch (e) {
    return new Response(JSON.stringify({ e: e.message }), { status: 500, headers: hd });
  }
}

async function getB2Auth() {
  var r = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
    headers: { 'Authorization': 'Basic ' + btoa(B2_KEY_ID + ':' + B2_APP_KEY) }
  });
  var d = await r.json();
  if (!r.ok) throw new Error('B2 auth fail');
  return { token: d.authorizationToken, apiUrl: d.apiUrl + '/b2api/v2', dlUrl: d.downloadUrl };
}

async function getBid(ba) {
  var r = await fetch(ba.apiUrl + '/b2_list_buckets', {
    method: 'POST',
    headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketName: B2_BUCKET })
  });
  var d = await r.json();
  if (!d.buckets || !d.buckets.length) throw new Error('Bucket "' + B2_BUCKET + '" not found');
  return d.buckets[0].bucketId;
}

function supFetch(path, body, method) {
  var h = {
    'apikey': SUPABASE_ANON,
    'Authorization': 'Bearer ' + SUPABASE_ANON,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
  var opt = { method: method || 'GET', headers: h };
  if (body) opt.body = body;
  return fetch(SUPABASE_URL + '/rest/v1/' + path, opt);
}

function genCode() {
  var x = '0123456789', r = '';
  for (var i = 0; i < 6; i++) r += x[Math.floor(Math.random() * 10)];
  return r;
}

async function doUpload(req, hd) {
  var fd = await req.formData();
  var f = fd.get('file');
  if (!f) return new Response(JSON.stringify({ error: 'no file' }), { status: 400, headers: hd });

  var code = genCode();
  var ext = f.name.split('.').pop();
  var storageName = code + '.' + ext;
  var buf = await f.arrayBuffer();

  var ba = await getB2Auth();
  var bucketId = await getBid(ba);

  var ur = await fetch(ba.apiUrl + '/b2_get_upload_url', {
    method: 'POST',
    headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bucketId })
  });
  if (!ur.ok) return new Response(JSON.stringify({ error: 'get upload url fail' }), { status: 500, headers: hd });
  var ud = await ur.json();

  var upRes = await fetch(ud.uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': ud.authorizationToken,
      'X-Bz-File-Name': storageName,
      'Content-Type': 'application/octet-stream',
      'X-Bz-Content-Sha1': 'do_not_verify'
    },
    body: buf
  });
  if (!upRes.ok) return new Response(JSON.stringify({ error: 'b2 upload fail' }), { status: 500, headers: hd });
  var upInfo = await upRes.json();

  await supFetch('/fileshare', JSON.stringify({
    code: code, filename: f.name, filesize: f.size, filetype: f.type || ext,
    storage_path: storageName, b2_file_id: upInfo.fileId, uploaded_by: 'user'
  }), 'POST');

  return new Response(JSON.stringify({ ok: true, code: code }), { headers: hd });
}

async function doDownload(url, hd) {
  var c = url.searchParams.get('code');
  if (!c) return new Response(JSON.stringify({ error: 'no code' }), { status: 400, headers: hd });

  var r = await supFetch('/fileshare?code=eq.' + c + '&select=*');
  var d = await r.json();
  if (!d || !d.length) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: hd });

  var ba = await getB2Auth();
  var bucketId = await getBid(ba);

  var ar = await fetch(ba.apiUrl + '/b2_get_download_authorization', {
    method: 'POST',
    headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucketId: bucketId, fileNamePrefix: d[0].storage_path, validDurationInSeconds: 3600 })
  });
  var ad = await ar.json();

  var downloadUrl = ba.dlUrl + '/file/' + B2_BUCKET + '/' + d[0].storage_path + '?Authorization=' + ad.authorizationToken;

  return new Response(JSON.stringify({ filename: d[0].filename, filesize: d[0].filesize, url: downloadUrl }), { headers: hd });
}

async function doMyList(hd) {
  var r = await supFetch('/fileshare?order=created_at.desc');
  var d = await r.json();
  return new Response(JSON.stringify(d || []), { headers: hd });
}

async function doAdminList(hd) {
  var r = await supFetch('/fileshare?order=created_at.desc');
  var d = await r.json();
  return new Response(JSON.stringify(d || []), { headers: hd });
}

async function doAdminDelete(url, hd) {
  var id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: 'no id' }), { status: 400, headers: hd });

  var r = await supFetch('/fileshare?id=eq.' + id + '&select=storage_path,b2_file_id');
  var d = await r.json();
  if (d && d.length && d[0].b2_file_id) {
    try {
      var ba = await getB2Auth();
      await fetch(ba.apiUrl + '/b2_delete_file_version', {
        method: 'POST',
        headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: d[0].storage_path, fileId: d[0].b2_file_id })
      });
    } catch (ee) {}
  }
  await supFetch('/fileshare?id=eq.' + id, null, 'DELETE');
  return new Response(JSON.stringify({ ok: true }), { headers: hd });
}
