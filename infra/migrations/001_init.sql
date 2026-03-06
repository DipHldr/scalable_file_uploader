CREATE TABLE IF NOT EXISTS videos(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    hls_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- FOR JOB TRACKING

CREATE TABLE IF NOT EXISTS transcoding_jobs(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
    bullmq_job_id TEXT,
    worker_id TEXT,
    priority INTEGER DEFAULT 1,
    progress INTEGER DEFAULT 0,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
