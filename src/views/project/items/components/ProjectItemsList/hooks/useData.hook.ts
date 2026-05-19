import { h, ref, onMounted, onUnmounted, onActivated } from 'vue'
import { NInput } from 'naive-ui'
import { goDialog, fetchPathByName, routerTurnByPath, getSessionStorage, setSessionStorage } from '@/utils'
import { DialogEnum } from '@/enums/pluginEnum'
import { StorageEnum } from '@/enums/storageEnum'
import { PreviewEnum } from '@/enums/pageEnum'
import { ChartList } from '../../..'
import { Chartype } from '../../../index.d'
import { getProjectList, deleteProject, publishProject, renameProject, getProjectData } from '@/api/modules/project'

const PROJECT_LIST_REFRESH_EVENT = 'GO_VIEW_PROJECT_LIST_REFRESH'

const isApiSuccess = (res: any) => res?.code === 0 || res?.code === 200

// 数据初始化
export const useDataListInit = () => {
  const list = ref<ChartList>([])
  const total = ref(0)
  const loading = ref(false)
  const page = ref(1)
  const pageSize = ref(10)

  const normalizeProjectState = (state: number) => state === 1
  const normalizeProjectName = (projectName?: string) => projectName || '未命名项目'
  const normalizeList = (rawList: any[]) => {
    return rawList.map((item: any) => ({
      id: item.id,
      title: normalizeProjectName(item.projectName),
      label: normalizeProjectState(item.state) ? '已发布' : '未发布',
      release: normalizeProjectState(item.state)
    }))
  }

  const fetchList = async (targetPage: number = 1, limit: number = 10) => {
    loading.value = true
    try {
      const res = await getProjectList(targetPage, limit)
      if (res.code === 0) {
        list.value = normalizeList(res.data || [])
        total.value = res.count
        page.value = targetPage
        pageSize.value = limit
      }
    } catch (err) {
      window['$message'].error('获取项目列表失败')
    } finally {
      loading.value = false
    }
  }

  // 删除
  const deleteHandle = (cardData: { id: string }, index: number) => {
    goDialog({
      type: DialogEnum.DELETE,
      promise: true,
      onPositiveCallback: () =>
        new Promise((res) => {
          deleteProject(cardData.id).then(() => res(1)).catch(() => res(0))
        }),
      promiseResCallback: (e: any) => {
        if (e) {
          window['$message'].success('删除成功')
          list.value.splice(index, 1)
          total.value = Math.max(0, total.value - 1)
        }
      }
    })
  }

  // 发布/取消发布
  const publishHandle = async (cardData: Chartype) => {
    if (!cardData?.id) return
    const targetState = cardData.release ? -1 : 1
    const actionText = targetState === 1 ? '发布' : '取消发布'
    try {
      const res: any = await publishProject({ id: String(cardData.id), state: targetState })
      if (isApiSuccess(res)) {
        const target = list.value.find(item => String(item.id) === String(cardData.id))
        if (target) {
          target.release = targetState === 1
          target.label = target.release ? '已发布' : '未发布'
        }
        window['$message'].success(`${actionText}成功`)
      } else {
        window['$message'].error(`${actionText}失败`)
      }
    } catch (error) {
      window['$message'].error(`${actionText}失败`)
    }
  }

  // 重命名
  const renameHandle = (cardData: Chartype) => {
    if (!cardData?.id) return
    const newTitleRef = ref(cardData.title || '')
    goDialog({
      title: '项目重命名',
      message: '请输入新的项目名称',
      positiveText: '确认',
      negativeText: '取消',
      content: () =>
        h(NInput, {
          value: newTitleRef.value,
          maxlength: 50,
          showCount: true,
          placeholder: '请输入项目名称',
          'onUpdate:value': (value: string) => {
            newTitleRef.value = value
          }
        }),
      promise: true,
      onPositiveCallback: async () => {
        const projectName = (newTitleRef.value || '').trim()
        if (!projectName) {
          window['$message'].warning('项目名称不能为空')
          return 0
        }
        const res: any = await renameProject({
          id: String(cardData.id),
          projectName
        })
        return isApiSuccess(res) ? projectName : 0
      },
      promiseResCallback: (value: string | number) => {
        if (!value) return
        const target = list.value.find(item => String(item.id) === String(cardData.id))
        if (target) {
          target.title = String(value)
        }
        window['$message'].success('重命名成功')
      }
    })
  }

  // 列表预览
  const previewHandle = async (cardData: Chartype) => {
    if (!cardData?.id) return
    const path = fetchPathByName(PreviewEnum.CHART_PREVIEW_NAME, 'href')
    if (!path) return
    try {
      const res: any = await getProjectData(String(cardData.id))
      if (!isApiSuccess(res) || !res?.data?.content) {
        window['$message'].warning('项目暂无可预览内容，请先编辑并保存')
        return
      }
      const storageInfo = JSON.parse(res.data.content)
      const sessionStorageInfo = getSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST) || []
      const targetId = String(cardData.id)
      const targetData = { id: targetId, ...storageInfo }
      const existedIndex = sessionStorageInfo.findIndex((item: { id: string }) => String(item.id) === targetId)
      if (existedIndex !== -1) {
        sessionStorageInfo.splice(existedIndex, 1, targetData)
      } else {
        sessionStorageInfo.push(targetData)
      }
      setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, sessionStorageInfo)
      routerTurnByPath(path, [targetId], undefined, true)
    } catch (error) {
      window['$message'].error('预览失败，请稍后重试')
    }
  }

  const pageChangeHandle = (targetPage: number) => {
    fetchList(targetPage, pageSize.value)
  }

  const pageSizeChangeHandle = (size: number) => {
    fetchList(1, size)
  }

  const refreshListFromEditor = (event: MessageEvent) => {
    if (event?.data?.type !== PROJECT_LIST_REFRESH_EVENT) return
    fetchList(page.value, pageSize.value)
  }

  onMounted(() => {
    fetchList()
    window.addEventListener('message', refreshListFromEditor)
  })

  onActivated(() => {
    fetchList(page.value, pageSize.value)
  })

  onUnmounted(() => {
    window.removeEventListener('message', refreshListFromEditor)
  })

  return {
    list,
    total,
    loading,
    page,
    pageSize,
    fetchList,
    deleteHandle,
    publishHandle,
    renameHandle,
    previewHandle,
    pageChangeHandle,
    pageSizeChangeHandle
  }
}
