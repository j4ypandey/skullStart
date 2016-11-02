var mongoose = require( 'mongoose' );

var postSchema = new mongoose.Schema( {
	author: String,
	title: String,
	body: String,
	type: String,
	tags: String,
	date: Date
} );

mongoose.model( 'Post', postSchema );