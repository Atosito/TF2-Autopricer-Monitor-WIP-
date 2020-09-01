const connect = async (mongoose) => {
    mongoose.set('useFindAndModify', false);
    mongoose.set('useUnifiedTopology', true);
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useCreateIndex', true);
    mongoose.connect('mongodb://localhost/TF2Autopricer', err => {
        if (err) {
            console.log(err)
        }
        console.log('Connected to database correctly!')
        return;
        
    })
};

module.exports = connect;
