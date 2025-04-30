
/**
 * Interface for Department data
 */
export interface Department {
    department_id: string;
    org_id: string;
    department_name: string;
    description: string;
    created_by?: string;
    created_on?: string;
    modified_by?: string;
    modified_on?: string;
    is_active: string;
    opr_id: string;

}

/**
 * Interface for creating or updating a department
 */
export interface DepartmentRequest {
    id: string;
    name: string;
    description: string;
    isActive: string;
    orgId: string;
    oprId: string;
    createdBy: string;
}

/**
 * Interface for API response of department operations
 */
export interface DepartmentResponse {
    status: string;
    statusMsg: string;
    id?: string;
}

/**
 * Interface for pagination information
 */
export interface PaginationInfo {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
}