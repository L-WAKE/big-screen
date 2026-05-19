import { get, post, put, del } from '@/api/http'

export interface ProjectItem {
  id: string
  projectName: string
  state: number
  createTime: string
  createUserId?: string
  indexImage?: string
  remarks?: string
}

export interface ProjectListResult {
  code: number
  msg: string
  count: number
  data: ProjectItem[]
}

export const getProjectList = (page: number = 1, limit: number = 10) => {
  return get('/api/goview/project/list', { page, limit }) as unknown as Promise<ProjectListResult>
}

export const createProject = (data: { id?: string; projectName: string; remarks?: string }) => {
  return post('/api/goview/project/create', data)
}

export const editProject = (data: Partial<ProjectItem>) => {
  return post('/api/goview/project/edit', data)
}

export const deleteProject = (ids: string) => {
  return del('/api/goview/project/delete', { ids })
}

export const renameProject = (data: { id: string; projectName: string }) => {
  return post('/api/goview/project/rename', data)
}

export const publishProject = (data: { id: string; state: number }) => {
  return put('/api/goview/project/publish', data)
}

export const getProjectData = (projectId: string) => {
  return get('/api/goview/project/getData', { projectId })
}

export const saveProjectData = (data: { projectId: string; content: string }) => {
  return post('/api/goview/project/save/data', data)
}
