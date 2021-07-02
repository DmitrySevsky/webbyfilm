
const fs = require('fs');
const { Film, filmValidation } = require('../models/film');

const router = require('express').Router();

// Получение всех фильмов отсортированых по названию
router.get('/all', async (req, res) => {
    const films = await Film.find({}, {
        _id: 0,
        __v: 0
    }, err => {
        if (err) {
            return res.status(400).send(err);
        }
    }).sort({ title: 1 });

    return res.send(films);
});

// Получение фильма по Id
router.get('/:id', async (req, res) => {
    await Film.findById(req.params.id, (err, film) => {
        if (err) return res.status(400).send(err.details[0].message);
        if (!film) return res.status(404).send('Invalid movie ID');

        return res.send(film);
    });
});

// Поиск по указанному в теле сайта названию или актеру
router.get('/', async (req, res) => {
    await Film.find({ $or: [{ title: req.body.title }, { actors: { $in: req.body.actors } }] }, {
        _id: 0,
        __v: 0
    }, (err, films) => {
        if (err) return res.status(400).send(err.details[0].message);
        return res.send(films);
    });
});

// Добавение нового фильма
router.post('/', async (req, res) => {
    const { error } = filmValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    let film = await Film.findOne({ title: req.body.title }, (err) => {
        if (err) return res.status(400).send(err.details[0].message);
    });

    if (film) return res.status(400).send('This film already here!');

    film = new Film({
        title: req.body.title,
        year: req.body.year,
        format: req.body.format,
        actors: req.body.actors
    });

    await film.save(err => {
        if (err) return res.status(400).send(err.message);
        return res.status(200).send('Movie added!');
    });
});

// Добавление вильмов, взятых из дериктории '../data' из файла, 
// название которого указано в теле сайта
router.post('/import', async (req, res) => {
    const filmKeys = ['title', 'year', 'format', 'actors'];

    const data = await fs.readFileSync('./data/' + req.body.fileName, "utf8");

    let collection = data.split(/\r\n\r\n\r\n/i);

    let needContinue = false;
    let row, key, stars, document, film;
    let result = '';
    for (let j = 0; j < collection.length; j++) {
        document = collection[j].split(/\r\n/i);

        row = document[0].split(': ');
        await Film.findOne({ title: row[1] }, (err, film) => {
            if (err) {
                // return res.status(400).send(err.details[0].message);
                result += err.details[0].message + '\n';
                needContinue = true;
                return;
            }
            if (film) {
                result += 'This film already here!\n';
                needContinue = true;
            }
        });

        if (needContinue) {
            needContinue = false;
            continue;
        }

        let objFilm = {};

        for (let i = 0; i < document.length - 1; i++) {
            if (document[i]) {
                key = filmKeys[i];
                row = document[i].split(': ');
                objFilm[key] = row[1];
            }
        }
        stars = document[3].split(': ');
        key = filmKeys[3];
        objFilm[key] = stars[1].split(', ');

        film = new Film(objFilm);

        film = await film.save(err => {
            if (err) {
                result += err.message + '\n';
                return needContinue = true;
            }
            
            result += 'OK!\n';
        });
    }
    return res.status(200).send(result);
});

// Удаление по id, указанному в пути сайта
router.delete('/:id', async (req, res) => {
    Film.findByIdAndDelete(req.params.id, (err) => {
        if (err) return res.status(400).send(err.details[0].message);
        return res.status(200).send('Movie deleted!');
    });
});

// Удаление по указанному в теле сайта названию 
router.delete('/', async (req, res) => {
    Film.findOneAndDelete({ title: req.body.title }, (err) => {
        if (err) return res.status(400).send(err.details[0].message);
        return res.status(200).send('Movie deleted!');
    });
});

module.exports = router;
