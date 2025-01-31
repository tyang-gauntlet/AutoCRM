import { Client } from 'langsmith'

// Initialize LangSmith client
export const langsmith = new Client({
    apiUrl: process.env.LANGSMITH_API_URL,
    apiKey: process.env.LANGSMITH_API_KEY,
})

// Configure tracing environment variables
export const TRACING_CONFIG = {
    enabled: process.env.LANGCHAIN_TRACING_V2 === 'true',
    projectName: process.env.LANGSMITH_PROJECT || 'autocrm',
    backgroundCallbacks: process.env.LANGCHAIN_CALLBACKS_BACKGROUND === 'true',
    // Set to false in serverless environments to ensure tracing completes
    isServerless: process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined,
}

// Helper to get trace name for different operations
export const getTraceName = (operation: string) => `AutoCRM - ${operation}` 