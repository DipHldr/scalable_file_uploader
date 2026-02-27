![Node](https://img.shields.io/badge/node-%3E%3D18-green)
![Dockerized](https://img.shields.io/badge/docker-ready-blue)
![License](https://img.shields.io/badge/license-MIT-lightgrey)
# Scalable Distributed Video Uploader

A production-ready video ingestion and processing system designed for large-scale workloads.

The architecture supports resumable uploads, multipart transfer, and asynchronous transcoding, allowing the API layer to remain stateless while compute-intensive media operations are handled independently.

By decoupling request handling from background processing using object storage (MinIO) and distributed job queues (BullMQ), the system achieves horizontal scalability, fault tolerance, and efficient resource utilization under sustained load.




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

### Monorepo & Service Architecture
The system is organized as a **high-performance monorepo** using npm workspaces. This enables a clean separation of concerns while maintaining a shared internal library for core utilities.

- **`@aether/shared-utils`**: Internal workspace for MinIO clients, BullMQ configurations, and shared business logic.
- **`services/api`**: Express.js producer service that handles file ingestion and job creation.
- **`services/worker`**: Dedicated transcoding consumer service with a custom FFmpeg/spawn implementation.
- **Container Orchestration**: Fully managed via Docker Compose for consistent networking and deployment.

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

## System Flow Diagram

```mermaid
flowchart LR
    Client -->|Upload| API
    API -->|Store Raw Video| MinIO
    API -->|Create Job| Redis
    Worker -->|Consume Job| Redis
    Worker -->|Download Raw| MinIO
    Worker -->|FFmpeg Transcode| HLS
    Worker -->|Upload Processed| MinIO
    Client -->|Stream .m3u8| MinIO
  ```

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


## Distributed Worker Logic

The system is designed to be **fault-tolerant** and **memory-efficient**:

* **BullMQ State Machine:** Jobs move through `Waiting -> Active -> Completed/Failed` states. If a worker crashes, BullMQ detects the "stalled" job and re-queues it.
* **Stream-Based Processing:** We use Node.js `spawn` rather than `exec`. This allows us to pipe FFmpeg's `stderr` to track progress in real-time while maintaining a flat memory footprint (no RAM buffering).
* **Atomic Retries:** Configured with exponential backoff to handle transient issues like file-system locks or temporary CPU spikes.


#  Quick Start — Dockerized Monorepo

### Architecture Overview

Services included:

- **Video API** — Handles upload requests
- **Transcoding Worker** — Processes videos using FFmpeg
- **Redis** — Queue / messaging layer
- **MinIO** — Object storage (S3-compatible)

All services communicate internally using Docker service names (e.g., `http://minio:9000`).


### 1. Clone the Repository

```bash
git clone https://github.com/your-username/scalable_file_uploader.git
cd scalable_file_uploader
````


### 2. Environment Configuration

Create a `.env` file in the project root:

```env
# -----------------------------
# MinIO Configuration
# -----------------------------
MINIO_ENDPOINT=minio
MINIO_ROOT_USER=demo_user
MINIO_ROOT_PASSWORD=your_secure_password

# -----------------------------
# Redis Configuration
# -----------------------------
REDIS_HOST=redis
REDIS_PORT=6379

# -----------------------------
# API Configuration
# -----------------------------
PORT=3000
```

These variables are automatically injected into containers by Docker Compose.


### 3. Launch the Infrastructure

From the project root:

```bash
docker-compose -f infra/docker-compose.yml up --build -d
```

### What This Command Does

*  Builds API and Worker images using the monorepo context
*  Creates a private Docker network
*  Enables internal service-to-service communication
*  Mounts persistent volumes for MinIO
*  Starts Redis for job queue handling

Wait until logs show all services are healthy.


### 4. Service Access Points

| Service       | URL                                            | Credentials           |
| ------------- | ---------------------------------------------- | --------------------- |
| Video API     | [http://localhost:3000](http://localhost:3000) | N/A                   |
| MinIO Console | [http://localhost:9001](http://localhost:9001) | `demo_user / your_secure_password` |
| Redis         | localhost:6379                                 | N/A                   |


### 5. Test the Processing Pipeline

1. Open **Postman**
2. Send a `POST` request to:

```
http://localhost:3000/api/v1/upload
```

3. Select **form-data**
4. Add a key:

   * `video` (type: File)
   * Attach a video file


### What Happens Next?

1. API uploads the file to MinIO
2. A job is pushed into Redis
3. The Worker consumes the job
4. FFmpeg starts transcoding
5. Progress logs stream in real-time in your terminal


### Stopping the Infrastructure

To stop all services:

```bash
docker-compose -f infra/docker-compose.yml down
```

To remove volumes as well:

```bash
docker-compose -f infra/docker-compose.yml down -v
```

## Horizontal Scaling

This architecture supports horizontal scaling out of the box.

Because the API is stateless and workers consume from a shared Redis-backed BullMQ queue, we can scale services independently.

---

### Scaling Worker Replicas

To increase transcoding throughput:

```bash
docker-compose -f infra/docker-compose.yml up --scale worker=3 -d
```

* This launches multiple worker containers consuming from the same queue.
* Jobs are automatically distributed
* No duplicate processing
* BullMQ handles locking and concurrency

we can verify running containers:
```bash
docker ps
```

## Scaling API Replicas
```bash
docker-compose -f infra/docker-compose.yml up --scale api=2 -d
```

##  Notes

* All services are isolated inside Docker.
* No external Redis or MinIO installation is required.
* Internal communication uses container service names, not `localhost`.
* Persistent storage ensures MinIO data survives container restarts.

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


## License
* Distributed under the MIT License. See LICENSE for more information.
