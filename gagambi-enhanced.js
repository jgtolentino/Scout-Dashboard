import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function fetchEnrichments() {
  const res = await api.get('/api/v1/enrichments');
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

export async function fetchScrapedPosts() {
  const res = await api.get('/api/v1/scraped-posts');
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

export async function fetchJudgeResults() {
  const res = await api.get('/api/v1/judge-results');
  return Array.isArray(res.data) ? res.data : res.data?.data ?? [];
}

export async function enrichPost(postId) {
  const res = await api.post(`/api/v1/enrich/${postId}`);
  return res.data;
}

export async function login(username, password) {
  const formData = new FormData();
  formData.append('username', username);
  formData.append('password', password);
  
  const res = await api.post('/api/v1/auth/login', formData);
  if (res.data.access_token) {
    localStorage.setItem('token', res.data.access_token);
  }
  return res.data;
}

// Dashboard specific endpoints
export async function fetchDashboardMetrics(dateRange) {
  const res = await api.get('/api/v1/dashboard/metrics', {
    params: { range: dateRange }
  });
  return res.data;
}

export async function fetchTrendData(metric, dateRange) {
  const res = await api.get(`/api/v1/dashboard/trends/${metric}`, {
    params: { range: dateRange }
  });
  return res.data;
}

export async function fetchRecentActivity(limit = 10) {
  const res = await api.get('/api/v1/dashboard/activity', {
    params: { limit }
  });
  return res.data;
}

export async function fetchActiveJobs() {
  const res = await api.get('/api/v1/jobs/active');
  return res.data;
}

// Job management endpoints
export async function startScrapeJob(config) {
  const res = await api.post('/api/v1/jobs/scrape', config);
  return res.data;
}

export async function startEnrichmentJob(config) {
  const res = await api.post('/api/v1/jobs/enrichment', config);
  return res.data;
}

export async function startScoringJob(config) {
  const res = await api.post('/api/v1/jobs/scoring', config);
  return res.data;
}

export async function getJobStatus(jobId) {
  const res = await api.get(`/api/v1/jobs/${jobId}`);
  return res.data;
}

export default api;
