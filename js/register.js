if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(function (reg) {
        console.log('service worker registered');
    }).catch(function () {
        console.log('Registration failed');
    });
} else {
    console.log('serviceworker are not supported');
}
 
