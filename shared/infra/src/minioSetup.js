import {Client as MinioClient} from 'minio';

export const minioClient=new MinioClient({
    endPoint:process.env.MINIO_ENDPOINT||'127.0.0.1',
    port:parseInt(process.env.MINIO_PORT)||9000,
    useSSL:false,
    accessKey:process.env.MINIO_ROOT_USER||'admin',
    secretKey:process.env.MINIO_ROOT_PASSWORD||'password123'
});

export const BUCKET_NAME="video-uploader"

export const initMinio=async ()=>{
    try {
        const exists=await minioClient.bucketExists(BUCKET_NAME);
        if(!exists){
            await minioClient.makeBucket(BUCKET_NAME,'us-east-1');
            console.log(`Bucket ${BUCKET_NAME} created successfully`)
        }
        else{
            console.log(`Bucket ${BUCKET_NAME} is ready`);
        }
        
    } catch (error) {
        if (error.code === 'BucketAlreadyOwnedByYou' || error.code === 'BucketAlreadyExists') {
            console.log(`Bucket ${BUCKET_NAME} was created by another process`);
        } else {
            console.error(' MINIO INITIALIZATION FAILED', error);
        }
    }

}
