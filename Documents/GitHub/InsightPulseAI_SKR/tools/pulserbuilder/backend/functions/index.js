const functions = require('firebase-functions');
const admin = require('firebase-admin');
const axios = require('axios');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Configuration for the agents API
const AGENT_API_URL = process.env.AGENT_API_URL || 'https://pulserbuilder-agents.firebaseapp.com/api';
const AGENT_API_KEY = process.env.AGENT_API_KEY;

/**
 * Validate user authentication for all agent requests
 */
const validateAuth = async (context) => {
  // Check if auth context exists
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  return context.auth.uid;
};

/**
 * Generate a complete UI from a text prompt
 */
exports.generateUI = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { prompt, options = {} } = data;
    
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with a valid prompt.'
      );
    }
    
    // Call Maya agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/maya/wireframe`,
      {
        prompt,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating UI:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});

/**
 * Generate a single component from a text prompt
 */
exports.generateComponent = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { prompt, options = {} } = data;
    
    // Validate input
    if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with a valid prompt.'
      );
    }
    
    // Call Maya agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/maya/component`,
      {
        prompt,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating component:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});

/**
 * Improve existing UI with suggestions
 */
exports.improveUI = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { components, prompt, options = {} } = data;
    
    // Validate input
    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with valid components array.'
      );
    }
    
    // Call Maya agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/maya/improve`,
      {
        components,
        prompt,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error improving UI:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});

/**
 * Generate code from components
 */
exports.generateCode = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { components, options = {} } = data;
    
    // Validate input
    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with valid components array.'
      );
    }
    
    // Call Basher agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/basher/generate-code`,
      {
        components,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating code:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});

/**
 * Analyze design and provide feedback
 */
exports.analyzeDesign = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { components, options = {} } = data;
    
    // Validate input
    if (!components || !Array.isArray(components) || components.length === 0) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with valid components array.'
      );
    }
    
    // Call Maya agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/maya/review`,
      {
        components,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error analyzing design:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});

/**
 * Generate presentation or documentation
 */
exports.generatePresentation = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { content, type = 'presentation', options = {} } = data;
    
    // Validate input
    if (!content || typeof content !== 'string' || content.trim() === '') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with valid content.'
      );
    }
    
    const endpoint = type === 'documentation' 
      ? 'documentation'
      : 'presentation';
    
    // Call DeckGen agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/deckgen/${endpoint}`,
      {
        content,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error generating presentation:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});

/**
 * Deploy project to hosting
 */
exports.deployProject = functions.https.onCall(async (data, context) => {
  try {
    const uid = await validateAuth(context);
    
    const { projectId, options = {} } = data;
    
    // Validate input
    if (!projectId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'The function must be called with a valid projectId.'
      );
    }
    
    // Get project from Firestore
    const projectDoc = await admin.firestore().collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Project not found.'
      );
    }
    
    const project = projectDoc.data();
    
    // Verify ownership or collaboration rights
    if (project.userId !== uid && 
       (!project.collaborators || !project.collaborators.includes(uid))) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to deploy this project.'
      );
    }
    
    // Call Basher agent through the API
    const response = await axios.post(
      `${AGENT_API_URL}/agents/basher/deploy`,
      {
        project,
        userId: uid,
        options
      },
      {
        headers: {
          'Authorization': `Bearer ${AGENT_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Update project with deployment information
    await admin.firestore().collection('projects').doc(projectId).update({
      deployments: admin.firestore.FieldValue.arrayUnion({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        url: response.data.deploymentUrl,
        status: 'success',
        platform: options.platform || 'vercel',
        version: project.version || '1.0.0'
      })
    });
    
    return response.data;
  } catch (error) {
    console.error('Error deploying project:', error);
    
    // Handle specific errors
    if (error.response) {
      throw new functions.https.HttpsError(
        'internal',
        error.response.data.message || 'Error communicating with agent API',
        { status: error.response.status }
      );
    }
    
    throw new functions.https.HttpsError(
      'internal',
      error.message || 'Unknown error occurred'
    );
  }
});