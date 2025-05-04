/**
 * Interface for login request payload
 */
export interface LoginRequest {
    email: string;
    password: string;
}

/**
 * Interface for login response from the API
 */
export interface LoginResponse {
    success: boolean;
    message: string;
    token: string;
    userId: string;
    role: string;
    username: string;
    org_id: string;
    opr_id: string;
    l_org_name: string;
    l_role_name: string;
    l_department_Id: string;
}

/**
 * Interface for current user data
 */
export interface UserData {
    userId: string;
    username: string;
    email: string;
    role: string;
    token: string;
    organizationId: string;
    operatingUnitId: string;
    l_department_Id: string;
    l_org_name: string;
    l_role_name: string;
    account_id: string;
}

export interface UserByDepartment {
    account_id: string;
    name: string;
    email: string;
    phone_no: string;
    password: string;
    department_id: string;
    role_id: string;
    org_id: number;
    opr_id: number;
    created_by: string;
    created_on: string;
    modified_by: string | null;
    modified_on: string;
    is_active: string;
}

/**
 * Interface for registration request payload
 */
export interface RegisterRequest {
    name: string;
    email: string;
    phoneNo: string;
    password: string;
    l_department_Id: string;
    roleId: string;
    orgId: string;
    oprId: string;
    createdBy: string;
}
/**
 * Interface for Role data
 */
export interface Role {
    role_id: string;
    org_id: number;
    role_name: string;
    opr_id: number;
    created_by: string;
    created_on: string;
    modified_by: string;
    modified_on: string;
    is_active: string;
}

/**
 * Interface for Organization data
 */
export interface Organization {
    org_id: number;
    org_name: string;
    created_by: string;
    created_on: string;
    modified_by: string;
    modified_on: string;
    is_active: string;
}

/**
 * Interface for Operating Unit data
 */
export interface OperatingUnit {
    opr_id: number;
    opr_name: string;
    org_id: number;
    created_by: string;
    created_on: string;
    modified_by: string;
    modified_on: string;
    is_active: string;
}