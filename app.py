from flask import Flask, request, jsonify, render_template
from pathlib import Path
from datetime import datetime
import base64
import os
from dotenv import load_dotenv
from supabase import create_client, Client
load_dotenv()

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent
PHOTO_DIR = BASE_DIR / "captured_photos"
PHOTO_DIR.mkdir(exist_ok=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
    print("[+] Supabase connected")
else:
    print("[!] Supabase environment variables are missing")


@app.route("/")
def home():
    return render_template("index.html")


@app.post("/save-photo")
def save_photo():
    data = request.get_json(silent=True)

    if not data:
        return jsonify({
            "success": False,
            "message": "No data received"
        }), 400

    image_data = data.get("image")

    if not image_data:
        return jsonify({
            "success": False,
            "message": "No image received"
        }), 400

    try:
        header, encoded = image_data.split(",", 1)

        if "image/jpeg" not in header:
            return jsonify({
                "success": False,
                "message": "Invalid image format"
            }), 400

        image_bytes = base64.b64decode(encoded, validate=True)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
        filename = f"camera_demo_{timestamp}.jpg"

        # Local copy for local development/testing
        local_path = PHOTO_DIR / filename
        local_path.write_bytes(image_bytes)

        print(f"[+] Local copy saved: {local_path}")

        # Upload to Supabase
        if supabase is None:
            return jsonify({
                "success": False,
                "message": "Supabase is not configured"
            }), 500

        supabase.storage.from_("captured_photos").upload(
            filename,
            image_bytes,
            {
                "content-type": "image/jpeg",
                "upsert": "false"
            }
        )

        print(f"[+] Photo uploaded to Supabase: {filename}")

        return jsonify({
            "success": True,
            "filename": filename
        })

    except Exception as error:
        print(f"[-] Error saving/uploading photo: {error}")

        return jsonify({
            "success": False,
            "message": "Could not save image"
        }), 500


if __name__ == "__main__":
    print("NMAP AWARENESS DEMO")
    print("Website: http://127.0.0.1:5000")
    print("Photos:", PHOTO_DIR)

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )