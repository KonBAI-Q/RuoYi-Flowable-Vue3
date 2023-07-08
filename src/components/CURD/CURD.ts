import { reactive } from 'vue';
import { objectWithoutEmpty } from '@/utils';
import { isFunction } from '@vueuse/core';
import { CURDHooks, LIFECYCLE_HOOKS, createHook, registerHook } from './apiLifecycle';

export enum CURD_STATUS {
  NORMAL,
  PREPARED,
  PROCESSING
}

export interface CURDOptions {
  title?: string; // 表名
  idField?: string; // 唯一标识字段
  dataList?: unknown[]; // 表格数据
  selections?: unknown[]; // 选择数据
  queryParams?: Record<string, any>; // 受CURD控制的查询参数
  params?: Record<string, any>; // 除queryParams外的查询传参(不由CURD工具控制的query参数)
  defaultForm?: Record<string, any>; // 默认表单, 初始化和重置时使用此对象替换原对象
  getList?: (queryParams: Record<string, any>) => Promise<any>; // 分页查询方法
  add?: (form: Record<string, any>) => Promise<any>; // 新增方法
  edit?: (form: Record<string, any>) => Promise<any>; // 编辑方法
  del?: (id: string | number | Array<string | number>) => Promise<any>; // 删除方法
  batchDel?: (id: string | number | Array<string | number>) => Promise<any>; // 批量删除方法, 不填则默认使用del删除方法
  get?: (id: string | number) => Promise<any>; // 查询单行方法
}

