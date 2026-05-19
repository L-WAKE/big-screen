import { post, get } from '@/api/http'

export interface LoginParams {
  username: string
  password: string
}

export interface UserInfo {
  id: string
  username: string
  nickname?: string
}

export interface LoginResult {
  userinfo: UserInfo
  token: {
    tokenName: string
    tokenValue: string
  }
}

export const sysLogin = (params: LoginParams) => {
  return post('/api/goview/sys/login', params) as unknown as Promise<{ code: number; msg: string; data: LoginResult }>
}

export const sysLogout = () => {
  return get('/api/goview/sys/logout')
}
