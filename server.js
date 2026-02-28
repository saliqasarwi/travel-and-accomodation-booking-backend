const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");
const morgan = require("morgan");
// const bodyParser = require("body-parser");
const app = express();
const PORT = 5000;

const swaggerJSDoc = require("swagger-jsdoc");
const swaggerUi = require("swagger-ui-express");
// Swagger Setup
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Hotel API",
      version: "1.0.0",
      description: "A simple Express API to manage hotels and bookings",
    },
  },
  apis: ["./server.js"], // Adjust if your routes are in a different file
};

const swaggerSpec = swaggerJSDoc(swaggerOptions);

// Serve Swagger UI
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const getJsonData = (fileName) => {
  const filePath = path.join(__dirname, "data", fileName);
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
};

const deleteJsonData = (fileName, key, value) => {
  const filePath = path.join(__dirname, "data", fileName);
  if (!fs.existsSync(filePath)) {
    console.log("File not found.");
    return;
  }

  const fileContent = fs.readFileSync(filePath, "utf8");
  let data = fileContent ? JSON.parse(fileContent) : [];
  console.log(data);
  const newData = data.filter((item) => item[key] !== Number(value));
  if (newData.length === data.length) {
    console.log("No matching record found to delete.");
    return;
  }
  fs.writeFileSync(filePath, JSON.stringify(newData, null, 2), "utf8");
  console.log(`Deleted record with ${key}: ${value}`);
};

const writeJsonData = (fileName, newData, uniqueKey = "id") => {
  const filePath = path.join(__dirname, "data", fileName);
  let data = [];
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    data = fileContent ? JSON.parse(fileContent) : [];
  }
  const index = data.findIndex(
    (item) => item[uniqueKey] === newData[uniqueKey]
  );

  if (index !== -1) {
    data[index] = { ...data[index], ...newData };
  } else {
    data.push(newData);
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
};

app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.post("/api/auth/authenticate", (req, res) => {
  if (req.body.userName == "user" && req.body.password == "user") {
    res.json({
      authentication:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMiIsImdpdmVuX25hbWUiOiJNYXplbiIsImZhbWlseV9uYW1lIjoiU2FtaSIsInVzZXJUeXBlIjoiVXNlciIsIm5iZiI6MTczMjExNTQyMCwiZXhwIjoxNzMyMTE5MDIwLCJpc3MiOiJodHRwczovL2FwcC1ob3RlbC1yZXNlcnZhdGlvbi13ZWJhcGktdWFlLWRldi0wMDEuYXp1cmV3ZWJzaXRlcy5uZXQifQ.SosxseAWXFuoNqSkeeurjet6FiqEX-4Mheo4o1DbCYc",
      userType: "User",
    });
  } else if (req.body.userName == "admin" && req.body.password == "admin") {
    res.json({
      authentication:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiMSIsImdpdmVuX25hbWUiOiJNb2hhbWFkIiwiZmFtaWx5X25hbWUiOiJNaWxoZW0iLCJ1c2VyVHlwZSI6IkFkbWluIiwibmJmIjoxNzMyNjQ4ODU5LCJleHAiOjE3MzI2NTI0NTksImlzcyI6Imh0dHBzOi8vYXBwLWhvdGVsLXJlc2VydmF0aW9uLXdlYmFwaS11YWUtZGV2LTAwMS5henVyZXdlYnNpdGVzLm5ldCJ9.IJ-ekmzr0FF1oNSrjDwElMZhoyc42H7nFq-3bWKuG8Q",
      userType: "Admin",
    });
  } else {
    res.status(401).json({ message: "Invalid user or password" });
  }
});

app.get("/api/home/users/2/recent-hotels", (req, res) => {
  res.json(getJsonData("recentHotels.json"));
});

app.get("/api/home/featured-deals", (req, res) => {
  res.json(getJsonData("featuredDeals.json"));
});

app.get("/api/home/destinations/trending", (req, res) => {
  res.json(getJsonData("trending.json"));
});

