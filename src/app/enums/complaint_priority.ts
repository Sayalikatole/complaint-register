/**
 * Enum for complaint priorities
 */
export enum ComplaintPriority {
    LOW = 'LOW',
    MEDIUM = 'MEDIUM',
    HIGH = 'HIGH'
}

/**
 * Get display name for priority
 * @param priority The priority enum value
 * @returns A user-friendly display name
 */
export function getPriorityDisplayName(priority: string): string {
    switch (priority) {
        case ComplaintPriority.LOW:
            return 'Low';
        case ComplaintPriority.MEDIUM:
            return 'Medium';
        case ComplaintPriority.HIGH:
            return 'High';
        default:
            return priority;
    }
}



