const fs = require('fs');
const path = require('path');
const express = require('express');
const app = express();
app.use(express.json());

const BASE_DIR = path.join(__dirname, 'movie_booking_backend1');
const DATA_FILE = path.join(BASE_DIR, 'movies.txt');


if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR);
}
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, '[]'); // Initialize with an empty array
}


const readMoviesFromFile = () => {
    const data = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(data);
};

const writeMoviesToFile = (movies) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(movies, null, 2));
};

app.get('/movies', (req, res) => {
    const movies = readMoviesFromFile();
    res.json(movies);
});

app.post('/movies', (req, res) => {
    const { title, releaseDate, duration, genre } = req.body;
    if (!title || !releaseDate || !duration || !genre) {
        return res.status(400).json({ error: 'All fields are required: title, releaseDate, duration, genre' });
    }
    const movies = readMoviesFromFile();
    const newMovie = { id: Date.now(), title, releaseDate, duration, genre };
    movies.push(newMovie);
    writeMoviesToFile(movies);
    res.status(201).json(newMovie);
});

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

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log('Use Postman or similar tools to test the API.');
});
