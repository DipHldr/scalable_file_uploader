import express from 'express';
import {uploadVideo} from '../../controllers/upload.js';
import { storage,upload } from '../../middleware/multerConfig.js';
import { getListOfAllVideos } from '../../controllers/getVideoList.js';
import { getPlaylist } from '../../controllers/getPlaylist.js';
const router=express.Router();

//videos
router.post('/videos/upload',upload.single('video'),uploadVideo);
router.get('/videos',getListOfAllVideos);//--> get list of al videos
router.get('/videos/:id/playlist',getPlaylist)//-->serve the hls playlist url
// router.get('/videos/:id')//-->give video detail by id 
// router.get('/videos/:id/status')//-->update video status
// router.delete('/videos/:id') //--> delete a video

//trancoding jobs..
/*
GET /api/v1/transcoding-jobs/:id — Get a transcoding job by ID

PATCH /api/v1/transcoding-jobs/:id/progress — Update job progress

GET /api/v1/videos/:videoId/transcoding-jobs — Get all transcoding jobs for a video

DELETE /api/v1/transcoding-jobs/:id — Delete a transcoding job
*/


export default router;