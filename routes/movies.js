
const fs = require('fs');
const { Film, filmValidation } = require('../models/film');

const router = require('express').Router();

// Функция сортировки по алфавиту
const sortByAlph = (a, b) => {
    const res = a.title.toLowerCase().localeCompare(b.title.toLowerCase());
    if (res === 0) {
        let minLength = (a.title.length < b.title.length) ? a.title.length : b.title.length;

        for (let i = 0; i < minLength; i++) {
            if (a.title.charCodeAt(i) > b.title.charCodeAt(i)) return 1;
            if (a.title.charCodeAt(i) < b.title.charCodeAt(i)) return -1;
        }
    }
    return res;
}

// Получение всех фильмов отсортированых по названию
router.get('/all', async (req, res) => {
    const films = await Film.find({}, {
        __v: 0
    }, err => {
        if (err) {
            return res.status(400).send(err);
        }
    });
    films.sort(sortByAlph);
    return res.send(films);
});

// Получение фильма по Id
router.get('/:id', async (req, res) => {
    try {
        const film = await Film.findById(req.params.id, { __v: 0, _id: 0 });
        return res.send(film);
    } catch (error) {
        return res.status(400).send('Invalid movie ID');
    }
});


// Поиск по указанному в теле запроса названию или актеру
router.get('/', async (req, res) => {
    const name = req.body.title;
    const findParam = "[\\h\\w]*" + name + "[\\h\\w]*";

    await Film.find({
        $or: [
            { title: { $regex: findParam, $options: "g" } },
            { actors: { $in: req.body.actors } }
        ]
    }, { __v: 0 }, (err, films) => {
        if (err) return res.status(400).send(err);
        return res.send(films);
    });
});

const deleteDuplicates = arr => {
    return res = arr.reduce((acc, elem) => {
        if (acc.indexOf(elem) === -1) acc.push(elem);
        return acc;
    }, []);
}

// Добавение нового фильма
router.post('/', async (req, res) => {
    const { error } = filmValidation(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    // Убираем повторяющихся актёров
    const chk_actors = deleteDuplicates(req.body.actors);

    let film = await Film.findOne({
        title: req.body.title,
        year: req.body.year,
        format: req.body.format,
        actors: chk_actors
    }, (err) => {
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

// Загрузка файла из input'а
// !!!Warning!!! В postman при загрузке файла через form-data,
// ключем должен быть 'fileData'
router.post('/import', async (req, res, next) => {
    if (req.file) res.locals.file = req.file.path;
    next();
});

// Загрузка файла из body
router.post('/import', async (req, res, next) => {
    if (!res.locals.file && req.body.fileName) {
        res.locals.file = './data/' + req.body.fileName;
    }
    next();
});

// Добавление вильмов, взятых из дериктории '../data' из файла, 
// название которого указано в теле запроса
router.post('/import', async (req, res) => {
    let row, key, document, film, chk_actors, filmRowValues, error;
    const filmKeys = ['title', 'year', 'format', 'actors'];

    if (!res.locals.file) return res.status(400).send('File not found!');

    const data = await fs.readFileSync(res.locals.file, "utf8");

    if (!data) return res.status(400).send('Empty file');

    let collection = data.split(/\r\n\r\n\r\n/i);

    for (let j of collection) {
        document = j.split(/\r\n/i);

        filmRowValues = [];
        document.forEach(row => {
            if (row) filmRowValues.push(row.split(': ')[1]);
        });
        if (!filmRowValues[0]) continue;
        
        filmRowValues[1] = filmRowValues[1].trim();
        filmRowValues[3] = filmRowValues[3].split(', ');
        chk_actors = deleteDuplicates(filmRowValues[3]);

        error = await Film.findOne({
            title: filmRowValues[0],
            year: filmRowValues[1].trim(),
            format: filmRowValues[2],
            actors: chk_actors
        });
        if (error) continue;

        let objFilm = {};

        for (let i = 0; i < document.length - 1; i++) {
            key = filmKeys[i];
            row = filmRowValues[i];
            objFilm[key] = row;
        }
        key = filmKeys[3];
        objFilm[key] = chk_actors;

        film = new Film(objFilm);

        error = await film.save(err => {
            if (err) {
                needContinue = true;
                return err.message;
            }
        });
        if (error) return res.status(400).send(error);
    }
    res.status(200).send('Done!');
});

// Обновление фильма, найденого по id, указанному в пути сайта, 
// с применением парамтров, указаных в теле запроса
router.put('/:id', async (req, res) => {
    try {
        await Film.findById(req.params.id);
    } catch (error) {
        return res.status(400).send('Invalid movie ID');
    }

    let film = req.body;
    film.actors = deleteDuplicates(film.actors);

    const { error } = filmValidation(film);
    if (error) return res.status(400).send(error.details[0].message);

    Film.findByIdAndUpdate(req.params.id, req.body, (err) => {
        if (err) return res.status(400).send(err);
        return res.status(200).send('Movie updated!');
    });
});

// Удаление по id, указанному в пути сайта
router.delete('/:id', async (req, res) => {
    Film.findByIdAndDelete(req.params.id, (err) => {
        if (err) return res.status(400).send(err.details[0].message);
        return res.status(200).send('Movie deleted!');
    });
});

// Удаление по указанному в запроса названию 
router.delete('/', async (req, res) => {
    Film.findOneAndDelete({ title: req.body.title }, (err) => {
        if (err) return res.status(400).send(err.details[0].message);
        return res.status(200).send('Movie deleted!');
    });
});

module.exports = router;
