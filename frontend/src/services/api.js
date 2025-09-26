// frontend/src/services/api.js
import axios from "axios";

// Change this if deploying to production
const BASE = "http://localhost:5000";


// Helper to add Firebase ID token to request headers
function authHeaders(token) {
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
}

/**
 * POST /punch
 * @param {string} idToken - Firebase ID token
 * @param {string} type - "in" or "out"
 */
export async function punch(idToken, type) {
  return axios.post(`${BASE}/punch`, { type }, authHeaders(idToken));
}

/**
 * POST /computeSummary
 * @param {string} idToken - Firebase ID token
 * @param {string} date - Date string (e.g., "2025-09-25")
 * @param {string} userId - Optional (admin only)
 */
export async function computeSummary(idToken, date, userId) {
  return axios.post(`${BASE}/computeSummary`, { date, userId }, authHeaders(idToken));
}

/**
 * GET /admin/punches
 * @param {string} idToken - Firebase ID token
 * @param {Object} params - { userId, start, end }
 */
export async function getAdminPunches(idToken, params) {
  return axios.get(`${BASE}/admin/punches`, {
    params,
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

/**
 * POST /admin/editPunch
 * @param {string} idToken - Firebase ID token
 * @param {Object} body - { punchId, type?, timestampISO? }
 */
export async function editPunch(idToken, body) {
  return axios.post(`${BASE}/admin/editPunch`, body, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

/**
 * POST /admin/weeklyReport
 * @param {string} idToken - Firebase ID token
 * @param {Object} body - { weekStart, userId? }
 */
export async function weeklyReport(idToken, body) {
  return axios.post(`${BASE}/admin/weeklyReport`, body, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}

/**
 * POST /admin/dailyReport
 * @param {string} idToken - Firebase ID token
 * @param {Object} param1 - { date }
 */
export async function dailyReport(idToken, { date }) {
  return axios.post(`${BASE}/admin/dailyReport`, { date }, {
    headers: {
      Authorization: `Bearer ${idToken}`,
    },
  });
}
