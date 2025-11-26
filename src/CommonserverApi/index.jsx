import axios from 'axios';
import { notification } from 'antd';
import store from 'store';
// Helper: read cookie
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  if (match) return match[2];
  return null;
}

// Create axios instance
const serverApi = axios.create({
  baseURL: 'http://localhost:8901/commonservices/',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: add token from cookie
serverApi.interceptors.request.use(
  (request) => {
    const accessToken = getCookie('accessToken');
    const tenantId = getCookie('tenantId')
    const employeeId = getCookie('empID')
    const branchCode = getCookie('branchCode')
    const orgCode = getCookie('orgCode')
    if (accessToken) {
      request.headers.Authorization = `Bearer ${accessToken}`;
      request.headers.AccessToken = accessToken;
      store.set("accessToken", accessToken)
      store.set("employeeId", employeeId)
      store.set("branchCode", branchCode)
      store.set("tenantId", tenantId)
      store.set("orgCode", orgCode)
    }
    return request;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle errors globally
serverApi.interceptors.response.use(
  (response) => response,
  (error) => {
    const response = error.response;
    if (response && response.data && response.data.error) {
      const { error: errMsg } = response.data;
      if (errMsg !== 'Bad Request') {
        notification.warning({ message: errMsg });
      }
    }
    return Promise.reject(error);
  }
);

export default serverApi;
