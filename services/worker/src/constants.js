export const ffmpeg_command=(inputPath,outputPath)=>{
    return `     ffmpeg -i ${inputPath} \
                -filter_complex "[0:v]split=3[v1][v2][v3];
                [v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease[v1out];
                [v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v2out];
                [v3]scale=w=854:h=480:force_original_aspect_ratio=decrease[v3out]" \
                -map [v1out] -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5350k -bufsize:v:0 7500k -map a:0 -c:a:0 aac -b:a:0 192k \
                -map [v2out] -c:v:1 libx264 -b:v:1 3000k -maxrate:v:1 3210k -bufsize:v:1 4500k -map a:0 -c:a:1 aac -b:a:1 128k \
                -map [v3out] -c:v:2 libx264 -b:v:2 1500k -maxrate:v:2 1600k -bufsize:v:2 2500k -map a:0 -c:a:2 aac -b:a:2 96k \
                -f hls \
                -hls_time 10 \
                -hls_playlist_type vod \
                -hls_segment_filename "${outputPath}/%v/segment%03d.ts" \
                -master_pl_name index.m3u8 \
                -var_stream_map "v:0,a:0 v:1,a:1 v:2,a:2" \
                "${outputPath}/%v/index.m3u8"
                `;
}

export const ffmpeg_args = (inputPath, outputPath) => {
    return [
        '-i', inputPath,
        '-filter_complex', `[0:v]split=3[v1][v2][v3]; \
        [v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease:force_divisible_by=2[v1out]; \
        [v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease:force_divisible_by=2[v2out]; \
        [v3]scale=w=854:h=-2:force_original_aspect_ratio=decrease:force_divisible_by=2[v3out]`,
        '-map', '[v1out]', '-c:v:0', 'libx264', '-b:v:0', '5000k', '-maxrate:v:0', '5350k', '-bufsize:v:0', '7500k', '-map', 'a:0', '-c:a:0', 'aac', '-b:a:0', '192k',
        '-map', '[v2out]', '-c:v:1', 'libx264', '-b:v:1', '3000k', '-maxrate:v:1', '3210k', '-bufsize:v:1', '4500k', '-map', 'a:0', '-c:a:1', 'aac', '-b:a:1', '128k',
        '-map', '[v3out]', '-c:v:2', 'libx264', '-b:v:2', '1500k', '-maxrate:v:2', '1600k', '-bufsize:v:2', '2500k', '-map', 'a:0', '-c:a:2', 'aac', '-b:a:2', '96k',
        '-f', 'hls',
        '-hls_time', '10',
        '-hls_playlist_type', 'vod',
        '-hls_segment_filename', `${outputPath}/%v/segment%03d.ts`,
        '-master_pl_name', 'index.m3u8',
        '-var_stream_map', 'v:0,a:0 v:1,a:1 v:2,a:2',
        `${outputPath}/%v/index.m3u8`
    ];
};