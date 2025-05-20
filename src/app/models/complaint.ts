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
    has_feedback?: boolean;
    is_anonymous?: string;     // Added new field
    tag_id?: string;           // Added new field
    l_previous_status?: string; // Added from Java model
    l_category_name?: string;  // Added from Java model
    l_tag_name?: string;       // Added from Java model
    location: string
}

// Create payload interface
export interface CreateComplaintPayload {
    complaint_id: string;
    org_id: number;           // Changed from organization_id and to number
    subject: string;          // Changed from title
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW' | '';
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
    is_anonymous?: string;     // Added new field
    tag_id?: string;           // Added new field
    location: string;
}

// Rest of the interfaces remain unchanged
// Update status payload interface
export interface UpdateComplaintStatusPayload {
    complaint_id: string;
    status: string;
    resolution_comments?: string;
}

// Complaint filters interface - update to include new fields
export interface ComplaintFilters {
    status?: string;
    priority?: number;
    department_id?: string;
    category_id?: string;
    tag_id?: string;          // Added new field
    dateFrom?: string;
    dateTo?: string;
    searchTerm?: string;
    is_anonymous?: string;    // Added new field
}

// The rest of your interfaces remain the same
export interface ApiResponse<T> {
    status: boolean;
    statusCode: number;
    statusMsg: string;
    data: T;
}

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

export interface ComplaintHistoryItem {
    complaint_status_history_id: string;
    complaint_id: string;
    from_status: string;
    to_status: string;
    reason: string;
    changed_by: string;
    changed_on: string;
    l_changed_by: string;
}

export interface ChatMessage {
    complaint_message_history_id?: string;
    complaint_id: string;
    sender_id: string;
    receiver_id: string;
    message: string;
    sent_on?: string;
    attachment: Attachment | null;
    l_sender_id?: string;
    l_receiver_id?: string;
    l_sender_role?: string;
    l_receiver_role?: string;
}

export interface FeedbackData {
    feedback_id: string;
    subject: string;
    description: string;
    rating: number;
    complaint_id: string;
    created_by: string;
    created_on: string;
    modified_on: string;
    modified_by: string;
    org_id: number;
    opr_id: number;
    is_active: string;
    l_created_by: string;
}

// Modify existing FeedbackResponse if needed
export interface FeedbackResponse {
    status: boolean;
    statusMsg?: string;
    data?: any;
}







export interface FeedbackQuestionOption {
    option_id: string;
    question_id: string;
    option_text: string;
    option_order: string;
}

export interface FeedbackQuestion {
    question_id: string;
    question_text: string;
    question_type: 'MCQ' | 'TEXT' | 'RATING';
    is_active: string;
    created_on: string;
    feedbackQuestionOptions: FeedbackQuestionOption[];
}

export interface FeedbackQuestionResponse {
    response_id: string;
    feedback_id: string;
    question_id: string;
    selected_option_id: string;
}

// Update the FeedbackAnswer interface to match the backend structure
export interface FeedbackAnswer {
    response_id: string;
    feedback_id: string;
    question_id: string;
    selected_option_id: string;
}

// This will be added to your existing FeedbackData interface
export interface FeedbackDataWithAnswers extends FeedbackData {
    answers: FeedbackAnswer[];
}

// In complaint.ts - Add this interface to match the new response format:

export interface FeedbackWithResponses {
    feedback: FeedbackData;
    feedbackQuestionResponse: FeedbackQuestionResponseWithText[];
}

export interface FeedbackQuestionResponseWithText {
    response_id: string;
    feedback_id: string;
    question_id: string;
    selected_option_id: string;
    answer_text: string;
    created_on: string;
    l_question_text: string;
    l_option_text: string;
}