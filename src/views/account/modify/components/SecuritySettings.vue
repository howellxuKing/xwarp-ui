<template>
  <div class="security-settings">
    <el-alert title="订阅、节点和登录密码独立管理。请妥善保存两步验证恢复码。" type="info" :closable="false" />
    <p>两步验证：{{ status.totpEnabled ? '已开启' : '未开启' }}；剩余恢复码：{{ status.recoveryCodesRemaining || 0 }}</p>
    <p v-if="status.legacySubscriptionAllowed">旧订阅链接仍可用。更换订阅链接后，旧链接会失效。</p>
    <el-form label-width="140px" @submit.native.prevent>
      <el-form-item label="当前登录密码"><el-input v-model="password" type="password" autocomplete="current-password" /></el-form-item>
      <el-form-item label="验证码 / 恢复码"><el-input v-model="code" autocomplete="one-time-code" maxlength="32" /></el-form-item>
      <el-form-item>
        <el-button v-if="!status.totpEnabled && !secret" :loading="busy" @click="setup">绑定两步验证</el-button>
        <el-button v-if="secret" :loading="busy" type="primary" @click="confirm">验证并开启</el-button>
        <el-button v-if="status.totpEnabled" :loading="busy" type="danger" @click="disable">关闭两步验证</el-button>
        <el-button :loading="busy" @click="rotate">更换订阅链接</el-button>
        <el-button :loading="busy" type="danger" @click="rotateNodes">更换节点凭据</el-button>
      </el-form-item>
    </el-form>
    <el-alert v-if="secret" type="warning" :closable="false" title="在验证器中手动添加下方密钥，然后输入6位验证码确认。绑定请求5分钟后过期。" />
    <p v-if="secret"><code>{{ secret }}</code></p>
    <el-alert v-if="recoveryCodes.length" title="恢复码只在这里显示一次，每个只能使用一次。请存入密码管理器，离开页面后无法再次查看。" type="warning" :closable="false" />
    <pre v-if="recoveryCodes.length">{{ recoveryCodes.join('\n') }}</pre>
    <div v-if="subscription"><p>新订阅链接（请更新 Clash Verge 中的订阅）：</p><el-input :value="subscription" readonly /><el-button @click="copySubscription">复制</el-button></div>
    <div v-if="$store.getters.roles.includes('sysadmin')">
      <el-divider>服务器健康</el-divider><el-button @click="loadHealth">刷新检查结果</el-button>
      <p v-if="health && !health.available">{{ health.message }}</p>
      <div v-if="health && health.available">
        <p>最后检查：{{ health.report.checked_at }}</p>
        <el-alert v-for="(warning, i) in health.report.warnings" :key="i" :title="warning" type="warning" :closable="false" />
        <el-table :data="health.report.containers"><el-table-column prop="name" label="服务" /><el-table-column prop="status" label="状态" /><el-table-column prop="restarts" label="重启次数" /><el-table-column prop="oom_killed" label="内存不足" /></el-table>
        <p>{{ health.report.interpretation }}</p>
      </div>
    </div>
  </div>
</template>
<script>
import { securityStatus, securityAction, serverHealth } from '@/api/security'
import copy from 'copy-to-clipboard'
export default {
  data: () => ({ status: {}, password: '', code: '', secret: '', recoveryCodes: [], subscription: '', busy: false, health: null }),
  created() { this.refresh() },
  beforeDestroy() { this.password = ''; this.code = ''; this.secret = ''; this.recoveryCodes = []; this.subscription = '' },
  methods: {
    async loadHealth() { this.health = (await serverHealth()).data },
    async refresh() { this.status = (await securityStatus()).data },
    async perform(action) {
      if (!this.password) { this.$message.warning('请输入当前登录密码'); return null }
      this.busy = true
      try { return (await securityAction(action, { password: this.password, code: this.code })).data }
      finally { this.busy = false; this.code = '' }
    },
    async setup() { const result = await this.perform('totp/setup'); if (result) this.secret = result.secret },
    async confirm() { const result = await this.perform('totp/confirm'); if (result) { this.recoveryCodes = result.recoveryCodes; this.secret = ''; this.password = ''; await this.refresh() } },
    async disable() { await this.$confirm('关闭后，登录将不再要求动态验证码。确认关闭？'); if (!this.password) return; await this.perform('totp/disable'); this.password = ''; this.recoveryCodes = []; await this.refresh() },
    async rotate() { await this.$confirm('旧订阅链接将失效，节点连接凭据保持不变。确认更换？'); const result = await this.perform('subscription/rotate'); if (result) { this.subscription = new URL(result, window.location.origin).href; this.password = ''; await this.refresh() } },
    async rotateNodes() { await this.$confirm("更换后需要刷新订阅，并由管理员重启相关节点才能清除已有连接及缓存。确认更换？"); const result = await this.perform("nodes/rotate"); if (result) { this.$message.warning({ message: result.message, duration: 0, showClose: true }); this.password = ""; await this.refresh() } },
    copySubscription() { if (copy(this.subscription)) this.$message.success('已复制，请勿公开分享') }
  }
}
</script>
<style scoped>
.security-settings { max-width: 760px; }
pre { white-space: pre-wrap; }
</style>
