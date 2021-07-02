
const mongo = () => {
    const mongoose = require('mongoose');

    mongoose.connect('mongodb://localhost:27017/webbyFilm', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(console.log('Connected to MongoDB!!'))
        .catch(error => console.log(error));
}

module.exports = mongo;
