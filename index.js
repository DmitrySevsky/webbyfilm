
const movies = require('./routes/movies');

const express = require('express');
const app = express();

require('./startup/mongoDB')(); // Подключение к базе

app.use(express.json());
app.use('/api/v1/movies', movies);  // Подключение маршрутизации

const port = process.env.PORT || 8000;
app.listen(port, () => {
    console.log(`Connected to port ${port}!!`);
});
