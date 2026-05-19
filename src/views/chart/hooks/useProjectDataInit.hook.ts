import { onMounted } from 'vue'
import { fetchRouteParamsLocation } from '@/utils'
import { getProjectData } from '@/api/modules/project'
import { useSync } from './useSync.hook'
import { useChartEditStore } from '@/store/modules/chartEditStore/chartEditStore'
import { EditCanvasConfigEnum } from '@/store/modules/chartEditStore/chartEditStore.d'

// 编辑页初始化：按项目ID回填后端存储数据
export const useProjectDataInit = () => {
  const chartEditStore = useChartEditStore()
  const { updateComponent } = useSync()

  const initProjectData = async () => {
    const projectId = fetchRouteParamsLocation()
    if (!projectId) return
    try {
      const res: any = await getProjectData(projectId)
      if ((res?.code !== 0 && res?.code !== 200) || !res?.data) {
        return
      }
      const remoteData = res.data
      const content = remoteData?.content
      const projectName = remoteData?.projectName
      if (projectName) {
        chartEditStore.setEditCanvasConfig(EditCanvasConfigEnum.PROJECT_NAME, projectName)
      }
      if (!content) return
      const storageInfo = JSON.parse(content)
      if (!storageInfo?.editCanvasConfig || !storageInfo?.componentList || !storageInfo?.requestGlobalConfig) {
        return
      }
      // 优先使用后端项目名称，避免前端空标题覆盖
      if (projectName) {
        storageInfo.editCanvasConfig.projectName = projectName
      }
      await updateComponent(storageInfo, true, false)
    } catch (error) {
      console.error(error)
      window['$message'].warning('项目数据加载失败，已使用本地默认配置')
    }
  }

  onMounted(() => {
    initProjectData()
  })

  return {
    initProjectData
  }
}
