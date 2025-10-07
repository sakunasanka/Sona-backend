import * as yup from 'yup';
import { ValidationError } from '../utils/errors';

export const createUserSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),

    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .matches(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!#%*?&]{8,}$/,
            'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        )
        .required('Password is required'),
    
    name: yup
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(50, 'Name cannot exceed 50 characters')
        .required('Name is required'),

    userType: yup
        .string()
        .oneOf(['Client', 'Counselor', 'Admin'], 'User type must be either Client or Counselor')
        .required('User type is required'),
    
    avatar: yup
        .string()
        .url('Avatar must be a valid URL')
        .optional()
})

export const signInSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),

    password: yup
        .string()
        .min(8, 'Password must be at least 8 characters')
        .required('Password is required'),
})

// Psychiatrist validation schemas
export const bookPsychiatristSessionSchema = yup.object({
    psychiatristId: yup
        .number()
        .integer('Psychiatrist ID must be an integer')
        .positive('Psychiatrist ID must be positive')
        .required('Psychiatrist ID is required'),
    
    date: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .required('Date is required'),
    
    timeSlot: yup
        .string()
        .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time slot must be in HH:MM format')
        .required('Time slot is required'),
    
    duration: yup
        .number()
        .integer('Duration must be an integer')
        .positive('Duration must be positive')
        .min(15, 'Duration must be at least 15 minutes')
        .max(240, 'Duration cannot exceed 240 minutes')
        .required('Duration is required'),
    
    price: yup
        .number()
        .positive('Price must be positive')
        .required('Price is required'),
    
    concerns: yup
        .string()
        .max(1000, 'Concerns cannot exceed 1000 characters')
        .optional()
});

export const psychiatristAvailabilitySchema = yup.object({
    date: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
        .required('Date is required'),
    
    isAvailable: yup
        .boolean()
        .required('Availability status is required')
});

export const createPsychiatristSchema = yup.object({
    firebaseId: yup
        .string()
        .required('Firebase ID is required'),
    
    name: yup
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .required('Name is required'),
    
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),
    
    avatar: yup
        .string()
        .url('Avatar must be a valid URL')
        .optional(),
    
    title: yup
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title cannot exceed 100 characters')
        .required('Title is required'),
    
    specialties: yup
        .array()
        .of(yup.string().min(2, 'Each specialty must be at least 2 characters'))
        .min(1, 'At least one specialty is required')
        .required('Specialties are required'),
    
    address: yup
        .string()
        .min(10, 'Address must be at least 10 characters')
        .max(200, 'Address cannot exceed 200 characters')
        .required('Address is required'),
    
    contact_no: yup
        .string()
        .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
        .required('Contact number is required'),
    
    license_no: yup
        .string()
        .min(5, 'License number must be at least 5 characters')
        .max(50, 'License number cannot exceed 50 characters')
        .required('License number is required'),
    
    idCard: yup
        .string()
        .min(5, 'ID card must be at least 5 characters')
        .max(50, 'ID card cannot exceed 50 characters')
        .required('ID card is required'),
    
    description: yup
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    
    sessionFee: yup
        .number()
        .positive('Session fee must be positive')
        .optional(),
    
    languages: yup
        .array()
        .of(yup.string().min(2, 'Each language must be at least 2 characters'))
        .optional(),
    
    qualifications: yup
        .array()
        .of(yup.string().min(2, 'Each qualification must be at least 2 characters'))
        .optional(),
    
    consultationTypes: yup
        .array()
        .of(yup.string().oneOf(['In-person', 'Video', 'Phone', 'Emergency'], 'Invalid consultation type'))
        .optional(),
    
    experience: yup
        .string()
        .max(100, 'Experience cannot exceed 100 characters')
        .optional(),
    
    coverImage: yup
        .string()
        .url('Cover image must be a valid URL')
        .optional(),
    
    instagram: yup
        .string()
        .max(255, 'Instagram handle cannot exceed 255 characters')
        .matches(/^@?[a-zA-Z0-9_.]+$/, 'Instagram handle can only contain letters, numbers, underscores, and periods')
        .optional(),
    
    linkedin: yup
        .string()
        .max(255, 'LinkedIn profile cannot exceed 255 characters')
        .url('LinkedIn must be a valid URL')
        .optional(),
    
    x: yup
        .string()
        .max(255, 'X (Twitter) handle cannot exceed 255 characters')
        .matches(/^@?[a-zA-Z0-9_]+$/, 'X handle can only contain letters, numbers, and underscores')
        .optional(),
    
    website: yup
        .string()
        .max(255, 'Website URL cannot exceed 255 characters')
        .url('Website must be a valid URL')
        .optional()
});

