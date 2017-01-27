console.log('Started', self);

self.addEventListener('install', function(event) {
  self.skipWaiting();
  console.log('Installed', event);
});

self.addEventListener('activate', function(event) {
  console.log('Activated', event);
});

self.addEventListener('push', function(event) {
  var payload = event.data.json(),
      title = payload.title,
      body = payload.body;

  event.waitUntil(
    self.registration.showNotification(title, {
     body: body,
     icon: 'favicon-32x32.png',
   }));
});
