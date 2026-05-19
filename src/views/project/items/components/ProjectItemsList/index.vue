<template>
  <div class="go-items-list">
    <n-spin :show="loading">
      <div v-if="!loading && !list.length" class="list-empty">
        <n-empty description="暂无项目，点击左侧「新建」创建大屏项目"></n-empty>
      </div>
      <n-grid
        v-else-if="list.length"
        :x-gap="20"
        :y-gap="20"
        cols="2 s:2 m:3 l:4 xl:4 xxl:4"
        responsive="screen"
      >
        <n-grid-item v-for="(item, index) in list" :key="item.id">
          <project-items-card
            :cardData="item"
            @delete="deleteHandle($event, index)"
            @edit="editHandle"
            @preview="previewHandle"
            @publish="publishHandle"
            @rename="renameHandle"
          ></project-items-card>
        </n-grid-item>
      </n-grid>
    </n-spin>
    <div v-if="!loading && total > 0" class="list-pagination">
      <n-pagination
        :item-count="total"
        :page="page"
        :page-size="pageSize"
        :page-sizes="[10, 20, 30, 40]"
        show-size-picker
        @update:page="pageChangeHandle"
        @update:page-size="pageSizeChangeHandle"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ProjectItemsCard } from '../ProjectItemsCard/index'
import { useModalDataInit } from './hooks/useModal.hook'
import { useDataListInit } from './hooks/useData.hook'

const { list, total, loading, page, pageSize, deleteHandle, previewHandle, publishHandle, renameHandle, pageChangeHandle, pageSizeChangeHandle } = useDataListInit()
const { editHandle } = useModalDataInit()
</script>

<style lang="scss" scoped>
$contentHeight: 250px;
@include go('items-list') {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  min-height: calc(100vh - #{$--header-height} * 2 - 2px);
  .list-content {
    position: relative;
    height: $contentHeight;
  }
  .list-empty {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: calc(100vh - #{$--header-height} * 2 - 120px);
  }
  .list-pagination {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