app.get("/api/hotels", (req, res) => {
  let hotels = getJsonData("hotels.json");

  const { hotelName, city } = req.query;

  if (hotelName) {
    hotels = hotels.filter((h) =>
      h.name?.toLowerCase().includes(hotelName.toLowerCase())
    );
  }

  if (city) {
    hotels = hotels.filter((h) =>
      h.city?.toLowerCase().includes(city.toLowerCase())
    );
  }

  res.json(hotels);
});

app.get("/api/hotels/:id/gallery", (req, res) => {
  res.json(getJsonData("gallery.json"));
});

app.get("/api/hotels/:id", (req, res) => {
  const hotels = getJsonData("hotels.json");
  const id = Number(req.params.id);

  const hotel = hotels.find((h) => Number(h.id) === id);
  if (!hotel) return res.status(404).json({ message: "Hotel not found" });
  res.json({
    hotelName: hotel.hotelName,
    location: hotel.location,
    description: hotel.description,
    amenities: hotel.amenities ?? [],
    starRating: hotel.starRating,
    latitude: hotel.latitude,      
    longitude: hotel.longitude,
    availableRooms:hotel.availableRooms,
    imageUrl: hotel.imageUrl,
  });
});


app.get("/api/hotels/:id/available-rooms", (req, res) => {
  const hotelId=Number(req.params.id);
  const rooms=getJsonData("rooms.json");
  res.json(rooms.filter((r)=>Number(r.hotelId)===hotelId&&r.availability));
});

app.get("/api/hotels/:id/reviews", (req, res) => {
  res.json(getJsonData("reviews.json"));
});

app.post("/api/bookings", (req, res) => {
  const bookingId = Date.now();

  const booking = {
    bookingId,
    confirmationNumber: `CNF-${bookingId}`,
    bookingStatus: "Confirmed",
    createdAt: new Date().toISOString(),
    request: req.body,
  };

  const filePath = path.join(__dirname, "data", "bookings.json");
  fs.writeFileSync(filePath, JSON.stringify(booking, null, 2), "utf8");

  res.json({
    bookingId,
    confirmationNumber: booking.confirmationNumber,
  });
});



app.get("/api/bookings/:id", (req, res) => {
  const data = getJsonData("bookings.json");
  const id = Number(req.params.id);

  if (!data || Number(data.bookingId) !== id) {
    return res.status(404).json({ message: "Booking not found" });
  }

  res.json(data);
});

app.get("/api/home/search", (req, res) => {
  console.log("SEARCH req.query =", req.query);

  let { city, adults, children, numberOfRooms } = req.query; 

  // normalize
  city = typeof city === "string" ? city.trim() : city;

  // IMPORTANT: if frontend accidentally sends "undefined" or "null" as strings
  if (city === "undefined" || city === "null" || city === "") {
    city = undefined;
  }

  const rooms = getJsonData("searchResults.json");
  let filteredResults = rooms;

  if (city) {
    filteredResults = filteredResults.filter(
      (room) =>
        typeof room.cityName === "string" &&
        room.cityName.toLowerCase().includes(city.toLowerCase())
    );
  }

  // convert to numbers (because req.query values are strings)
  const adultsNum = adults != null ? Number(adults) : undefined;
  const childrenNum = children != null ? Number(children) : undefined;
  const roomsNum = numberOfRooms != null ? Number(numberOfRooms) : undefined;

  if (!Number.isNaN(adultsNum) && adultsNum !== undefined) {
    filteredResults = filteredResults.filter((room) => room.numberOfAdults >= adultsNum);
  }
  if (!Number.isNaN(childrenNum) && childrenNum !== undefined) {
    filteredResults = filteredResults.filter((room) => room.numberOfChildren >= childrenNum);
  }
  if (!Number.isNaN(roomsNum) && roomsNum !== undefined) {
    filteredResults = filteredResults.filter((room) => room.numberOfRooms >= roomsNum);
  }

  console.log("SEARCH results count =", filteredResults.length);
  res.json(filteredResults);
});

