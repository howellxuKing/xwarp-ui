<template>
  <div class="app-container">
    <el-tabs v-model="activeName">
      <el-tab-pane :label="$t('config.modifyPass')" name="modify-pass">
        <ModifyPass />
      </el-tab-pane>
      <el-tab-pane :label="$t('config.modifyProperty')" name="modify-property">
        <ModifyProperty />
      </el-tab-pane>
      <el-tab-pane label="安全与订阅" name="security"><SecuritySettings /></el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
import SecuritySettings from './components/SecuritySettings'
import ModifyPass from '@/views/account/modify/components/ModifyPass'
import ModifyProperty from '@/views/account/modify/components/ModifyProperty'

export default {
  name: 'index',
  components: { ModifyProperty, ModifyPass, SecuritySettings },
  data() {
    return {
      activeName: 'modify-pass'
    }
  }
}
</script>

<style scoped></style>
