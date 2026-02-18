import Minio from 'minio';

const minioClient=Minio.Client({
    endPoint:'127.0.0.1',
    port:9000,
    useSSL:false,
    accesskey:'admin',
    secretkey:'password123'
});

const BUCKET_NAME="video-uploader"

(async()=>{
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
        console.error('MINIO INITIALIZATION FAILED',error);
    }

})()

export {minioClient,BUCKET_NAME};