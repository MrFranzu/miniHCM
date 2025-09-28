import axios from "axios";
import { auth } from "../firebase";

const BASE = process.env.NODE_ENV === "production"
  ? "/api"
  : "http://localhost:5000/api";


const api = axios.create({ baseURL: BASE });

// Attach token to every request automatically
api.interceptors.request.use(async (config) => {
  try {
    const user = auth.currentUser;
    if (user) {
      // Get Firebase ID token
      const token = await user.getIdToken(true);
      console.log("🔑 Sending ID token:", token.substring(0, 40) + "...");
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.warn(
      "Could not attach ID token to request:",
      err && err.message ? err.message : err
    );
  }
  return config;
});

// API functions
export async function punch(type) {
  return api.post(`/punch`, { type });
}

export async function computeSummary(date, userId) {
  return api.post(`/computeSummary`, { date, userId });
}

export async function getAdminPunches(params) {
  return api.get(`/admin/punches`, { params });
}

export async function editPunch(body) {
  return api.post(`/admin/editPunch`, body);
}

export async function weeklyReport(body) {
  return api.post(`/admin/weeklyReport`, body);
}

export async function dailyReport({ date }) {
  return api.post(`/admin/dailyReport`, { date });
}
