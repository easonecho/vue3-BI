<template>
  <div class="screen-page">
    <div class="screen-bg">
      <div class="screen-bg__grid" />
      <div class="screen-bg__radar" />
    </div>
    <header class="screen-header">
      <div class="screen-header__title">
        <span class="title-main">{{ screenTitle }}</span>
      </div>
      <div class="screen-header__meta">
        <span>{{ nowText }}</span>
        <el-button size="small" @click="back">返回系统</el-button>
        <el-button size="small" type="primary" @click="toggleFullscreen">
          {{ fullscreen ? '退出全屏' : '全屏' }}
        </el-button>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="loading" class="screen-loading">
      <el-icon class="is-loading" :size="32"><Loading /></el-icon>
      <span>正在加载大屏数据...</span>
    </div>

    <!-- 错误提示 -->
    <div v-else-if="errorMsg" class="screen-error">
      <el-icon :size="32"><WarningFilled /></el-icon>
      <span>{{ errorMsg }}</span>
    </div>

    <!-- 大屏内容 -->
    <template v-else>
      <ScreenKpiCards :kpis="kpis" />
      <section class="screen-body">
        <div class="screen-col screen-col--left">
          <div class="panel">
            <div class="panel__title">业务构成</div>
            <div ref="pieRef" class="chart" />
          </div>
          <ScreenRatePanel :rates="rates" />
        </div>
        <div class="screen-col screen-col--mid">
          <div class="panel">
            <div class="panel__title">{{ midChartTitle }}</div>
            <div ref="barRef" class="chart chart--main" />
          </div>
        </div>
        <div class="screen-col screen-col--right">
          <div class="panel">
            <div class="panel__title">流量趋势 (近30日)</div>
            <div ref="lineRef" class="chart" />
          </div>
          <ScreenRankingPanel :ranking="ranking" />
        </div>
      </section>
    </template>
    <footer class="screen-footer"><span>© BI 低代码平台 · 数据可视化大屏</span></footer>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted } from 'vue'
import { Loading, WarningFilled } from '@element-plus/icons-vue'
import ScreenKpiCards from './components/ScreenKpiCards.vue'
import ScreenRatePanel from './components/ScreenRatePanel.vue'
import ScreenRankingPanel from './components/ScreenRankingPanel.vue'
import { useScreenCharts } from './composables/useScreenCharts'
import { useScreenDashboard } from './composables/useScreenDashboard'

const { pieRef, lineRef, barRef, renderPie, renderLine, renderBar, resize, dispose } =
  useScreenCharts()

const {
  loading,
  errorMsg,
  screenTitle,
  midChartTitle,
  fullscreen,
  toggleFullscreen,
  back,
  nowText,
  kpis,
  rates,
  ranking,
  init,
  stop,
} = useScreenDashboard({ renderPie })

onMounted(async () => {
  await init()
  await nextTick()
  renderPie()
  renderLine()
  renderBar()
  window.addEventListener('resize', resize)
})

onBeforeUnmount(() => {
  stop()
  window.removeEventListener('resize', resize)
  dispose()
})
</script>

<style scoped lang="less">
@import './styles/screen.less';
</style>
