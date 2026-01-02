// Test Firebase connection
console.log(
  "Firebase initialized:",
  firebase.apps.length > 0
);

// Test writing data
function testFirebase() {
  database
    .ref("test")
    .set({
      message: "Hello Firebase!",
      timestamp: Date.now()
    })
    .then(() => {
      console.log("Data written to Firebase");
    })
    .catch((error) => {
      console.error("Error writing to Firebase:", error);
    });
}

// Call this function to test
testFirebase();
