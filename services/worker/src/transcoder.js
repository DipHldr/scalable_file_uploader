import fs from 'fs';
import {Worker} from 'bullmq';
import IORedis from 'ioredis';
import { exec,spawn } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import {ffmpeg_args} from './constants.js';
import {downloadFromMinio,uploadDirectoryToMinio} from '@aether/utils';
import path from 'path';
import {fileURLToPath} from 'url';
import { initMinio,pool } from '@aether/infra';


await initMinio();

const __dirname=path.dirname(fileURLToPath(import.meta.url));

const connection=new IORedis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    maxRetriesPerRequest:null
});
const client=await pool.connect();
const worker=new Worker('video-processing',async(job)=>{
    // console.log(job);
    const {videoId,storageKey,name}=job.data;

    const workerId=process.env.HOSTNAME||`${os.hostname}-${uuidv4().substring(0,6)}`;
    // const videoId=job.data.name.split('.')[0];
    // const inputPath=job.data.file;

    let claim;
    for(let i=0;i<3;i++){
        claim=await pool.query(
            `UPDATE transcoding_jobs SET status='processing', started_at=NOW(),
             worker_id=$1 WHERE video_id=$2 AND status='pending' RETURNING id`,
            [workerId,videoId]
        );

        if(claim.rowCount>0)break;

        await new Promise(res=>setTimeout(res,500));
    }

    if(!claim||claim.rowCount==0){
        console.log(`Job [${job.id}] already claimed or DB row not ready. skipping....`);
        return;
    }

    await pool.query(`UPDATE videos SET status='processing' WHERE id=$1`,[videoId]);
    
    //I have to create an API endpoint to serve the playlist URL to the frontend
    // const playlistUrl=`http://localhost:3000/videos/${videoId}/index.m3u8`;
    
    const rootDir=path.resolve(__dirname,'../..');
    const localDownloadPath=path.resolve(rootDir,'temp/raw',job.data.name);
    // const remoteFileName=job.data.storageKey;
    const outputPath=path.join(rootDir,'temp/processed',videoId);
    const outputStorageKey=`videos/processed/${videoId}`
    
    if(!fs.existsSync(path.dirname(localDownloadPath))){
        fs.mkdirSync(path.dirname(localDownloadPath),{recursive:true});
    }

    //0->1080 1->720 2->480
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(`${outputPath}/0`, { recursive: true });
        fs.mkdirSync(`${outputPath}/1`, { recursive: true });
        fs.mkdirSync(`${outputPath}/2`, { recursive: true });
    }

    try {

        await downloadFromMinio(storageKey,localDownloadPath);

        return new Promise((resolve,reject)=>{

            const ffmpegProcess=spawn('ffmpeg',ffmpeg_args(localDownloadPath,outputPath));


            // console.log('test ->\n',ffmpegProcess.stderr);
            // Capturing stderr to track progress
            ffmpegProcess.stderr.on('data',(data)=>{
                const output=data.toString();
                console.log(output);
                //FFmpeg sends strings like "time=00:00:15.24"
                //using regex to get timestamp
                const timeMatch = output.match(/time=(\d{2}:\d{2}:\d{2}.\d{2})/);
                if (timeMatch) {
                    const elapsed = timeMatch[1];
                    console.log(`[Job ${job.id}] Progress: ${elapsed}`);
                    
                    //updating the BullMQ progress here
                    job.updateProgress({ time: elapsed });
                }

            });
            //Handling process completion
            ffmpegProcess.on('close', async (code) => {
                if (code === 0) {
                    console.log('FFmpeg finished successfully');
                    await uploadDirectoryToMinio(outputPath,outputStorageKey);
                    const hls_url=`${outputStorageKey}/index.m3u8`;

                    
                    await client.query('BEGIN');
                    await client.query(`UPDATE videos SET status='completed', hls_url=$1 WHERE id=$2`,[hls_url,videoId]);
                    await client.query(`UPDATE transcoding_jobs SET status='completed', completed_at=NOW() WHERE video_id=$1`,[videoId]);
                    await client.query('COMMIT');

                    
                    if(fs.existsSync(localDownloadPath)){
                        fs.rmSync(localDownloadPath,{force:true})
                    }
                    if(fs.existsSync(outputPath)){
                        fs.rmSync(outputPath,{recursive:true,force:true});
                    }
                    resolve({ 
                        status: 'success',
                        message:'video successfully processed',
                        playlisturl:hls_url
                    });
                } else {
                    reject(new Error(`FFmpeg exited with code ${code}`));
                }
            });

            //Handling process errors (like "ffmpeg not found")
            ffmpegProcess.on('error', (err) => {
                reject(err);
            });

        });

        
    } catch (error) {
        await client.query(`UPDATE videos SET status='failed' WHERE id=$1`,[videoId]);
        await client.query(`UPDATE transcoding_jobs SET status='failed',error_message=$1 WHERE video_id=$2`,[error.message,videoId]);
        throw error;        
    }

},{connection, concurrency:1})