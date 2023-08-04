<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="70">
          <el-form-item label="流程名称" prop="processName">
            <el-input v-model="queryParams.processName" placeholder="请输入流程名称" clearable style="width: 200px" @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="接收时间" style="width: 308px;">
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
            <el-button type="warning" plain icon="Download" @click="handleExport" v-hasPermi="['workflow:process:todoExport']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="todoList">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="任务编号" align="center" prop="taskId" :show-overflow-tooltip="true" />
        <el-table-column label="流程名称" align="center" prop="procDefName" />
        <el-table-column label="任务节点" align="center" prop="taskName" />
        <el-table-column label="流程版本" align="center">
          <template #default="scope">
            <el-tag>v{{scope.row.procDefVersion}}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="流程发起人" align="center" prop="startUserName" />
        <el-table-column label="接收时间" align="center" prop="createTime" width="180" />
        <el-table-column label="操作" width="180" align="center" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="办理" placement="top">
              <el-button link type="primary" icon="EditPen" @click="handleProcess(scope.row)" v-hasPermi="['workflow:process:approval']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>

      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>
  </div>
</template>

<script setup name="Todo" lang="ts">
import { listTodoProcess } from '@/api/workflow/work/process';
import { ProcessVO, ProcessQuery } from "@/api/workflow/work/types";
import {DateModelType} from "element-plus";

import { ComponentInternalInstance } from "vue";

const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const todoList = ref<ProcessVO[]>([]);
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
  processName: ''
});

/** 查询待办列表 */
const getList = async () => {
  loading.value = true;
  const res = await listTodoProcess(proxy?.addDateRange(queryParams.value, dateRange.value));
  todoList.value = res.rows;
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
/** 跳转到处理页面 */
const handleProcess = (row: ProcessVO) => {
  router.push({
    path: '/workflow/process/detail/' + row.procInsId,
    query: {
      taskId: row.taskId,
      processed: true
    }
  })
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("workflow/process/todoExport", {
    ...queryParams.value
  }, `todo_${new Date().getTime()}.xlsx`);
}

onMounted(() => {
  getList();
});
</script>
