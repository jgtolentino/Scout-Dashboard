import { z } from 'zod';
export declare const ChunkMetadataSchema: z.ZodObject<{
    chunk_id: z.ZodString;
    file_id: z.ZodString;
    filepath: z.ZodString;
    title: z.ZodOptional<z.ZodString>;
    text_snippet: z.ZodString;
    tags: z.ZodArray<z.ZodString, "many">;
    visual_quality_score: z.ZodNumber;
    semantic_topics: z.ZodArray<z.ZodString, "many">;
    mood_label: z.ZodString;
    embedding_vector: z.ZodOptional<z.ZodArray<z.ZodNumber, "many">>;
    chunk_index: z.ZodNumber;
    chunk_size: z.ZodNumber;
    content_type: z.ZodEnum<["text", "image", "slide", "video"]>;
    confidence_score: z.ZodNumber;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    chunk_id: string;
    file_id: string;
    filepath: string;
    text_snippet: string;
    tags: string[];
    visual_quality_score: number;
    semantic_topics: string[];
    mood_label: string;
    chunk_index: number;
    chunk_size: number;
    content_type: "text" | "image" | "slide" | "video";
    confidence_score: number;
    title?: string | undefined;
    embedding_vector?: number[] | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
}, {
    chunk_id: string;
    file_id: string;
    filepath: string;
    text_snippet: string;
    tags: string[];
    visual_quality_score: number;
    semantic_topics: string[];
    mood_label: string;
    chunk_index: number;
    chunk_size: number;
    content_type: "text" | "image" | "slide" | "video";
    confidence_score: number;
    title?: string | undefined;
    embedding_vector?: number[] | undefined;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
}>;
export declare const FileMetadataSchema: z.ZodObject<{
    file_id: z.ZodString;
    original_filename: z.ZodString;
    filepath: z.ZodString;
    file_size: z.ZodNumber;
    mime_type: z.ZodString;
    campaign_name: z.ZodOptional<z.ZodString>;
    client_name: z.ZodOptional<z.ZodString>;
    brand_name: z.ZodOptional<z.ZodString>;
    file_type: z.ZodEnum<["video", "image", "presentation", "document"]>;
    processing_status: z.ZodEnum<["pending", "processing", "completed", "failed"]>;
    total_chunks: z.ZodNumber;
    azure_blob_url: z.ZodOptional<z.ZodString>;
    google_drive_id: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodDate>;
    processed_at: z.ZodOptional<z.ZodDate>;
    error_message: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    file_id: string;
    filepath: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_type: "image" | "video" | "presentation" | "document";
    processing_status: "pending" | "processing" | "completed" | "failed";
    total_chunks: number;
    created_at?: Date | undefined;
    campaign_name?: string | undefined;
    client_name?: string | undefined;
    brand_name?: string | undefined;
    azure_blob_url?: string | undefined;
    google_drive_id?: string | undefined;
    processed_at?: Date | undefined;
    error_message?: string | undefined;
}, {
    file_id: string;
    filepath: string;
    original_filename: string;
    file_size: number;
    mime_type: string;
    file_type: "image" | "video" | "presentation" | "document";
    processing_status: "pending" | "processing" | "completed" | "failed";
    total_chunks: number;
    created_at?: Date | undefined;
    campaign_name?: string | undefined;
    client_name?: string | undefined;
    brand_name?: string | undefined;
    azure_blob_url?: string | undefined;
    google_drive_id?: string | undefined;
    processed_at?: Date | undefined;
    error_message?: string | undefined;
}>;
export declare const CampaignInsightsSchema: z.ZodObject<{
    campaign_id: z.ZodString;
    campaign_name: z.ZodString;
    client_name: z.ZodOptional<z.ZodString>;
    total_files: z.ZodNumber;
    total_chunks: z.ZodNumber;
    avg_quality_score: z.ZodNumber;
    dominant_mood: z.ZodString;
    key_topics: z.ZodArray<z.ZodString, "many">;
    effectiveness_prediction: z.ZodNumber;
    creative_features: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    business_outcomes: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    award_submissions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    created_at: z.ZodOptional<z.ZodDate>;
    updated_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    campaign_name: string;
    total_chunks: number;
    campaign_id: string;
    total_files: number;
    avg_quality_score: number;
    dominant_mood: string;
    key_topics: string[];
    effectiveness_prediction: number;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    client_name?: string | undefined;
    creative_features?: Record<string, any> | undefined;
    business_outcomes?: Record<string, any> | undefined;
    award_submissions?: string[] | undefined;
}, {
    campaign_name: string;
    total_chunks: number;
    campaign_id: string;
    total_files: number;
    avg_quality_score: number;
    dominant_mood: string;
    key_topics: string[];
    effectiveness_prediction: number;
    created_at?: Date | undefined;
    updated_at?: Date | undefined;
    client_name?: string | undefined;
    creative_features?: Record<string, any> | undefined;
    business_outcomes?: Record<string, any> | undefined;
    award_submissions?: string[] | undefined;
}>;
export declare const SemanticIndexSchema: z.ZodObject<{
    search_id: z.ZodString;
    chunk_id: z.ZodString;
    search_terms: z.ZodString;
    topic_clusters: z.ZodArray<z.ZodString, "many">;
    similarity_hash: z.ZodString;
    search_rank: z.ZodNumber;
    relevance_score: z.ZodNumber;
    created_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    chunk_id: string;
    search_id: string;
    search_terms: string;
    topic_clusters: string[];
    similarity_hash: string;
    search_rank: number;
    relevance_score: number;
    created_at?: Date | undefined;
}, {
    chunk_id: string;
    search_id: string;
    search_terms: string;
    topic_clusters: string[];
    similarity_hash: string;
    search_rank: number;
    relevance_score: number;
    created_at?: Date | undefined;
}>;
export declare const QualityMetricsSchema: z.ZodObject<{
    metric_id: z.ZodString;
    chunk_id: z.ZodString;
    content_clarity: z.ZodNumber;
    visual_appeal: z.ZodNumber;
    message_strength: z.ZodNumber;
    brand_consistency: z.ZodNumber;
    emotional_impact: z.ZodNumber;
    technical_quality: z.ZodNumber;
    overall_score: z.ZodNumber;
    classification_model: z.ZodString;
    processing_time_ms: z.ZodNumber;
    created_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    chunk_id: string;
    metric_id: string;
    content_clarity: number;
    visual_appeal: number;
    message_strength: number;
    brand_consistency: number;
    emotional_impact: number;
    technical_quality: number;
    overall_score: number;
    classification_model: string;
    processing_time_ms: number;
    created_at?: Date | undefined;
}, {
    chunk_id: string;
    metric_id: string;
    content_clarity: number;
    visual_appeal: number;
    message_strength: number;
    brand_consistency: number;
    emotional_impact: number;
    technical_quality: number;
    overall_score: number;
    classification_model: string;
    processing_time_ms: number;
    created_at?: Date | undefined;
}>;
export declare const ProcessingLogSchema: z.ZodObject<{
    log_id: z.ZodString;
    file_id: z.ZodOptional<z.ZodString>;
    chunk_id: z.ZodOptional<z.ZodString>;
    operation_type: z.ZodEnum<["extraction", "embedding", "classification", "indexing"]>;
    status: z.ZodEnum<["started", "completed", "failed"]>;
    error_message: z.ZodOptional<z.ZodString>;
    processing_time_ms: z.ZodOptional<z.ZodNumber>;
    model_version: z.ZodOptional<z.ZodString>;
    agent_version: z.ZodOptional<z.ZodString>;
    created_at: z.ZodOptional<z.ZodDate>;
}, "strip", z.ZodTypeAny, {
    status: "completed" | "failed" | "started";
    log_id: string;
    operation_type: "extraction" | "embedding" | "classification" | "indexing";
    chunk_id?: string | undefined;
    file_id?: string | undefined;
    created_at?: Date | undefined;
    error_message?: string | undefined;
    processing_time_ms?: number | undefined;
    model_version?: string | undefined;
    agent_version?: string | undefined;
}, {
    status: "completed" | "failed" | "started";
    log_id: string;
    operation_type: "extraction" | "embedding" | "classification" | "indexing";
    chunk_id?: string | undefined;
    file_id?: string | undefined;
    created_at?: Date | undefined;
    error_message?: string | undefined;
    processing_time_ms?: number | undefined;
    model_version?: string | undefined;
    agent_version?: string | undefined;
}>;
export declare const SearchQuerySchema: z.ZodObject<{
    query: z.ZodString;
    filters: z.ZodOptional<z.ZodObject<{
        campaign_name: z.ZodOptional<z.ZodString>;
        client_name: z.ZodOptional<z.ZodString>;
        file_type: z.ZodOptional<z.ZodEnum<["video", "image", "presentation", "document"]>>;
        mood_label: z.ZodOptional<z.ZodString>;
        content_type: z.ZodOptional<z.ZodEnum<["text", "image", "slide", "video"]>>;
        min_quality_score: z.ZodOptional<z.ZodNumber>;
        date_range: z.ZodOptional<z.ZodObject<{
            start: z.ZodDate;
            end: z.ZodDate;
        }, "strip", z.ZodTypeAny, {
            start: Date;
            end: Date;
        }, {
            start: Date;
            end: Date;
        }>>;
    }, "strip", z.ZodTypeAny, {
        mood_label?: string | undefined;
        content_type?: "text" | "image" | "slide" | "video" | undefined;
        campaign_name?: string | undefined;
        client_name?: string | undefined;
        file_type?: "image" | "video" | "presentation" | "document" | undefined;
        min_quality_score?: number | undefined;
        date_range?: {
            start: Date;
            end: Date;
        } | undefined;
    }, {
        mood_label?: string | undefined;
        content_type?: "text" | "image" | "slide" | "video" | undefined;
        campaign_name?: string | undefined;
        client_name?: string | undefined;
        file_type?: "image" | "video" | "presentation" | "document" | undefined;
        min_quality_score?: number | undefined;
        date_range?: {
            start: Date;
            end: Date;
        } | undefined;
    }>>;
    sort: z.ZodOptional<z.ZodObject<{
        field: z.ZodString;
        direction: z.ZodEnum<["asc", "desc"]>;
    }, "strip", z.ZodTypeAny, {
        field: string;
        direction: "asc" | "desc";
    }, {
        field: string;
        direction: "asc" | "desc";
    }>>;
    limit: z.ZodDefault<z.ZodNumber>;
    offset: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    query: string;
    limit: number;
    offset: number;
    sort?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
    filters?: {
        mood_label?: string | undefined;
        content_type?: "text" | "image" | "slide" | "video" | undefined;
        campaign_name?: string | undefined;
        client_name?: string | undefined;
        file_type?: "image" | "video" | "presentation" | "document" | undefined;
        min_quality_score?: number | undefined;
        date_range?: {
            start: Date;
            end: Date;
        } | undefined;
    } | undefined;
}, {
    query: string;
    sort?: {
        field: string;
        direction: "asc" | "desc";
    } | undefined;
    filters?: {
        mood_label?: string | undefined;
        content_type?: "text" | "image" | "slide" | "video" | undefined;
        campaign_name?: string | undefined;
        client_name?: string | undefined;
        file_type?: "image" | "video" | "presentation" | "document" | undefined;
        min_quality_score?: number | undefined;
        date_range?: {
            start: Date;
            end: Date;
        } | undefined;
    } | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
export declare const SearchResultSchema: z.ZodObject<{
    chunk_id: z.ZodString;
    file_id: z.ZodString;
    original_filename: z.ZodString;
    campaign_name: z.ZodOptional<z.ZodString>;
    title: z.ZodOptional<z.ZodString>;
    text_snippet: z.ZodString;
    visual_quality_score: z.ZodNumber;
    mood_label: z.ZodString;
    confidence_score: z.ZodNumber;
    search_rank: z.ZodNumber;
    relevance_score: z.ZodNumber;
    highlight: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    chunk_id: string;
    file_id: string;
    text_snippet: string;
    visual_quality_score: number;
    mood_label: string;
    confidence_score: number;
    original_filename: string;
    search_rank: number;
    relevance_score: number;
    title?: string | undefined;
    campaign_name?: string | undefined;
    highlight?: string | undefined;
}, {
    chunk_id: string;
    file_id: string;
    text_snippet: string;
    visual_quality_score: number;
    mood_label: string;
    confidence_score: number;
    original_filename: string;
    search_rank: number;
    relevance_score: number;
    title?: string | undefined;
    campaign_name?: string | undefined;
    highlight?: string | undefined;
}>;
export declare const SearchResponseSchema: z.ZodObject<{
    results: z.ZodArray<z.ZodObject<{
        chunk_id: z.ZodString;
        file_id: z.ZodString;
        original_filename: z.ZodString;
        campaign_name: z.ZodOptional<z.ZodString>;
        title: z.ZodOptional<z.ZodString>;
        text_snippet: z.ZodString;
        visual_quality_score: z.ZodNumber;
        mood_label: z.ZodString;
        confidence_score: z.ZodNumber;
        search_rank: z.ZodNumber;
        relevance_score: z.ZodNumber;
        highlight: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        chunk_id: string;
        file_id: string;
        text_snippet: string;
        visual_quality_score: number;
        mood_label: string;
        confidence_score: number;
        original_filename: string;
        search_rank: number;
        relevance_score: number;
        title?: string | undefined;
        campaign_name?: string | undefined;
        highlight?: string | undefined;
    }, {
        chunk_id: string;
        file_id: string;
        text_snippet: string;
        visual_quality_score: number;
        mood_label: string;
        confidence_score: number;
        original_filename: string;
        search_rank: number;
        relevance_score: number;
        title?: string | undefined;
        campaign_name?: string | undefined;
        highlight?: string | undefined;
    }>, "many">;
    total_count: z.ZodNumber;
    query: z.ZodString;
    filters: z.ZodRecord<z.ZodString, z.ZodAny>;
    execution_time_ms: z.ZodNumber;
    page: z.ZodNumber;
    per_page: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    query: string;
    filters: Record<string, any>;
    results: {
        chunk_id: string;
        file_id: string;
        text_snippet: string;
        visual_quality_score: number;
        mood_label: string;
        confidence_score: number;
        original_filename: string;
        search_rank: number;
        relevance_score: number;
        title?: string | undefined;
        campaign_name?: string | undefined;
        highlight?: string | undefined;
    }[];
    total_count: number;
    execution_time_ms: number;
    page: number;
    per_page: number;
}, {
    query: string;
    filters: Record<string, any>;
    results: {
        chunk_id: string;
        file_id: string;
        text_snippet: string;
        visual_quality_score: number;
        mood_label: string;
        confidence_score: number;
        original_filename: string;
        search_rank: number;
        relevance_score: number;
        title?: string | undefined;
        campaign_name?: string | undefined;
        highlight?: string | undefined;
    }[];
    total_count: number;
    execution_time_ms: number;
    page: number;
    per_page: number;
}>;
export declare const ProcessingOptionsSchema: z.ZodObject<{
    campaign_name: z.ZodOptional<z.ZodString>;
    client_name: z.ZodOptional<z.ZodString>;
    extract_images: z.ZodDefault<z.ZodBoolean>;
    extract_videos: z.ZodDefault<z.ZodBoolean>;
    generate_embeddings: z.ZodDefault<z.ZodBoolean>;
    classify_content: z.ZodDefault<z.ZodBoolean>;
    assess_quality: z.ZodDefault<z.ZodBoolean>;
    chunk_size: z.ZodDefault<z.ZodNumber>;
    overlap_size: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    chunk_size: number;
    extract_images: boolean;
    extract_videos: boolean;
    generate_embeddings: boolean;
    classify_content: boolean;
    assess_quality: boolean;
    overlap_size: number;
    campaign_name?: string | undefined;
    client_name?: string | undefined;
}, {
    chunk_size?: number | undefined;
    campaign_name?: string | undefined;
    client_name?: string | undefined;
    extract_images?: boolean | undefined;
    extract_videos?: boolean | undefined;
    generate_embeddings?: boolean | undefined;
    classify_content?: boolean | undefined;
    assess_quality?: boolean | undefined;
    overlap_size?: number | undefined;
}>;
export declare const ProcessingResultSchema: z.ZodObject<{
    success: z.ZodBoolean;
    file_id: z.ZodOptional<z.ZodString>;
    chunks_created: z.ZodOptional<z.ZodNumber>;
    processing_time_ms: z.ZodNumber;
    error: z.ZodOptional<z.ZodString>;
    warnings: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    processing_time_ms: number;
    success: boolean;
    file_id?: string | undefined;
    chunks_created?: number | undefined;
    error?: string | undefined;
    warnings?: string[] | undefined;
}, {
    processing_time_ms: number;
    success: boolean;
    file_id?: string | undefined;
    chunks_created?: number | undefined;
    error?: string | undefined;
    warnings?: string[] | undefined;
}>;
export declare const BatchProcessingResultSchema: z.ZodObject<{
    total_files: z.ZodNumber;
    successful_files: z.ZodNumber;
    failed_files: z.ZodNumber;
    total_chunks: z.ZodNumber;
    total_processing_time_ms: z.ZodNumber;
    errors: z.ZodArray<z.ZodObject<{
        file: z.ZodString;
        error: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        error: string;
        file: string;
    }, {
        error: string;
        file: string;
    }>, "many">;
    warnings: z.ZodArray<z.ZodString, "many">;
}, "strip", z.ZodTypeAny, {
    total_chunks: number;
    total_files: number;
    warnings: string[];
    successful_files: number;
    failed_files: number;
    total_processing_time_ms: number;
    errors: {
        error: string;
        file: string;
    }[];
}, {
    total_chunks: number;
    total_files: number;
    warnings: string[];
    successful_files: number;
    failed_files: number;
    total_processing_time_ms: number;
    errors: {
        error: string;
        file: string;
    }[];
}>;
export declare const DatabaseConfigSchema: z.ZodObject<{
    server: z.ZodString;
    database: z.ZodString;
    user: z.ZodString;
    password: z.ZodString;
    options: z.ZodObject<{
        encrypt: z.ZodBoolean;
        trustServerCertificate: z.ZodBoolean;
        requestTimeout: z.ZodNumber;
        connectionTimeout: z.ZodNumber;
        enableArithAbort: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        encrypt: boolean;
        trustServerCertificate: boolean;
        requestTimeout: number;
        connectionTimeout: number;
        enableArithAbort: boolean;
    }, {
        encrypt: boolean;
        trustServerCertificate: boolean;
        requestTimeout: number;
        connectionTimeout: number;
        enableArithAbort: boolean;
    }>;
    pool: z.ZodObject<{
        max: z.ZodNumber;
        min: z.ZodNumber;
        idleTimeoutMillis: z.ZodNumber;
        acquireTimeoutMillis: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        max: number;
        min: number;
        idleTimeoutMillis: number;
        acquireTimeoutMillis: number;
    }, {
        max: number;
        min: number;
        idleTimeoutMillis: number;
        acquireTimeoutMillis: number;
    }>;
}, "strip", z.ZodTypeAny, {
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
        requestTimeout: number;
        connectionTimeout: number;
        enableArithAbort: boolean;
    };
    server: string;
    database: string;
    user: string;
    password: string;
    pool: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
        acquireTimeoutMillis: number;
    };
}, {
    options: {
        encrypt: boolean;
        trustServerCertificate: boolean;
        requestTimeout: number;
        connectionTimeout: number;
        enableArithAbort: boolean;
    };
    server: string;
    database: string;
    user: string;
    password: string;
    pool: {
        max: number;
        min: number;
        idleTimeoutMillis: number;
        acquireTimeoutMillis: number;
    };
}>;
export declare const AzureConfigSchema: z.ZodObject<{
    openai: z.ZodObject<{
        api_key: z.ZodString;
        api_version: z.ZodString;
        endpoint: z.ZodString;
        embedding_model: z.ZodString;
        chat_model: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        api_key: string;
        api_version: string;
        endpoint: string;
        embedding_model: string;
        chat_model: string;
    }, {
        api_key: string;
        api_version: string;
        endpoint: string;
        embedding_model: string;
        chat_model: string;
    }>;
    storage: z.ZodOptional<z.ZodObject<{
        connection_string: z.ZodString;
        container_name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        connection_string: string;
        container_name: string;
    }, {
        connection_string: string;
        container_name: string;
    }>>;
    identity: z.ZodOptional<z.ZodObject<{
        tenant_id: z.ZodString;
        client_id: z.ZodString;
        client_secret: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        tenant_id: string;
        client_id: string;
        client_secret: string;
    }, {
        tenant_id: string;
        client_id: string;
        client_secret: string;
    }>>;
}, "strip", z.ZodTypeAny, {
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
    } | undefined;
    identity?: {
        tenant_id: string;
        client_id: string;
        client_secret: string;
    } | undefined;
}, {
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
    } | undefined;
    identity?: {
        tenant_id: string;
        client_id: string;
        client_secret: string;
    } | undefined;
}>;
export declare const PaginationSchema: z.ZodObject<{
    page: z.ZodNumber;
    per_page: z.ZodNumber;
    total: z.ZodNumber;
    total_pages: z.ZodNumber;
    has_next: z.ZodBoolean;
    has_prev: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}, {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
}>;
export declare const PaginatedSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    data: z.ZodArray<T, "many">;
    pagination: z.ZodObject<{
        page: z.ZodNumber;
        per_page: z.ZodNumber;
        total: z.ZodNumber;
        total_pages: z.ZodNumber;
        has_next: z.ZodBoolean;
        has_prev: z.ZodBoolean;
    }, "strip", z.ZodTypeAny, {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    }, {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    }>;
}, "strip", z.ZodTypeAny, {
    data: T["_output"][];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}, {
    data: T["_input"][];
    pagination: {
        page: number;
        per_page: number;
        total: number;
        total_pages: number;
        has_next: boolean;
        has_prev: boolean;
    };
}>;
export declare const ApiResponseSchema: <T extends z.ZodTypeAny>(dataSchema: T) => z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}, "strip", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}>, any> extends infer T_1 ? { [k in keyof T_1]: z.objectUtil.addQuestionMarks<z.baseObjectOutputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}>, any>[k]; } : never, z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}> extends infer T_2 ? { [k_1 in keyof T_2]: z.baseObjectInputType<{
    success: z.ZodBoolean;
    data: z.ZodOptional<T>;
    error: z.ZodOptional<z.ZodString>;
    message: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodString;
}>[k_1]; } : never>;
export declare const HealthCheckSchema: z.ZodObject<{
    status: z.ZodEnum<["healthy", "unhealthy"]>;
    details: z.ZodObject<{
        database: z.ZodBoolean;
        azure_openai: z.ZodBoolean;
        storage: z.ZodBoolean;
        timestamp: z.ZodString;
        version: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        database: boolean;
        storage: boolean;
        azure_openai: boolean;
        timestamp: string;
        version: string;
    }, {
        database: boolean;
        storage: boolean;
        azure_openai: boolean;
        timestamp: string;
        version: string;
    }>;
}, "strip", z.ZodTypeAny, {
    status: "healthy" | "unhealthy";
    details: {
        database: boolean;
        storage: boolean;
        azure_openai: boolean;
        timestamp: string;
        version: string;
    };
}, {
    status: "healthy" | "unhealthy";
    details: {
        database: boolean;
        storage: boolean;
        azure_openai: boolean;
        timestamp: string;
        version: string;
    };
}>;
export declare const EnvironmentSchema: z.ZodObject<{
    AZURE_SQL_SERVER: z.ZodDefault<z.ZodString>;
    AZURE_SQL_DATABASE: z.ZodDefault<z.ZodString>;
    AZURE_SQL_USER: z.ZodDefault<z.ZodString>;
    AZURE_SQL_PASSWORD: z.ZodString;
    AZURE_OPENAI_API_KEY: z.ZodString;
    AZURE_OPENAI_API_VERSION: z.ZodDefault<z.ZodString>;
    AZURE_OPENAI_ENDPOINT: z.ZodString;
    AZURE_OPENAI_EMBEDDING_MODEL: z.ZodDefault<z.ZodString>;
    AZURE_OPENAI_CHAT_MODEL: z.ZodDefault<z.ZodString>;
    AZURE_STORAGE_CONNECTION_STRING: z.ZodOptional<z.ZodString>;
    AZURE_STORAGE_CONTAINER: z.ZodDefault<z.ZodString>;
    AZURE_TENANT_ID: z.ZodOptional<z.ZodString>;
    AZURE_CLIENT_ID: z.ZodOptional<z.ZodString>;
    AZURE_CLIENT_SECRET: z.ZodOptional<z.ZodString>;
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    LOG_LEVEL: z.ZodDefault<z.ZodEnum<["error", "warn", "info", "debug"]>>;
    MAX_FILE_SIZE_MB: z.ZodDefault<z.ZodNumber>;
    MAX_BATCH_SIZE: z.ZodDefault<z.ZodNumber>;
    PROCESSING_TIMEOUT_MS: z.ZodDefault<z.ZodNumber>;
    API_PORT: z.ZodDefault<z.ZodNumber>;
    API_HOST: z.ZodDefault<z.ZodString>;
    CORS_ORIGINS: z.ZodDefault<z.ZodString>;
    CONNECTION_TIMEOUT: z.ZodDefault<z.ZodNumber>;
    REQUEST_TIMEOUT: z.ZodDefault<z.ZodNumber>;
    POOL_MAX: z.ZodDefault<z.ZodNumber>;
    POOL_MIN: z.ZodDefault<z.ZodNumber>;
    POOL_IDLE_TIMEOUT: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    AZURE_SQL_SERVER: string;
    AZURE_SQL_DATABASE: string;
    AZURE_SQL_USER: string;
    AZURE_SQL_PASSWORD: string;
    AZURE_OPENAI_API_KEY: string;
    AZURE_OPENAI_API_VERSION: string;
    AZURE_OPENAI_ENDPOINT: string;
    AZURE_OPENAI_EMBEDDING_MODEL: string;
    AZURE_OPENAI_CHAT_MODEL: string;
    AZURE_STORAGE_CONTAINER: string;
    NODE_ENV: "development" | "production" | "test";
    LOG_LEVEL: "error" | "warn" | "info" | "debug";
    MAX_FILE_SIZE_MB: number;
    MAX_BATCH_SIZE: number;
    PROCESSING_TIMEOUT_MS: number;
    API_PORT: number;
    API_HOST: string;
    CORS_ORIGINS: string;
    CONNECTION_TIMEOUT: number;
    REQUEST_TIMEOUT: number;
    POOL_MAX: number;
    POOL_MIN: number;
    POOL_IDLE_TIMEOUT: number;
    AZURE_STORAGE_CONNECTION_STRING?: string | undefined;
    AZURE_TENANT_ID?: string | undefined;
    AZURE_CLIENT_ID?: string | undefined;
    AZURE_CLIENT_SECRET?: string | undefined;
}, {
    AZURE_SQL_PASSWORD: string;
    AZURE_OPENAI_API_KEY: string;
    AZURE_OPENAI_ENDPOINT: string;
    AZURE_SQL_SERVER?: string | undefined;
    AZURE_SQL_DATABASE?: string | undefined;
    AZURE_SQL_USER?: string | undefined;
    AZURE_OPENAI_API_VERSION?: string | undefined;
    AZURE_OPENAI_EMBEDDING_MODEL?: string | undefined;
    AZURE_OPENAI_CHAT_MODEL?: string | undefined;
    AZURE_STORAGE_CONNECTION_STRING?: string | undefined;
    AZURE_STORAGE_CONTAINER?: string | undefined;
    AZURE_TENANT_ID?: string | undefined;
    AZURE_CLIENT_ID?: string | undefined;
    AZURE_CLIENT_SECRET?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    LOG_LEVEL?: "error" | "warn" | "info" | "debug" | undefined;
    MAX_FILE_SIZE_MB?: number | undefined;
    MAX_BATCH_SIZE?: number | undefined;
    PROCESSING_TIMEOUT_MS?: number | undefined;
    API_PORT?: number | undefined;
    API_HOST?: string | undefined;
    CORS_ORIGINS?: string | undefined;
    CONNECTION_TIMEOUT?: number | undefined;
    REQUEST_TIMEOUT?: number | undefined;
    POOL_MAX?: number | undefined;
    POOL_MIN?: number | undefined;
    POOL_IDLE_TIMEOUT?: number | undefined;
}>;
export type ChunkMetadata = z.infer<typeof ChunkMetadataSchema>;
export type FileMetadata = z.infer<typeof FileMetadataSchema>;
export type CampaignInsights = z.infer<typeof CampaignInsightsSchema>;
export type SemanticIndex = z.infer<typeof SemanticIndexSchema>;
export type QualityMetrics = z.infer<typeof QualityMetricsSchema>;
export type ProcessingLog = z.infer<typeof ProcessingLogSchema>;
export type SearchQuery = z.infer<typeof SearchQuerySchema>;
export type SearchResult = z.infer<typeof SearchResultSchema>;
export type SearchResponse = z.infer<typeof SearchResponseSchema>;
export type ProcessingOptions = z.infer<typeof ProcessingOptionsSchema>;
export type ProcessingResult = z.infer<typeof ProcessingResultSchema>;
export type BatchProcessingResult = z.infer<typeof BatchProcessingResultSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
export type AzureConfig = z.infer<typeof AzureConfigSchema>;
export type Environment = z.infer<typeof EnvironmentSchema>;
//# sourceMappingURL=pageindex.d.ts.map