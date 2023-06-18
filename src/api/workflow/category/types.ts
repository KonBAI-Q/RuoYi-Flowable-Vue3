/**
 * 流程分类查询对象类型
 */
export interface CategoryQuery extends PageQuery {
  categoryName?: string;
  code?: string;
}

/**
 * 流程分类返回对象
 */
export interface CategoryVO extends BaseEntity {
  categoryId: string | number;
  categoryName: string;
  code: string;
  remark: string;
}

export interface CategoryForm {
  categoryId?: string | number;
  categoryName?: string;
  code?: string;
  remark?: string;
}
