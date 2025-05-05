export interface Suggestion {
    showActionsDropdown: boolean;
    suggestion_id: string;
    org_id: number;
    subject: string;
    description: string;
    department_id?: string;
    created_by: string;
    created_on?: string;
    modified_on?: string;
    modified_by?: string;
    attachment_id?: string;
    opr_id: number;
    l_department_name?: string;
    l_created_by?: string;
}

// Create payload interface for creating/updating suggestions
export interface CreateSuggestionPayload {
    suggestion_id: string;
    org_id: number;
    subject: string;
    description: string;
    department_id?: string;
    created_by: string;
    created_on?: string;
    modified_on?: string;
    modified_by?: string;
    // attachment_id?: string;
    opr_id: number;
}

export interface SuggestionResponse {
    status: boolean;
    statusMsg?: string;
    data?: any;
}