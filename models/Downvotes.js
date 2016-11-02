var mongoose = require( 'mongoose' );

var downvoteSchema = new mongoose.Schema( {
	downvote: { type: Number, default: 0 },
	user: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
	comments: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }	
} );

mongoose.model( 'Downvote', downvoteSchema );