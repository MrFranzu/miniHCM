//services\api.js
import axios from "axios";

const BASE = "https://mini-hcm.vercel.app/api";

// Helper for auth header
function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

export async function punch(token, type) {
  return axios.post(`${BASE}/punch`, { type }, authHeaders(token));
}

export async function computeSummary(token, date, userId) {
  return axios.post(`${BASE}/computeSummary`, { date, userId }, authHeaders(token));
}

export async function getAdminPunches(token, params) {
  return axios.get(`${BASE}/admin/punches`, { ...authHeaders(token), params });
}

export async function editPunch(token, body) {
  return axios.post(`${BASE}/admin/editPunch`, body, authHeaders(token));
}

export async function weeklyReport(token, body) {
  return axios.post(`${BASE}/admin/weeklyReport`, body, authHeaders(token));
}

export async function dailyReport(token, { date }) {
  return axios.post(`${BASE}/admin/dailyReport`, { date }, authHeaders(token));
}
