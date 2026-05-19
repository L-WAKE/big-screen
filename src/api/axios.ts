import axios, { AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios'
import { ResultEnum } from "@/enums/httpEnum"
import { ErrorPageNameMap } from "@/enums/pageEnum"
import { redirectErrorPage } from '@/utils'
import { getLocalStorage } from '@/utils/storage'
import { StorageEnum } from '@/enums/storageEnum'

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/',
  timeout: ResultEnum.TIMEOUT,
})

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const tokenInfo = getLocalStorage(StorageEnum.GO_ACCESS_TOKEN_STORE)
    if (tokenInfo && tokenInfo.tokenValue) {
      config.headers['satoken'] = tokenInfo.tokenValue
    }
    return config
  },
  (error: AxiosError) => {
    Promise.reject(error)
  }
)

axiosInstance.interceptors.response.use(
  (res: AxiosResponse) => {
    const { code } = res.data as { code: number }
    if (code === undefined || code === null) return Promise.resolve(res.data)
    if (code === ResultEnum.DATA_SUCCESS) return Promise.resolve(res.data)
    if (ErrorPageNameMap.get(code)) redirectErrorPage(code)
    return Promise.resolve(res.data)
  },
  (err: AxiosResponse) => {
    Promise.reject(err)
  }
)

export default axiosInstance
