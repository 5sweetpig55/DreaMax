/* DreaMax 文件速递 — Cloudflare Worker */
/* 无需任何外部库，复制全部代码直接部署 */

// ========== 环境变量（在 Cloudflare Workers 后台设置） ==========
// B2_KEY_ID      - Backblaze B2 的 keyID
// B2_APP_KEY     - Backblaze B2 的 applicationKey
// B2_BUCKET      - B2 桶名（dreamax）
// SUPABASE_URL   - Supabase 项目 URL
// SUPABASE_ANON  - Supabase anon public key
// ADMIN_USERS    - 管理员邮箱，逗号分隔

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // ── B2 鉴权 ──
    var b2AuthToken = null;
    var b2ApiUrl = null;
    var b2DownloadUrl = null;

    async function b2Authorize() {
      var basic = btoa(env.B2_KEY_ID + ':' + env.B2_APP_KEY);
      var res = await fetch('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
        headers: { 'Authorization': 'Basic ' + basic }
      });
      var data = await res.json();
      if (!res.ok) throw new Error(data.message || 'B2 auth failed');
      b2AuthToken = data.authorizationToken;
      b2ApiUrl = data.apiUrl + '/b2api/v2';
      b2DownloadUrl = data.downloadUrl;
      return data;
    }

    async function getUploadUrl() {
      if (!b2ApiUrl) await b2Authorize();
      var res = await fetch(b2ApiUrl + '/b2_get_upload_url', {
        method: 'POST',
        headers: {
          'Authorization': b2AuthToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ bucketId: '' }) // 需要 bucketId
      });
      var data = await res.json();
      return data;
    }

    // 先获取 bucketId
    var bucketId = null;
    async function getBucketId() {
      if (bucketId) return bucketId;
      if (!b2ApiUrl) await b2Authorize();
      var res = await fetch(b2ApiUrl + '/b2_list_buckets', {
        method: 'POST',
        headers: { 'Authorization': b2AuthToken, 'Content-Type': 'application/json' },
        body: JSON.stringify({ bucketName: env.B2_BUCKET })
      });
      var data = await res.json();
      if (data.buckets && data.buckets.length > 0) {
        bucketId = data.buckets[0].bucketId;
      }
      return bucketId;
    }

    async function supabaseQuery(path, opts) {
      return fetch(env.SUPABASE_URL + '/rest/v1/' + path, {
        headers: {
          'apikey': env.SUPABASE_ANON,
          'Authorization': 'Bearer ' + env.SUPABASE_ANON,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation',
          ...(opts && opts.headers || {}),
        },
        ...(opts || {}),
      });
    }

    async function verifyUser(authHeader) {
      if (!authHeader) return null;
      var token = authHeader.replace('Bearer ', '');
      try {
        var res = await fetch(env.SUPABASE_URL + '/auth/v1/user', {
          headers: { 'Authorization': 'Bearer ' + token, 'apikey': env.SUPABASE_ANON }
        });
        if (!res.ok) return null;
        return await res.json();
      } catch { return null; }
    }

    function isAdmin(email) {
      return (env.ADMIN_USERS || '').split(',').includes(email);
    }

    // ========== 上传 ==========
    if (path === '/upload' && method === 'POST') {
      var user = await verifyUser(request.headers.get('Authorization'));
      if (!user) {
        return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      var formData = await request.formData();
      var file = formData.get('file');
      var customCode = formData.get('code') || '';
      var code = customCode || generateCode(6);
      if (!file) {
        return new Response(JSON.stringify({ error: '请选择文件' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      var ext = file.name.split('.').pop();
      var fileName = code + '.' + ext;
      var fileBuffer = await file.arrayBuffer();

      try {
        await b2Authorize();
        var bid = await getBucketId();
        if (!bid) throw new Error('Bucket not found');

        // 获取上传 URL
        var upRes = await fetch(b2ApiUrl + '/b2_get_upload_url', {
          method: 'POST',
          headers: { 'Authorization': b2AuthToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ bucketId: bid })
        });
        var upData = await upRes.json();
        if (!upRes.ok) throw new Error(upData.message || 'Get upload URL failed');

        // 上传文件
        var uploadRes = await fetch(upData.uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': upData.authorizationToken,
            'X-Bz-File-Name': fileName,
            'Content-Type': 'application/octet-stream',
            'X-Bz-Content-Sha1': 'do_not_verify',
          },
          body: fileBuffer
        });
        var uploadResult = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadResult.message || 'Upload failed');

        // 记录到 Supabase
        await supabaseQuery('/fileshare', {
          method: 'POST',
          body: JSON.stringify({
            code: code,
            filename: file.name,
            filesize: file.size,
            filetype: file.type || ext,
            storage_path: fileName,
            uploaded_by: user.email,
          })
        });

        return new Response(JSON.stringify({
          success: true,
          code: code,
          url: request.url.origin + '/download?code=' + code,
        }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

      } catch (err) {
        return new Response(JSON.stringify({ error: '上传失败: ' + err.message }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }

    // ========== 下载 ==========
    if (path === '/download' && method === 'GET') {
      var code = url.searchParams.get('code');
      if (!code) {
        return new Response(JSON.stringify({ error: '请输入提取码' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      var res = await supabaseQuery('/fileshare?code=eq.' + code + '&select=*');
      var data = await res.json();
      if (!data || data.length === 0) {
        return new Response(JSON.stringify({ error: '提取码无效' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }

      var record = data[0];

      try {
        await b2Authorize();
        var bid = await getBucketId();

        // 生成授权下载链接（1小时有效）
        var authRes = await fetch(b2ApiUrl + '/b2_get_download_authorization', {
          method: 'POST',
          headers: { 'Authorization': b2AuthToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bucketId: bid,
            fileNamePrefix: record.storage_path,
            validDurationInSeconds: 3600,
          })
        });
        var authData = await authRes.json();

        var downloadUrl = b2DownloadUrl + '/file/' + env.B2_BUCKET + '/' + record.storage_path +
          '?Authorization=' + encodeURIComponent(authData.authorizationToken);

        return new Response(JSON.stringify({
          filename: record.filename,
          filesize: record.filesize,
          url: downloadUrl,
        }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });

      } catch (err) {
        return new Response(JSON.stringify({ error: '获取下载链接失败' }), { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
    }

    // ========== 我的记录 ==========
    if (path === '/my/list' && method === 'GET') {
      var user = await verifyUser(request.headers.get('Authorization'));
      if (!user) {
        return new Response(JSON.stringify({ error: '请先登录' }), { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      var r = await supabaseQuery('/fileshare?uploaded_by=eq.' + encodeURIComponent(user.email) + '&order=created_at.desc');
      var d = await r.json();
      return new Response(JSON.stringify(d || []), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ========== 管理员：全部记录 ==========
    if (path === '/admin/list' && method === 'GET') {
      var user = await verifyUser(request.headers.get('Authorization'));
      if (!user || !isAdmin(user.email)) {
        return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      var r = await supabaseQuery('/fileshare?order=created_at.desc');
      var d = await r.json();
      return new Response(JSON.stringify(d || []), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    // ========== 管理员：删除 ==========
    if (path === '/admin/delete' && method === 'DELETE') {
      var user = await verifyUser(request.headers.get('Authorization'));
      if (!user || !isAdmin(user.email)) {
        return new Response(JSON.stringify({ error: '无权限' }), { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      var id = url.searchParams.get('id');
      if (!id) {
        return new Response(JSON.stringify({ error: '缺少 ID' }), { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
      }
      await supabaseQuery('/fileshare?id=eq.' + id, { method: 'DELETE' });
      return new Response(JSON.stringify({ success: true }), { headers: { 'Content-Type': 'application/json', ...corsHeaders } });
    }

    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } });
  },
};

function generateCode(len) {
  var chars = '0123456789';
  var r = '';
  for (var i = 0; i < len; i++) r += chars[Math.floor(Math.random() * chars.length)];
  return r;
}
