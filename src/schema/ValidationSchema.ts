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
