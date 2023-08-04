<template>
  <div class="app-container">
    <el-tabs tab-position="top" :model-value="processed === true ? 'approval' : 'form'">
      <el-tab-pane label="任务办理" name="approval" v-if="processed === true">
        <el-card class="box-card" shadow="hover" v-if="taskFormOpen">
          <template #header>
            <span>填写表单</span>
          </template>
          <div class="cu-content">
            <v-form-render :form-json="{}" :form-data="{}" ref="vfRenderRef" />
          </div>
        </el-card>
        <el-card class="box-card" shadow="hover">
          <template #header>
            <span>审批流程</span>
          </template>
          <el-row>
            <el-col :span="20" :offset="2">
              <el-form ref="taskFormRef" :model="taskForm" :rules="rules" label-width="120px">
                <el-form-item label="审批意见" prop="comment">
                  <el-input type="textarea" :rows="5" v-model="taskForm.comment" placeholder="请输入 审批意见" />
                </el-form-item>
                <el-form-item label="抄送人" prop="copyUserIds">
                  <el-tag :key="index" v-for="(item, index) in copyUser" closable :disable-transitions="false" @close="handleClose('copy', item)">
                    {{ item.nickName }}
                  </el-tag>
                  <el-button class="button-new-tag" type="primary" icon="el-icon-plus" circle @click="onSelectCopyUsers" />
                </el-form-item>
                <el-form-item label="指定审批人" prop="copyUserIds">
                  <el-tag :key="index" v-for="(item, index) in nextUser" closable :disable-transitions="false" @close="handleClose('next', item)">
                    {{ item.nickName }}
                  </el-tag>
                  <el-button class="button-new-tag" type="primary" icon="el-icon-plus" circle @click="onSelectNextUsers" />
                </el-form-item>
              </el-form>
            </el-col>
          </el-row>
          <el-row :gutter="10" type="flex" justify="center">
            <el-col :span="1.5">
              <el-button icon="CircleCheck" type="success" @click="handleComplete">通过</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button icon="ChatLineSquare" type="primary" @click="handleDelegate">委派</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button icon="Switch" type="success" @click="handleTransfer">转办</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button icon="RefreshLeft" type="warning" @click="handleReturn">退回</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button icon="CircleClose" type="danger" @click="handleReject">拒绝</el-button>
            </el-col>
          </el-row>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="表单信息" name="form">
        <div v-if="formVisible">
          <el-card class="box-card" shadow="never" v-for="(item, index) in processFormList" :key="index">
            <template #header>
              <span>{{ item.title }}</span>
            </template>
            <!--流程处理表单模块-->
            <div class="cu-content">
              <v-form-render :form-json="item.formModel" :form-data="item.formData" ref="vFormRenderRef" />
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <el-tab-pane label="流转记录" name="record">
        <el-card class="box-card" shadow="never">
          <el-col :span="20" :offset="2">
            <div class="block">
              <el-timeline>
                <el-timeline-item v-for="(item, index) in historyProcNodeList" :key="index" :type="tagType(item.endTime)">
                  <p style="font-weight: 700">{{ item.activityName }}</p>
                  <el-card v-if="item.activityType === 'startEvent'" class="box-card" shadow="hover">
                    {{ item.assigneeName }} 在 {{ item.createTime }} 发起流程
                  </el-card>
                  <el-card v-if="item.activityType === 'userTask'" class="box-card" shadow="hover">
                    <el-descriptions :column="5" :labelStyle="{'font-weight': 'bold'}">
                      <el-descriptions-item label="实际办理">{{ item.assigneeName || '-'}}</el-descriptions-item>
                      <el-descriptions-item label="候选办理">{{ item.candidate || '-'}}</el-descriptions-item>
                      <el-descriptions-item label="接收时间">{{ item.createTime || '-'}}</el-descriptions-item>
                      <el-descriptions-item label="办结时间">{{ item.endTime || '-' }}</el-descriptions-item>
                      <el-descriptions-item label="耗时">{{ item.duration || '-'}}</el-descriptions-item>
                    </el-descriptions>
                    <div v-if="item.commentList && item.commentList.length > 0">
                      <div v-for="(comment, index) in item.commentList" :key="index">
                        <el-divider content-position="left">
                          <el-tag :type="approveTypeTag(comment.type)">{{ commentType(comment.type) }}</el-tag>
                          <el-tag type="info" effect="plain">{{ comment.time }}</el-tag>
                        </el-divider>
                        <span>{{ comment.fullMessage }}</span>
                      </div>
                    </div>
                  </el-card>
                  <el-card v-if="item.activityType === 'endEvent'" class="box-card" shadow="hover">
                    {{ item.createTime }} 结束流程
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-col>
        </el-card>
      </el-tab-pane>

      <el-tab-pane label="流程跟踪" name="track">
        <el-card class="box-card" shadow="never">
          <process-viewer
            :key="`designer-${loadIndex}`"
            :style="'height:' + height"
            :xml="processXml"
            :finishedInfo="finishedInfo"
            :allCommentList="historyProcNodeList"
          />
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!--退回流程-->
    <el-dialog :title="returnDialog.title" v-model="returnDialog.visible" width="40%" append-to-body>
      <el-radio-group v-model="returnTaskKey">
        <el-radio-button v-for="item in returnTaskList" :key="item.id" :label="item.id">
          {{ item.name }}
        </el-radio-button>
      </el-radio-group>
      <template #footer>
        <el-button @click="returnDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitReturn">确 定</el-button>
      </template>
    </el-dialog>

    <el-dialog :title="userSelectDialog.title" v-model="userSelectDialog.visible" width="60%" append-to-body>
      <el-row type="flex" :gutter="20">
        <!--部门数据-->
        <el-col :span="5">
          <el-card shadow="never" style="height: 100%">
            <template #header>
              <span>部门列表</span>
            </template>
            <div class="head-container">
              <el-input v-model="deptName" placeholder="请输入部门名称" prefix-icon="Search" clearable />
              <el-tree
                :data="deptOptions"
                :props="{ label: 'label', children: 'children' }"
                :expand-on-click-node="false"
                :filter-node-method="filterNode"
                ref="deptTreeRef"
                default-expand-all
                @node-click="handleNodeClick"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="18">
          <el-table
            ref="userTable"
            :key="userSelectType"
            height="500"
            v-loading="userLoading"
            :data="userList"
            highlight-current-row
            @current-change="changeCurrentUser"
            @selection-change="handleSelectionChange"
          >
            <el-table-column v-if="userSelectType === 'copy' || userSelectType === 'next'" width="55" type="selection" />
            <el-table-column v-else width="30">
              <template #default="scope">
                <el-radio :label="scope.row.userId" v-model="currentUserId">{{''}}</el-radio>
              </template>
            </el-table-column>
            <el-table-column label="用户名称" align="center" prop="userName" />
            <el-table-column label="用户昵称" align="center" prop="nickName" />
            <el-table-column label="手机" align="center" prop="phonenumber" />
          </el-table>
          <pagination :total="userTotal" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
        </el-col>
      </el-row>
      <template #footer>
        <el-button @click="userSelectDialog.visible = false">取 消</el-button>
        <el-button type="primary" @click="submitUserData">确 定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup name="Detail" lang="ts">
