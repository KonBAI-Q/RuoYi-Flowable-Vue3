import request from '@/utils/request';
import { AxiosPromise } from 'axios';
import { UserVO, DeptVO } from '@/api/workflow/identity/types';

// 查询流程模型信息
export function selectUser(query?: any): AxiosPromise<UserVO[]> {
  return request({
    url: '/workflow/identity/selectUser',
    method: 'get',
    params: query
  });
}

export function deptTreeSelect(): AxiosPromise<DeptVO[]> {
  return request({
    url: '/workflow/identity/deptTree',
    method: 'get'
  });
}
