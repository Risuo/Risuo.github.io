var map;
var centerUrl;
var mapZoom;
var static_Img;
var blob;
var bounds;
var overlay;
var subBounds;
var image;
var predictionOverlay;
var predictionBounds;
var count;
var apiKey = "AIzaSyCiTASyv4ikDvjz3nRgbGNiUAn-Z4MOLlI";
let shouldIlogDots = true;


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: apiKey,
    authDomain: "sketcher-app-test-engine.firebaseapp.com",
    projectId: "sketcher-app-test-engine",
    storageBucket: "sketcher-app-test-engine.appspot.com",
    messagingSenderId: "987456894174",
    appId: "1:987456894174:web:254008b41a47334a207e4f",
    measurementId: "G-XSHW4JDZQ4"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Send a dummy image to GCP Storage to begin (if necessary) cold-start loading.
// This appears to reduce lag-time between selection & display availability for the first selection
// from ~25seconds down to ~8-12seconds
//console.log('Provisioning Cloud Run Instance')
// static_Img = document.createElement('img');
// static_Img.src = 'https://maps.googleapis.com/maps/api/staticmap?center=' + "38.534531215, -77.034331215" + '&zoom=' + "19" + '&maptype=satellite' + '&scale=1' + '&size=100x100' +
//     '&format=png32' + '&key=AIzaSyCiTASyv4ikDvjz3nRgbGNiUAn-Z4MOLlI&v=3.exp&libraries=places';
// var dummy_URL = static_Img.src;
// console.log('dummy_URL: ', dummy_URL)
// var filename = firebase.storage().ref('satellite_screenshots/' + '_dummy');
// fetch(dummy_URL).then(res => {
//     return res.blob();
// }).then(blob => {
//     filename.put(blob)
// }).catch(error => {
//     console.error(error);
// });

function appendScript(url, callback) {
    var script = document.createElement("script")
    script.type = "text/javascript";
    if (script.readyState) {  //IE
        script.onreadystatechange = function () {
            if (script.readyState === "loaded" || script.readyState === "complete") {
                script.onreadystatechange = null;
                callback();
            }
        };
    } else {  //Others
        script.onload = function () {
            callback();
        };
    }
    script.src = url;
    document.getElementsByTagName("head")[0].appendChild(script);
}


const msg1 = "> Welcome!"
const msg2 = "> This is an interactive Detectron2 driven Building Identification project."
const msg3 = "> You can either input an address above, or click and drag below."
const msg4 = "> If you are the first user in a while, there will be a slight (~30 seconds) "
const msg5 = "  Cold-Start delay to your first request."
const msg6 = "> Subsequent requests should generally be on the order of 10 seconds."
const msg7 = "> "
const msg8 = "> Enjoy, and thank you for visiting! - Peter Scott Miller."
const introduction = [msg1, msg2, msg3, msg4, msg5, msg6, msg7, msg8];
const cancelIntroduction = {cancelled: false};

async function asyncCharacterPrint(messageArray, cancelThisMessage, timing) { // (array of strings, boolean, integer)
    await (async () => {
        for (const line in messageArray) {
            for (const character in messageArray[line]) {
                console.log(messageArray[line][character]);
                await new Promise(res => setTimeout(res, timing));
                if (cancelThisMessage.cancelled) break;
            }
            if (cancelThisMessage.cancelled) break;
            console.log("<br/>");
        }
    })();
}

function characterPrint(messageArray, timing) {
    let currentIndex = 0;

    function printMessage() {
        if (currentIndex >= messageArray.length) {
            return;
        }
        const message = messageArray[currentIndex];

        for (const character of message) {
            console.log(character);
        }
        console.log("<br/>");
        currentIndex++;
        setTimeout(printMessage, timing);
    }

    printMessage();
}

function appendMap() {
    appendScript("https://maps.googleapis.com/maps/api/js?key=" + apiKey + "&v=3.exp&libraries=places", function () {
        $("#activate-map").css("display", "none");
        asyncCharacterPrint(introduction, cancelIntroduction, 30);
        // (async () => {
        //     for (message in messages) {
        //         // console.log(messages[message])
        //         for (letter in messages[message]) {
        //             console.log(messages[message][letter]);
        //             await new Promise(res => setTimeout(res, 50));
        //             if (cancelIntroduction) break;
        //         }
        //         console.log("<br/>");
        //         if (cancelIntroduction) break;
        //     }
        //
        // })();
        initialize();
        btnMLBegin.classList.remove('hide');
    });
}

