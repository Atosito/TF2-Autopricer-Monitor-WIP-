const connect = (mongoose) => {
    mongoose.set('useFindAndModify', false);
    mongoose.set('useUnifiedTopology', true);
    mongoose.set('useNewUrlParser', true);
    mongoose.set('useCreateIndex', true);
    mongoose.connect('mongodb://localhost/TF2Autopricer', async err => {
        if (err){
            console.log(err)
        }
        console.log('Connected to database correctly!')
    })
};

module.exports = connect;
