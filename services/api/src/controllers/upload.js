import {uploadToMinio} from '@aether/utils';
import path from 'path';
import {Queue} from 'bullmq';
import fs from 'fs';
import { pool } from '@aether/infra';

// await initMinio();

//connection to bullmq redis
const videoQueue=new Queue('video-processing',{
    connection:{
        host:process.env.REDIS_HOST||'127.0.0.1',
        port:Number(process.env.REDIS_PORT)||6379
    }
});

export const uploadVideo=async(req,res)=>{
    console.log("Hello from server\n");
    let videoId;

    try {

        if(!req.file){
            return res.status(400).json({message:'failed to upload file'});
        }


        // console.log('contents of req.file:\n', req.file)

        const fileName=req.file.filename;

        const absoluteFilePath=path.resolve(req.file.path);

        const storageKey=`videos/raw/${fileName}`;

        const videoEntry=await pool.query(
            `INSERT INTO videos(title,original_filename,storage_key,status)
            VALUES ($1,$2,$3,'uploading') RETURNING id`,
            [fileName,req.file.originalname,storageKey]
        );
        
        videoId=videoEntry.rows[0].id;

        await uploadToMinio(storageKey,absoluteFilePath);

        if(fs.existsSync(absoluteFilePath)){
            await fs.promises.unlinkSync(absoluteFilePath);
        }

        const client=await pool.connect();
        try {

            
            await client.query('BEGIN');
            await client.query(`UPDATE videos SET status='pending' WHERE id=$1`,[videoId]);
            await client.query(`INSERT INTO transcoding_jobs (video_id,status) VALUES ($1,'pending')`,[videoId]);
            
            const job=await videoQueue.add('transcoder',{
                videoId,
                storageKey,
                name:fileName
            },{
                jobId:videoId,
                attempts:3,
                backoff:5000,
                removeOnComplete:true
            });
            
            await client.query(`UPDATE transcoding_jobs SET bullmq_job_id=$1 WHERE video_id=$2`,
                [job.id,videoId]
            );
            
            //TODO add a outbox table to handle the dual write problem
            await client.query('COMMIT');
            
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        }finally{
            client.release();
        }


        return res.status(200).json({
            message:'Uploaded Successfully',
            videoId,
            fileInfo:{
                name:req.file.filename,
                size:req.file.size,
            }
        });
        
    } catch (error) {
        console.log(error);

        if(videoId){
            await pool.query(`UPDATE videos SET status='failed'WHERE id=$1`,[videoId]);
            await pool.query(`UPDATE transcoding_jobs SET status='failed' , error_message=$1 WHERE video_id=$2 AND status!='completed'`,
                [error.message,videoId]);
        }

        return res.status(500).json({
            message:"UPLOAD FAILED",
            error:error.message
        });
        
    }
    
}