async function logDots() {
    console.log('> ');
    const intervalId = setInterval(() => {
        if (shouldIlogDots) {
            console.log('.');
        } else {
            clearInterval(intervalId); // Stop logging dots when stopLogging is true
        }
    }, 500);
}

function initialize() {
    firebase.auth().signOut()
    firebase.auth().signInAnonymously(); // Sets a UID upon appendMap (activate-map button click)
    let count = 0;


    var latlng = new google.maps.LatLng(39.037278, -77.179171);
    var myOptions = {
        zoom: 19,
        loading: 'async',
        center: latlng,
        mapTypeId: 'satellite',
        gestureHandling: 'greedy',
        streetViewControl: false,
        scaleControl: true,
        fullscreenControl: false,
        tilt: 0,
        rotateControl: false, // This line keeps the tilt option from appearing when the viewport is changed
        mapTypeControlOptions: {
            mapTypeIds: ['']
        }
    };

    // add the map to the map placeholder
    map = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
    map.setTilt(0);

    //const coordsDiv = document.getElementById("coords");
    //const toggleDOMButton = document.createElement("button");
    //toggleDOMButton.textContent = "Toggle Prediction Overlay";
    //toggleDOMButton.classList.add("custom-map-control-buttom");
    //map.controls[google.maps.ControlPosition.TOP_RIGHT].push(toggleDOMButton);

    const input = document.getElementById("pac-input");

    const autocomplete = new google.maps.places.Autocomplete(input);
    autocomplete.setFields(['geometry'])

    const infowindow = new google.maps.InfoWindow();
    const infowindowContent = document.getElementById("infowindow-content");
    infowindow.setContent(infowindowContent);
    const marker = new google.maps.Marker({
        map,
        anchorPoint: new google.maps.Point(0, -29),
    });
    autocomplete.addListener("place_changed", () => {
        infowindow.close();
        marker.setVisible(false);
        const place = autocomplete.getPlace();
        //console.log(place)
        //console.log('Coordinates:')

        if (!place.geometry || !place.geometry.location) {
            window.alert("No details available for input: '" + place.name + "'");
            return;
        }

        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
            map.setZoom(19);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(19);
        }
        marker.setPosition(place.geometry.location);
        marker.setVisible(true);
        infowindow.open(marker);
    });

    //map.addListener("mousemove", (event) => {
    //coordsDiv.textContent =
    //"Center: " +
    //map.getCenter() +
    //bounds = map.getBounds()
    //console.log(bounds.getNorthEast().lat())
    //" Zoom: " +
    //map.getZoom()
    // +
    //" lat: " +
    //(event.latLng.lat()) +
    //", " +
    //"lng: " +
    //(event.latLng.lng());
    //});

    bounds = map.getBounds();
    map.addListener("click", (event) => {
        centerUrl = map.getCenter().toUrlValue();
        mapZoom = map.getZoom();
        bounds = map.getBounds();
    });

    map.addListener("mouseout", (event) => {
        centerUrl = map.getCenter().toUrlValue();
        mapZoom = map.getZoom();
        bounds = map.getBounds();
    });

    map.addListener("dragend", (event) => {
        centerUrl = map.getCenter().toUrlValue();
        mapZoom = map.getZoom();
        bounds = map.getBounds();
    });

    map.addListener("zoom_changed", (event) => {
        centerUrl = map.getCenter().toUrlValue();
        mapZoom = map.getZoom();
        bounds = map.getBounds();
    });

    map.addListener("idle", (event) => {
        centerUrl = map.getCenter().toUrlValue();
        mapZoom = map.getZoom();
        bounds = map.getBounds();
    });


    const btnMLBegin = document.getElementById('btnMLBegin')

    // Click button to grab static image & display based on variables on dynamic map & upload to Firebase storage & retrieve URL for static map

    btnMLBegin.addEventListener('click', e => {

        cancelIntroduction.cancelled = true;

        //console.log(count)
        //console.log("Center coordinates: ");
        //console.log(centerUrl)
        //console.log("<br /> Map Zoom:")
        //console.log(mapZoom)
        //console.log("<br />")
        //btnMLShow.classList.remove('hide');
        //btnMLShow.classList.add('hide');

        count++;
        predictionBounds = {
            north: bounds.getNorthEast().lat(),
            south: bounds.getSouthWest().lat(),
            east: bounds.getNorthEast().lng(),
            west: bounds.getSouthWest().lng()
        };

        clear_logs();
        btnMLBegin.classList.add('hide');

        log_container_2.classList.add('hide')
        log_card_2.classList.add('hide')
        log_2.classList.add('hide');

        //console.log('Bounds of Viewport = Bounds of Static Img:', predictionBounds)
        // static_Img = document.createElement('img');
        // static_Img.src = 'https://maps.googleapis.com/maps/api/staticmap?center=' + centerUrl + '&zoom='
        //     + mapZoom + '&maptype=satellite' + '&scale=2' + '&size=640x640' +
        //     '&format=png32' + '&key=' + apiKey + '&v=3.exp&libraries=places&loading=async';
        // var static_Url = static_Img.src;
        var static_Url = 'https://maps.googleapis.com/maps/api/staticmap?center=' + centerUrl + '&zoom='
            + mapZoom + '&maptype=satellite' + '&scale=2' + '&size=640x640' +
            '&format=png32' + '&key=' + apiKey + '&v=3.exp&libraries=places&loading=async';
        if (count === 1) console.log("<br/>");


        // old working version
        // (async () => {
        //     await asyncCharacterPrint(transferringMessage, cancelTransferring, 30);
        //
        //     // console.log("<br/><br/>> Static Image " + count + " identified. <br /> > Center coordinates: " + centerUrl + ".<br /> " +
        //     //     "> Zoom Level: " + mapZoom + ".<br /> > Transferring image to ML processing container. <br />> ")
        //
        //     //console.log('static_Img URL:', static_Url)
        //     var uid = firebase.auth().currentUser.uid;
        //     //console.log(uid)
        //     var filename_store = firebase.storage().ref('satellite_screenshots/' + uid + '_' + count);
        //
        //     fetch(static_Url).then(res => {
        //         return res.blob();
        //     }).then(blob => {
        //         filename_store.put(blob)
        //
        //             // .then(function (snapshot) { // actually, might be able to remove after the put(blob) bit.
        //             //     return snapshot.ref.getDownloadURL()
        //             // })
        //             .then(url => { // This and the next 2 lines, starting at .then ending with }) can be removed once debugging is done
        //                 // if (count === 1) {
        //                 //     console.log("<br />> Possible cold-start mode detected. Additional time for processing may be " +
        //                 //         "required. Subsequent requests will (generally) be quicker. See details page for more information.")
        //                 // }
        //                 let msg1 = "> Image received by ML processing container.";
        //                 let msg2 = "> Beginning ML Processing.";
        //                 let imageReceived = [msg1, msg2];
        //                 let cancelImageReceived = {cancelled: false};
        //                 asyncCharacterPrint(imageReceived, cancelImageReceived, 30)
        //                 // console.log("<br />> Image received by ML processing container.<br />> Beginning ML Processing.<br />> ");
        //
        //             })
        //
        //     }).catch(error => {
        //         console.error(error);
        //     });
        // })();


        // current working version
        // (async () => {
        //     await asyncCharacterPrint(transferringMessage, cancelTransferring, 30);
        //     var uid = firebase.auth().currentUser.uid;
        //     var filename_store = firebase.storage().ref('satellite_screenshots/' + uid + '_' + count);
        //
        //
        //     const response = await fetch(static_Url);
        //     const blob = await response.blob();
        //
        //     await filename_store.put(blob);
        //
        //     // Uncomment the next lines if you need the download URL
        //     // const url = await filename_store.getDownloadURL();
        //     // console.log('Download URL:', url);
        //
        //     let msg1 = "> Image received by ML processing container.";
        //     let msg2 = "> Beginning ML Processing.";
        //     let imageReceived = [msg1, msg2];
        //     let cancelImageReceived = {cancelled: false};
        //     await asyncCharacterPrint(imageReceived, cancelImageReceived, 30);
        // })();


        (async () => {
            // Concurrently start fetching and storing the file
            const fetchAndStorePromise = (async () => {
                var uid = firebase.auth().currentUser.uid;
                var filename_store = firebase.storage().ref('satellite_screenshots/' + uid + '_' + count);

                const response = await fetch(static_Url);
                const blob = await response.blob();
                await filename_store.put(blob);

                // Uncomment the next lines if you need the download URL
                // const url = await filename_store.getDownloadURL();
                // console.log('Download URL:', url);
            })();

            // Concurrently start the first asyncCharacterPrint
            let msg1b = "> Static Image " + count + " identified."
            let msg2b = "> Center coordinates: " + centerUrl + "."
            let msg3b = "> Zoom Level: " + mapZoom + "."
            let msg4b = "> Transferring image to ML processing container. "
            let transferringMessage = [msg1b, msg2b, msg3b, msg4b];
            let cancelTransferring = {cancelled: false};

            const asyncPrintPromise = asyncCharacterPrint(transferringMessage, cancelTransferring, 30);

            // Wait for both promises to complete before proceeding
            await Promise.all([fetchAndStorePromise, asyncPrintPromise]);

            // Now, proceed to the second asyncCharacterPrint
            let msg1 = "> Image received by ML processing container.";
            let msg2 = "> Beginning ML Processing.";
            let imageReceived = [msg1, msg2];
            let cancelImageReceived = {cancelled: false};
            const shouldILogDots = asyncCharacterPrint(imageReceived, cancelImageReceived, 30);

            await Promise.all([fetchAndStorePromise, asyncPrintPromise, shouldILogDots]);
            await logDots();

        })();


        //btnMLShow.addEventListener('click',    e => {

        var uid = firebase.auth().currentUser.uid;
        map.setTilt(0);

        predicted_Img = document.createElement('img');

        var storage = firebase.storage();
        var predicted_Img_Path = storage.refFromURL('gs://sketcher-app-test-engine.appspot.com/processed_images/'
            + uid + '_' + count + '.png')


        var tid = setInterval(function () {
            pull_predicted_image()
        }, 500);

        function pull_predicted_image() {
            predicted_Img_Path.getDownloadURL().then((url) => {
                shouldIlogDots = false;
                console.log("<br/>")
                predicted_Img.src = url
                //console.log('Predicted_Img uploaded here:', predicted_Img.src)
                predictionOverlay = new google.maps.GroundOverlay(
                    predicted_Img.src, predictionBounds
                );
                clearInterval(tid)
                predictionOverlay.setMap(map);
                let msgc1 = "> Best results tend to be in clearer (less tree-cover) higher-resolution areas, ";
                let msgc2 = "> (not all satellite imagery sources are of uniform quality).";
                let msgc3 = "> Processed Map Overlay displayed below."
                let firstImageDisplayed = [msgc1, msgc2, msgc3];
                let imageDisplayed = [msgc3]
                let cancelImageDisplayed = {cancelled: false};
                if (count === 1) {
                    asyncCharacterPrint(firstImageDisplayed, cancelImageDisplayed, 30)
                } else asyncCharacterPrint(imageDisplayed, cancelImageDisplayed, 30);


                // if (count === 1) {
                //     setTimeout(() => {
                //         console.log("<br /> > Best results tend to be in clearer (less tree-cover) higher-resolution " +
                //             "areas (satellite imagery sources are not of uniform quality).");
                //     }, 200);
                // }
                // setTimeout(() => {
                //     console.log("<br /> > Predicted Image displayed below. <br /><br />");
                // }, 400);
                // // setTimeout(() => {
                // //     console.log("<br /> > For a pre-selected 'high performance' result, click 'Pre-selected' below.");
                // // }, 600);
                // setTimeout(() => {
                //     predictionOverlay.setMap(map);
                // }, 500);

                //btnMLShow.classList.remove('hide')


                if (mapZoom < 18) {
                    log_container_2.classList.remove('hide')
                    log_card_2.classList.remove('hide')
                    log_2.classList.remove('hide');
                    var logger2 = document.getElementById('log_2');
                    let errorZoomMessage = "> Try zooming in closer. Best results tend to be at Zoom Levels 19 and 20.";
                    (async () => {
                        for (let character in errorZoomMessage) {
                            logger2.innerHTML += errorZoomMessage[character];
                            await new Promise(res => setTimeout(res, 40));
                        }
                    })();
                    // logger2.innerHTML += "> Try zooming in closer. Best results tend to be at Zoom Levels 19 and 20.";
                }
                if (count === 1) {
                    setTimeout(() => {

                        btnMLBegin.classList.remove('hide');
                    }, 6150);
                } else {
                    setTimeout(() => {
                        btnMLBegin.classList.remove('hide');
                    }, 1250);
                }

                //log.classList.add('hide');
                //log_container.classList.add('hide');
                //log_card.classList.add('hide')
            }).catch(error => {
            });
        }

        setTimeout(function () {
            clearInterval(tid)
        }, 100000)
    });
}

