export interface Complaint {
    complaint_id: string;
    org_id: number;
    subject: string;           // Changed from 'title'
    description: string;
    status: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    department_id: string;
    created_by: string;
    assigned_to?: string;
    created_on: string;        // Changed from 'created_date'
    modified_on?: string;      // Changed from 'modified_date'
    modified_by?: string;
    due_date?: string;         // Added field
    is_active: string;         // Added field
    opr_id: number;
    category_id?: string;
    category_name?: string;
    sub_category_id?: string;
    sub_category_name?: string;
    department_name?: string;
    assigned_to_name?: string;
    resolution_comments?: string;
    resolution_date?: string;
    attachments?: string[];
}

// Create payload interface
export interface CreateComplaintPayload {
    complaint_id: string;
    org_id: number;           // Changed from organization_id and to number
    subject: string;          // Changed from title
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    status: string;           // Added field with default "OPEN"
    department_id: string;
    created_by: string;
    assigned_to?: string;     // Added field
    created_on?: string;      // Added field
    modified_on?: string;     // Added field
    modified_by?: string;
    due_date?: string;        // Added field
    is_active: string;        // Added field with default "YES"
    opr_id: number;           // Changed from operating_unit_id and to number
    category_id?: string;
    sub_category_id?: string;
    attachments?: string[];
}

// Update status payload interface
export interface UpdateComplaintStatusPayload {
    complaint_id: string;
    status: string;
    resolution_comments?: string;
}

// Complaint filters interface
export interface ComplaintFilters {
    status?: string;
    priority?: number;
    department_id?: string;
    category_id?: string;
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
}

// Response interface
export interface ApiResponse<T> {
    status: boolean;
    statusCode: number;
    statusMsg: string;
    data: T;
}


/**
 * Interface for API response of department operations
 */
export interface ComplaintResponse {
    status: string;
    statusMsg: string;
    id?: string;
}