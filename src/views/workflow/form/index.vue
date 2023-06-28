<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="70">
          <el-form-item label="表单名称" prop="formName">
            <el-input v-model="queryParams.formName" placeholder="请输入表单名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery">搜索</el-button>
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </transition>
    <el-card shadow="never">
      <template #header>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['workflow:form:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['workflow:form:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['workflow:form:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['workflow:form:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="formList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="表单主键" align="center" prop="formId" v-if="false" />
        <el-table-column label="表单名称" align="center" prop="formName" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetail(scope.row)" v-hasPermi="['workflow:form:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['workflow:form:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['workflow:form:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 流程表单设计器对话框 -->
    <el-dialog :title="designer.title" v-model="designer.visible" fullscreen>
      <div id="form-designer">
        <v-form-designer ref="vfDesignerRef" :resetFormJson="true" :designer-config="designerConfig">
          <!-- 自定义按钮插槽 -->
          <template #customToolButtons>
            <el-button link type="primary" icon="Finished" @click="dialog.visible = true">保存</el-button>
          </template>
        </v-form-designer>
      </div>
    </el-dialog>

    <!-- 预览表单对话框 -->
    <el-dialog :title="render.title" v-model="render.visible" width="60%" append-to-body>
      <v-form-render :form-json="{}" :form-data="{}" ref="vfRenderRef" />
    </el-dialog>

    <!-- 添加或修改流程表单对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="600px" append-to-body>
      <el-form ref="formFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="表单名称" prop="formName">
          <el-input v-model="form.formName" placeholder="请输入表单名称" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Form" lang="ts">
import { listForm, addForm, updateForm, getForm, delForm } from "@/api/workflow/form";
import { FormForm, FormQuery, FormVO } from "@/api/workflow/form/types";
import { ComponentInternalInstance } from "vue";

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const formList = ref<FormVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const vfDesignerRef = ref(null);
const vfRenderRef = ref(null);
const formFormRef = ref(ElForm);
const queryFormRef = ref(ElForm);

const designerConfig = reactive({
  externalLink: true,
  toolbarMaxWidth: 510,
  // languageMenu: true,
  //externalLink: false,
  //formTemplates: false,
  //eventCollapse: false,
  //clearDesignerButton: false,
  //previewFormButton: false,
})
const designer = reactive<DialogOption>({
  visible: false,
  title: ''
})
const render = reactive<DialogOption>({
  visible: false,
  title: ''
})
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const initFormData: FormForm = {
  formId: undefined,
  formName: '',
  content: '',
  remark: ''
}
const data = reactive<PageData<FormForm, FormQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    formName: ''
  },
  rules: {
    formName: [{ required: true, message: "表单名称不能为空", trigger: "blur" }]
  }
});

const { queryParams, form, rules } = toRefs<PageData<FormForm, FormQuery>>(data);

/** 查询岗位列表 */
const getList = async () => {
  loading.value = true;
  const res = await listForm(queryParams.value);
  formList.value = res.rows;
  total.value = res.total;
  loading.value = false;
}
/** 取消按钮 */
const cancel = () => {
  reset();
  dialog.visible = false;
}
/** 表单重置 */
const reset = () => {
  form.value = {...initFormData};
}
/** 搜索按钮操作 */
const handleQuery = () => {
  queryParams.value.pageNum = 1;
  getList();
}
/** 重置按钮操作 */
const resetQuery = () => {
  queryFormRef.value.resetFields();
  handleQuery();
}
/** 多选框选中数据 */
const handleSelectionChange = (selection: FormVO[]) => {
  ids.value = selection.map(item => item.formId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 新增表单操作 */
const handleAdd = () => {
  designer.visible = true;
  nextTick(() => {
    reset();
    vfDesignerRef.value.clearDesigner();
  })
}
/** 修改表单操作 */
const handleUpdate = (row?: FormVO) => {
  designer.visible = true;
  nextTick(async () => {
    const formId = row?.formId || ids.value[0];
    const res = await getForm(formId);
    form.value = res.data;
    vfDesignerRef.value.setFormJson(form.value.content);
  })
}
/** 查看表单操作 */
const handleDetail = (row: FormVO) => {
  render.visible = true;
  render.title = '查看表单详情';
  nextTick(async () => {
    vfRenderRef.value.setFormJson(row.content || {formConfig: {}, widgetList: []});
  });
}
/** 提交表单操作 */
const submitForm = () => {
  const formJson = vfDesignerRef.value.getFormJson();
  form.value.content = JSON.stringify(formJson);
  nextTick(async () => {
    form.value.formId ? await updateForm(form.value) : await addForm(form.value);
    proxy?.$modal.msgSuccess("操作成功");
    dialog.visible = false;
    designer.visible = false;
    getList();
  })
}
/** 删除按钮操作 */
const handleDelete = async (row?: FormVO) => {
  const formIds = row?.formId || ids.value;
  await proxy?.$modal.confirm('是否确认删除表单编号为"' + formIds + '"的数据项？');
  await delForm(formIds);
  getList();
  proxy?.$modal.msgSuccess("删除成功");
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("workflow/form/export", {
    ...queryParams.value
  }, `form_${new Date().getTime()}.xlsx`);
}

onMounted(() => {
  getList();
});
</script>

<style lang="scss" scoped>
#form-designer {
  .main-container {
    margin: 0;
  }
  label {
    font-weight: normal;
  }
  :deep(.external-link) {
    display: flex;
    align-items: center;
  }
}
</style>