function clear_logs() {
    //$('#log').empty()
    $('#log_2').empty()
    shouldIlogDots = true;
}

(function () {
    if (!console) {
        console = {};
    }
    // var old = console.log;
    var logger = document.getElementById('log');
    var box = document.getElementById('log_container');
    console.log = function (message) {
        if (typeof message == 'object') {
            //logger.innerHTML += (JSON && JSON.stringify ? JSON.stringify(message) : String(message)); //+ '<br />';
        } else {
            logger.innerHTML += message; // + '<br />';
            box.scrollTop = box.scrollHeight;
        }
    }
})();


//showPrediction.addEventListener('click', e => {
//var uid = firebase.auth().currentUser.uid;
//console.log("Click registered")
//predicted_Img = document.createElement('img');
//predicted_Img.src = 'https://storage.cloud.google.com/sketcher-app-test-engine.appspot.com/satelite_screenshots/' + uid + '_test_out_' + count + '.png'
//document.getElementById('staticGrabSpot').appendChild(predicted_Img);
//});
//toggleDOMButton.addEventListener('click', e => {
//    var uid = firebase.auth().currentUser.uid;
//    map.setTilt(0);
//    console.log("Click registered on toggleDom Btn")
//    predicted_Img = document.createElement('img');
//    var storage = firebase.storage();
//    var predicted_Img_Path = storage.refFromURL('gs://sketcher-app-test-engine.appspot.com/satelite_screenshots/' + uid + '_test_out_' + count + '.png')
//    console.log(predicted_Img_Path)
//    predicted_Img_Path.getDownloadURL()
//        .then((url) => {
//            predicted_Img.src = url
//            console.log('testing here:', predicted_Img.src)
//            predictionOverlay = new google.maps.GroundOverlay(
//                predicted_Img.src, predictionBounds
//            );
//            predictionOverlay.setMap(map);
//        })
//predicted_Img.src = 'https://storage.cloud.google.com/sketcher-app-test-engine.appspot.com/satelite_screenshots/' + uid + '_test_out_' + count + '.png'
//document.getElementById('staticGrabSpot').appendChild(predicted_Img);
//});
//const btnLogin = document.getElementById('btnLogin');
//const btnLogout = document.getElementById('btnLogout');
//const btnUpload = document.getElementById('fileButton');
//const uploader = document.getElementById('uploader');
//const showPrediction = document.getElementById('showPrediction')
//const toggleDOM = document.getElementById('toggleDOM')