import { detailProcess } from "@/api/workflow/work/process";
import { complete, delegate, transfer, rejectTask, returnList, returnTask } from "@/api/workflow/work/task";
import { deptTreeSelect, selectUser } from "@/api/workflow/identity";
import { TaskForm } from "@/api/workflow/work/types";
import { UserVO, DeptVO } from "@/api/workflow/identity/types";

import { ComponentInternalInstance } from "vue";
import {useRoute} from "vue-router";

const route = useRoute();
const router = useRouter();
const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const userList = ref<UserVO[]>([]);
const processed = ref(false);
const taskFormOpen = ref(false)
const userMultipleSelection = ref([]);
const userSelectType = ref();
const currentUserId = ref();
const userLoading = ref(false);
const userTotal = ref(0);
const loadIndex = ref(0);
const height = ref(document.documentElement.clientHeight - 205 + 'px;');
const processXml = ref('');
const taskFormVisible = ref(false);
const processFormList = ref([]);
const taskFormData = ref([]);
const historyProcNodeList = ref<any>();
const formVisible = ref(false);
const finishedInfo = ref({});

const deptName = ref('');
const deptOptions = ref<DeptVO[]>([]);

const returnTaskList = ref();
const returnTaskKey = ref();

const copyUser = ref([]);
const nextUser = ref([]);

