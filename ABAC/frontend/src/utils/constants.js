// Centralized constants — add new departments/roles here, reflects everywhere
export const DEPARTMENTS = [
    'engineering', 'data', 'security', 'sales', 'hr', 'finance', 'general',
    'cardiology', 'neurology', 'oncology', 'pediatrics', 'radiology',
    'banking', 'support', 'operations', 'legal', 'marketing'
];

export const LOCATIONS = [
    'india', 'usa', 'uk', 'germany', 'singapore', 'australia', 'uae', 'global'
];

// Base roles — user can type any custom role too
export const ROLES = ['viewer', 'analyst', 'developer', 'manager', 'admin', 'doctor', 'nurse', 'seller', 'auditor', 'support'];

export const cap = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
