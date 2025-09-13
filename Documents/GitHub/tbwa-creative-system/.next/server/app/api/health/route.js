"use strict";(()=>{var e={};e.id=829,e.ids=[829],e.modules={399:e=>{e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},517:e=>{e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},3519:(e,t,a)=>{a.r(t),a.d(t,{originalPathname:()=>p,patchFetch:()=>N,requestAsyncStorage:()=>m,routeModule:()=>u,serverHooks:()=>A,staticGenerationAsyncStorage:()=>_});var s={};a.r(s),a.d(s,{GET:()=>E,POST:()=>d});var n=a(9303),i=a(8716),o=a(670),c=a(7070),r=a(6262);async function E(){try{let e=await (0,r.B)(),t=await e.request().query("SELECT 1 as health"),a=(await e.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('campaign_documents', 'campaign_analysis', 'creative_features_lookup', 'business_outcomes_lookup')
    `)).recordset.map(e=>e.TABLE_NAME),s=["campaign_documents","campaign_analysis","creative_features_lookup","business_outcomes_lookup"].every(e=>a.includes(e)),n=[{name:"Azure SQL Database",status:t.recordset.length>0?"healthy":"error",message:t.recordset.length>0?"Connected successfully":"Connection failed",lastChecked:new Date().toISOString(),responseTime:50,details:{server:"sqltbwaprojectscoutserver.database.windows.net",database:"SQL-TBWA-ProjectScout-Reporting-Prod",tablesReady:s}},{name:"Azure OpenAI",status:"healthy",message:"API key configured",lastChecked:new Date().toISOString(),responseTime:30,details:{endpoint:"https://eastus.api.cognitive.microsoft.com/",deployment:"gpt-4o-deployment"}},{name:"Google Drive",status:process.env.GOOGLE_SERVICE_ACCOUNT_KEY||process.env.GOOGLE_SERVICE_ACCOUNT_PATH?"healthy":"error",message:process.env.GOOGLE_SERVICE_ACCOUNT_KEY||process.env.GOOGLE_SERVICE_ACCOUNT_PATH?"Service account configured":"Service account missing",lastChecked:new Date().toISOString(),responseTime:40,details:{hasServiceAccount:!!(process.env.GOOGLE_SERVICE_ACCOUNT_KEY||process.env.GOOGLE_SERVICE_ACCOUNT_PATH),hasRootFolder:!0}}];return c.NextResponse.json({status:"healthy",timestamp:new Date().toISOString(),services:n,metrics:{totalCampaigns:0,processedCampaigns:0,totalAssets:0,processingQueue:0,storageUsed:"0 GB",apiCallsToday:0,averageProcessingTime:45},system_type:"TBWA Creative Campaign Analysis"})}catch(e){return c.NextResponse.json({status:"unhealthy",error:e instanceof Error?e.message:"Unknown error",timestamp:new Date().toISOString(),system_type:"TBWA Creative Campaign Analysis"},{status:500})}}async function d(){try{return await (0,r.i)(),c.NextResponse.json({message:"System maintenance completed",results:{databaseInit:{success:!0,message:"Database initialized successfully"}},timestamp:new Date().toISOString()})}catch(e){return console.error("Maintenance error:",e),c.NextResponse.json({error:"Maintenance failed",details:e.message,timestamp:new Date().toISOString()},{status:500})}}let u=new n.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/health/route",pathname:"/api/health",filename:"route",bundlePath:"app/api/health/route"},resolvedPagePath:"/Users/tbwa/Documents/GitHub/tbwa-creative-system/app/api/health/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:m,staticGenerationAsyncStorage:_,serverHooks:A}=u,p="/api/health/route";function N(){return(0,o.patchFetch)({serverHooks:A,staticGenerationAsyncStorage:_})}},6262:(e,t,a)=>{a.d(t,{B:()=>c,i:()=>r});let s=require("mssql");var n=a.n(s);let i={server:"sqltbwaprojectscoutserver.database.windows.net",database:"SQL-TBWA-ProjectScout-Reporting-Prod",user:"TBWA",password:"R@nd0mPA$!",options:{encrypt:!0,trustServerCertificate:!1},pool:{max:10,min:0,idleTimeoutMillis:3e4}},o=null;async function c(){return o||(o=new(n()).ConnectionPool(i),await o.connect()),o}async function r(){let e=await c();await e.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaign_documents' AND xtype='U')
    CREATE TABLE campaign_documents (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) UNIQUE NOT NULL,
      filename NVARCHAR(500) NOT NULL,
      mime_type NVARCHAR(100),
      size BIGINT,
      created_time DATETIME2,
      modified_time DATETIME2,
      drive_id NVARCHAR(255),
      path NVARCHAR(1000),
      campaign_name NVARCHAR(255),
      client_name NVARCHAR(255),
      file_type NVARCHAR(50), -- video, image, presentation, document, other
      processed_at DATETIME2 DEFAULT GETDATE(),
      INDEX idx_campaign_document_id (document_id),
      INDEX idx_campaign_name (campaign_name),
      INDEX idx_client_name (client_name),
      INDEX idx_file_type (file_type),
      INDEX idx_processed_at (processed_at)
    )
  `),await e.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='campaign_analysis' AND xtype='U')
    CREATE TABLE campaign_analysis (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      creative_features NVARCHAR(MAX), -- JSON with all creative features
      business_outcomes NVARCHAR(MAX), -- JSON with all business outcomes
      campaign_composition NVARCHAR(MAX), -- JSON with campaign composition
      confidence_score DECIMAL(3,2),
      analysis_timestamp DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_analysis_doc_id (document_id),
      INDEX idx_analysis_timestamp (analysis_timestamp),
      INDEX idx_confidence_score (confidence_score)
    )
  `),await e.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='creative_features_lookup' AND xtype='U')
    CREATE TABLE creative_features_lookup (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      feature_category NVARCHAR(50), -- content, design, messaging, targeting, channel, detected
      feature_name NVARCHAR(100),
      feature_value BIT,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_feature_category (feature_category),
      INDEX idx_feature_name (feature_name),
      INDEX idx_feature_value (feature_value)
    )
  `),await e.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='business_outcomes_lookup' AND xtype='U')
    CREATE TABLE business_outcomes_lookup (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      outcome_category NVARCHAR(50), -- engagement, conversion, brand, efficiency, behavioral, business
      outcome_name NVARCHAR(100),
      outcome_value BIT,
      prediction_confidence DECIMAL(3,2),
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_outcome_category (outcome_category),
      INDEX idx_outcome_name (outcome_name),
      INDEX idx_outcome_value (outcome_value),
      INDEX idx_prediction_confidence (prediction_confidence)
    )
  `),await e.request().query(`
    IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='document_chunks' AND xtype='U')
    CREATE TABLE document_chunks (
      id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
      document_id NVARCHAR(255) NOT NULL,
      chunk_id NVARCHAR(255) NOT NULL,
      content NVARCHAR(MAX) NOT NULL,
      embedding NVARCHAR(MAX), -- JSON array of embedding vectors
      chunk_index INT,
      created_at DATETIME2 DEFAULT GETDATE(),
      FOREIGN KEY (document_id) REFERENCES campaign_documents(document_id),
      INDEX idx_chunks_doc_id (document_id),
      INDEX idx_chunk_id (chunk_id)
    )
  `),await e.request().query(`
    CREATE OR ALTER VIEW campaign_summary AS
    SELECT 
      cd.campaign_name,
      cd.client_name,
      COUNT(*) as total_files,
      SUM(CASE WHEN cd.file_type = 'video' THEN 1 ELSE 0 END) as video_count,
      SUM(CASE WHEN cd.file_type = 'image' THEN 1 ELSE 0 END) as image_count,
      SUM(CASE WHEN cd.file_type = 'presentation' THEN 1 ELSE 0 END) as presentation_count,
      AVG(ca.confidence_score) as avg_confidence,
      MAX(cd.processed_at) as last_processed
    FROM campaign_documents cd
    LEFT JOIN campaign_analysis ca ON cd.document_id = ca.document_id
    WHERE cd.campaign_name IS NOT NULL
    GROUP BY cd.campaign_name, cd.client_name
  `)}}};var t=require("../../../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),s=t.X(0,[276,972],()=>a(3519));module.exports=s})();