const taskFormRef = ref(ElForm);
const vFormRenderRef = ref(null);
const deptTreeRef = ref(null);

const returnDialog = reactive<DialogOption>({
  visible: false,
  title: '退回流程'
});

const userSelectDialog = reactive<DialogOption>({
  visible: false,
  title: ''
});

const taskForm = reactive<TaskForm>({
  comment: '',
  procInsId: '',
  taskId: '',
  userId: '',
  copyUserIds: '',
  nextUserIds: '',
  vars: '',
  targetKey: ''
});

const rules = ref({
  comment: [{ required: true, message: '请输入审批意见', trigger: 'blur' }]
});

const queryParams = ref({
  pageNum: 1,
  pageSize: 10
});
const tagType = (val: any) => {
  if (val) {
      return "success";
  } else {
      return "info";
  }
}
const commentType = (val: string) => {
  switch (val) {
    case '1': return '通过'
    case '2': return '退回'
    case '3': return '驳回'
    case '4': return '委派'
    case '5': return '转办'
    case '6': return '终止'
    case '7': return '撤回'
  }
}
const approveTypeTag = (val: string) => {
  switch (val) {
    case '1': return 'success'
    case '2': return 'warning'
    case '3': return 'danger'
    case '4': return 'primary'
    case '5': return 'success'
    case '6': return 'danger'
    case '7': return 'info'
  }
}

const initData = () => {
  taskForm.procInsId = route.params && route.params.procInsId as string;
  taskForm.taskId  = route.query && route.query.taskId as string;
  processed.value = route.query && (route.query.processed || false) === "true";

  // 流程任务重获取变量表单
  getProcessDetails(taskForm.procInsId, taskForm.taskId);
  loadIndex.value++;
};
/** 通过条件过滤节点  */
const filterNode = (value: string, data: any) => {
  if (!value) return true
  return data.label.indexOf(value) !== -1
}
// /** 根据名称筛选部门树 */
// watchEffect(
//     () => {deptTreeRef.value.filter(deptName.value);},
//     {
//       flush: 'post' // watchEffect会在DOM挂载或者更新之前就会触发，此属性控制在DOM元素更新后运行
//     }
// );
// 节点单击事件
const handleNodeClick = (data: any) => {
  getList(data.id);
}
/** 查询部门下拉树结构 */
const getTreeSelect = async () => {
  const res = await deptTreeSelect();
  deptOptions.value = res.data;
};
/** 查询用户列表 */
const getList = async (deptId?: number) => {
  userLoading.value = true;
  const res = await selectUser({deptId: deptId});
  userLoading.value = false;
  userList.value = res.rows;
  userTotal.value = res.total;
}

const getProcessDetails = async (procInsId: string, taskId: string) => {
  const params = {procInsId: procInsId, taskId: taskId}
  const res = await detailProcess(params);
  const data = res.data;
  processXml.value = data.bpmnXml;
  processFormList.value = data.processFormList;
  taskFormVisible.value = data.existTaskForm;
  if (taskFormVisible.value) {
    taskFormData.value = data.taskFormData;
  }
  historyProcNodeList.value = data.historyProcNodeList;
  finishedInfo.value = data.flowViewer;
  formVisible.value = true;
  nextTick(() => {
    processFormList.value.forEach((item: any, index: any) => {
      if (item.disabled) {
        vFormRenderRef.value[index].disableForm();
      }
    })
  })
}
const onSelectCopyUsers = () => {
  userMultipleSelection.value = copyUser;
  onSelectUsers('添加抄送人', 'copy')
}
const onSelectNextUsers = () => {
  userMultipleSelection.value = nextUser;
  onSelectUsers('指定审批人', 'next')
}
const onSelectUsers = (title: string, type: string) => {
  userSelectType.value = type;
  userSelectDialog.title = title;
  userSelectDialog.visible = true;
  getTreeSelect();
  getList()
}
/** 通过任务 */
const handleComplete = () => {
  // 校验表单
  taskFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const res = await complete(taskForm)
      proxy?.$modal.msgSuccess(res.msg);
      goBack();
    }
  });
}
/** 委派任务 */
const handleDelegate = () => {
  userSelectType.value = 'delegate';
  userSelectDialog.title = '委派任务'
  userSelectDialog.visible = true;
  getTreeSelect();
}
/** 转办任务 */
const handleTransfer = () => {
  userSelectType.value = 'transfer';
  userSelectDialog.title = '转办任务';
  userSelectDialog.visible = true;
  getTreeSelect();
}
/** 退回任务 */
const handleReturn = async () => {
  // 校验表单
  taskFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      const res = await returnList(taskForm);
      returnTaskList.value = res.data;
      returnDialog.visible = true;
    }
  });
}
/** 拒绝任务 */
const handleReject = async () => {
  await proxy?.$modal.confirm('拒绝审批单流程会终止，是否继续?');
  await rejectTask(taskForm);
  proxy?.$modal.msgSuccess("操作成功");
  goBack();
}

