'use client';

import { useState, useEffect } from 'react';
import { ApiVersionSelector } from '@/components/ApiVersionSelector';
import { ApiVersion } from '@/lib/api/versioning';

// Swagger UI component (loaded dynamically)
let SwaggerUI: any = null;

export default function DocsPage() {
  const [apiVersion, setApiVersion] = useState<ApiVersion>('v1');
  const [swaggerLoaded, setSwaggerLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Dynamically import Swagger UI to avoid SSR issues
    import('swagger-ui-react')
      .then((module) => {
        SwaggerUI = module.default;
        setSwaggerLoaded(true);
      })
      .catch((err) => {
        console.error('Failed to load Swagger UI:', err);
        setError('Failed to load documentation viewer');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const getApiDocsUrl = (version: ApiVersion) => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/api/docs?version=${version}&format=json`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API documentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Documentation Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">API Documentation</h1>
              <p className="text-sm text-gray-600 mt-1">
                Scout Dashboard v5.0 - Interactive API Documentation
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/api/docs?format=json"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                View Raw JSON
              </a>
              <a
                href="/api/docs?format=yaml"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Download YAML
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Version Selector */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <ApiVersionSelector
          onVersionChange={setApiVersion}
          className="mb-6"
        />
      </div>

      {/* API Documentation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-lg shadow-sm">
          {swaggerLoaded && SwaggerUI ? (
            <SwaggerUI
              url={getApiDocsUrl(apiVersion)}
              docExpansion="list"
              defaultModelsExpandDepth={2}
              defaultModelExpandDepth={2}
              displayOperationId={false}
              displayRequestDuration={true}
              filter={true}
              showExtensions={true}
              showCommonExtensions={true}
              tryItOutEnabled={true}
              requestInterceptor={(request: any) => {
                // Add authorization header if available
                const token = localStorage.getItem('authToken');
                if (token) {
                  request.headers.Authorization = `Bearer ${token}`;
                }
                return request;
              }}
              responseInterceptor={(response: any) => {
                // Log API responses for debugging
                console.log('API Response:', response);
                return response;
              }}
              onComplete={(system: any) => {
                console.log('Swagger UI loaded:', system);
              }}
              plugins={[
                {
                  statePlugins: {
                    auth: {
                      wrapActions: {
                        authorize: (oriAction: any) => (payload: any) => {
                          // Custom authorization logic
                          const result = oriAction(payload);
                          console.log('Authorization updated:', payload);
                          return result;
                        },
                      },
                    },
                  },
                },
              ]}
              presets={[
                // You can add custom presets here
              ]}
            />
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 text-lg mb-4">📚</div>
              <p className="text-gray-600">API documentation viewer not available</p>
              <p className="text-sm text-gray-500 mt-2">
                Please visit{' '}
                <a
                  href="/api/docs"
                  className="text-blue-600 hover:text-blue-800"
                >
                  /api/docs
                </a>{' '}
                for raw OpenAPI specification
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div>
              <span>API Version: {apiVersion}</span>
              <span className="mx-2">•</span>
              <span>Generated from Zod schemas</span>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/swagger-api/swagger-ui"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                Powered by Swagger UI
              </a>
              <a
                href="https://spec.openapis.org/oas/v3.0.3"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700"
              >
                OpenAPI 3.0.3
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}