app.get("/api/search-results/amenities", (req, res) => {
  res.json(getJsonData("amenities.json"));
});
app.get("/api/hotels/:id/rooms", (req, res) => {
  const rooms = getJsonData("rooms.json");
  const id = Number(req.params.id);

  const hotelRooms = rooms.filter((r) => Number(r.hotelId) === id);
  res.json(hotelRooms);
});
app.get("/api/cities", (req, res) => {
  let cities = getJsonData("cities.json");

  const { cityName, country } = req.query;

  if (cityName) {
    cities = cities.filter((c) =>
      c.name?.toLowerCase().includes(cityName.toLowerCase())
    );
  }

  if (country) {
    cities = cities.filter((c) =>
      c.country?.toLowerCase().includes(country.toLowerCase())
    );
  }

  res.json(cities);
});


app.put("/api/cities/:id", (req, res) => {
  const newData = {
    id: Number(req.params.id),
    ...req.body,
  };
  writeJsonData("cities.json", newData);
  res.json(getJsonData("cities.json"));
});
app.delete("/api/cities/:id", (req, res) => {
  deleteJsonData("cities.json", "id", req.params.id);
  res.json(getJsonData("cities.json"));
});
app.post("/api/cities", (req, res) => {
  const data = getJsonData("cities.json");
  writeJsonData("cities.json", {
    id: data[data.length - 1].id + 1,
    ...req.body,
  });
  res.json(getJsonData("cities.json"));
});

app.put("/api/hotels/:id", (req, res) => {
  const newData = {
    id: Number(req.params.id),
    ...req.body,
  };
  writeJsonData("hotels.json", newData);

  res.json(getJsonData("hotels.json"));
});
app.delete("/api/hotels/:id", (req, res) => {
  deleteJsonData("hotels.json", "id", req.params.id);
  res.json(getJsonData("hotels.json"));
});
app.post("/api/hotels", (req, res) => {
  const data = getJsonData("hotels.json");
  writeJsonData("hotels.json", {
    id: data[data.length - 1].id + 1,
    ...req.body,
  });

  res.json(getJsonData("hotels.json"));
});
app.get("/api/rooms", (req, res) => {
  let rooms = getJsonData("rooms.json");

  const { roomNumber, hotel, city } = req.query;

  if (roomNumber) {
    rooms = rooms.filter((r) =>
      String(r.roomNumber).includes(roomNumber)
    );
  }

  if (hotel) {
    rooms = rooms.filter((r) =>
      r.hotelName?.toLowerCase().includes(hotel.toLowerCase())
    );
  }

  if (city) {
    rooms = rooms.filter((r) =>
      r.city?.toLowerCase().includes(city.toLowerCase())
    );
  }

  res.json(rooms);
});
app.put("/api/rooms/:id", (req, res) => {
  const newData = {
    id: Number(req.params.id),
    ...req.body,
  };

  writeJsonData("rooms.json", newData);
  res.json(getJsonData("rooms.json"));
});
app.delete("/api/rooms/:id", (req, res) => {
  deleteJsonData("rooms.json", "id", req.params.id);
  res.json(getJsonData("rooms.json"));
});
app.post("/api/rooms", (req, res) => {
  const data = getJsonData("rooms.json");
  writeJsonData("rooms.json", {
    id: data[data.length - 1].id + 1,
    ...req.body,
  });
  res.json(getJsonData("rooms.json"));
});
app.get("/api/admin/navigation", (req, res) => {
  res.json([
    { label: "Cities", path: "/admin/cities" },
    { label: "Hotels", path: "/admin/hotels" },
    { label: "Rooms", path: "/admin/rooms" },
  ]);
});
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

/**
 * @swagger
 * /api/auth/authenticate:
 *   post:
 *     summary: Authenticate a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userName:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authentication:
 *                   type: string
 *                 userType:
 *                   type: string
 *       401:
 *         description: Invalid user or password
 */

