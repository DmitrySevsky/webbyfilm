const Joi = require('joi');
const mongoose = require('mongoose');

// Описание шаблона документа
const filmSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
        maxlength: 50
    },
    year: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 20,
        required: true
    },
    format: {
        type: String,
        enum: ['VHS', 'DVD', 'Blu-Ray']
    },
    actors: [{
        type: String,
        maxlength: 100
    }]
});
// Проверка на повторение актёров
filmSchema.path('actors').validate(function (actors) {
    let res = [];
    actors.forEach(actor => { if (res.indexOf(actor) === -1) res.push(actor); });
    this.actors = res;
});

const Film = mongoose.model('Film', filmSchema);

// Функция валидации полученого документа
const filmValidation = (film) => {
    const schema = Joi.object({
        title: Joi.string()
            .trim()
            .max(50)
            .required(),
        year: Joi.number()
            .min(1900)
            .max(new Date().getFullYear() + 20),
        format: Joi.string()
            .valid('VHS', 'DVD', 'Blu-Ray')
            .required(),
        actors: Joi.array()
            .items(Joi.string().trim())
            .min(1)
    });

    return schema.validate(film);
}

module.exports = { Film, filmValidation };