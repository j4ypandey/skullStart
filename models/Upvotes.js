var mongoose = require( 'mongoose' );

var upvoteSchema = new mongoose.Schema( {
	user: String,
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
	comment: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
	date: Date
} );

mongoose.model( 'Upvote', upvoteSchema );