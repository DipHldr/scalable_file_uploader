CREATE TABLE IF NOT EXISTS videos(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_key TEXT NOT NULL, --this is for raw file 
    status TEXT DEFAULT 'pending' CHECK (status IN ('uploading','pending', 'processing', 'completed', 'failed')),
    hls_url TEXT, -- this is for proccessed file
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
    status TEXT DEFAULT 'pending',
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
