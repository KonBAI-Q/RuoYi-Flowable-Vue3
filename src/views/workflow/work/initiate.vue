<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="70">
          <el-form-item label="流程标识" prop="processKey">
            <el-input v-model="queryParams.processKey" placeholder="请输入流程标识" clearable style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="流程名称" prop="processName">
            <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="流程分类" prop="category">
            <el-select v-model="queryParams.category" clearable placeholder="请选择">
              <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.code" />
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
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['workflow:process:startExport']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="processList">
        <el-table-column label="流程标识" align="center" prop="processKey" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" :show-overflow-tooltip="true">
          <template #default="scope">
            <el-button type="text" @click="handleProcessView(scope.row)">
              <span>{{ scope.row.processName }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="流程分类" align="center" prop="categoryName" :formatter="categoryFormat" />
        <el-table-column label="流程版本" align="center">
          <template #default="scope">
            <el-tag>v{{ scope.row.version }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center">
          <template #default="scope">
            <el-tag type="success" v-if="!scope.row.suspended">激活</el-tag>
            <el-tag type="warning" v-if="scope.row.suspended">挂起</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="部署时间" align="center" prop="deploymentTime" width="180" />
        <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="发起" placement="top">
              <el-button link type="primary" icon="VideoPlay" @click="handleStart(scope.row)" v-hasPermi="['workflow:process:start']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 流程图 -->
    <el-dialog :title="processDialog.title" v-model="processDialog.visible" width="70%">
      <process-viewer :key="`designer-${reloadIndex}`" :xml="processXml" :style="{height: '650px'}" />
    </el-dialog>
  </div>
</template>

<script setup name="WorkProcess" lang="ts">
import { listProcess, getBpmnXml } from "@/api/workflow/work/process";
import { listAllCategory } from "@/api/workflow/category";
import { ProcessQuery, ProcessVO } from "@/api/workflow/work/types";
import { CategoryVO } from "@/api/workflow/category/types";
import { ComponentInternalInstance } from "vue";

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const processList = ref<ProcessVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const total = ref(0);
const reloadIndex = ref(0);
const processXml = ref("");
const categoryOptions = ref<CategoryVO[]>([]);

const queryFormRef = ref(ElForm);

const processDialog = reactive<DialogOption>({
  visible: false,
  title: '流程图'
});

const queryParams = ref<ProcessQuery>({
  pageNum: 1,
  pageSize: 10,
  processKey: '',
  processName: '',
  category: ''
});

/** 查询流程分类列表 */
const getCategoryList = async () => {
  const res = await listAllCategory();
  categoryOptions.value = res.data;
}
/** 查询流程列表 */
const getList = async () => {
  loading.value = true;
  const res = await listProcess(queryParams.value);
  processList.value = res.rows;
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
/** 查看流程图 */
const handleProcessView = async (row: any) => {
  reloadIndex.value++;
  // 发送请求，获取xml
  const res = await getBpmnXml(row.definitionId);
  processXml.value = res.data;
  processDialog.visible = true;
}
/** 发起流程 */
const handleStart = (row: ProcessVO) => {
  router.push({
    path: '/workflow/process/start/' + row.deploymentId,
    query: {
      definitionId: row.definitionId,
    }
  })
};
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("workflow/process/startExport", {
    ...queryParams.value
  }, `start_process_${new Date().getTime()}.xlsx`);
}

const categoryFormat = (row: ProcessVO) => {
  return categoryOptions.value.find(k => k.code === row.category)?.categoryName ?? '';
}

onMounted(() => {
  getCategoryList();
  getList();
});
</script>
