<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
          <el-form-item label="流程标识" prop="processKey">
            <el-input v-model="queryParams.processKey" placeholder="请输入流程标识" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="流程名称" prop="processName">
            <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="流程分类" prop="category">
            <el-select v-model="queryParams.category" clearable placeholder="流程分类">
              <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态" prop="state">
            <el-select v-model="queryParams.state" clearable placeholder="请选择状态">
              <el-option :key="1" label="激活" value="active" />
              <el-option :key="2" label="挂起" value="suspended" />
            </el-select>
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
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['workflow:deploy:remove']">
              删除
            </el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" fit :data="deployList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="流程标识" align="center" prop="processKey" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" prop="processName" :show-overflow-tooltip="true" />
        <el-table-column label="流程分类" align="center" prop="categoryName" :formatter="categoryFormat" />
        <el-table-column label="流程版本" align="center">
          <template #default="scope">
            <el-tag size="small">v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template #default="scope">
            <el-tag type="success" v-if="!scope.row.suspended">激活</el-tag>
            <el-tag type="warning" v-if="scope.row.suspended">挂起</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部署时间" align="center" prop="deploymentTime" width="180" />
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="版本管理" placement="top">
              <el-button link type="primary" icon="PriceTag" @click="handlePublish(scope.row)" v-hasPermi="['workflow:deploy:list']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['workflow:deploy:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

<!--    &lt;!&ndash; 流程图对话框 &ndash;&gt;-->
<!--    <el-dialog :title="processDialog.title" v-model="processDialog.visible" width="500px" append-to-body>-->
<!--      <process-viewer :key="`designer-${processView.index}`" :xml="processView.xmlData" :style="{height: '400px'}" />-->
<!--    </el-dialog>-->

    <!-- 版本管理 -->
    <el-dialog title="版本管理" v-model="publishDialog.visible" width="700px" append-to-body>
      <el-table v-loading="publishLoading" :data="publishList">
        <el-table-column label="流程标识" align="center" prop="processKey" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" :show-overflow-tooltip="true">
          <template #default="scope">
            <el-button type="text" @click="handleProcessView(scope.row)">
              <span>{{ scope.row.processName }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="流程版本" align="center">
          <template #default="scope">
            <el-tag size="small">v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template #default="scope">
            <el-tag type="success" v-if="!scope.row.suspended">激活</el-tag>
            <el-tag type="warning" v-if="scope.row.suspended">挂起</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="挂起" placement="top">
              <el-button link type="primary" icon="VideoPause" @click="handleChangeState(scope.row, 'suspended')" v-hasPermi="['workflow:deploy:status']"></el-button>
            </el-tooltip>
            <el-tooltip content="激活" placement="top">
              <el-button link type="primary" icon="VideoPlay" @click="handleChangeState(scope.row, 'active')" v-hasPermi="['workflow:deploy:status']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['workflow:deploy:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="publishTotal > 0" :total="publishTotal" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getPublishList" />
    </el-dialog>
  </div>
</template>

<script setup name="Deploy" lang="ts">
import { listAllCategory } from '@/api/workflow/category'
import { listDeploy, listPublish, getBpmnXml, changeState, delDeploy } from '@/api/workflow/deploy'
import { ComponentInternalInstance } from "vue";
import { CategoryVO } from "@/api/workflow/category/types";
import {DeployVO, ProcessQuery} from "@/api/workflow/deploy/types";
import { ElForm } from 'element-plus';
import {ModelVO} from "@/api/workflow/model/types";

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const categoryOptions = ref<CategoryVO[]>([]);

const deployList = ref<DeployVO[]>([]);
const loading = ref(true);
const showSearch = ref(true)
const ids = ref<Array<string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const publishList = ref<DeployVO[]>([]);
const publishLoading = ref(true);
const publishTotal = ref(0);

const queryFormRef = ref(ElForm);
const processDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const publishDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const data = reactive<PageData<{}, ProcessQuery>>({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    processKey: '',
    processName: '',
    category: ''
  },
  rules: {}
});
const { queryParams } = toRefs(data);

/** 查询流程分类列表 */
const getCategoryList = async () => {
  const res = await listAllCategory();
  categoryOptions.value = res.data;
};

const getList = async () => {
  loading.value = true;
  const res = await listDeploy(queryParams.value);
  deployList.value = res.rows;
  total.value = res.total;
  loading.value = false;
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
const handleSelectionChange = (selection: DeployVO[]) => {
  ids.value = selection.map(item => item.deploymentId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 删除按钮操作 */
const handleDelete = async (row?: DeployVO) => {
  const deploymentIds = row?.deploymentId || ids.value;
  await proxy?.$modal.confirm('是否确认删除参数编号为"' + deploymentIds + '"的数据项？');
  await delDeploy(deploymentIds);
  getList();
  proxy?.$modal.msgSuccess("删除成功");
}
const getPublishList = async () => {
  publishLoading.value = true;
  const res = await listPublish(queryParams.value);
  publishList.value = res.rows;
  publishTotal.value = res.total;
  publishLoading.value = false;
}
const handlePublish = (row: DeployVO) => {
  queryParams.value.processKey = row.processKey;
  publishDialog.visible = true;
  getPublishList();
}
const handleProcessView = (row: DeployVO) => {

}
const handleChangeState = async (row: DeployVO, state: string) => {
  const params = {
    definitionId: row.definitionId,
    state: state
  }
  await changeState(params);
  proxy?.$modal.msgSuccess("操作成功");
  getPublishList();
}

const categoryFormat = (row: ModelVO) => {
  return categoryOptions.value.find(k => k.code === row.category)?.categoryName ?? '';
}

onMounted(() => {
  getCategoryList();
  getList();
})
</script>
