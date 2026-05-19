<template>
  <n-space class="go-mt-0" :wrap="false">
    <n-button v-for="item in comBtnList" :key="item.title" :type="item.type" ghost @click="item.event">
      <template #icon>
        <component :is="item.icon"></component>
      </template>
      <span>{{ item.title }}</span>
    </n-button>
  </n-space>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import {
  renderIcon,
  goDialog,
  fetchPathByName,
  routerTurnByPath,
  setSessionStorage,
  getSessionStorage,
  setLocalStorage,
  getLocalStorage,
  fetchRouteParamsLocation,
  goHome
} from '@/utils'
import { PreviewEnum } from '@/enums/pageEnum'
import { StorageEnum } from '@/enums/storageEnum'
import { useRoute } from 'vue-router'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { syncData } from '../../ContentEdit/components/EditTools/hooks/useSyncUpdate.hook'
import { icon } from '@/plugins'
import { cloneDeep } from 'lodash'
import { createProject, editProject, publishProject, saveProjectData } from '@/api/modules/project'
const PROJECT_LIST_REFRESH_EVENT = 'GO_VIEW_PROJECT_LIST_REFRESH'
const { BrowsersOutlineIcon, SendIcon, AnalyticsIcon } = icon.ionicons5
const { DocumentAddIcon } = icon.carbon
const chartEditStore = useChartEditStore()
const PROJECT_ID_MAP_STORAGE_KEY = 'GO_VIEW_ROUTE_PROJECT_MAP'

const routerParamsInfo = useRoute()

const getProjectMap = (): Record<string, string> => {
  return getLocalStorage(PROJECT_ID_MAP_STORAGE_KEY) || {}
}

const setProjectMap = (map: Record<string, string>) => {
  setLocalStorage(PROJECT_ID_MAP_STORAGE_KEY, map)
}

const setProjectIdByRouteId = (routeId: string, projectId: string) => {
  if (!routeId || !projectId) return
  const map = getProjectMap()
  map[routeId] = projectId
  setProjectMap(map)
}

const getProjectIdByRouteId = (routeId: string) => {
  if (!routeId) return ''
  const map = getProjectMap()
  return map[routeId] || ''
}

const ensureProjectId = async (routeId: string, projectName: string) => {
  const localProjectId = getProjectIdByRouteId(routeId)
  if (localProjectId) {
    return localProjectId
  }
  try {
    const createRes: any = await createProject({ id: routeId, projectName } as any)
    const projectId = createRes?.data?.id || routeId
    setProjectIdByRouteId(routeId, projectId)
    return projectId
  } catch (error) {
    // routeId 对应项目已经存在时，直接使用 routeId 作为 projectId 继续发布流程
    setProjectIdByRouteId(routeId, routeId)
    return routeId
  }
}

// 保存后返回项目列表并刷新
const returnToProjectList = () => {
  if (window.opener && !window.opener.closed) {
    window.opener.postMessage({ type: PROJECT_LIST_REFRESH_EVENT }, window.location.origin)
    window.close()
    return
  }
  goHome()
}

// 保存（未发布状态）
const saveHandle = async () => {
  try {
    const routeId = fetchRouteParamsLocation()
    if (!routeId) {
      window['$message'].error('未获取到项目ID')
      return
    }
    const storageInfo = chartEditStore.getStorageInfo()
    const projectName = chartEditStore.getEditCanvasConfig.projectName || `未命名项目-${routeId.slice(-4)}`
    const projectId = await ensureProjectId(routeId, projectName)

    await editProject({ id: projectId, projectName })
    await saveProjectData({
      projectId,
      content: JSON.stringify(storageInfo)
    })
    setProjectIdByRouteId(routeId, projectId)
    window['$message'].success('保存成功，已返回项目列表')
    returnToProjectList()
  } catch (error) {
    console.error(error)
    window['$message'].error('保存失败，请检查后端服务与接口配置')
  }
}

// 预览
const previewHandle = () => {
  const path = fetchPathByName(PreviewEnum.CHART_PREVIEW_NAME, 'href')
  if (!path) return
  const { id } = routerParamsInfo.params
  // id 标识
  const previewId = typeof id === 'string' ? id : id[0]
  const storageInfo = chartEditStore.getStorageInfo()
  const sessionStorageInfo = getSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST) || []

  if (sessionStorageInfo?.length) {
    const repeateIndex = sessionStorageInfo.findIndex((e: { id: string }) => e.id === previewId)
    // 重复替换
    if (repeateIndex !== -1) {
      sessionStorageInfo.splice(repeateIndex, 1, { id: previewId, ...storageInfo })
      setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, sessionStorageInfo)
    } else {
      sessionStorageInfo.push({
        id: previewId,
        ...storageInfo
      })
      setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, sessionStorageInfo)
    }
  } else {
    setSessionStorage(StorageEnum.GO_CHART_STORAGE_LIST, [{ id: previewId, ...storageInfo }])
  }
  // 跳转
  routerTurnByPath(path, [previewId], undefined, true)
}

// 发布
const sendHandle = () => {
  goDialog({
    message: '确认发布当前大屏吗？发布后将自动同步到项目列表。',
    positiveText: '发布',
    promise: true,
    onPositiveCallback: async () => {
      const routeId = fetchRouteParamsLocation()
      if (!routeId) {
        throw new Error('未获取到项目ID')
      }
      const storageInfo = chartEditStore.getStorageInfo()
      const projectName = chartEditStore.getEditCanvasConfig.projectName || `未命名项目-${routeId.slice(-4)}`
      const projectId = await ensureProjectId(routeId, projectName)

      await editProject({ id: projectId, projectName })
      await saveProjectData({
        projectId,
        content: JSON.stringify(storageInfo)
      })
      await publishProject({ id: projectId, state: 1 })
      setProjectIdByRouteId(routeId, projectId)
    },
    promiseResCallback: () => {
      window['$message'].success('发布成功，已为你跳转到项目列表')
      returnToProjectList()
    },
    promiseRejCallback: (error: any) => {
      console.error(error)
      window['$message'].error('发布失败，请检查后端服务与接口配置')
    }
  })
}

const btnList = [
  {
    select: true,
    title: '同步内容',
    type: 'primary',
    icon: renderIcon(AnalyticsIcon),
    event: syncData
  },
  {
    select: true,
    title: '保存',
    type: 'default',
    icon: renderIcon(DocumentAddIcon),
    event: saveHandle
  },
  {
    select: true,
    title: '预览',
    icon: renderIcon(BrowsersOutlineIcon),
    event: previewHandle
  },
  {
    select: true,
    title: '发布',
    icon: renderIcon(SendIcon),
    event: sendHandle
  }
]

const comBtnList = computed(() => {
  if (chartEditStore.getEditCanvas.isCodeEdit) {
    return btnList
  }
  const cloneList = cloneDeep(btnList)
  cloneList.shift()
  return cloneList
})
</script>

<style lang="scss" scoped>
.align-center {
  margin-top: -4px;
}
</style>
