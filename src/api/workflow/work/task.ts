import request from '@/utils/request';

// 完成任务
export function complete(data?: any) {
  return request({
    url: '/workflow/task/complete',
    method: 'post',
    data: data
  });
}

// 委派任务
export function delegate(data?: any) {
  return request({
    url: '/workflow/task/delegate',
    method: 'post',
    data: data
  });
}

// 转办任务
export function transfer(data?: any) {
  return request({
    url: '/workflow/task/transfer',
    method: 'post',
    data: data
  });
}

// 退回任务
export function returnTask(data?: any) {
  return request({
    url: '/workflow/task/return',
    method: 'post',
    data: data
  });
}

// 拒绝任务
export function rejectTask(data?: any) {
  return request({
    url: '/workflow/task/reject',
    method: 'post',
    data: data
  });
}

// 签收任务
export function claimTask(data?: any) {
  return request({
    url: '/workflow/task/claim',
    method: 'post',
    data: data
  });
}

// 可退回任务列表
export function returnList(data?: any) {
  return request({
    url: '/workflow/task/returnList',
    method: 'post',
    data: data
  });
}

// 撤回任务
export function revokeProcess(data?: any) {
  return request({
    url: '/workflow/task/revokeProcess',
    method: 'post',
    data: data
  });
}
