// import { initializeApp } from "firebase/app";
// import { getMessaging } from "firebase/messaging/sw";
// import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
// import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
// import { getMessaging, onBackgroundMessage } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-sw.js";

// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
    apiKey: "AIzaSyCb4HKgNXI0zAahXVQZ959DqURWZwtYvf4",
    authDomain: "hackathon404-bf0c3.firebaseapp.com",
    projectId: "hackathon404-bf0c3",
    storageBucket: "hackathon404-bf0c3.appspot.com",
    messagingSenderId: "807052214718",
    appId: "1:807052214718:web:f210b8a3a4fd6c8d30f9ef",
    measurementId: "G-00QE2WG4JL"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log(
      '[firebase-messaging-sw.js] Received background message ',
      payload
    );
    // Customize notification here
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
      body: payload.notification.body,
    //   icon: '/firebase-logo.png'
    };
  
    self.registration.showNotification(notificationTitle, notificationOptions);
  });


// // Initialize the Firebase app in the service worker by passing in
// // your app's Firebase config object.
// // https://firebase.google.com/docs/web/setup#config-object
// const firebaseApp = firebase.initializeApp({
//     apiKey: "AIzaSyCb4HKgNXI0zAahXVQZ959DqURWZwtYvf4",
//     authDomain: "hackathon404-bf0c3.firebaseapp.com",
//     projectId: "hackathon404-bf0c3",
//     storageBucket: "hackathon404-bf0c3.appspot.com",
//     messagingSenderId: "807052214718",
//     appId: "1:807052214718:web:f210b8a3a4fd6c8d30f9ef",
//     measurementId: "G-00QE2WG4JL"
// });

// // Retrieve an instance of Firebase Messaging so that it can handle background
// // messages.
// const messaging = getMessaging(firebaseApp);

// onBackgroundMessage(messaging, (payload) => {
//     console.log('[firebase-messaging-sw.js] Received background message ', payload);
//     // Customize notification here
//     const notificationTitle = 'Background Message Title';
//     const notificationOptions = {
//       body: 'Background Message body.',
//       icon: '/firebase-logo.png'
//     };
  
//     self.registration.showNotification(notificationTitle,
//       notificationOptions);
//   });
  


// //백그라운드 서비스워커 설정
// messaging.onBackgroundMessage(messaging, (payload) => {
//     console.log(
//       "[firebase-messaging-sw.js] Received background message ",
//       payload
//     );
    
//     // Customize notification here
//     const notificationTitle = "Background Message Title";
//     const notificationOptions = {
//       body: payload,
//       icon: "/firebase-logo.png",
//     };
    
//     self.registration.showNotification(notificationTitle, notificationOptions);
//   });
