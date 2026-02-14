# Scalable Distributed Video Uploader

A robust, production-ready system designed to handle large-scale video ingestion. This project implements **resumable uploads**, **multipart processing**, and **asynchronous transcoding** to ensure high availability and reliability.



## Features

* **Resumable Chunks:** Uses the TUS protocol to resume uploads after network failure.
* **Multipart Uploads:** Directly streams large files to storage.
* **Worker-Based Transcoding:** Decouples uploading from processing using a message queue.
* **Horizontal Scalability:** Stateless API design allows for easy scaling via Kubernetes or ECS.
* **Progress Tracking:** Real-time feedback via WebSockets or polling.

---

## System Architecture

The system follows a microservices-oriented flow to ensure that a 4k video upload doesn't block your entire API:

1.  **Client:** Requests a signed URL or upload ID.
2.  **API Gateway:** Validates authentication and rate limits.
3.  **Blob Storage:** Temporary storage for raw video chunks.
4.  **Event Bus:** Triggers a notification once the upload is complete.
5.  **Transcoding Worker:** Uses FFmpeg to convert videos into multiple resolutions and HLS segments.

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js|
| **Queue** | Redis + BullMQ  |
| **Storage** |Used local storage for now |
| **Processing** | FFmpeg |

---

---

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

## Database Schema

| Table | Column | Type | Description |
| :--- | :--- | :--- | :--- |
| **Videos** | `id` | UUID | Primary key for the video |
| | `status` | Enum | `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED` |
| | `path` | String | Location of the original raw file |
| **Jobs** | `job_id` | String | The ID returned by BullMQ/Redis |
| | `progress` | Integer | 0-100 percentage tracking |

---

## Getting Started

### Prerequisites

* Node.js (v18+) or your preferred runtime
* FFmpeg 
* docker

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/scalable-video-uploader.git](https://github.com/your-username/scalable-video-uploader.git)
   cd scalable-video-uploader
   ```
## Command to Run The Project
``` bash
docker run --name < any name > -p 6379:6379 -d redis
npm run start
```
## Contributing
* Contributions are welcome!

## License
* Distributed under the MIT License. See LICENSE for more information.
