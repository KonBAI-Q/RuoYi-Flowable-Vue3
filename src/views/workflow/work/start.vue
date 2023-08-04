<template>
  <div class="app-container">
    <el-card class="box-card">
      <template #header>
        <span>发起流程</span>
      </template>
      <div class="form-conf" v-if="dialog.visible">
        <v-form-render :form-json="formModel" :form-data="formData" ref="vfRenderRef"></v-form-render>
        <div class="cu-submit">
          <el-button type="primary" @click="submit">提交</el-button>
          <el-button @click="reset">重置</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup name="WorkStart" lang="ts">
import { getProcessForm, startProcess } from '@/api/workflow/work/process';

import { ComponentInternalInstance } from "vue";

const route = useRoute();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const vfRenderRef = ref(null);

const deployId = ref();
const definitionId = ref();
const formModel = ref({});
const formData = ref({});

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initData = async () => {
  deployId.value = route.params && route.params.deployId;
  definitionId.value = route.query && route.query.definitionId;
  const res = await getProcessForm({ definitionId: definitionId.value, deployId: deployId.value });
  formModel.value = res.data.formModel;
  dialog.visible = true;
  nextTick(async () => {
    vfRenderRef.value.setFormJson(formModel.value || {formConfig: {}, widgetList: []});
  });
}

const submit = async () => {
  const data = await vfRenderRef.value.getFormData();
  if (definitionId.value) {
    const res = await startProcess(definitionId.value, JSON.stringify(data));
    proxy?.$modal.msgSuccess(res.msg);
    const obj = { path: "/work/own" };
    proxy?.$tab.closeOpenPage(obj);
  }
}

const reset = () => {
  vfRenderRef.value.resetForm();
}

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.form-conf {
  margin: 15px auto;
  width: 80%;
  padding: 15px;
}
</style>
