export interface Category {
  category_id: string;
  category_name: string;
  description?: string;
  department_id: string;
  org_id: number;
  opr_id: number;
  created_on?: string;
  is_active?: string;
  created_by?: string;
  modified_by?: string | null;
}


export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  statusMsg: string;
  data: T;
}