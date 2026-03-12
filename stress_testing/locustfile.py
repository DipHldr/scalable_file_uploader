import uuid
import os
from locust import HttpUser, task, between

class ArcaneVideoUser(HttpUser):
    # Simulate a user thinking for 1-4 seconds between actions
    wait_time = between(1, 4)
    host = "http://localhost:3000"
    video_ids = []

    def on_start(self):
        """
        Runs once when a virtual user is 'born'. 
        this ensures the test video exists.
        """
        self.test_video_path = "./test_video.mp4"
        
        if not os.path.exists(self.test_video_path):
            print(f"Creating dummy video: {self.test_video_path}")
            with open(self.test_video_path, "wb") as f:
                f.write(os.urandom(1024 * 1024 * 5))
    @task(3)
    def browse_videos(self):
        """Users spend most of their time browsing the list."""
        with self.client.get("/api/v1/videos", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                if data.get("videos"):
                    self.video_ids = [v['id'] for v in data['videos']]
                response.success()
            else:
                response.failure(f"Failed to fetch list: {response.status_code}")

    @task(1)
    def upload_new_video(self):
        """Simulates the multipart/form-data upload."""
        unique_id = str(uuid.uuid4())[:8]
        
        # Open the file in binary mode
        with open(self.test_video_path, "rb") as video_file:
            files = {
                'video': (self.test_video_path, video_file, 'video/mp4')
            }
            data = {
                'title': f"Stress Test Video {unique_id}"
            }

            with self.client.post("/api/v1/videos", data=data, files=files, catch_response=True) as response:
                if response.status_code == 200:
                    response.success()
                else:
                    response.failure(f"Upload crashed: {response.status_code} - {response.text}")

    @task(2)
    def fetch_playlist(self):
        # Simulates fetching the HLS playlist. 
        # Replace this with a real ID from your DB for a true test
        if self.video_ids:
            import random
            random_id = random.choice(self.video_ids)
            self.client.get(f"/api/v1/videos/{random_id}/playlist")
        else:
            # If no IDs found yet, just browse
            self.browse_videos()