import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

// We can sniff the request URL using an interceptor before it's sent
api.interceptors.request.use(config => {
  console.log('Axios resolved URL:', config.url);
  console.log('Axios resolved Base:', config.baseURL);
  // combine them to see what it would fetch
  const fullUrl = api.getUri(config);
  console.log('Combined Full URL:', fullUrl);
  throw new Error('stopped');
});

api.post('/admin/invites').catch(() => {});
