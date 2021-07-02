
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
        default: new Date().getFullYear()
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

const Film = mongoose.model('Film', filmSchema);

// Функция валидации полученого документа
const filmValidation = (film) => {
    const schema = Joi.object({
        title: Joi.string()
            .max(50)
            .required(),
        year: Joi.number(),
        format: Joi.string()
            .valid('VHS', 'DVD', 'Blu-Ray')
            .required(),
        actors: Joi.array().items(Joi.string())
    });

    return schema.validate(film);
}

module.exports = { Film, filmValidation };