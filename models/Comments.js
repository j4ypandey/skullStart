var mongoose = require('mongoose');

var commentSchema = new mongoose.Schema({
	body: String,
	author: String,
	upvotes: {type: Number, default: 0},
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
	date: Date
});

mongoose.model('Comment', commentSchema);