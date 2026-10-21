<template>
  <div class="login-container">
    <el-form
      v-if="!credentials"
      ref="registerForm"
      :model="registerForm"
      :rules="registerRules"
      class="login-form"
      label-position="left"
      @submit.native.prevent="handleRegister"
    >
      <div class="title-container">
        <h3 class="title">{{ $t('register.title') }}</h3>
      </div>
      <p class="registration-hint">{{ $t('register.generatedPasswordHint') }}</p>
      <el-form-item prop="username">
        <span class="svg-container"><svg-icon icon-class="username" /></span>
        <el-input
          ref="username"
          v-model="registerForm.username"
          :placeholder="$t('register.username')"
          :aria-label="$t('register.username')"
          name="username"
          autocomplete="username"
          maxlength="20"
          clearable
          @keyup.enter.native.prevent="handleRegister"
        />
      </el-form-item>
      <el-form-item v-if="captchaEnable" prop="captchaCode">
        <span class="svg-container"><svg-icon icon-class="valid-code" /></span>
        <el-input
          v-model="registerForm.captchaCode"
          autocomplete="off"
          :placeholder="$t('login.code')"
          :aria-label="$t('login.code')"
          style="width: 65%"
          @keyup.enter.native.prevent="handleRegister"
        />
        <div class="captcha">
          <img :src="captchaImg" :alt="$t('login.code')" @click="handleCaptchaGenerate" height="38px" />
        </div>
      </el-form-item>
      <el-button
        :loading="loading"
        :disabled="!settingsLoaded"
        type="primary"
        class="registration-action"
        @click="handleRegister"
      >{{ $t('register.register') }}</el-button>
      <el-button class="registration-action" @click="$router.push('/login')">
        {{ $t('register.login') }}
      </el-button>
    </el-form>

    <section v-else class="login-form registration-result" aria-labelledby="registration-result-title">
      <div class="title-container">
        <h3 id="registration-result-title" class="title">{{ $t('register.resultTitle') }}</h3>
      </div>
      <p class="registration-hint" role="status">{{ $t('register.saveCredentialsHint') }}</p>
      <dl class="registration-credentials">
        <dt>{{ $t('register.username') }}</dt>
        <dd><code>{{ credentials.username }}</code></dd>
        <dt>{{ $t('register.pass') }}</dt>
        <dd><code>{{ credentials.initialPassword }}</code></dd>
      </dl>
      <el-button class="registration-action" @click="copyCredentials">
        {{ $t('register.copyCredentials') }}
      </el-button>
      <p class="registration-hint">{{ $t('register.passwordManagedByAdmin') }}</p>
      <el-checkbox v-model="credentialsSaved" class="registration-confirm">
        {{ $t('register.credentialsSaved') }}
      </el-checkbox>
      <el-button
        type="primary"
        :disabled="!credentialsSaved"
        class="registration-action"
        @click="goToLogin"
      >{{ $t('register.goToLogin') }}</el-button>
    </section>
  </div>
</template>

<script>
import copy from 'copy-to-clipboard'
import { generateCaptcha } from '@/api/account'
import { setting } from '@/api/system'

export default {
  name: 'Register',
  data() {
    const validateUsername = (rule, value, callback) => {
      if (this.registerForm.username.trim().indexOf('admin') >= 0) {
        callback(new Error(this.$t('valid.usernameNotExistAdmin')))
      } else {
        callback()
      }
    }
    return {
      registerForm: { username: '', captchaId: '', captchaCode: '' },
      credentials: null,
      credentialsSaved: false,
      settingsLoaded: false,
      captchaImg: '',
      captchaEnable: 0,
      registerRules: {
        username: [
          { required: true, message: this.$t('valid.username'), trigger: ['change', 'blur'] },
          { min: 6, max: 20, message: this.$t('valid.usernameRange'), trigger: ['change', 'blur'] },
          { pattern: /^[A-Za-z0-9]+$/, message: this.$t('valid.usernameElement'), trigger: ['change', 'blur'] },
          { validator: validateUsername, trigger: ['change', 'blur'] }
        ],
        captchaCode: [
          { required: true, message: this.$t('valid.code'), trigger: ['change', 'blur'] }
        ]
      },
      loading: false
    }
  },
  created() {
    setting().then(({ data }) => {
      this.captchaEnable = data.captchaEnable
      this.settingsLoaded = true
      if (this.captchaEnable) this.handleCaptchaGenerate()
    })
  },
  beforeDestroy() {
    this.credentials = null
  },
  methods: {
    handleCaptchaGenerate() {
      return generateCaptcha().then(({ data }) => {
        this.registerForm.captchaId = data.captchaId
        this.captchaImg = data.captchaImg
      })
    },
    handleRegister() {
      if (this.loading || this.credentials || !this.settingsLoaded) return
      this.$refs.registerForm.validate((valid) => {
        if (!valid) return
        this.loading = true
        this.$store.dispatch('account/register', this.registerForm)
          .then((data) => {
            if (!data || !data.username || !data.initialPassword) {
              this.$message.error(this.$t('register.credentialsUnavailable'))
              return
            }
            this.credentials = { username: data.username, initialPassword: data.initialPassword }
            this.credentialsSaved = false
          })
          .catch(() => {
            if (this.captchaEnable) this.handleCaptchaGenerate()
          })
          .finally(() => { this.loading = false })
      })
    },
    copyCredentials() {
      const text = this.$t('register.username') + ': ' + this.credentials.username + '\n' +
        this.$t('register.pass') + ': ' + this.credentials.initialPassword
      if (copy(text)) {
        this.$message.success(this.$t('register.credentialsCopied'))
      } else {
        this.$message.error(this.$t('register.copyFailed'))
      }
    },
    goToLogin() {
      if (!this.credentialsSaved) return
      this.credentials = null
      this.$router.push('/login')
    }
  }
}
</script>

