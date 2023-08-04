<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="70">
          <el-form-item label="模型标识" prop="modelKey">
            <el-input v-model="queryParams.modelKey" placeholder="请输入模型标识" clearable style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="模型名称" prop="modelName">
            <el-input v-model="queryParams.modelName" placeholder="请输入模型名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['workflow:model:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete" v-hasPermi="['workflow:model:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['workflow:model:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="modelList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="模型标识" align="center" prop="modelKey" :show-overflow-tooltip="true" />
        <el-table-column label="模型名称" align="center" :show-overflow-tooltip="true">
          <template #default="scope">
            <el-button type="text" @click="handleProcessView(scope.row)">
              <span>{{ scope.row.modelName }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="模型名称" align="center" prop="modelName" :show-overflow-tooltip="true" />
        <el-table-column label="流程分类" align="center" prop="categoryName" :formatter="categoryFormat" />
        <el-table-column label="模型版本" align="center">
          <template #default="scope">
            <el-tag size="small">v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['workflow:model:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['workflow:model:remove']"></el-button>
            </el-tooltip>
            <el-tooltip content="设计" placement="top">
              <el-button link type="primary" icon="Brush" @click="handleDesigner(scope.row)" v-hasPermi="['workflow:model:designer']"></el-button>
            </el-tooltip>
            <el-tooltip content="部署" placement="top">
              <el-button link type="primary" icon="Promotion" @click="handleDeploy(scope.row)" v-hasPermi="['workflow:model:deploy']"></el-button>
            </el-tooltip>
            <el-tooltip content="历史" placement="top">
              <el-button link type="primary" icon="Discount" @click="handleHistory(scope.row)" v-hasPermi="['workflow:model:list']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!--  添加或修改模型信息对话框  -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="modelFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="模型标识" prop="modelKey">
          <el-input v-model="form.modelKey" clearable disabled placeholder="请输入模型标识" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" clearable :disabled="form.modelId !== undefined" placeholder="请输入模型名称" />
        </el-form-item>
        <el-form-item label="流程分类" prop="category">
          <el-select v-model="form.category" placeholder="请选择" clearable style="width:100%">
            <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.code" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入内容" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <el-dialog :title="designer.title" v-model="designer.visible" append-to-body fullscreen>
      <ProcessDesigner
        :key="`designer-${reloadIndex}`"
        ref="modelDesignerRef"
        v-loading="designerLoading"
        :designer-form="designerForm"
        :bpmn-xml="bpmnXml"
        @save="onSaveDesigner"
      />
    </el-dialog>

    <el-dialog :title="history.title" v-model="history.visible" append-to-body>
      <el-table v-loading="historyLoading" :data="historyList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="模型标识" align="center" prop="modelKey" :show-overflow-tooltip="true" />
        <el-table-column label="模型名称" align="center" prop="modelName" :show-overflow-tooltip="true" />
        <el-table-column label="流程分类" align="center" prop="categoryName" :formatter="categoryFormat" />
        <el-table-column label="模型版本" align="center">
          <template #default="scope">
            <el-tag>v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="描述" align="center" prop="description" :show-overflow-tooltip="true" />
        <el-table-column label="创建时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="部署" placement="top">
              <el-button link type="primary" icon="Promotion" @click="handleDeploy(scope.row)" v-hasPermi="['workflow:model:deploy']"></el-button>
            </el-tooltip>
            <el-tooltip content="设为最新" placement="top">
              <el-button link type="primary" icon="Star" @click="handleLatest(scope.row)" v-hasPermi="['workflow:model:save']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-dialog>

    <!-- 流程图 -->
    <el-dialog :title="processDialog.title" v-model="processDialog.visible" width="70%">
      <process-viewer :key="`designer-${reloadIndex}`" :xml="processXml" :style="{height: '650px'}" />
    </el-dialog>
  </div>
</template>

<script setup name="Model" lang="ts">
import { getBpmnXml, listModel, historyModel, latestModel, addModel, updateModel, saveModel, delModel, deployModel, getModel } from "@/api/workflow/model";
import { listAllCategory } from "@/api/workflow/category";
import { ModelForm, ModelQuery, ModelVO, DesignerForm } from "@/api/workflow/model/types";
import { CategoryVO } from "@/api/workflow/category/types";
import ProcessDesigner from "@/components/ProcessDesigner";
import { ComponentInternalInstance } from "vue";

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const modelList = ref<ModelVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const categoryOptions = ref<CategoryVO[]>([]);
const designerLoading = ref(true);
const bpmnXml = ref<string>('');
const reloadIndex = ref(0);
const processXml = ref<string>("");

const historyList = ref<ModelVO[]>([]);
const historyLoading = ref(true);
const historyTotal = ref(0);

const modelFormRef = ref(ElForm);
const queryFormRef = ref(ElForm);
const modelDesignerRef = ref(null)

const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const processDialog = reactive<DialogOption>({
  visible: false,
  title: '流程图'
});

const designer = reactive<DialogOption>({
  visible: false,
  title: ''
});

const history = reactive<DialogOption>({
  visible: false,
  title: ''
});

const initFormData: ModelForm = {
  modelId: undefined,
  modelKey: `Process_${new Date().getTime()}`,
  modelName: `业务流程_${new Date().getTime()}`,
  category: '',
  description: '',
  formType: undefined,
  formId: undefined,
  bpmnXml: '',
  newVersion: false
}

const data = reactive<PageData<ModelForm, ModelQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    modelKey: '',
    modelName: '',
  },
  rules: {
    modelKey: [{ required: true, message: "岗位名称不能为空", trigger: "blur" }],
    modelName: [{ required: true, message: "岗位编码不能为空", trigger: "blur" }],
  }
});