export const createCounselorSchema = yup.object({
    firebaseId: yup
        .string()
        .required('Firebase ID is required'),
    
    name: yup
        .string()
        .min(3, 'Name must be at least 3 characters')
        .max(100, 'Name cannot exceed 100 characters')
        .required('Name is required'),
    
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),
    
    avatar: yup
        .string()
        .url('Avatar must be a valid URL')
        .optional(),
    
    title: yup
        .string()
        .min(2, 'Title must be at least 2 characters')
        .max(100, 'Title cannot exceed 100 characters')
        .required('Title is required'),
    
    specialities: yup
        .array()
        .of(yup.string().min(2, 'Each speciality must be at least 2 characters'))
        .min(1, 'At least one speciality is required')
        .required('Specialities are required'),
    
    address: yup
        .string()
        .min(10, 'Address must be at least 10 characters')
        .max(200, 'Address cannot exceed 200 characters')
        .required('Address is required'),
    
    contact_no: yup
        .string()
        .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
        .required('Contact number is required'),
    
    license_no: yup
        .string()
        .min(5, 'License number must be at least 5 characters')
        .max(50, 'License number cannot exceed 50 characters')
        .required('License number is required'),
    
    idCard: yup
        .string()
        .min(5, 'ID card must be at least 5 characters')
        .max(50, 'ID card cannot exceed 50 characters')
        .required('ID card is required'),
    
    description: yup
        .string()
        .max(1000, 'Description cannot exceed 1000 characters')
        .optional(),
    
    sessionFee: yup
        .number()
        .positive('Session fee must be positive')
        .optional(),
    
    isVolunteer: yup
        .boolean()
        .optional(),
    
    coverImage: yup
        .string()
        .url('Cover image must be a valid URL')
        .optional(),
    
    instagram: yup
        .string()
        .max(255, 'Instagram handle cannot exceed 255 characters')
        .matches(/^@?[a-zA-Z0-9_.]+$/, 'Instagram handle can only contain letters, numbers, underscores, and periods')
        .optional(),
    
    linkedin: yup
        .string()
        .max(255, 'LinkedIn profile cannot exceed 255 characters')
        .url('LinkedIn must be a valid URL')
        .optional(),
    
    x: yup
        .string()
        .max(255, 'X (Twitter) handle cannot exceed 255 characters')
        .matches(/^@?[a-zA-Z0-9_]+$/, 'X handle can only contain letters, numbers, and underscores')
        .optional(),
    
    website: yup
        .string()
        .max(255, 'Website URL cannot exceed 255 characters')
        .url('Website must be a valid URL')
        .optional(),
    
    languages: yup
        .array()
        .of(yup.string().min(2, 'Each language must be at least 2 characters'))
        .min(1, 'At least one language is required')
        .max(10, 'Cannot specify more than 10 languages')
        .optional()
});