<style lang="scss">
/* 修复input 背景不协调 和光标变色 */
/* Detail see https://github.com/PanJiaChen/vue-element-admin/pull/927 */

$bg: #283443;
$light_gray: #fff;
$cursor: #fff;

@supports (-webkit-mask: none) and (not (cater-color: $cursor)) {
  .login-container .el-input input {
    color: $cursor;
  }
}

/* reset element-ui css */
.login-container {
  .el-input {
    display: inline-block;
    height: 47px;
    width: 85%;

    input {
      background: transparent;
      border: 0px;
      -webkit-appearance: none;
      border-radius: 0px;
      padding: 12px 5px 12px 15px;
      color: $light_gray;
      height: 47px;
      caret-color: $cursor;

      &:-webkit-autofill {
        box-shadow: 0 0 0px 1000px $bg inset !important;
        -webkit-text-fill-color: $cursor !important;
      }
    }
  }

  .el-form-item {
    border: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.1);
    border-radius: 5px;
    color: var(--text-muted, #454545);
  }
}
</style>

<style lang="scss" scoped>
$bg: #2d3a4b;
$dark_gray: #889aa4;
$light_gray: #eee;

.login-container {
  min-height: 100%;
  width: 100%;
  background-color: $bg;
  overflow: hidden;

  .login-form {
    position: relative;
    width: 520px;
    max-width: 100%;
    padding: 160px 35px 0;
    margin: 0 auto;
    overflow: hidden;
  }

  .tips {
    font-size: 14px;
    color: #fff;
    margin-bottom: 10px;

    span {
      &:first-of-type {
        margin-right: 16px;
      }
    }
  }

  .svg-container {
    padding: 6px 5px 6px 15px;
    color: $dark_gray;
    vertical-align: middle;
    width: 30px;
    display: inline-block;
  }

  .title-container {
    position: relative;

    .title {
      font-size: 26px;
      color: $light_gray;
      margin: 0px auto 40px auto;
      text-align: center;
      font-weight: bold;
    }
  }

  .show-pwd {
    position: absolute;
    right: 10px;
    top: 7px;
    font-size: 16px;
    color: $dark_gray;
    cursor: pointer;
    user-select: none;
  }

  .captcha {
    position: absolute;
    right: 0;
    top: 0;

    img {
      height: 48px;
      cursor: pointer;
      vertical-align: middle;
    }
  }
}
</style>


<style lang="scss" scoped>
.registration-hint {
  margin: 0 0 24px;
  color: var(--text-regular, #d6d9db);
  font-size: 14px;
  line-height: 1.7;
}
.registration-action {
  display: block;
  width: 100%;
  margin: 0 0 20px !important;
}
.registration-credentials {
  margin: 28px 0;
  padding: 24px 0;
  border-top: 1px solid var(--border, #2f3336);
  border-bottom: 1px solid var(--border, #2f3336);
  dt {
    margin-bottom: 8px;
    color: var(--text-regular, #d6d9db);
    font-size: 14px;
  }
  dd {
    margin: 0 0 24px;
    color: var(--text, #e7e9ea);
    font-size: 20px;
    font-weight: 600;
    line-height: 1.5;
    overflow-wrap: anywhere;
    user-select: text;
    &:last-child { margin-bottom: 0; }
  }
}
.registration-confirm {
  display: block;
  margin: 0 0 24px;
  ::v-deep .el-checkbox__label {
    white-space: normal;
    line-height: 1.6;
    vertical-align: top;
  }
}
@media (max-width: 600px) {
  .login-container .login-form {
    padding: 64px 24px 32px;
  }
}
</style>
