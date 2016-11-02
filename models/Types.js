var mongoose = require('mongoose');

var typeSchema = new mongoose.Schema({
	type: String;
	posts: [{type: mongoose.Schema.Types.ObjectId, ref: 'Post'}]
});

mongoose.model('Type', typeSchema);