export const updateCounselorProfileSchema = yup.object({
    firstName: yup
        .string()
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name cannot exceed 50 characters')
        .optional(),
    
    lastName: yup
        .string()
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name cannot exceed 50 characters')
        .optional(),
    
    email: yup
        .string()
        .email('Invalid email format')
        .optional(),
    
    profileImage: yup
        .string()
        .test('valid-url-or-empty', 'Profile image must be a valid URL or empty', function(value) {
            if (!value || value.trim() === '') return true; // Allow empty strings
            try {
                new URL(value);
                return true;
            } catch {
                return false;
            }
        })
        .optional(),
    
    coverImage: yup
        .string()
        .url('Cover image must be a valid URL')
        .optional(),
    
    bio: yup
        .string()
        .max(1000, 'Bio cannot exceed 1000 characters')
        .optional(),
    
    specializations: yup
        .array()
        .of(yup.string().min(2, 'Each specialization must be at least 2 characters'))
        .min(1, 'At least one specialization is required')
        .max(10, 'Cannot specify more than 10 specializations')
        .optional(),
    
    phone: yup
        .string()
        .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number format')
        .optional(),
    
    location: yup
        .string()
        .min(5, 'Location must be at least 5 characters')
        .max(200, 'Location cannot exceed 200 characters')
        .optional(),
    
    instagram: yup
        .string()
        .max(255, 'Instagram handle cannot exceed 255 characters')
        .matches(/^@?[a-zA-Z0-9_.]+$/, 'Instagram handle can only contain letters, numbers, underscores, and periods')
        .optional(),
    
    linkedin: yup
        .string()
        .max(255, 'LinkedIn profile cannot exceed 255 characters')
        .url('LinkedIn must be a valid URL')
        .optional(),
    
    x: yup
        .string()
        .max(255, 'X (Twitter) handle cannot exceed 255 characters')
        .matches(/^@?[a-zA-Z0-9_]+$/, 'X handle can only contain letters, numbers, and underscores')
        .optional(),
    
    website: yup
        .string()
        .max(255, 'Website URL cannot exceed 255 characters')
        .url('Website must be a valid URL')
        .optional(),
    
    languages: yup
        .array()
        .of(yup.string().min(2, 'Each language must be at least 2 characters'))
        .min(1, 'At least one language is required')
        .max(10, 'Cannot specify more than 10 languages')
        .optional()
});

export const emailSchema = yup.object({
    email: yup
        .string()
        .email('Invalid email format')
        .required('Email is required'),
})

export const updateProfileSchema = yup.object({
    name: yup
        .string()
        .min(2, 'Name must be at least 2 characters long')
        .max(50, 'Name cannot exceed 50 characters')
        .optional(),

    avatar: yup
        .string()
        .url('Avatar must be a valid URL')
        .optional()
})

// PHQ-9 Response Schema
export const phq9ResponseSchema = yup.object({
    questionIndex: yup
        .number()
        .integer('Question index must be an integer')
        .min(0, 'Question index must be between 0 and 8')
        .max(8, 'Question index must be between 0 and 8')
        .required('Question index is required'),
    
    answer: yup
        .number()
        .integer('Answer must be an integer')
        .min(0, 'Answer must be between 0 and 3 (0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day)')
        .max(3, 'Answer must be between 0 and 3 (0=Not at all, 1=Several days, 2=More than half the days, 3=Nearly every day)')
        .required('Answer is required')
});

// PHQ-9 Submission Schema (simplified - only validate client input)
export const phq9SubmissionSchema = yup.object({
    responses: yup
        .array(phq9ResponseSchema)
        .length(9, 'PHQ-9 questionnaire must have exactly 9 responses')
        .required('Responses are required')
        .test('unique-questions', 'Each question must be answered exactly once', function(responses) {
            if (!responses) return false;
            const indices = responses.map(r => r.questionIndex);
            const uniqueIndices = new Set(indices);
            const expectedIndices = new Set([0, 1, 2, 3, 4, 5, 6, 7, 8]);
            
            // Check if we have exactly 9 unique indices and they match expected
            return uniqueIndices.size === 9 && 
                   [...uniqueIndices].every(index => expectedIndices.has(index));
        }),
    
    impact: yup
        .string()
        .max(100, 'Impact description cannot exceed 100 characters')
        .optional()
});