const designerForm = reactive<DesignerForm>({
  modelId: '',
  form: {
    processName: '',
    processKey: ''
  }
});

const { queryParams, form, rules } = toRefs<PageData<ModelForm, ModelQuery>>(data);

const router = useRouter();

/** 查询模型列表 */
const getList = async () => {
  loading.value = true;
  const res = await listModel(queryParams.value);
  modelList.value = res.rows;
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
  modelFormRef.value.resetFields();
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
const handleSelectionChange = (selection: ModelVO[]) => {
  ids.value = selection.map(item => item.modelId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 新增按钮操作 */
const handleAdd = () => {
  dialog.visible = true;
  dialog.title = "添加模型";
  nextTick(() => {
    reset();
  })
}
/** 修改按钮操作 */
const handleUpdate = (row?: ModelVO) => {
  dialog.visible = true;
  dialog.title = "修改模型";
  nextTick(async () => {
    reset();
    const modelId = row?.modelId || ids.value[0];
    const res = await getModel(modelId);
    form.value = res.data;
  });
};
/** 删除按钮操作 */
const handleDelete = async (row?: ModelVO) => {
  const modelIds = row?.modelId || ids.value;
  await proxy?.$modal.confirm('是否确认删除参数编号为"' + modelIds + '"的数据项？');
  await delModel(modelIds);
  getList();
  proxy?.$modal.msgSuccess("删除成功");
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("workflow/model/export", {
    ...queryParams.value
  }, `model_${new Date().getTime()}.xlsx`);
};
/** 查看流程图 */
const handleProcessView = async (row: ModelVO) => {
  reloadIndex.value++;
  // 发送请求，获取xml
  const res = await getBpmnXml(row.modelId);
  processXml.value = res.data;
  processDialog.visible = true;
}
/** 设计按钮操作 */
const handleDesigner = async (row: ModelVO) => {
  reloadIndex.value++;
  designerForm.modelId = row.modelId;
  const res = await getBpmnXml(row.modelId);
  bpmnXml.value = res.data || '';
  designerLoading.value = false;
  designer.title = "流程设计 - " + row.modelName;
  designer.visible = true;
}
const handleDeploy = (row?: ModelVO) => {
  loading.value = true;
  nextTick(async () => {
    await deployModel({ modelId: row?.modelId });
    proxy?.$modal.msgSuccess("操作成功");
    router.push({
      name: 'Deploy',
      path: '/workflow/deploy'
    });
    loading.value = false;
  });
}
const handleLatest = async (row: ModelVO) => {
  await proxy?.$modal.confirm('是否将此模型保存为新版本?');
  historyLoading.value = true;
  await latestModel({modelId: row.modelId});
  history.visible = false;
  getList();
  proxy?.$modal.msgSuccess("操作成功");
  historyLoading.value = false;
}
/** 查询历史列表 */
const getHistoryList = async () => {
  historyLoading.value = true;
  const res = await historyModel(queryParams.value);
  historyList.value = res.rows;
  historyTotal.value = res.total;
  historyLoading.value = false;
}
const handleHistory = (row?: ModelVO) => {
  history.visible = true;
  history.title = "模型历史";
  queryParams.value.modelKey = row?.modelKey;
  getHistoryList();
}
/** 提交表单操作 */
const submitForm = () => {
  modelFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      form.value.modelId ? await updateModel(form.value) : await addModel(form.value);
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      getList();
    }
  })
}
/** 查询流程分类列表 */
const getCategoryList = async () => {
  const res = await listAllCategory();
  categoryOptions.value = res.data;
}

const onSaveDesigner = async (str: string) => {
  bpmnXml.value = str;
  let dataBody = {
    modelId: designerForm.modelId,
    bpmnXml: str
  }
  proxy?.$modal.confirm('是否将此模型保存为新版本?').then(() => {
    confirmSave(dataBody, true)
  }).catch(action => {
    if (action === 'cancel') {
      confirmSave(dataBody, false)
    }
  })
}
const confirmSave = async (body: any, newVersion: boolean) => {
  designerLoading.value = true;
  await saveModel(Object.assign(body, { newVersion: newVersion }));
  getList();
  proxy?.$modal.msgSuccess("保存成功");
  designerLoading.value = false;
  designer.visible = false;
}

const categoryFormat = (row: ModelVO) => {
  return categoryOptions.value.find(k => k.code === row.category)?.categoryName ?? '';
}

onMounted(() => {
  getCategoryList()
  getList();
});
</script>

<style lang="scss" scoped>
.el-dialog__body {
  max-height: calc(100vh) !important;
  overflow-y: auto;
  overflow-x: hidden;
}
</style>
