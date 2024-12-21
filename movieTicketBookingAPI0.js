const fs = require('fs');
const path = require('path');
const express = require('express');

// Initialize Express app
const app = express();
app.use(express.json());

// Define directories and file paths
const BASE_DIR = path.join(__dirname, 'movie_booking_backend0');
const DATA_FILE = path.join(BASE_DIR, 'movies.txt');
const BOOKINGS_FILE = path.join(BASE_DIR, 'bookings.txt');

// Ensure the folder and file structure exists
if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR);
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]'); // Initialize with an empty array
}
if (!fs.existsSync(BOOKINGS_FILE)) {
    fs.writeFileSync(BOOKINGS_FILE, '[]'); // Initialize with an empty array
}

// Utility functions
const readMoviesFromFile = () => {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
};

const writeMoviesToFile = (movies) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2));
};

const readBookingsFromFile = () => {
    const data = fs.readFileSync(BOOKINGS_FILE, 'utf-8');
    return JSON.parse(data);
};

const writeBookingsToFile = (bookings) => {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
};

// Queue for ticket bookings
class BookingQueue {
    constructor() {
        this.queue = [];
    }

    enqueue(booking) {
        this.queue.push(booking);
    }

    dequeue() {
        return this.queue.shift();
    }

    size() {
        return this.queue.length;
    }
}
const bookingQueue = new BookingQueue();

// Graph for seating arrangements
class Theatre {
    constructor(rows, cols) {
        this.rows = rows;
        this.cols = cols;
        this.seating = Array.from({ length: rows }, () => Array(cols).fill(0));
    }

    bookSeat(row, col) {
        if (this.seating[row][col] === 0) {
            this.seating[row][col] = 1;
            return true;
        }
        return false;
    }

    getSeatingMap() {
        return this.seating;
    }
}
const theatre = new Theatre(10, 10); // Example: 10 rows, 10 columns

// API endpoints

// Get all movies sorted by popularity
app.get('/movies', (req, res) => {
    const movies = readMoviesFromFile();
    const sortedMovies = movies.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    res.json(sortedMovies);
});

// Add a new movie
app.post('/movies', (req, res) => {
    const { title, releaseDate, duration, genre } = req.body;
    if (!title || !releaseDate || !duration || !genre) {
        return res.status(400).json({ error: 'All fields are required: title, releaseDate, duration, genre' });
    }
    const movies = readMoviesFromFile();
    const newMovie = { id: Date.now(), title, releaseDate, duration, genre, popularity: 0 };
    movies.push(newMovie);
    writeMoviesToFile(movies);
    res.status(201).json(newMovie);
});

// Update a movie
app.put('/movies/:id', (req, res) => {
    const { id } = req.params;
    const { title, releaseDate, duration, genre } = req.body;
    const movies = readMoviesFromFile();
    const movieIndex = movies.findIndex((movie) => movie.id === parseInt(id));
    if (movieIndex === -1) {
        return res.status(404).json({ error: 'Movie not found' });
    }
    const updatedMovie = { ...movies[movieIndex], title, releaseDate, duration, genre };
    movies[movieIndex] = updatedMovie;
    writeMoviesToFile(movies);
    res.json(updatedMovie);
});

// Delete a movie
app.delete('/movies/:id', (req, res) => {
    const { id } = req.params;
    const movies = readMoviesFromFile();
    const filteredMovies = movies.filter((movie) => movie.id !== parseInt(id));
    if (filteredMovies.length === movies.length) {
        return res.status(404).json({ error: 'Movie not found' });
    }
    writeMoviesToFile(filteredMovies);
    res.status(204).send();
});

// Queue a ticket booking
app.post('/bookings', (req, res) => {
    const { movieId, row, col } = req.body;
    const movies = readMoviesFromFile();
    const movie = movies.find((m) => m.id === movieId);
    if (!movie) {
        return res.status(404).json({ error: 'Movie not found' });
    }

    if (!theatre.bookSeat(row, col)) {
        return res.status(400).json({ error: 'Seat already booked' });
    }

    const booking = { id: Date.now(), movieId, row, col };
    bookingQueue.enqueue(booking);

    const bookings = readBookingsFromFile();
    bookings.push(booking);
    writeBookingsToFile(bookings);

    movie.popularity += 1; // Increment movie popularity
    writeMoviesToFile(movies);

    res.status(201).json(booking);
});

// Process the next booking in the queue
app.post('/process-booking', (req, res) => {
    if (bookingQueue.size() === 0) {
        return res.status(400).json({ error: 'No bookings in the queue' });
    }
    const nextBooking = bookingQueue.dequeue();
    res.json(nextBooking);
});

// Get the seating map
app.get('/seating', (req, res) => {
    res.json(theatre.getSeatingMap());
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Use Postman or similar tools to test the API.');
});