export function CURD(options: CURDOptions) {
  const optionWithDefault = Object.assign(
    {},
    {
      title: '',
      idField: 'id',
      dataList: [] as any[],
      selections: [] as any[],
      queryParams: {},
      params: {}, //除query外的传参(不由CURD工具控制的query参数)
      defaultForm: {},
      getList: () => Promise.resolve('defaultSuccess'),
      add: () => Promise.resolve('defaultSuccess'),
      edit: () => Promise.resolve('defaultSuccess'),
      del: () => Promise.resolve('defaultSuccess'),
      get: () => Promise.resolve('defaultSuccess')
    },
    options
  );

  const state = reactive({
    ...optionWithDefault,
    form: Object.assign({}, optionWithDefault.defaultForm),
    status: {
      c: CURD_STATUS.NORMAL,
      u: CURD_STATUS.NORMAL,
      get cu() {
        if (state.status.c === CURD_STATUS.NORMAL && state.status.u === CURD_STATUS.NORMAL) {
          return CURD_STATUS.NORMAL;
        } else if (state.status.c === CURD_STATUS.PREPARED || state.status.u === CURD_STATUS.PREPARED) {
          return CURD_STATUS.PREPARED;
        } else if (state.status.c === CURD_STATUS.PROCESSING || state.status.u === CURD_STATUS.PROCESSING) {
          return CURD_STATUS.PROCESSING;
        } else {
          throw new Error("wrong state's cu status");
        }
      },
      get title() {
        if (state.status.c === CURD_STATUS.PREPARED || state.status.c === CURD_STATUS.PROCESSING) {
          return `新增${state.title}`;
        } else if (state.status.u === CURD_STATUS.PREPARED || state.status.u === CURD_STATUS.PROCESSING) {
          return `编辑${state.title}`;
        }
      }
    },
    pageNum: 1,
    pageSize: 10,
    total: 0,
    loading: false,
    buttonLoading: false
  });

  const curdHooks: CURDHooks = {};
  const callHooks = registerHook(curdHooks);

  const methods = {
    getQueryParams() {
      const queryParams = Object.assign({}, state.queryParams, state.params, {
        pageNum: state.pageNum,
        pageSize: state.pageSize
      });
      return objectWithoutEmpty(queryParams);
    },
    resetQueryParams() {
      for (const key in state.queryParams) {
        if (Object.prototype.hasOwnProperty.call(optionWithDefault.queryParams, key)) {
          state.queryParams[key] = optionWithDefault.queryParams[key];
        } else {
          state.queryParams[key] = null;
        }
      }
    },
    resetForm() {
      for (const key in state.form) {
        if (Object.prototype.hasOwnProperty.call(optionWithDefault.defaultForm, key)) {
          state.form[key] = optionWithDefault.defaultForm[key];
        } else {
          state.form[key] = null;
        }
      }
    },
    // 执行刷新
    async refresh() {
      const validList = await Promise.all(callHooks(LIFECYCLE_HOOKS.BEFORE_REFRESH, state));
      if (validList.some((valid) => typeof valid === 'boolean' && !valid)) {
        return Promise.reject('beforeRefresh: false');
      }
      return new Promise((resolve, reject) => {
        state.loading = true;
        state
          .getList(methods.getQueryParams)
          .then((res) => {
            state.total = res.total;
            state.dataList = res.rows;
            methods.selectionChangeHandler([]);
            resolve(res);
          })
          .catch((err) => {
            reject(err);
          })
          .finally(() => {
            state.loading = false;
          });
      }).then((res) => {
        callHooks(LIFECYCLE_HOOKS.AFTER_REFRESH, state);
        return Promise.resolve(res);
      });
    },
    // 执行查询
    async doQuery() {
      const validList = await Promise.all(callHooks(LIFECYCLE_HOOKS.BEFORE_QUERY, state));
      if (validList.some((valid) => typeof valid === 'boolean' && !valid)) {
        return Promise.reject('beforeQuery: false');
      }
      state.pageNum = 1;
      return methods.refresh();
    },
    // 执行重置查询
    doResetQuery() {
      methods.resetQueryParams();
      return methods.doQuery();
    },
    // 启动新增
    toAdd() {
      methods.resetForm();
      if (Object.hasOwn(state.form, state.idField || 'id')) {
        delete state.form[state.idField || 'id'];
      }
      state.status.c = CURD_STATUS.PREPARED;
    },
    // 执行新增
    doAdd() {
      state.status.c = CURD_STATUS.PROCESSING;
      state.buttonLoading = true;
      return state
        .add(state.form)
        .then(() => {
          state.status.c = CURD_STATUS.NORMAL;
          methods.resetForm();
          return methods.doQuery();
        })
        .catch((err) => {
          state.status.c = CURD_STATUS.PREPARED;
          state.buttonLoading = false;
          return Promise.reject(err);
        });
    },
    // 启动编辑
    toEdit(form: Record<string, any>) {
      methods.resetForm();
      state.form = { ...form };
      state.status.u = CURD_STATUS.PREPARED;
    },
    // 执行编辑
    doEdit() {
      state.status.u = CURD_STATUS.PROCESSING;
      state.buttonLoading = true;
      return state
        .edit(state.form)
        .then(() => {
          state.status.u = CURD_STATUS.NORMAL;
          methods.resetForm();
          return methods.refresh();
        })
        .catch((err) => {
          state.status.u = CURD_STATUS.PREPARED;
          return Promise.reject(err);
        })
        .finally(() => {
          state.buttonLoading = false;
        });
    },
    // 提交新增/编辑
    async submitCU() {
      const validList = await Promise.all(callHooks(LIFECYCLE_HOOKS.BEFORE_SUBMIT_CU, state));
      if (validList.some((valid) => typeof valid === 'boolean' && !valid)) {
        return Promise.reject('beforeSubmitCU false');
      }
      // if (hooks.beforeSubmitCU && !hooks.beforeSubmitCU()) {
      //   return Promise.reject('beforeSubmitCU false');
      // }
      if (state.status.c === CURD_STATUS.PREPARED) {
        return methods.doAdd().then((res) => {
          callHooks(LIFECYCLE_HOOKS.AFTER_SUBMIT_CU, state);
          return Promise.resolve(res);
        });
      }
      if (state.status.u === CURD_STATUS.PREPARED) {
        return methods.doEdit().then((res) => {
          callHooks(LIFECYCLE_HOOKS.AFTER_SUBMIT_CU, state);
          return Promise.resolve(res);
        });
      }
    },
    // 取消新增/编辑
    cancelCU() {
      methods.resetForm();
      state.status.c = CURD_STATUS.NORMAL;
      state.status.u = CURD_STATUS.NORMAL;
    },
    // 执行删除
    doDel(form: Record<string, any>) {
      if (!state.idField) {
        throw new Error('curdMethods.del/idField is empty');
        return Promise.reject('curdMethods.del/idField is empty');
      }
      const id = form[state.idField];
      if (!id && id !== 0) {
        throw new Error(`can't find property ${state.idField}`);
        return Promise.reject(`can't find property ${state.idField}`);
      }
      state.buttonLoading = true;
      return state
        .del(id)
        .then(() => {
          callHooks(LIFECYCLE_HOOKS.AFTER_DEL, state);
          state.buttonLoading = false;
          return methods.refresh();
        })
        .catch((err) => {
          state.buttonLoading = false;
          return Promise.reject(err);
        });
    },
    // 执行批量删除
    doBatchDel() {
      if (!state.idField) {
        throw new Error('curdMethods.del/idField is empty');
        return Promise.reject('curdMethods.del/idField is empty');
      }
      if (!Array.isArray(state.selections) || state.selections.length === 0) {
        return Promise.resolve();
      }
      state.buttonLoading = true;
      const ids = state.selections.map((item) => item[state.idField]);
      return (isFunction(state.batchDel) ? state.batchDel(ids) : state.del(ids))
        .then(() => {
          callHooks(LIFECYCLE_HOOKS.AFTER_DEL, state);
          state.buttonLoading = false;
          return methods.refresh();
        })
        .catch((err) => {
          state.buttonLoading = false;
          return Promise.reject(err);
        });
    },
    // 执行单行查询
    doGet(form: Record<string, any>) {
      if (!state.idField) {
        throw new Error('idField is empty');
        return Promise.reject('idField is empty');
      }
      const id = form[state.idField];
      if (!id && id !== 0) {
        throw new Error(`can't find property ${state.idField}`);
        return Promise.reject(`can't find property ${state.idField}`);
      }
      methods.resetForm();
      state.buttonLoading = true;
      return state
        .get(id)
        .then((res) => {
          state.form = res.data;
          return Promise.resolve(res);
        })
        .finally(() => {
          state.buttonLoading = false;
        });
    },
    // 多选改变 val类型期望为el-table事件selection-change的回调参数selection
    selectionChangeHandler(val: any[]) {
      state.selections = val;
    }
  };

  // 分页用钩子
  const usePagination = () => ({
    state,
    pageChangeHandler(e: number) {
      state.pageNum = e;
      return methods.refresh();
    },
    sizeChangeHandler(e: number) {
      state.pageSize = e;
      state.pageNum = 1;
      return methods.refresh();
    }
  });

  return {
    state,
    refresh: methods.refresh,
    doQuery: methods.doQuery,
    doResetQuery: methods.doResetQuery,
    toAdd: methods.toAdd,
    doAdd: methods.doAdd,
    toEdit: methods.toEdit,
    doEdit: methods.doEdit,
    submitCU: methods.submitCU,
    cancelCU: methods.cancelCU,
    doDel: methods.doDel,
    doBatchDel: methods.doBatchDel,
    doGet: methods.doGet,
    selectionChangeHandler: methods.selectionChangeHandler,
    usePagination,
    hooks: {
      beforeQuery: createHook(LIFECYCLE_HOOKS.BEFORE_QUERY, curdHooks),
      beforeRefresh: createHook(LIFECYCLE_HOOKS.BEFORE_REFRESH, curdHooks),
      afterRefresh: createHook(LIFECYCLE_HOOKS.AFTER_REFRESH, curdHooks),
      beforeSubmitCU: createHook(LIFECYCLE_HOOKS.BEFORE_SUBMIT_CU, curdHooks),
      afterSubmitCU: createHook(LIFECYCLE_HOOKS.AFTER_SUBMIT_CU, curdHooks),
      afterDel: createHook(LIFECYCLE_HOOKS.AFTER_DEL, curdHooks)
    },
    methods
  };
}

export type Curd = ReturnType<typeof CURD>;

export default CURD;
