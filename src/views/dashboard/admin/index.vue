<template>
  <div class="dashboard-editor-container">
    <panel-group :group-data="panelGroupData" @edit="openEdit" />
    <el-row :gutter="8">
      <el-col
        :xs="{ span: 24 }"
        :sm="{ span: 24 }"
        :md="{ span: 24 }"
        :lg="{ span: 12 }"
        :xl="{ span: 12 }"
      >
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>{{ $t('dashboard.trafficRank') }}</span>
          </div>
          <div class="component-item">
            <traffic-table />
          </div>
        </el-card>
      </el-col>
      <el-col
        :xs="{ span: 24 }"
        :sm="{ span: 12 }"
        :md="{ span: 12 }"
        :lg="{ span: 6 }"
        :xl="{ span: 6 }"
      >
      </el-col>
      <el-col
        :xs="{ span: 24 }"
        :sm="{ span: 12 }"
        :md="{ span: 12 }"
        :lg="{ span: 6 }"
        :xl="{ span: 6 }"
      >
      </el-col>
    </el-row>

    <el-dialog :title="$t('table.edit')" :visible.sync="editVisible" width="420px">
      <el-form label-width="110px">
        <el-form-item :label="$t('dashboard.quota') + ' (GB)'">
          <el-input-number
            v-model.number="editForm.quotaGb"
            controls-position="right"
            :precision="2"
            style="width: 100%"
            @change="onQuotaGbChange"
          />
        </el-form-item>
        <el-form-item :label="$t('dashboard.residualFlow') + ' (GB)'">
          <el-input-number
            v-model.number="editForm.residualGb"
            controls-position="right"
            :precision="2"
            style="width: 100%"
            @change="onResidualGbChange"
          />
          <div class="edit-tips">{{ $t('dashboard.quotaTips') }}</div>
        </el-form-item>
        <el-form-item :label="$t('table.expireTime')">
          <el-date-picker
            v-model="editForm.expireTime"
            type="datetime"
            value-format="timestamp"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <div slot="footer">
        <el-button @click="editVisible = false">{{
          $t('table.cancel')
        }}</el-button>
        <el-button type="primary" @click="submitEdit">{{
          $t('table.confirm')
        }}</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import PanelGroup from '@/views/dashboard/admin/compoments/PanelGroup.vue'
import TrafficTable from '@/views/dashboard/admin/compoments/TrafficTable'
import { panelGroup } from '@/api/dashboard'
import {
  getAccountInfo,
  selectAccountById,
  updateAccountById
} from '@/api/account'

export default {
  name: 'Admin',
  components: {
    PanelGroup,
    TrafficTable
  },
  data() {
    return {
      editVisible: false,
      usedBytes: 0,
      editForm: {
        id: 0,
        quotaGb: 0,
        residualGb: 0,
        expireTime: '',
        username: '',
        roleId: 2,
        deleted: 0,
        email: ''
      },
      panelGroupData: {
        totalFlow: 0,
        residualFlow: 0,
        nodeNum: 0,
        expireTime: new Date(),
        accountCount: 0,
        cpuUsed: 0,
        memUsed: 0,
        diskUsed: 0
      }
    }
  },
  created() {
    this.getPanelGroup()
  },
  methods: {
    getPanelGroup() {
      panelGroup().then((response) => {
        this.panelGroupData = response.data
      })
    },
    openEdit() {
      getAccountInfo().then((response) => {
        const id = response.data.id
        selectAccountById({ id }).then((resp) => {
          const account = resp.data
          this.usedBytes = (account.upload || 0) + (account.download || 0)
          const usedGb = this.toGb(this.usedBytes)
          this.editForm = {
            id: account.id,
            username: account.username,
            roleId: account.roleId,
            deleted: account.deleted,
            email: account.email,
            expireTime: account.expireTime,
            quotaGb: account.quota < 0 ? -1 : this.round2(this.toGb(account.quota)),
            residualGb:
              account.quota < 0
                ? -1
                : this.round2(this.toGb(account.quota) - usedGb)
          }
          this.editVisible = true
        })
      })
    },
    toGb(bytes) {
      return bytes / 1024 / 1024 / 1024
    },
    round2(value) {
      return Math.round(value * 100) / 100
    },
    onQuotaGbChange(value) {
      if (value === null || value === undefined) return
      if (value < 0) {
        this.editForm.quotaGb = -1
        this.editForm.residualGb = -1
        return
      }
      this.editForm.residualGb = this.round2(value - this.toGb(this.usedBytes))
    },
    onResidualGbChange(value) {
      if (value === null || value === undefined) return
      if (value < 0) {
        this.editForm.residualGb = -1
        this.editForm.quotaGb = -1
        return
      }
      this.editForm.quotaGb = this.round2(value + this.toGb(this.usedBytes))
    },
    submitEdit() {
      const quotaMb =
        this.editForm.quotaGb < 0 ? -1 : Math.round(this.editForm.quotaGb * 1024)
      const payload = {
        id: this.editForm.id,
        username: this.editForm.username,
        roleId: this.editForm.roleId,
        deleted: this.editForm.deleted,
        email: this.editForm.email,
        expireTime: this.editForm.expireTime,
        quota: quotaMb
      }
      updateAccountById(payload).then(() => {
        this.editVisible = false
        this.getPanelGroup()
        this.$notify({
          title: 'Success',
          message: this.$t('confirm.modifySuccess'),
          type: 'success',
          duration: 2000
        })
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-editor-container {
  padding: 32px;
  background-color: rgb(240, 242, 245);
  position: relative;

  .edit-tips {
    font-size: 12px;
    color: #909399;
    line-height: 18px;
    margin-top: 4px;
  }

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
