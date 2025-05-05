export interface Complaint {
    showStatusDropdown: boolean;
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
    l_department_name?: string;
    l_assigned_to?: string;
    l_created_by?: string;
    l_deffered_reason?: string;
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
    l_previous_status?: string; // Added field
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

export interface Cl_createAttachmentPayload {
    entity_type: string,
    entity_id: string,
    uploaded_file_name: string,
    uploaded_by: string,
    l_encrypted_file: string
}


// Add this to your models/complaint.ts or update the existing interface
export interface Attachment {
    attachment_id: string;
    entity_type: string;
    entity_id: string;
    file_path?: string;
    uploaded_by: string;
    uploaded_on: string;
    l_encrypted_file: string;
    stored_file_name: string;
    uploaded_file_name: string;
}



// Add this interface to complaint.service.ts or to your models/complaint.ts file
export interface ComplaintHistoryItem {
    complaint_status_history_id: string;
    complaint_id: string;
    from_status: string;
    to_status: string;
    reason: string;
    changed_by: string;
    changed_on: string;
}

// Add this interface to your complaint service
export interface ChatMessage {
    chat_id?: string;
    complaint_id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    timestamp?: string;
    sender_name?: string;
    sender_role?: string;
    is_read?: boolean;
    attachments?: string[];
    l_sender_id?: string;
    l_receiver_id?: string;
}