// Full PHQ-9 Schema (for internal validation after calculation)
export const phq9FullSchema = yup.object({
    responses: yup
        .array(phq9ResponseSchema)
        .length(9, 'PHQ-9 questionnaire must have exactly 9 responses')
        .required('Responses are required'),
    
    totalScore: yup
        .number()
        .integer('Total score must be an integer')
        .min(0, 'Total score must be between 0 and 27')
        .max(27, 'Total score must be between 0 and 27')
        .required('Total score is required'),
    
    severity: yup
        .string()
        .oneOf(['Minimal or none', 'Mild', 'Moderate', 'Moderately severe', 'Severe'], 'Invalid severity level')
        .required('Severity is required'),
    
    impact: yup
        .string()
        .max(100, 'Impact description cannot exceed 100 characters')
        .optional(),
    
    hasItem9Positive: yup
        .boolean()
        .required('hasItem9Positive flag is required'),
    
    completedAt: yup
        .date()
        .required('Completion date is required')
        .max(new Date(), 'Completion date cannot be in the future')
});

// Helper function for severity calculation
function getSeverityFromScore(score: number): string {
    if (score >= 0 && score <= 4) return 'Minimal or none';
    if (score >= 5 && score <= 9) return 'Mild';
    if (score >= 10 && score <= 14) return 'Moderate';
    if (score >= 15 && score <= 19) return 'Moderately severe';
    if (score >= 20 && score <= 27) return 'Severe';
    throw new Error('Invalid PHQ-9 score');
}

// Analytics Query Schema
export const phq9AnalyticsSchema = yup.object({
    startDate: yup
        .date()
        .optional(),
    
    endDate: yup
        .date()
        .optional()
        .when('startDate', (startDate, schema) => {
            return startDate ? schema.min(startDate, 'End date must be after start date') : schema;
        }),
    
    severity: yup
        .string()
        .oneOf(['Minimal or none', 'Mild', 'Moderate', 'Moderately severe', 'Severe'])
        .optional(),
    
    hasItem9Positive: yup
        .boolean()
        .optional()
});

/**
 * Validates data against a Yup schema.
 * @param schema - The Yup schema to validate against.
 * @param data - The data to validate.
 * @returns A promise that resolves with the validated data.
 * @throws ValidationError if validation fails.
 */

export const validateData = async <T>(schema: yup.ObjectSchema<any>, data: any): Promise<T> => {
    try {
        return await schema.validate(data, { abortEarly: false });
    } catch (error) {
        if (error instanceof yup.ValidationError) {
            throw new ValidationError(error.errors.join(', '));
        }
        throw error; // Re-throw unexpected errors
    }
}

// Complaint validation schemas
export const createComplaintSchema = yup.object({
    additional_details: yup
        .string()
        .max(1000, 'Additional details cannot exceed 1000 characters')
        .optional(),

    session_id: yup
        .number()
        .integer('Session ID must be an integer')
        .positive('Session ID must be positive')
        .required('Session ID is required'),

    proof: yup
        .string()
        .url('Proof must be a valid URL')
        .optional(),

    reason: yup
        .string()
        .max(100, 'Reason cannot exceed 100 characters')
        .optional()
});

export const updateComplaintStatusSchema = yup.object({
    status: yup
        .string()
        .oneOf(['pending', 'resolved', 'rejected', 'in review'], 'Invalid status value')
        .required('Status is required'),

    reasonID: yup
        .number()
        .integer('Reason ID must be an integer')
        .positive('Reason ID must be positive')
        .optional()
});

export const updateCounselorVolunteerSchema = yup.object({
    isVolunteer: yup
        .boolean()
        .required('isVolunteer status is required'),

    sessionFee: yup
        .number()
        .min(0, 'Session fee cannot be negative')
        .max(10000, 'Session fee cannot exceed 10,000')
        .required('Session fee is required')
});