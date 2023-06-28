import request from '@/utils/request';
import { FormForm, FormQuery, FormVO } from './types';
import { AxiosPromise } from 'axios';

// 查询流程表单列表
export function listForm(query?: FormQuery): AxiosPromise<FormVO[]> {
  return request({
    url: '/workflow/form/list',
    method: 'get',
    params: query
  });
}

// 查询流程表单详细
export function getForm(formId: string | number): AxiosPromise<FormVO> {
  return request({
    url: '/workflow/form/' + formId,
    method: 'get'
  });
}

// 新增流程表单
export function addForm(data: FormForm) {
  return request({
    url: '/workflow/form',
    method: 'post',
    data: data
  });
}

// 修改流程表单
export function updateForm(data: FormForm) {
  return request({
    url: '/workflow/form',
    method: 'put',
    data: data
  });
}

// 删除流程表单
export function delForm(formId?: string | number | (string | number)[]) {
  return request({
    url: '/workflow/form/' + formId,
    method: 'delete'
  });
}
