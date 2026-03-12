import {pool} from '@aether/infra';

/*
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    storage_key TEXT NOT NULL, --this is for raw file 
    status TEXT DEFAULT 'pending' CHECK (status IN ('uploading','pending', 'processing', 'completed', 'failed')),
    hls_url TEXT, -- this is for proccessed file
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
*/
export const getListOfAllVideos=async(req,res)=>{

    try {
        const query=`SELECT id,title,original_filename,status FROM videos WHERE status='completed' ORDER BY created_at DESC`;
        const {rows}=await pool.query(query);

        if(rows.length==0){
            return res.status(200).json({
                message:'No completed videos found',
                videos:[]
            });
        }
        return res.status(200).json({
            message:'success fetching list of videos',
            videos:rows
        });
        
    } catch (error) {
        return res.status(500).json({
            message:'error fetching video list',
            error:error.message
        });
    }
}