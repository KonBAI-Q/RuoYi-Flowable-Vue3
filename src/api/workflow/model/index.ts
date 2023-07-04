import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { ModelQuery, ModelVO } from './types';

// 查询流程模型信息
export function listModel(query?: ModelQuery): AxiosPromise<ModelVO[]> {
  return request({
    url: '/workflow/model/list',
    method: 'get',
    params: query
  });
}

// 查询流程模型信息
export function historyModel(query?: ModelQuery): AxiosPromise<ModelVO[]> {
  return request({
    url: '/workflow/model/historyList',
    method: 'get',
    params: query
  });
}

export function getModel(modelId?: string) {
  return request({
    url: '/workflow/model/' + modelId,
    method: 'get'
  });
}

// 新增模型信息
export function addModel(data?: any) {
  return request({
    url: '/workflow/model',
    method: 'post',
    data: data
  });
}

// 修改模型信息
export function updateModel(data?: any) {
  return request({
    url: '/workflow/model',
    method: 'put',
    data: data
  });
}

// 保存流程模型
export function saveModel(data?: any) {
  return request({
    url: '/workflow/model/save',
    method: 'post',
    data: data
  });
}

export function latestModel(params?: any) {
  return request({
    url: '/workflow/model/latest',
    method: 'post',
    params: params
  });
}

export function delModel(modelIds?: string | string[]) {
  return request({
    url: '/workflow/model/' + modelIds,
    method: 'delete'
  });
}

export function deployModel(params?: any) {
  return request({
    url: '/workflow/model/deploy',
    method: 'post',
    params: params
  });
}

// 获取流程模型流程图
export function getBpmnXml(modelId?: string) {
  return request({
    url: '/workflow/model/bpmnXml/' + modelId,
    method: 'get'
  });
}