/**
 * @swagger
 * /api/home/users/{userId}/recent-hotels:
 *   get:
 *     summary: Get recent hotels for a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: List of recent hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/home/featured-deals:
 *   get:
 *     summary: Get featured hotel deals
 *     responses:
 *       200:
 *         description: List of featured hotel deals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/home/destinations/trending:
 *   get:
 *     summary: Get trending destinations
 *     responses:
 *       200:
 *         description: List of trending destinations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/hotels:
 *   get:
 *     summary: Get a list of hotels
 *     parameters:
 *       - in: query
 *         name: searchQuery
 *         required: false
 *         schema:
 *           type: string
 *         description: Search query for filtering hotels
 *       - in: query
 *         name: pageNumber
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: pageSize
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of hotels per page
 *     responses:
 *       200:
 *         description: List of hotels
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/hotels/{id}/gallery:
 *   get:
 *     summary: Get hotel gallery by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel gallery
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/hotels/{id}:
 *   get:
 *     summary: Get hotel details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /api/hotels/{id}/available-rooms:
 *   get:
 *     summary: Get available rooms for a hotel by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: List of available rooms
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/hotels/{id}/reviews:
 *   get:
 *     summary: Get hotel reviews by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: List of hotel reviews
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a booking
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               hotelId:
 *                 type: integer
 *               roomId:
 *                 type: integer
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Booking confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get booking details by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Booking ID
 *     responses:
 *       200:
 *         description: Booking details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 */

/**
 * @swagger
 * /api/home/search:
 *   get:
 *     summary: Search for rooms
 *     parameters:
 *       - in: query
 *         name: city
 *         required: false
 *         schema:
 *           type: string
 *         description: City for search filter
 *       - in: query
 *         name: checkInDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-in date
 *       - in: query
 *         name: checkOutDate
 *         required: false
 *         schema:
 *           type: string
 *           format: date
 *         description: Check-out date
 *       - in: query
 *         name: adults
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of adults
 *       - in: query
 *         name: children
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of children
 *       - in: query
 *         name: numberOfRooms
 *         required: false
 *         schema:
 *           type: integer
 *         description: Number of rooms
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/search-results/amenities:
 *   get:
 *     summary: Get list of available amenities
 *     responses:
 *       200:
 *         description: List of amenities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/cities:
 *   get:
 *     summary: Get list of cities
 *     responses:
 *       200:
 *         description: List of cities
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/hotels/{id}/rooms:
 *   get:
 *     summary: Get rooms available in a hotel by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: List of rooms in a hotel
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 */

/**
 * @swagger
 * /api/cities/{id}:
 *   put:
 *     summary: Update a city by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: City ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: City updated
 */

/**
 * @swagger
 * /api/cities/{id}:
 *   delete:
 *     summary: Delete a city by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: City ID
 *     responses:
 *       200:
 *         description: City deleted
 */

/**
 * @swagger
 * /api/cities:
 *   post:
 *     summary: Create a new city
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: City created
 */

/**
 * @swagger
 * /api/hotels/{id}:
 *   put:
 *     summary: Update a hotel by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Hotel updated
 */

/**
 * @swagger
 * /api/hotels/{id}:
 *   delete:
 *     summary: Delete a hotel by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Hotel ID
 *     responses:
 *       200:
 *         description: Hotel deleted
 */

/**
 * @swagger
 * /api/hotels:
 *   post:
 *     summary: Create a new hotel
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Hotel created
 */

/**
 * @swagger
 * /api/rooms/{id}:
 *   put:
 *     summary: Update a room by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Room updated
 */

/**
 * @swagger
 * /api/rooms/{id}:
 *   delete:
 *     summary: Delete a room by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Room ID
 *     responses:
 *       200:
 *         description: Room deleted
 */

/**
 * @swagger
 * /api/rooms:
 *   post:
 *     summary: Create a new room
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Room created
 */
