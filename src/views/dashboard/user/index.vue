<template>
  <div class="dashboard-editor-container">
    <panel-group :group-data="panelGroupData" />
  </div>
</template>

<script>
import PanelGroup from '@/views/dashboard/user/compoments/PanelGroup'
import { panelGroup } from '@/api/dashboard'

export default {
  name: 'User',
  components: {
    PanelGroup
  },
  data() {
    return {
      panelGroupData: {
        totalFlow: 0,
        residualFlow: 0,
        nodeNum: 0,
        expireTime: new Date()
      }
    }
  },
  created() {
    panelGroup().then((response) => {
      const { data } = response
      this.panelGroupData = data
    })
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: transparent;
  position: relative;

  .github-corner {
    position: absolute;
    top: 0px;
    border: 0;
    right: 0;
  }

  .chart-wrapper {
    background: var(--surface, #fff);
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

@media (max-width: 1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
