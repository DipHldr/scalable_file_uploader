import { pool } from "@aether/infra";
export const getPlaylist=async(req,res)=>{
    const {id}=req.params;

    try {
        const {rows}=await pool.query(`SELECT hls_url FROM videos WHERE id=$1 AND status='completed'`,[id]);

        if(rows.length===0){
            return res.status(404).json({
                message:'Video Not Found',
                hls_url:""
            })
        }
        const relativePath=rows[0].hls_url;
        console.log("relativePath: ",relativePath);

        const fullHlsUrl=`http://localhost:9000/video-uploader/${relativePath}`;
        return res.status(200).json({
            message:'Successfully found video',
            hls_url:fullHlsUrl
        });
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            message:'Error in fetching playlist',
            error:error.messsage
        })
    }
}