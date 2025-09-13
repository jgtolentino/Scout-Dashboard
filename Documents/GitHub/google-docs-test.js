#!/usr/bin/env node

/**
 * Google Docs API Test & Integration
 * 
 * Quick test to verify Google Docs API access and create documents
 * for the TBWA Retail Dashboard project documentation.
 */

const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDocsIntegration {
  constructor(credentialsPath) {
    this.credentialsPath = credentialsPath;
    this.auth = null;
    this.docs = null;
    this.drive = null;
  }

  async authenticate() {
    try {
      // Load service account credentials
      const credentials = JSON.parse(fs.readFileSync(this.credentialsPath, 'utf8'));
      
      this.auth = new google.auth.GoogleAuth({
        credentials,
        scopes: [
          'https://www.googleapis.com/auth/documents',
          'https://www.googleapis.com/auth/drive',
          'https://www.googleapis.com/auth/drive.file'
        ]
      });

      const authClient = await this.auth.getClient();
      
      this.docs = google.docs({ version: 'v1', auth: authClient });
      this.drive = google.drive({ version: 'v3', auth: authClient });
      
      console.log('✅ Google Docs API authenticated successfully');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      return false;
    }
  }

  async testConnection() {
    console.log('🔌 Testing Google Docs API connection...\n');
    
    try {
      // Test by creating a simple document
      const testDoc = await this.docs.documents.create({
        resource: {
          title: 'API Connection Test - TBWA Retail Dashboard'
        }
      });
      
      console.log('✅ Test document created successfully!');
      console.log(`   Document ID: ${testDoc.data.documentId}`);
      console.log(`   Title: ${testDoc.data.title}`);
      
      // Add some content to verify write access
      await this.docs.documents.batchUpdate({
        documentId: testDoc.data.documentId,
        resource: {
          requests: [
            {
              insertText: {
                location: { index: 1 },
                text: `TBWA Retail Dashboard API Test\n\nConnection successful at: ${new Date().toISOString()}\n\nThis document was created automatically to test Google Docs API integration for the retail dashboard project.`
              }
            }
          ]
        }
      });
      
      console.log('✅ Content added to test document');
      
      // Get shareable link
      const file = await this.drive.files.get({
        fileId: testDoc.data.documentId,
        fields: 'webViewLink'
      });
      
      console.log(`   View: ${file.data.webViewLink}\n`);
      
      return { success: true, documentId: testDoc.data.documentId, link: file.data.webViewLink };
    } catch (error) {
      console.error('❌ Connection test failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async createProjectDocumentation() {
    console.log('📝 Creating TBWA Retail Dashboard documentation...\n');
    
    try {
      // Create main project documentation
      const projectDoc = await this.docs.documents.create({
        resource: {
          title: 'TBWA Retail Analytics Dashboard - Project Documentation'
        }
      });
      
      const documentId = projectDoc.data.documentId;
      
      // Create comprehensive project documentation
      const content = this.generateProjectDocContent();
      
      await this.docs.documents.batchUpdate({
        documentId,
        resource: {
          requests: content
        }
      });
      
      // Make document shareable
      await this.drive.permissions.create({
        fileId: documentId,
        resource: {
          role: 'writer',
          type: 'anyone'
        }
      });
      
      const file = await this.drive.files.get({
        fileId: documentId,
        fields: 'webViewLink'
      });
      
      console.log('✅ Project documentation created!');
      console.log(`   Document: ${projectDoc.data.title}`);
      console.log(`   Link: ${file.data.webViewLink}\n`);
      
      return { documentId, link: file.data.webViewLink };
    } catch (error) {
      console.error('❌ Failed to create documentation:', error.message);
      throw error;
    }
  }

  generateProjectDocContent() {
    return [
      // Title and header
      {
        insertText: {
          location: { index: 1 },
          text: 'TBWA Retail Analytics Dashboard\nProject Documentation & Implementation Guide\n\n'
        }
      },
      
      // Format title
      {
        updateTextStyle: {
          range: { startIndex: 1, endIndex: 33 },
          textStyle: {
            fontSize: { magnitude: 24, unit: 'PT' },
            bold: true
          }
        }
      },
      
      // Project overview
      {
        insertText: {
          location: { index: 80 },
          text: `Project Overview\n\nThis document outlines the implementation of a comprehensive retail analytics dashboard for TBWA's brand portfolio in the Philippines market.\n\n`
        }
      },
      
      // Brand portfolio section
      {
        insertText: {
          location: { index: 200 },
          text: `Brand Portfolio\n\nThe dashboard covers the following TBWA brands:\n\n• Alaska Milk Corporation\n  - Alaska\n  - Alpine\n  - Cow Bell\n  - Krem-Top\n\n• Liwayway Holdings/Oishi\n  - Prawn Crackers\n  - Pillows\n  - Smart C+\n  - Ribbed\n\n• Peerless Products\n  - Champion\n  - Calla\n  - Pride\n  - Care Plus\n\n• Del Monte Philippines\n  - Del Monte\n  - S&W\n  - Today's\n  - Fit 'n Right\n\n• Japan Tobacco International\n  - Winston\n  - Camel\n  - Mevius\n  - LD\n  - Mighty\n\n`
        }
      },
      
      // Technical architecture
      {
        insertText: {
          location: { index: 600 },
          text: `Technical Architecture\n\nMedallion Architecture Implementation:\n\n🥉 Bronze Layer (Raw Data)\n• Transaction events\n• Customer interactions\n• Product catalog data\n• Geographic information\n\n🥈 Silver Layer (Cleaned & Processed)\n• Data quality validation\n• NLP processing for insights\n• Customer segmentation\n• Brand categorization\n\n🥇 Gold Layer (Analytics Ready)\n• Aggregated metrics\n• Performance indicators\n• Comparative analysis\n• Real-time dashboards\n\n`
        }
      },
      
      // Implementation checklist
      {
        insertText: {
          location: { index: 1000 },
          text: `Implementation Checklist\n\n□ Data Architecture Setup\n  □ Create bronze layer views\n  □ Implement silver transformations\n  □ Build gold analytics views\n  □ Set up automated refresh\n\n□ Frontend Development\n  □ Build responsive dashboard layout\n  □ Implement drill-down analytics\n  □ Create brand performance charts\n  □ Add geographic visualizations\n\n□ Backend Development\n  □ Create RPC functions\n  □ Implement data processing\n  □ Set up real-time updates\n  □ Build API endpoints\n\n□ Testing & Deployment\n  □ Unit testing\n  □ Integration testing\n  □ Performance testing\n  □ Production deployment\n\n`
        }
      },
      
      // Footer with timestamp
      {
        insertText: {
          location: { index: 1500 },
          text: `\n\nDocument created: ${new Date().toLocaleDateString()}\nLast updated: ${new Date().toISOString()}\nCreated via Google Docs API integration`
        }
      }
    ];
  }
}

// Usage example and test
async function main() {
  console.log('🎯 TBWA Retail Dashboard - Google Docs Integration\n');
  console.log('=' * 50 + '\n');
  
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './google-credentials.json';
  
  if (!fs.existsSync(credentialsPath)) {
    console.log('❌ Google credentials file not found!');
    console.log('\nSetup instructions:');
    console.log('1. Go to: https://console.cloud.google.com/');
    console.log('2. Create/select project');
    console.log('3. Enable Google Docs API and Google Drive API');
    console.log('4. Create Service Account credentials');
    console.log('5. Download JSON file and save as "google-credentials.json"');
    console.log('6. Or set GOOGLE_APPLICATION_CREDENTIALS environment variable');
    console.log('\nExample:');
    console.log('export GOOGLE_APPLICATION_CREDENTIALS="./path/to/credentials.json"');
    console.log('');
    process.exit(1);
  }
  
  const googleDocs = new GoogleDocsIntegration(credentialsPath);
  
  // Test authentication
  const authSuccess = await googleDocs.authenticate();
  if (!authSuccess) {
    console.log('❌ Cannot proceed without authentication');
    process.exit(1);
  }
  
  // Test connection
  const connectionResult = await googleDocs.testConnection();
  if (!connectionResult.success) {
    console.log('❌ Connection test failed');
    process.exit(1);
  }
  
  // Create project documentation
  try {
    const projectDoc = await googleDocs.createProjectDocumentation();
    
    console.log('🎉 Setup Complete!');
    console.log('\n📊 Your retail dashboard documentation is ready:');
    console.log(`   Link: ${projectDoc.link}`);
    console.log('\n🚀 Next steps:');
    console.log('   1. Review and customize the documentation');
    console.log('   2. Share with team members');
    console.log('   3. Use this as living documentation during development');
    console.log('   4. Update progress and findings as you implement');
    
  } catch (error) {
    console.error('❌ Documentation creation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly  
if (require.main === module) {
  main().catch(console.error);
}

module.exports = GoogleDocsIntegration;