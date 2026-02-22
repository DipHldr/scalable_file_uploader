# Scalable Distributed Video Uploader

A robust, production-ready system designed to handle large-scale video ingestion and processing.This high-performance, stateless pipeline implements **resumable uploads**, **multipart processing**, and **asynchronous transcoding** to ensure reliability and availability under heavy workloads. By decoupling compute-intensive media operations from the API layer using Object Storage (MinIO) and distributed job queues (BullMQ), the architecture enables scalable, fault-tolerant video handling suitable for real-world deployment.




## Features

* **MinIO Integration**
  Used S3-compatible object storage for high availability and stateless services instead of local storage.

* **Persistent WSL Volumes**
  Implemented Docker bind mounts so transcoded assets persist across container restarts.

* **HLS / ABR Pipeline**
  Automated conversion of raw MP4 uploads into HLS playlists (`.m3u8`) and segments (`.ts`) for adaptive browser playback.

* **Fault-Tolerant Workers**
  BullMQ workers perform FFmpeg processing with retries and exponential backoff.

* **Resumable Chunks:** Uses the TUS protocol to resume uploads after network failure.

* **Multipart Uploads:** Efficient large file streaming directly to object storage.

* **Worker-Based Transcoding:** Decouples uploading from processing using a message queue.

* **Horizontal Scalability:** Stateless API design allows for easy scaling via Kubernetes or ECS.

* **Progress Tracking:** Real-time feedback via WebSockets or polling.


##  High-Level Architecture

The system is fully **stateless**, allowing API and worker services to scale independently.

###  Ingestion Layer
- Express API receives high-resolution video via `Multer`
- Streams payload directly to MinIO `raw/` bucket
- Pushes a `transcode` job to BullMQ with object metadata

###  Job Orchestration
- Redis-backed BullMQ queue
- Job state transitions:
  `Waiting → Active → Completed / Failed`
- Automatic stalled-job detection
- Configured retries with exponential backoff

###  Distributed Processing
- Worker pulls job from queue
- Downloads asset from MinIO
- Executes FFmpeg pipeline
- Streams progress via `stderr` parsing
- Uploads processed HLS assets to `processed/` bucket

###  Delivery
- Frontend streams `.m3u8` master playlist
- HLS segments (`.ts`) served via MinIO or CDN

## Tech Stack

| Component      | Technology            | Role                               |
| -------------- | --------------------- | ---------------------------------- |
| Backend        | Node.js (ESM)         | API & orchestration                |
| Object Storage | MinIO (S3-compatible) | Storage for raw & processed assets |
| Message Queue  | Redis + BullMQ        | Job scheduling & worker management |
| Processing     | FFmpeg                | Video transcoding & segmentation   |
| Infrastructure | Docker + WSL2         | Containerized runtime & fast I/O   |


## The Transcoding Pipeline (ABR)

To provide a YouTube-like experience, this project implements **Adaptive Bitrate Streaming (ABR)**. Instead of serving a single MP4, we transform the source into an HLS (HTTP Live Streaming) format.



* **Multi-Resolution Scaling:** Using a single-pass `filter_complex`, we split the input into 1080p, 720p, and 480p streams.
* **Mathematical Constraints:** Implemented scaling logic (`scale=w=trunc(oh*a/2)*2`) to ensure all dimensions are even, satisfying H.264 encoder requirements.
* **HLS Segmentation:** Slices video into 10-second `.ts` chunks, enabling users to jump to any part of the video instantly without downloading the whole file.

---

## Distributed Worker Logic

The system is designed to be **fault-tolerant** and **memory-efficient**:

* **BullMQ State Machine:** Jobs move through `Waiting -> Active -> Completed/Failed` states. If a worker crashes, BullMQ detects the "stalled" job and re-queues it.
* **Stream-Based Processing:** We use Node.js `spawn` rather than `exec`. This allows us to pipe FFmpeg's `stderr` to track progress in real-time while maintaining a flat memory footprint (no RAM buffering).
* **Atomic Retries:** Configured with exponential backoff to handle transient issues like file-system locks or temporary CPU spikes.



---

## Getting Started

### Prerequisites

* Node.js (v18+) or your preferred runtime
* FFmpeg 
* docker

## Installation & Setup

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/scalable_file_uploader.git](https://github.com/your-username/scalable_file_uploader.git)
   cd scalable-video-uploader
   ```


### Infrastructure (WSL / Docker)

Start storage and queue layers:

```bash
# Start Redis
docker run --name redis-server -p 6379:6379 -d redis

# Start MinIO with persistent volume
docker run -d \
  -p 9000:9000 \
  -p 9001:9001 \
  --name minio \
  -v ~/minio_data:/data \
  -e "MINIO_ROOT_USER=admin" \
  -e "MINIO_ROOT_PASSWORD=password123" \
  minio/minio server /data --console-address ":9001"
```

---

### Backend Setup

```bash
npm install

# Start API server + transcoder worker
npm run start
```

---

## Environment Configuration

| Variable       | Default   | Description                 |
| -------------- | --------- | --------------------------- |
| MINIO_ENDPOINT | 127.0.0.1 | MinIO API endpoint          |
| REDIS_HOST     | 127.0.0.1 | Redis connection for BullMQ |
| PORT           | 3000      | Express API port            |

---

## Transcoding Pipeline Details

Worker FFmpeg configuration optimized for web delivery:

* Video Codec: `libx264`
* Audio Codec: `aac`
* Segment Length: `10s` (`-hls_time 10`)
* Playlist Type: `VOD` (`-hls_list_size 0`)

Output:

* Master Playlist `.m3u8`
* Resolution Playlists
* `.ts` Segments

---

## Important Notes for WSL Users

If accessing the API from Windows tools (Postman / browser):

Use WSL IP address **or enable mirroring mode**:

```ini
[wsl2]
networkingMode=mirrored
```

Restart WSL:

```bash
wsl --shutdown
```

---

## Contributing
* Contributions are welcome!

## Project Motivation

This project was built to explore real-world backend system design concepts:

* Stateless microservice architecture
* Distributed job processing
* Media pipeline orchestration
* Object storage integration
* Production-style infrastructure workflows

It serves as a foundation for scaling toward production-grade video platforms.

---

## License
* Distributed under the MIT License. See LICENSE for more information.
