import axios from 'axios'

const axiosInstance = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
})

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('wp_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('wp_token')
      localStorage.removeItem('wp_user')
      window.location.href = '/login'
    }
    if (error.response?.status === 403) {
      const user = JSON.parse(localStorage.getItem('wp_user') || 'null')
      const role = user?.role
      window.location.href = role === 'MANAGER' ? '/manager' : role === 'TEAM_MEMBER' ? '/member' : '/login'
    }
    return Promise.reject(error)
  }
)

export default axiosInstance
