# Nmap Awareness & Camera Privacy Demo

## About the Project

This project was developed as an interactive component of a cybersecurity awareness session conducted to make the session more engaging and help participants understand how browser permissions work.

Instead of limiting the session to theoretical explanations and Nmap commands, I built a web application that combines a feedback form with a browser camera-permission demonstration.

The main objective was to demonstrate the importance of understanding permission requests, reading website notices, and knowing what can happen when camera access is granted to a web application.

## Why I Built This Project

During cybersecurity awareness sessions, people often learn about privacy risks theoretically but may not fully consider how their own decisions affect their privacy.

I wanted to create an interactive demonstration that would encourage participants to think about questions such as:

- Do we understand why a website requests camera access?
- Do we read permission notices before clicking Allow?
- Does granting camera permission automatically mean that every possible use of the camera is acceptable?
- Do we understand where information collected by a website might be stored?
- How can we make more informed decisions when using websites and applications?

The project helped turn these questions into a practical discussion about browser permissions, user awareness, and responsible handling of personal data.

## Project Workflow

The application follows this general workflow:

1. **Feedback form:** Participants complete the session feedback form.
2. **Camera permission:** The browser requests camera access through its native permission interface.
3. **Camera demonstration:** If permission is granted, the application attempts to capture a camera frame.
4. **Backend processing:** The captured image is sent to the Flask backend.
5. **Image storage:** The backend saves the image locally when possible and uploads it to the configured Supabase Storage bucket.
6. **Completion screen:** The application displays an awareness explanation about camera permissions and privacy.

If camera access is denied or unavailable, the application handles the failure and proceeds to the completion screen.

**Privacy note:** Participants should be explicitly informed before the demonstration if a camera frame will be captured, transmitted to a server, and stored. Browser permission alone does not replace informed consent.

## Technologies Used

| Technology | Purpose |
|---|---|
| HTML | Structures the web page and feedback form |
| CSS | Styles the user interface |
| JavaScript | Handles form submission, camera permission, frame capture, and HTTP requests |
| Python | Implements the backend logic |
| Flask | Provides web routes and processes submitted images |
| Supabase Storage | Stores uploaded image files |
| Render | Hosts the Flask application online |
| GitHub | Stores the project source code and version history |

## How the Application Works

### 1. Frontend

The frontend contains the feedback form and the final awareness section.

JavaScript uses the browser's `getUserMedia()` API to request camera access. When permission is granted, it waits for camera video data, captures a frame using a canvas, and encodes it as a JPEG image.

The image is then sent to the backend using an HTTP POST request.

### 2. Flask Backend

The Flask application exposes the `/save-photo` endpoint.

The backend receives the image data, decodes the JPEG image, generates a filename, and attempts to save the image to the local `captured_photos` directory.

It then uploads the image to Supabase Storage using the configured project credentials.

### 3. Why I Connected Supabase

I connected Supabase because I wanted a centralized storage location for images uploaded by the deployed application.

A local folder on a hosting server is not a reliable permanent storage solution, especially when using a hosting service whose filesystem may be temporary.

Supabase Storage provides a dedicated location for uploaded files and allows the stored images to be managed through the Supabase dashboard.

The project uses the `captured_photos` storage bucket.

**Storage and privacy:** Camera images can contain personal information. The bucket should remain private, access should be restricted, and images should be retained only for an appropriate period. Service credentials must be kept in environment variables and must never be committed to GitHub.

### 4. Why I Deployed It Using Render

I used Render to make the application accessible through a public HTTPS URL rather than requiring every participant to run the project locally.

This made the demonstration easier to conduct during a live session.

The deployment uses:

- **Repository:** GitHub
- **Web framework:** Flask
- **Production server:** Gunicorn
- **Build command:** `pip install -r requirements.txt`
- **Start command:** `gunicorn app:app`

Render provides the public application endpoint, while Supabase handles image storage.

### 5. Overall Architecture

```text
Participant's Browser
        |
        v
Feedback Form
        |
        v
Browser Camera Permission
        |
        v
Camera Frame Capture
        |
        v
Flask Backend on Render
        |
        v
Image Processing
        |
        v
Supabase Storage
        |
        v
Private Image Storage
```

The browser, backend, hosting platform, and storage service each perform a different role in the workflow.

## What I Learned

Building this project provided practical experience with:

- Integrating frontend JavaScript with a Python backend.
- Using browser camera APIs and handling permission errors.
- Sending image data through HTTP requests.
- Processing Base64-encoded image data in Flask.
- Integrating a backend application with Supabase Storage.
- Managing configuration through environment variables.
- Deploying a Flask application using Render and Gunicorn.
- Maintaining source code and deployment configuration through GitHub.
- Understanding the importance of privacy notices, informed consent, and secure data storage.

## Session Outcome

The interactive demonstration encouraged participants to engage with the camera-permission prompt rather than only hearing about browser permissions in theory.

It created an opportunity to discuss trust, digital privacy, permission awareness, and the difference between granting a technical permission and understanding how the permission may be used.

The experience reinforced an important cybersecurity lesson:

**Security awareness is not just about knowing the risks. It is also about understanding the decisions we make when interacting with technology.**

## Responsible Use and Privacy

This project is intended for authorized cybersecurity education and privacy-awareness demonstrations.

- Inform participants clearly about camera capture and image storage before they participate.
- Obtain informed consent for capturing and storing images.
- Do not use the application to collect images covertly or mislead participants.
- Keep uploaded images in private storage and limit access to authorized administrators.
- Delete images when they are no longer required or when consent is withdrawn, subject to applicable obligations.
- Never publish participants' images without appropriate permission.
- Never commit Supabase secrets, API credentials, or private images to the repository.

## Project Status

The application was developed as a practical cybersecurity awareness demonstration using Flask, Supabase Storage, Render, and GitHub.

Future improvements could include explicit consent controls, a retention policy, secure administrator access, upload validation, and a participant-facing explanation of what data is collected and why.

---

**Disclaimer:** This project is an educational demonstration of browser permissions, web application deployment, and cloud storage. It is not intended for covert surveillance or unauthorized collection of personal data.
