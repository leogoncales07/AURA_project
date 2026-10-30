// Expo Go serves the bundle from the development computer. Its host is the
// reachable address for the local API and web app as well.
export function metroHost(uri = '') {
    const authority = uri.replace(/^[a-z]+:\/\//i, '').split('/')[0];
    const host = authority.split(':')[0];
    return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(host) ? host : null;
}

export function serviceUrl(configured, metroUri, port, development) {
    const host = metroHost(metroUri);
    const localConfigured = !configured || /^http:\/\/(?:localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(?:1[6-9]|2\d|3[01])\.\d+\.\d+)(?::\d+)?(?:\/|$)/i.test(configured);
    if (development && host && localConfigured) return `http://${host}:${port}`;
    return configured || `http://localhost:${port}`;
}
