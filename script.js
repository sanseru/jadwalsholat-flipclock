// Define map outside the functions to make it global
const map = [
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
];

// Function to pad single digits with a leading zero
function padZero(num) {
  return num.toString().padStart(2, "0");
}

// Function to split digits of a number into an array
function splitDigits(stringVal) {
  return stringVal.toString().split("").map(Number);
}

// Function to update digit classes
function printClass(value, element) {
  // Remove all previous digit classes
  element.classList.remove(...map);
  // Add the appropriate digit class
  element.classList.add("digit", map[value]);
}

// Function to update the clock
function updateClock() {
  const currentDate = new Date();
  const hours = splitDigits(padZero(currentDate.getHours()));
  const minutes = splitDigits(padZero(currentDate.getMinutes()));
  const seconds = splitDigits(padZero(currentDate.getSeconds()));

  // Select all digit elements
  const hourDigits = document.querySelectorAll(".hours .digit");
  const minuteDigits = document.querySelectorAll(".minutes .digit");
  const secondDigits = document.querySelectorAll(".seconds .digit");

  // Update hours
  printClass(hours[0], hourDigits[0]);
  printClass(hours[1], hourDigits[1]);

  // Update minutes
  printClass(minutes[0], minuteDigits[0]);
  printClass(minutes[1], minuteDigits[1]);

  // Update seconds
  printClass(seconds[0], secondDigits[0]);
  printClass(seconds[1], secondDigits[1]);
}

// Add click event to toggle digit classes
document.body.addEventListener("click", function () {
  const digits = document.querySelectorAll(".digit");
  digits.forEach((digit) => {
    digit.classList.toggle("eight");
    digit.classList.toggle("nine");
  });
});

// Initial update and then set interval
updateClock();
setInterval(updateClock, 1000);

// Function to get user's current location
function getUserLocation() {
  return new Promise((resolve, reject) => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            locale: navigator.language,
          });
        },
        (error) => {
          reject(error);
        }
      );
    } else {
      reject(new Error("Geolocation not supported"));
    }
  });
}

// Function to fetch prayer times
async function fetchPrayerTimes(latitude, longitude, locale) {
  const currentDate = new Date();
  console.log(locale);
  const formattedDate = currentDate.toLocaleDateString(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const day = String(currentDate.getDate()).padStart(2, "0");
  const month = String(currentDate.getMonth() + 1).padStart(2, "0");
  const year = currentDate.getFullYear();
  const formattedDate2 = `${day}-${month}-${year}`;

  document.getElementById("dateDisplay").textContent = formattedDate;
  //  &tune=2,5,-3,3,1,3,0,-3,0 
  // Penmabahan Tune waktu agar menyesuikan
  try {
    const response = await fetch(
      `https://api.aladhan.com/v1/timings/${formattedDate2}?latitude=${latitude}&longitude=${longitude}&method=3&tune=2,5,-3,3,1,3,0,-3,0`
    );
    const data = await response.json();
    const times = data.data.timings;

    const prayerOrder = [
      { name: "Fajr", time: times.Fajr },
      { name: "Dhuhr", time: times.Dhuhr },
      { name: "Asr", time: times.Asr },
      { name: "Maghrib", time: times.Maghrib },
      { name: "Isha", time: times.Isha },
    ];
    scheduleNotifications(prayerOrder);

    const tbody = document.getElementById("prayerTimesBody");
    tbody.innerHTML = ""; // Clear previous times

    prayerOrder.forEach((prayer, index) => {
      const nextPrayer = prayerOrder[(index + 1) % prayerOrder.length];
      const row = tbody.insertRow();
      row.innerHTML = `
            <td>${prayer.name}</td>
            <td>${prayer.time}</td>
            <td>${nextPrayer.name}</td>
        `;
    });

    const cityName = data.data.meta.timezone.split("/")[1].replace("_", " ");
    document.getElementById(
      "locationDisplay"
    ).textContent = `Prayer Times for ${cityName}`;
    const datax = document.getElementById("method-pray");
    datax.innerHTML = `Method From : ${data.data.meta.method.name}`; // Clear previous times
  } catch (error) {
    document.getElementById("prayerTimesBody").innerHTML = `
        <tr>
            <td colspan="3" class="error">Error fetching prayer times: ${error.message}</td>
        </tr>
    `;
  }
}

// Main execution
async function init() {
  try {
    const { latitude, longitude, locale } = await getUserLocation();
    await fetchPrayerTimes(latitude, longitude, locale);
  } catch (error) {
    document.getElementById("locationDisplay").textContent =
      "Location Access Denied";
    document.getElementById("prayerTimesBody").innerHTML = `
        <tr>
            <td colspan="3" class="error">Please enable location services: ${error.message}</td>
        </tr>
    `;
  }
}

document.addEventListener("DOMContentLoaded", function () {
  // Request desktop notifications permission on page load
  if (!("Notification" in window)) {
    console.log("Desktop notifications are not available in your browser.");
    return;
  }

  if (Notification.permission !== "granted") {
    Notification.requestPermission();
  }
});

function parsePrayerTime(timeString) {
  const now = new Date();
  const [hours, minutes] = timeString.split(":").map(Number);
  const prayerTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    hours,
    minutes
  );
  return prayerTime;
}

// Function to schedule notifications
function scheduleNotifications(prayerTimes) {
  // Check if notifications are supported
  if (!("Notification" in window)) {
    console.log("This browser does not support desktop notification");
    return;
  }

  // Request notification permission
  Notification.requestPermission().then(function (permission) {
    if (permission === "granted") {
      // Cancel any existing notifications
      if (window.scheduledNotifications) {
        window.scheduledNotifications.forEach(clearTimeout);
      }
      window.scheduledNotifications = [];

      // Schedule notifications for each prayer time
      prayerTimes.forEach((prayer) => {
        const prayerTime = parsePrayerTime(prayer.time);
        const notificationTime = new Date(prayerTime.getTime() - 5 * 60000); // 5 minutes before

        // Calculate time difference
        const delay = notificationTime - new Date();

        if (delay > 0) {
          const notificationId = setTimeout(() => {
            new Notification(`${prayer.name} Prayer is Coming Soon`, {
              body: `Prayer time for ${prayer.name} will start in 5 minutes`,
              icon: "images/praying.png", // Optional: Add a path to an icon
            });
          }, delay);

          // Store notification timeout to allow cancellation
          window.scheduledNotifications.push(notificationId);
        }
      });
    }
  });
}

// Run on page load
init();
