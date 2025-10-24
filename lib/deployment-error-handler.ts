// Enhanced error handling utility for deployment issues
export class DeploymentError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public details?: any,
    public endpoint?: string
  ) {
    super(message)
    this.name = 'DeploymentError'
  }
}

export async function handleApiResponse<T>(
  response: Response,
  endpoint?: string
): Promise<T> {
  const responseText = await response.text()
  
  // Check if response is HTML (common in deployment errors)
  if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
    throw new DeploymentError(
      'Server returned HTML instead of JSON. This usually indicates a routing or authentication issue.',
      response.status,
      {
        responseType: 'html',
        responsePreview: responseText.substring(0, 500),
        possibleCauses: [
          'API route not found (404 page served)',
          'Authentication middleware blocking request',
          'Server-side error causing error page to be served',
          'Incorrect API endpoint URL'
        ]
      },
      endpoint
    )
  }

  // Try to parse JSON
  let data: any
  try {
    data = JSON.parse(responseText)
  } catch (parseError) {
    throw new DeploymentError(
      `Failed to parse response as JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parse error'}`,
      response.status,
      {
        responseType: 'invalid-json',
        responseText: responseText.substring(0, 1000),
        parseError: parseError instanceof Error ? parseError.message : 'Unknown error'
      },
      endpoint
    )
  }

  // Handle HTTP errors
  if (!response.ok) {
    throw new DeploymentError(
      data?.message || data?.error || `HTTP ${response.status} error`,
      response.status,
      {
        ...data,
        httpStatus: response.status,
        httpStatusText: response.statusText
      },
      endpoint
    )
  }

  return data as T
}

export async function makeApiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    console.log('Making API request:', {
      endpoint,
      method: options.method || 'GET',
      hasBody: !!options.body,
      headers: options.headers
    })

    const response = await fetch(endpoint, {
      ...options,
      headers: {
        ...options.headers,
        // Ensure we always request JSON
        'Accept': 'application/json',
      }
    })

    return await handleApiResponse<T>(response, endpoint)
  } catch (error) {
    if (error instanceof DeploymentError) {
      throw error
    }

    // Network or other fetch errors
    throw new DeploymentError(
      `Network error: ${error instanceof Error ? error.message : 'Unknown network error'}`,
      0,
      {
        errorType: 'network',
        originalError: error instanceof Error ? error.message : 'Unknown error'
      },
      endpoint
    )
  }
}

export function logDeploymentError(error: DeploymentError) {
  console.group('🚨 Deployment Error Details')
  console.error('Message:', error.message)
  console.error('Endpoint:', error.endpoint)
  console.error('Status Code:', error.statusCode)
  console.error('Details:', error.details)
  console.error('Stack:', error.stack)
  console.groupEnd()

  // Send error to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // You can integrate with services like Sentry, LogRocket, etc.
    console.error('Production error logged:', {
      message: error.message,
      endpoint: error.endpoint,
      statusCode: error.statusCode,
      timestamp: new Date().toISOString()
    })
  }
}