/** 返回页面 */
const goBack = () => {
  // 关闭当前标签页并返回上个页面
  proxy?.$tab.closePage(route);
  router.back()
}
// 关闭标签
const handleClose = (type: any, tag: any) => {
  let userObj = userMultipleSelection.value.find(item => item.userId === tag.id);
  userMultipleSelection.value.splice(userMultipleSelection.value.indexOf(userObj), 1);
  if (type === 'copy') {
    copyUser.value = userMultipleSelection.value;
    // 设置抄送人ID
    if (copyUser.value && copyUser.value.length > 0) {
      const val = copyUser.value.map(item => item.id);
      taskForm.copyUserIds = val instanceof Array ? val.join(',') : val;
    } else {
      taskForm.copyUserIds = '';
    }
  } else if (type === 'next') {
    nextUser.value = userMultipleSelection.value;
    // 设置抄送人ID
    if (nextUser.value && nextUser.value.length > 0) {
      const val = nextUser.value.map(item => item.id);
      taskForm.nextUserIds = val instanceof Array ? val.join(',') : val;
    } else {
      taskForm.nextUserIds = '';
    }
  }
}
const changeCurrentUser = (val: any) => {
  // currentUserId = val.userId
}
const handleSelectionChange = () => {

}
const submitReturn = () => {
  // 校验表单
  taskFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      if (!returnTaskKey) {
        proxy?.$modal.msgError("请选择退回节点！");
      }
      taskForm.targetKey = returnTaskKey.value;
      const res = await returnTask(taskForm);
      proxy?.$modal.msgSuccess(res.msg);
      goBack()
    }
  });
  console.log("taskForm => ", taskForm.targetKey);
}
const submitUserData = () => {
  let type = userSelectType.value;
  if (type === 'copy' || type === 'next') {
    if (!userMultipleSelection || userMultipleSelection.value.length <= 0) {
      proxy?.$modal.msgError("请选择用户");
      return false;
    }
    let userIds = userMultipleSelection.value.map(k => k.userId);
    if (type === 'copy') {
      // 设置抄送人ID信息
      copyUser.value = userMultipleSelection.value;
      taskForm.copyUserIds = userIds instanceof Array ? userIds.join(',') : userIds;
    } else if (type === 'next') {
      // 设置下一级审批人ID信息
      nextUser.value = userMultipleSelection.value;
      taskForm.nextUserIds = userIds instanceof Array ? userIds.join(',') : userIds;
    }
    userSelectDialog.visible = false;
  } else {
    if (!taskForm.comment) {
      proxy?.$modal.msgError("请输入审批意见");
      return false;
    }
    if (!currentUserId.value) {
      proxy?.$modal.msgError("请选择用户");
      return false;
    }
    taskForm.userId = currentUserId.value;
    if (type === 'delegate') {
      delegate(taskForm).then(res => {
        proxy?.$modal.msgSuccess(res.msg);
        goBack();
      });
    }
    if (type === 'transfer') {
      transfer(taskForm).then(res => {
        proxy?.$modal.msgSuccess(res.msg);
        goBack();
      });
    }
  }
}

onMounted(() => {
  initData();
});
</script>

<style lang="scss" scoped>
.clearfix:before,
.clearfix:after {
  display: table;
  content: "";
}
.clearfix:after {
  clear: both
}

.box-card {
  width: 100%;
  margin-bottom: 20px;
}

.el-tag + .el-tag {
  margin-left: 10px;
}

.el-row {
  margin-bottom: 20px;
  &:last-child {
    margin-bottom: 0;
  }
}
.el-col {
  border-radius: 4px;
}

.button-new-tag {
  margin-left: 10px;
}
</style>
