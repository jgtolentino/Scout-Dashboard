export interface ChunkMetadata {
    chunk_id: string;
    file_id: string;
    filepath: string;
    title?: string;
    text_snippet: string;
    tags: string[];
    visual_quality_score: number;
    semantic_topics: string[];
    mood_label: string;
    embedding_vector?: number[];
    chunk_index: number;
    chunk_size: number;
    content_type: 'text' | 'image' | 'slide' | 'video';
    confidence_score: number;
    created_at?: Date;
    updated_at?: Date;
}
export interface FileMetadata {
    file_id: string;
    original_filename: string;
    filepath: string;
    file_size: number;
    mime_type: string;
    campaign_name?: string;
    client_name?: string;
    brand_name?: string;
    file_type: 'video' | 'image' | 'presentation' | 'document';
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    total_chunks: number;
    azure_blob_url?: string;
    google_drive_id?: string;
    created_at?: Date;
    processed_at?: Date;
    error_message?: string;
}
export interface CampaignInsights {
    campaign_id: string;
    campaign_name: string;
    client_name?: string;
    total_files: number;
    total_chunks: number;
    avg_quality_score: number;
    dominant_mood: string;
    key_topics: string[];
    effectiveness_prediction: number;
    creative_features?: Record<string, any>;
    business_outcomes?: Record<string, any>;
    award_submissions?: string[];
    created_at?: Date;
    updated_at?: Date;
}
export interface SemanticIndex {
    search_id: string;
    chunk_id: string;
    search_terms: string;
    topic_clusters: string[];
    similarity_hash: string;
    search_rank: number;
    relevance_score: number;
    created_at?: Date;
}
export interface QualityMetrics {
    metric_id: string;
    chunk_id: string;
    content_clarity: number;
    visual_appeal: number;
    message_strength: number;
    brand_consistency: number;
    emotional_impact: number;
    technical_quality: number;
    overall_score: number;
    classification_model: string;
    processing_time_ms: number;
    created_at?: Date;
}
export interface ProcessingLog {
    log_id: string;
    file_id?: string;
    chunk_id?: string;
    operation_type: 'extraction' | 'embedding' | 'classification' | 'indexing';
    status: 'started' | 'completed' | 'failed';
    error_message?: string;
    processing_time_ms?: number;
    model_version?: string;
    agent_version?: string;
    created_at?: Date;
}
export interface FileOverview {
    file_id: string;
    original_filename: string;
    campaign_name?: string;
    client_name?: string;
    file_type: string;
    total_chunks: number;
    processing_status: string;
    avg_quality: number;
    moods: string;
    indexed_chunks: number;
    created_at: Date;
    processed_at?: Date;
}
export interface CampaignSummary {
    campaign_name: string;
    client_name?: string;
    total_files: number;
    total_chunks: number;
    avg_quality_score: number;
    dominant_mood: string;
    effectiveness_prediction: number;
    processed_files: number;
    current_avg_quality: number;
}
export interface SearchQuery {
    query: string;
    filters?: {
        campaign_name?: string;
        client_name?: string;
        file_type?: string;
        mood_label?: string;
        content_type?: string;
        min_quality_score?: number;
        date_range?: {
            start: Date;
            end: Date;
        };
    };
    sort?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
}
export interface SearchResult {
    chunk_id: string;
    file_id: string;
    original_filename: string;
    campaign_name?: string;
    title?: string;
    text_snippet: string;
    visual_quality_score: number;
    mood_label: string;
    confidence_score: number;
    search_rank: number;
    relevance_score: number;
    highlight?: string;
}
export interface SearchResponse {
    results: SearchResult[];
    total_count: number;
    query: string;
    filters: Record<string, any>;
    execution_time_ms: number;
    page: number;
    per_page: number;
}
export interface ProcessingOptions {
    campaign_name?: string;
    client_name?: string;
    extract_images?: boolean;
    extract_videos?: boolean;
    generate_embeddings?: boolean;
    classify_content?: boolean;
    assess_quality?: boolean;
    chunk_size?: number;
    overlap_size?: number;
}
export interface ProcessingResult {
    success: boolean;
    file_id?: string;
    chunks_created?: number;
    processing_time_ms: number;
    error?: string;
    warnings?: string[];
}
export interface BatchProcessingResult {
    total_files: number;
    successful_files: number;
    failed_files: number;
    total_chunks: number;
    total_processing_time_ms: number;
    errors: Array<{
        file: string;
        error: string;
    }>;
    warnings: string[];
}
export interface DatabaseConfig {
    server: string;
    database: string;
    user: string;
    password: string;
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
        requestTimeout: number;
        connectionTimeout: number;
        enableArithAbort: boolean;
    };
    pool: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
        acquireTimeoutMillis: number;
    };
}
export interface AzureConfig {
    openai: {
        api_key: string;
        api_version: string;
        endpoint: string;
        embedding_model: string;
        chat_model: string;
    };
    storage?: {
        connection_string: string;
        container_name: string;
    };
    identity?: {
        tenant_id: string;
        client_id: string;
        client_secret: string;
    };
}
export declare const MOOD_LABELS: readonly ["happy", "sad", "neutral", "energetic", "calm", "professional", "creative", "urgent", "playful", "serious", "emotional", "analytical"];
export type MoodLabel = typeof MOOD_LABELS[number];
export declare const CONTENT_TYPES: readonly ["text", "image", "slide", "video"];
export type ContentType = typeof CONTENT_TYPES[number];
export declare const FILE_TYPES: readonly ["video", "image", "presentation", "document"];
export type FileType = typeof FILE_TYPES[number];
export declare const PROCESSING_STATUSES: readonly ["pending", "processing", "completed", "failed"];
export type ProcessingStatus = typeof PROCESSING_STATUSES[number];
export type Paginated<T> = {
    data: T[];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
};
export type ApiResponse<T> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: string;
};
export type HealthCheck = {
    status: 'healthy' | 'unhealthy';
    details: {
        database: boolean;
        azure_openai: boolean;
        storage: boolean;
        timestamp: string;
        version: string;
    };
};
//# sourceMappingURL=pageindex.d.ts.map