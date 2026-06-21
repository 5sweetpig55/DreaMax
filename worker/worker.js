/* DreaMax 文件速递 — Cloudflare Worker */
/* 复制全部内容，粘贴到 Worker 编辑器，点 Save and Deploy */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' };
    if (method === 'OPTIONS') return new Response(null, { headers: cors });

    try {
      if (path === '/upload' && method === 'POST') return await handleUpload(request, env, cors);
      if (path === '/download' && method === 'GET') return await handleDownload(url, env, cors);
      if (path === '/my/list' && method === 'GET') return await handleMyList(request, env, cors);
      if (path === '/admin/list' && method === 'GET') return await handleAdminList(request, env, cors);
      if (path === '/admin/delete' && method === 'DELETE') return await handleAdminDelete(url, request, env, cors);
      if (path === '/hf-rewrite' && method === 'POST') return await handleHfRewrite(request, env, cors);
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...cors } });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message, stack: err.stack }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });
    }
  },
};

async function b2Auth(env) {
  var b = btoa(env.B2_KEY_ID + ':' + env.B2_APP_KEY);
  var r = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', { headers: { 'Authorization': 'Basic ' + b } });
  var d = await r.json();
  if (!r.ok) throw new Error('B2 auth: ' + (d.message || r.status));
  return { token: d.authorizationToken, apiUrl: d.apiUrl + '/b2api/v2', downloadUrl: d.downloadUrl };
}

async function getBucketId(env, ba) {
  var r = await fetch(ba.apiUrl + '/b2_list_buckets', { method: 'POST', headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ bucketName: env.B2_BUCKET }) });
  var d = await r.json();
  if (!r.ok) throw new Error('List buckets: ' + (d.message || r.status));
  if (!d.buckets || d.buckets.length === 0) throw new Error('Bucket "' + env.B2_BUCKET + '" not found');
  return d.buckets[0].bucketId;
}

async function sq(env, path, opts) {
  return fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
    headers: { 'apikey': env.SUPABASE_ANON, 'Authorization': 'Bearer ' + env.SUPABASE_ANON, 'Content-Type': 'application/json', 'Prefer': 'return=representation', ...(opts && opts.headers || {}) },
    ...(opts || {}),
  });
}

async function getAuthUser(request, env) {
  var h = request.headers.get('Authorization');
  if (!h) return null;
  try {
    var r = await fetch(env.SUPABASE_URL + '/auth/v1/user', { headers: { 'Authorization': 'Bearer ' + h.replace('Bearer ', ''), 'apikey': env.SUPABASE_ANON } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function gc(l) { var x = '0123456789', r = ''; for (var i = 0; i < l; i++) r += x[Math.floor(Math.random() * x.length)]; return r; }

async function handleUpload(request, env, cors) {
  var user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors } });

  var fd = await request.formData();
  var file = fd.get('file');
  if (!file) return new Response(JSON.stringify({ error: '请选择文件' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });

  var code = fd.get('code') || gc(6);
  var ext = file.name.split('.').pop();
  var fileName = code + '.' + ext;
  var fb = await file.arrayBuffer();

  var ba = await b2Auth(env);
  var bid = await getBucketId(env, ba);

  var ur = await fetch(ba.apiUrl + '/b2_get_upload_url', { method: 'POST', headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ bucketId: bid }) });
  var ud = await ur.json();
  if (!ur.ok) return new Response(JSON.stringify({ error: '获取上传地址失败: ' + (ud.message || ur.status) }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });

  var up = await fetch(ud.uploadUrl, { method: 'POST', headers: { 'Authorization': ud.authorizationToken, 'X-Bz-File-Name': fileName, 'Content-Type': 'application/octet-stream', 'X-Bz-Content-Sha1': 'do_not_verify' }, body: fb });
  var uj = await up.json();
  if (!up.ok) return new Response(JSON.stringify({ error: '上传到B2失败: ' + (uj.message || up.status) }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });

  await sq(env, '/fileshare', { method: 'POST', body: JSON.stringify({ code, filename: file.name, filesize: file.size, filetype: file.type || ext, storage_path: fileName, uploaded_by: user.email }) });

  return new Response(JSON.stringify({ success: true, code, url: request.url.origin + '/download?code=' + code }), { headers: { 'Content-Type': 'application/json', ...cors } });
}

async function handleDownload(url, env, cors) {
  var dc = url.searchParams.get('code');
  if (!dc) return new Response(JSON.stringify({ error: '请输入提取码' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });

  var r = await sq(env, '/fileshare?code=eq.' + dc + '&select=*');
  var d = await r.json();
  if (!d || d.length === 0) return new Response(JSON.stringify({ error: '提取码无效' }), { status: 404, headers: { 'Content-Type': 'application/json', ...cors } });

  var ba = await b2Auth(env);
  var bid = await getBucketId(env, ba);

  var ar = await fetch(ba.apiUrl + '/b2_get_download_authorization', { method: 'POST', headers: { 'Authorization': ba.token, 'Content-Type': 'application/json' }, body: JSON.stringify({ bucketId: bid, fileNamePrefix: d[0].storage_path, validDurationInSeconds: 3600 }) });
  var ad = await ar.json();
  if (!ar.ok) return new Response(JSON.stringify({ error: '获取下载授权失败' }), { status: 500, headers: { 'Content-Type': 'application/json', ...cors } });

  var dl = ba.downloadUrl + '/file/' + env.B2_BUCKET + '/' + d[0].storage_path + '?Authorization=' + encodeURIComponent(ad.authorizationToken);
  return new Response(JSON.stringify({ filename: d[0].filename, filesize: d[0].filesize, url: dl }), { headers: { 'Content-Type': 'application/json', ...cors } });
}

async function handleMyList(request, env, cors) {
  var user = await getAuthUser(request, env);
  if (!user) return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', ...cors } });
  var r = await sq(env, '/fileshare?uploaded_by=eq.' + encodeURIComponent(user.email) + '&order=created_at.desc');
  var d = await r.json();
  return new Response(JSON.stringify(d || []), { headers: { 'Content-Type': 'application/json', ...cors } });
}

async function handleAdminList(request, env, cors) {
  var user = await getAuthUser(request, env);
  if (!user || !(env.ADMIN_USERS || '').split(',').includes(user.email)) return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: { 'Content-Type': 'application/json', ...cors } });
  var r = await sq(env, '/fileshare?order=created_at.desc');
  var d = await r.json();
  return new Response(JSON.stringify(d || []), { headers: { 'Content-Type': 'application/json', ...cors } });
}

async function handleAdminDelete(url, request, env, cors) {
  var user = await getAuthUser(request, env);
  if (!user || !(env.ADMIN_USERS || '').split(',').includes(user.email)) return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: { 'Content-Type': 'application/json', ...cors } });
  var id = url.searchParams.get('id');
  if (!id) return new Response(JSON.stringify({ error: '缺少 ID' }), { status: 400, headers: { 'Content-Type': 'application/json', ...cors } });
  await sq(env, '/fileshare?id=eq.' + id, { method: 'DELETE' });
  return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...cors } });
}

async function handleHfRewrite(request, env, cors) {
  var body = await request.json();
  var hfRes = await fetch('https://api-inference.huggingface.co/models/google/flan-t5-large', {
    method: 'POST', headers: { 'Authorization': 'Bearer ' + env.HF_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body)
  });
  var hfData = await hfRes.json();
  return new Response(JSON.stringify(hfData), { headers: { 'Content-Type': 'application/json', ...cors } });
}
