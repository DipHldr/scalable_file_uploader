# Scalable Distributed Video Uploader

A robust, production-ready system designed to handle large-scale video ingestion. This project implements **resumable uploads**, **multipart processing**, and **asynchronous transcoding** to ensure high availability and reliability.



## 🚀 Features

* **Resumable Chunks:** Uses the TUS protocol to resume uploads after network failure.
* **Multipart Uploads:** Directly streams large files to cloud storage (S3/GCP) to bypass server memory limits.
* **Worker-Based Transcoding:** Decouples uploading from processing using a message queue.
* **Horizontal Scalability:** Stateless API design allows for easy scaling via Kubernetes or ECS.
* **Progress Tracking:** Real-time feedback via WebSockets or polling.

---

## 🏗️ System Architecture

The system follows a microservices-oriented flow to ensure that a 4k video upload doesn't block your entire API:

1.  **Client:** Requests a signed URL or upload ID.
2.  **API Gateway:** Validates authentication and rate limits.
3.  **Blob Storage:** Temporary storage for raw video chunks.
4.  **Event Bus:** Triggers a notification once the upload is complete.
5.  **Transcoding Worker:** Uses FFmpeg to convert videos into multiple resolutions and HLS segments.

---

## 🛠️ Tech Stack

| Component | Technology |
| :--- | :--- |
| **Backend** | Node.js|
| **Queue** | Redis + BullMQ  |
| **Storage** |Used local storage for now |
| **Processing** | FFmpeg |
| **Database** | PostgreSQL|

---

## ⚙️ Getting Started

### Prerequisites

* Docker & Docker Compose
* Node.js (v18+) or your preferred runtime

### Installation

1. **Clone the repository**
   ```bash
   git clone [https://github.com/your-username/scalable-video-uploader.git](https://github.com/your-username/scalable-video-uploader.git)
   cd scalable-video-uploader

## 🤝 Contributing
* Contributions are welcome! Please see the CONTRIBUTING.md for guidelines on how to submit pull requests, report issues, or suggest new features.

## 📄 License
* Distributed under the MIT License. See LICENSE for more information.


* **Would you like me to write the `docker-compose.yml` file to go along with this?**