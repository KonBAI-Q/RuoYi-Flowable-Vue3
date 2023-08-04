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
            <el-select v-model="queryParams.category" clearable placeholder="流程分类">
              <el-option v-for="item in categoryOptions" :key="item.categoryId" :label="item.categoryName" :value="item.code" />
            </el-select>
          </el-form-item>
          <el-form-item label="提交时间" style="width: 308px;">
            <el-date-picker
              v-model="dateRange"
              value-format="YYYY-MM-DD"
              type="daterange"
              range-separator="-"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
            ></el-date-picker>
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
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['workflow:process:remove']">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['workflow:process:ownExport']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="ownProcessList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="流程编号" align="center" prop="procInsId" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" prop="procDefName" :show-overflow-tooltip="true" />
        <el-table-column label="流程类别" align="center" prop="category" :formatter="categoryFormat" />
        <el-table-column label="流程版本" align="center" width="80px">
          <template #default="scope">
            <el-tag>v{{ scope.row.procDefVersion }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="当前节点" align="center" prop="taskName" />
        <el-table-column label="提交时间" align="center" prop="createTime" width="180" />
        <el-table-column label="流程状态" align="center" width="100">
          <template #default="scope">
            <dict-tag :options="wf_process_status" :value="scope.row.processStatus" />
          </template>
        </el-table-column>
        <el-table-column label="耗时" align="center" prop="duration" width="180" />
        <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="详情" placement="top">
              <el-button link type="primary" icon="View" @click="handleDetails(scope.row)" v-hasPermi="['workflow:process:query']"></el-button>
            </el-tooltip>
            <el-tooltip content="取消" placement="top">
              <el-button link type="primary" icon="CircleClose" @click="handleStop(scope.row)" v-hasPermi="['workflow:process:cancel']"></el-button>
            </el-tooltip>
            <el-tooltip content="再次发起" placement="top">
              <el-button link type="primary" icon="RefreshRight" @click="handleAgain(scope.row)" v-hasPermi="['workflow:process:start']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['workflow:process:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="Own" lang="ts">
import { listOwnProcess, stopProcess, delProcess } from "@/api/workflow/work/process";
import { listAllCategory } from "@/api/workflow/category";
import { ProcessQuery, ProcessVO } from "@/api/workflow/work/types";
import { CategoryVO } from "@/api/workflow/category/types";
import { DateModelType } from "element-plus";

import { ComponentInternalInstance } from "vue";

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const { wf_process_status } = toRefs<any>(proxy?.useDict("wf_process_status"));

const categoryOptions = ref<CategoryVO[]>([]);

const ownProcessList = ref<ProcessVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const dateRange = ref<[DateModelType, DateModelType]>(['','']);

const queryFormRef = ref(ElForm);

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
};
/** 查询我的流程列表 */
const getList = async () => {
  loading.value = true;
  const res = await listOwnProcess(proxy?.addDateRange(queryParams.value, dateRange.value));
  ownProcessList.value = res.rows;
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
const handleSelectionChange = (selection: ProcessVO[]) => {
  ids.value = selection.map(item => item.procInsId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 流程详情 */
const handleDetails = (row: ProcessVO) => {
  router.push({
    path: '/workflow/process/detail/' + row.procInsId,
    query: {
      processed: false
    }
  })
}
/** 取消流程申请 */
const handleStop = async (row: ProcessVO) => {
  await stopProcess( { procInsId: row.procInsId });
  proxy?.$modal.msgSuccess("操作成功");
  getList();
}
/** 再次发起流程 */
const handleAgain = (row: ProcessVO) => {
  // router.push({
  //   path: '/workflow/process/start/' + row.deployId,
  //   query: {
  //     definitionId: row.procDefId,
  //     procInsId: row.procInsId
  //   }
  // })
}
/** 删除按钮操作 */
const handleDelete = async (row?: ProcessVO) => {
  const procInsIds = row?.procInsId || ids.value;
  await proxy?.$modal.confirm('是否确认删除流程定义编号为"' + procInsIds + '"的数据项?');
  await delProcess(procInsIds);
  getList();
  proxy?.$modal.msgSuccess("删除成功");
}

/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("workflow/process/ownExport", {
    ...queryParams.value
  }, `own_process_${new Date().getTime()}.xlsx`);
}

const categoryFormat = (row: ProcessVO) => {
  return categoryOptions.value.find(k => k.code === row.category)?.categoryName ?? '';
}

onMounted(() => {
  getCategoryList();
  getList();
});
</script>
