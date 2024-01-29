// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: "AIzaSyCiTASyv4ikDvjz3nRgbGNiUAn-Z4MOLlI",
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

static_Img = document.createElement('img');
static_Img.src = 'https://maps.googleapis.com/maps/api/staticmap?center=' + "38.534531215, -77.034331215" + '&zoom=' + "19" + '&maptype=satellite' + '&scale=1' + '&size=100x100' +
    '&format=png32' + '&key=AIzaSyCiTASyv4ikDvjz3nRgbGNiUAn-Z4MOLlI&v=3.exp&libraries=places';
var dummy_URL = static_Img.src;
console.log('dummy_URL: ', dummy_URL)
var filename = firebase.storage().ref('satellite_screenshots/' + '_dummy');
fetch(dummy_URL).then(res => {
    return res.blob();
}).then(blob => {
    filename.put(blob)
}).catch(error => {
    console.error(error);
});