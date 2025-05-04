/**
 * Enum for complaint statuses
 */
export enum ComplaintStatus {
    OPEN = 'OPEN',
    ASSIGNED = 'ASSIGNED',
    IN_PROGRESS = 'IN_PROGRESS',
    RESOLVED = 'RESOLVED',
    REOPEN = 'REOPEN',
    ESCALATED = 'ESCALATED',
    DEFERRED = 'DEFERRED',
    CLOSED = 'CLOSED'
}

/**
 * Get display name for status
 * @param status The status enum value
 * @returns A user-friendly display name
 */
export function getStatusDisplayName(status: string): string {
    switch (status) {
        case ComplaintStatus.OPEN:
            return 'Open';
        case ComplaintStatus.ASSIGNED:
            return 'Assigned';
        case ComplaintStatus.IN_PROGRESS:
            return 'In Progress';
        case ComplaintStatus.RESOLVED:
            return 'Resolved';
        case ComplaintStatus.REOPEN:
            return 'Reopened';
        case ComplaintStatus.ESCALATED:
            return 'Escalated';
        case ComplaintStatus.DEFERRED:
            return 'Deferred';
        case ComplaintStatus.CLOSED:
            return 'Closed';
        default:
            return status;
    }
}