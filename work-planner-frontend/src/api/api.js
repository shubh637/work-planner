import axiosInstance from './axiosInstance'

export const authApi = {
  login:    (data) => axiosInstance.post('/auth/login', data),
  register: (data) => axiosInstance.post('/auth/register', data),
}

export const userApi = {
  getMe:      ()       => axiosInstance.get('/users/me'),
  getAll:     ()       => axiosInstance.get('/users'),
  getMembers: ()       => axiosInstance.get('/users/members'),
  addMember:  (data)   => axiosInstance.post('/users', data),
  update:     (id, d)  => axiosInstance.put(`/users/${id}`, d),
  remove:     (id)     => axiosInstance.delete(`/users/${id}`),
}

export const projectApi = {
  getAll:  ()       => axiosInstance.get('/projects'),
  getById: (id)     => axiosInstance.get(`/projects/${id}`),
  create:  (data)   => axiosInstance.post('/projects', data),
  update:  (id, d)  => axiosInstance.put(`/projects/${id}`, d),
  remove:  (id)     => axiosInstance.delete(`/projects/${id}`),
}

export const taskApi = {
  getFiltered:      (params) => axiosInstance.get('/tasks', { params }),
  getMyTasks:       ()       => axiosInstance.get('/tasks/my'),
  getMySuggestions: ()       => axiosInstance.get('/tasks/my-suggestions'),
  getPending:       ()       => axiosInstance.get('/tasks/pending-approval'),
  getById:          (id)     => axiosInstance.get(`/tasks/${id}`),
  getHistory:       (id)     => axiosInstance.get(`/tasks/${id}/history`),
  create:           (data)   => axiosInstance.post('/tasks', data),
  suggest:          (data)   => axiosInstance.post('/tasks/suggest', data),
  update:           (id, d)  => axiosInstance.put(`/tasks/${id}`, d),
  remove:           (id)     => axiosInstance.delete(`/tasks/${id}`),
  assign:           (id, d)  => axiosInstance.patch(`/tasks/${id}/assign`, d),
  approve:          (id, d)  => axiosInstance.patch(`/tasks/${id}/approve`, d),
  reject:           (id, d)  => axiosInstance.patch(`/tasks/${id}/reject`, d),
  advanceProgress:  (id, d)  => axiosInstance.patch(`/tasks/${id}/progress`, d),
}

export const reportApi = {
  tasksByStatus:  (params) => axiosInstance.get('/reports/tasks-by-status', { params }),
  tasksByProject: ()       => axiosInstance.get('/reports/tasks-by-project'),
  tasksByMember:  ()       => axiosInstance.get('/reports/tasks-by-member'),
}
