export interface DeployVO {
  definitionId: string;
  processName: string;
  processKey: string;
  category: string;
  version: number;
  formId: string | number;
  formName: string;
  deploymentId: string;
  suspended: boolean;
  deploymentTime: string;
}

export interface ProcessQuery extends PageQuery {
  processKey?: string;
  processName?: string;
  category?: string;
  state?: string;
}