// Click login event listener
// btnLogin.addEventListener('click', e => {
// firebase.auth().signInAnonymously();
// });
// Click logout event listener
// btnLogout.addEventListener('click', e => {
// firebase.auth().currentUser.delete();
// });
// firebase.auth().onAuthStateChanged(firebaseUser => {
//   if(firebaseUser) {
//     var uid = firebaseUser.uid;
//     console.log(uid);
//     btnLogout.classList.remove('hide');
//btnUpload.classList.remove('hide');
//uploader.classList.remove('hide');
// } else {
//   btnLogout.classList.add('hide');
//btnUpload.classList.add('hide');
//uploader.classList.add('hide');
//   }
// });

// // Code for manually uploading
// const fileButton = document.getElementById('fileButton');
// // Listen for file selection
// fileButton.addEventListener('change', function(e) {
// // Get file
// // Create a storage ref
//   var file = e.target.files[0];
//   var uid = firebase.auth().currentUser.uid;
//   var storageRef = firebase.storage().ref('satelite_screenshots/' + uid);
//   //var storageRef = firebase.storage().ref('satelite_screenshots/' + uid + get_url_extension(file.name));
//   // Upload file
//   var task = storageRef.put(file);
//   // Update progress bar
//   task.on('state_changed',
//     function progress(snapshot){
//       var percentage = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
//       uploader.value = percentage;
//     },
//     function error(err) {
//     },
//     function complete() {
//       storageRef.getDownloadURL().then(function(url) {
//           var test = url;
//           document.querySelector('img').src = test;
//       }).catch(function(error) {
//       });
//     }
//   );
// });




