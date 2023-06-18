import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { CategoryForm, CategoryQuery, CategoryVO } from '@/api/workflow/category/types';

// 查询流程分类列表
export function listCategory(query: CategoryQuery): AxiosPromise<CategoryVO[]> {
  return request({
    url: '/workflow/category/list',
    method: 'get',
    params: query
  });
}

// 查询流程分类列表
export function listAllCategory(query?: CategoryQuery): AxiosPromise<CategoryVO[]> {
  return request({
    url: '/workflow/category/listAll',
    method: 'get',
    params: query
  });
}

// 查询流程分类详细
export function getCategory(categoryId?: string | number): AxiosPromise<CategoryVO> {
  return request({
    url: '/workflow/category/' + categoryId,
    method: 'get'
  });
}

// 新增流程分类
export function addCategory(data: CategoryForm) {
  return request({
    url: '/workflow/category',
    method: 'post',
    data: data
  });
}

// 修改流程分类
export function updateCategory(data: CategoryForm) {
  return request({
    url: '/workflow/category',
    method: 'put',
    data: data
  });
}

// 删除流程分类
export function delCategory(categoryIds?: string | number | Array<string | number>) {
  return request({
    url: '/workflow/category/' + categoryIds,
    method: 'delete'
  });
}
