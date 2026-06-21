export async function onRequest(context) {
  var request = context.request;
  var url = new URL(request.url);
  var path = url.pathname.replace('/api', '') + url.search;
  var workerUrl = 'https://old-hall-b586.3752703718.workers.dev' + path;

  var response = await fetch(workerUrl, {
    method: request.method,
    headers: request.headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? null : request.body
  });

  return response;
}
