<template>
  <div class="p-2">
    <transition :enter-active-class="proxy?.animate.searchAnimate.enter" :leave-active-class="proxy?.animate.searchAnimate.leave">
      <div class="search" v-show="showSearch">
        <el-form :model="queryParams" ref="queryFormRef" :inline="true" label-width="68px">
          <el-form-item label="分类名称" prop="categoryName">
            <el-input v-model="queryParams.categoryName" placeholder="请输入分类名称" clearable @keyup.enter="handleQuery" />
          </el-form-item>
          <el-form-item label="分类编码" prop="code">
            <el-input v-model="queryParams.code" placeholder="请输入分类编码" clearable @keyup.enter="handleQuery" />
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
            <el-button type="primary" plain icon="Plus" @click="handleAdd" v-hasPermi="['workflow:category:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="success" plain icon="Edit" :disabled="single" @click="handleUpdate()" v-hasPermi="['workflow:category:edit']">
              修改
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="danger" plain icon="Delete" :disabled="multiple" @click="handleDelete()" v-hasPermi="['workflow:category:remove']">
              删除
            </el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="warning" plain icon="Download" @click="handleExport()" v-hasPermi="['workflow:category:export']">导出</el-button>
          </el-col>
          <right-toolbar v-model:showSearch="showSearch" @queryTable="getList"></right-toolbar>
        </el-row>
      </template>

      <el-table v-loading="loading" :data="categoryList" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="分类编号" align="center" prop="categoryId" v-if="true" />
        <el-table-column label="分类名称" align="center" prop="categoryName" />
        <el-table-column label="分类编码" align="center" prop="code" />
        <el-table-column label="备注" align="center" prop="remark" />
        <el-table-column label="操作" align="center" width="150" class-name="small-padding fixed-width">
          <template #default="scope">
            <el-tooltip content="修改" placement="top">
              <el-button link type="primary" icon="Edit" @click="handleUpdate(scope.row)" v-hasPermi="['workflow:category:edit']"></el-button>
            </el-tooltip>
            <el-tooltip content="删除" placement="top">
              <el-button link type="primary" icon="Delete" @click="handleDelete(scope.row)" v-hasPermi="['workflow:category:remove']"></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      <pagination v-show="total > 0" :total="total" v-model:page="queryParams.pageNum" v-model:limit="queryParams.pageSize" @pagination="getList" />
    </el-card>

    <!-- 添加或修改参数配置对话框 -->
    <el-dialog :title="dialog.title" v-model="dialog.visible" width="500px" append-to-body>
      <el-form ref="categoryFormRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="categoryName">
          <el-input v-model="form.categoryName" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类编码" prop="code">
          <el-input v-model="form.code" placeholder="请输入分类编码" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
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

<script setup name="Category" lang="ts">
import { listCategory, getCategory, delCategory, addCategory, updateCategory } from "@/api/workflow/category";
import { CategoryForm, CategoryQuery, CategoryVO } from "@/api/workflow/category/types";
import { ComponentInternalInstance } from "vue";

const { proxy } = getCurrentInstance() as ComponentInternalInstance;

const categoryList = ref<CategoryVO[]>([]);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref<Array<number | string>>([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);

const queryFormRef = ref(ElForm);
const categoryFormRef = ref(ElForm);
const dialog = reactive<DialogOption>({
  visible: false,
  title: ''
});
const initFormData: CategoryForm = {
  categoryId: undefined,
  categoryName: '',
  code: '',
  remark: ''
}
const data = reactive<PageData<CategoryForm, CategoryQuery>>({
  form: {...initFormData},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    categoryName: '',
    code: ''
  },
  rules: {
    categoryName: [{ required: true, message: "分类名称不能为空", trigger: "blur" }],
    code: [{ required: true, message: "分类编码不能为空", trigger: "blur" }]
  }
});

const { queryParams, form, rules } = toRefs(data);

/** 查询参数列表 */
const getList = async () => {
  loading.value = true;
  const res = await listCategory(queryParams.value);
  categoryList.value = res.rows;
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
  categoryFormRef.value.resetFields();
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
const handleSelectionChange = (selection: CategoryVO[]) => {
  ids.value = selection.map(item => item.categoryId);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
}
/** 新增按钮操作 */
const handleAdd = () => {
  dialog.visible = true;
  dialog.title = "添加参数";
  nextTick(() => {
    reset();
  })
}
/** 修改按钮操作 */
const handleUpdate = (row?: CategoryVO) => {
  dialog.visible = true;
  dialog.title = "修改参数";
  const categoryId = row?.categoryId || ids.value[0];
  nextTick(async () => {
    reset();
    const res = await getCategory(categoryId);
    form.value = res.data;
  })
}
/** 提交按钮 */
const submitForm = () => {
  categoryFormRef.value.validate(async (valid: boolean) => {
    if (valid) {
      form.value.categoryId ? await updateCategory(form.value) : await addCategory(form.value);
      proxy?.$modal.msgSuccess("操作成功");
      dialog.visible = false;
      getList();
    }
  });
}
/** 删除按钮操作 */
const handleDelete = async (row?: CategoryVO) => {
  const categoryIds = row?.categoryId || ids.value;
  await proxy?.$modal.confirm('是否确认删除参数编号为"' + categoryIds + '"的数据项？');
  await delCategory(categoryIds);
  getList();
  proxy?.$modal.msgSuccess("删除成功");
}
/** 导出按钮操作 */
const handleExport = () => {
  proxy?.download("workflow/category/export", {
    ...queryParams.value
  }, `category_${new Date().getTime()}.xlsx`);
}

onMounted(() => {
  getList();
})
</script>
