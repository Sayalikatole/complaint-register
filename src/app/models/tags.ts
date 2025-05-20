export interface Tags {
  tag_id: string;
  tag_name: string;
  category_id: string;
  org_id: number;
  opr_id: number;
  is_active?: string;
  created_by?: string;
  created_on?: string;
  modified_by?: string;
  modified_on?: string;
}

export interface ApiResponse<T> {
  status: boolean;
  statusCode: number;
  statusMsg: string;
  data: T;
}