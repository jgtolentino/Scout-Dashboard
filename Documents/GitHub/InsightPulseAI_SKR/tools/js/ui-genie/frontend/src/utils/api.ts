import axios from 'axios';

// Use explicit URL with no protocol-relative issues
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface GenerateUIResponse {
  ui_code: string;
}

export const generateUI = async (prompt: string): Promise<GenerateUIResponse> => {
  try {
    console.log('Sending prompt to backend:', prompt);
    console.log('Endpoint URL:', `${API_BASE_URL}/generate-ui`);
    
    const response = await api.post<GenerateUIResponse>('/generate-ui', {
      text: prompt,
    });
    
    console.log('Response from backend:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating UI:', error);
    // Return fallback UI instead of throwing
    return {
      ui_code: `<div class="p-4 bg-red-100 text-red-700 rounded-lg">
        <p>Error connecting to backend server: ${error instanceof Error ? error.message : 'Unknown error'}</p>
        <p>Please check that the backend is running at ${API_BASE_URL}</p>
      </div>`
    };
  }
};

export default api;