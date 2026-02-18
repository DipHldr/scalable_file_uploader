import {Client as MinioClient} from 'minio';

const minioClient=new MinioClient({
    endPoint:'127.0.0.1',
    port:9000,
    useSSL:false,
    accessKey:'admin',
    secretKey:'password123'
});

const BUCKET_NAME="video-uploader"

;(async()=>{
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

})()

export {minioClient,BUCKET_NAME};