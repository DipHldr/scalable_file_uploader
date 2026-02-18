# Scalable Distributed Video Uploader (v2.0)

A high-performance, stateless video ingestion and transcoding pipeline.
This system decouples heavy I/O and compute operations from the API layer using Object Storage (MinIO) and asynchronous job queues (BullMQ).

---

## 🚀 Key Improvements in v2.0

* **MinIO Integration**
  Replaced fragile local storage with S3-compatible object storage for high availability and stateless services.

* **Persistent WSL Volumes**
  Implemented Docker bind mounts so transcoded assets persist across container restarts.

* **HLS / ABR Pipeline**
  Automated conversion of raw MP4 uploads into HLS playlists (`.m3u8`) and segments (`.ts`) for adaptive browser playback.

* **Fault-Tolerant Workers**
  BullMQ workers perform FFmpeg processing with retries and exponential backoff.

---

## 🛠 Tech Stack

| Component      | Technology            | Role                               |
| -------------- | --------------------- | ---------------------------------- |
| Backend        | Node.js (ESM)         | API & orchestration                |
| Object Storage | MinIO (S3-compatible) | Storage for raw & processed assets |
| Message Queue  | Redis + BullMQ        | Job scheduling & worker management |
| Processing     | FFmpeg                | Video transcoding & segmentation   |
| Infrastructure | Docker + WSL2         | Containerized runtime & fast I/O   |

---

## 🏗 System Architecture

The workflow is fully **stateless**:

1. **Ingestion**

   * API receives file via Multer
   * Streams upload to MinIO `raw/` bucket

2. **Queuing**

   * Job pushed to BullMQ containing only object name

3. **Processing**

   * Worker downloads raw file from MinIO
   * FFmpeg converts to HLS segments
   * Uploads processed output back to MinIO `processed/`

4. **Delivery**

   * Frontend streams `.m3u8` directly from MinIO or CDN

---

## 🔧 Installation & Setup

### 1️⃣ Infrastructure (WSL / Docker)

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

### 2️⃣ Backend Setup

```bash
npm install

# Start API server + transcoder worker
npm run start
```

---

## ⚙️ Environment Configuration

| Variable       | Default   | Description                 |
| -------------- | --------- | --------------------------- |
| MINIO_ENDPOINT | 127.0.0.1 | MinIO API endpoint          |
| REDIS_HOST     | 127.0.0.1 | Redis connection for BullMQ |
| PORT           | 3000      | Express API port            |

---

## 📝 Transcoding Pipeline Details

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

## 🛑 Important Notes for WSL Users

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

## 📈 Roadmap

* [ ] Redis-based transcoding progress tracking (WebSockets)
* [ ] Multi-resolution ABR ladders (480p / 720p / 1080p)
* [ ] Metadata persistence (MongoDB / PostgreSQL)
* [ ] CDN integration for segment delivery

---

## ⭐ Project Motivation

This project was built to explore real-world backend system design concepts:

* Stateless microservice architecture
* Distributed job processing
* Media pipeline orchestration
* Object storage integration
* Production-style infrastructure workflows

It serves as a foundation for scaling toward production-grade video platforms.

---
