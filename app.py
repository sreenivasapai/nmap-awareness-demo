from flask import Flask, request, jsonify, render_template
from pathlib import Path
from datetime import datetime
import base64

app = Flask(__name__)

BASE_DIR = Path(__file__).resolve().parent

PHOTO_DIR = BASE_DIR / "captured_photos"

PHOTO_DIR.mkdir(exist_ok=True)


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

        image_bytes = base64.b64decode(
            encoded,
            validate=True
        )

        timestamp = datetime.now().strftime(
            "%Y%m%d_%H%M%S_%f"
        )

        filename = f"camera_demo_{timestamp}.jpg"

        filepath = PHOTO_DIR / filename

        filepath.write_bytes(image_bytes)

        print(f"[+] Photo saved: {filepath}")

        return jsonify({
            "success": True,
            "filename": filename
        })

    except Exception as error:

        print(f"[-] Error saving photo: {error}")

        return jsonify({
            "success": False,
            "message": "Could not save image"
        }), 500


if __name__ == "__main__":

    print()
    print("======================================")
    print("       NMAP AWARENESS DEMO")
    print("======================================")
    print()
    print("Website:")
    print("http://127.0.0.1:5000")
    print()
    print("Photos:")
    print(PHOTO_DIR)
    print()

    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )