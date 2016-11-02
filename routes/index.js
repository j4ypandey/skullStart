var express = require('express');
var router = express.Router();

var mongoose = require('mongoose');
var Post = mongoose.model('Post');
var Comment = mongoose.model('Comment');
var passport = require('passport');
var User = mongoose.model('User');
var jwt = require('express-jwt');
var Upvote = mongoose.model('Upvote');
var Downvote = mongoose.model('Downvote');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Flapper News' });
});

var auth = jwt({secret: 'SECRET', userProperty: 'payload'});

router.get('/posts', function (req, res, next) {
	Post.find(function (err, posts) {
		if (err) {
			return next(err);
		}

		var arr = [];

		if (posts.length === 0) {
			res.json(posts);
		}

		for (var post in posts) {
			!function fml(post) {
				Upvote.find({post: posts[post]}, function(err, upvotes) {
					if (err) {
						return next(err);
					}
					var temp = posts[post].toObject();
					temp.upvotes = upvotes.length;

					if (req.query.user != undefined) {
						temp.upvoted = upvoted(upvotes, req.query.user);
					}

					Comment.find({post: posts[post]}, function(err, comments) {
						if (err) {
							return next(err);
						}

						temp.comments = comments.length;
						arr.push(temp);
						if (arr.length === posts.length) {
							console.log(arr.sort(sortTime));
							res.json(arr);
						}
					});
				});
			}(post);
		}
	});
});

router.post('/posts', auth, function (req, res, next) {
	var post = new Post(req.body);
	post.author = req.payload.username;
	post.date = new Date();
	post.save(function (err, post) {
		if (err) {
			return next(err);
		}

		res.json(post);
	});
});

router.param('post', function (req, res, next, id) {
	var query = Post.findById(id);
	query.exec(function (err, post) {
		if (err) {
			return next(err);
		}

		if (!post) {
			return next (new Error("Can't find post"));	
		}

		req.post = post;
		return next();
	});
});

router.get('/posts/:post', function (req, res, next) {
	var temp = req.post.toObject();

	Comment.find({post: req.post}, function(err, comments) {
		Upvote.find({post: req.post}, function(err, upvotes) {
			if (err) {
				return next(err);
			}
		
			temp.upvotes = upvotes.length;

			if (req.query.user != undefined) {
				temp.upvoted = upvoted(upvotes, req.query.user);
			}
			temp.comments = [];
			
			if (comments.length === 0) {
				res.json(temp);
			}

			for (comment in comments) {
				!function fml(comment) {
						Upvote.find({comment: comments[comment]}, function(err, upvotes) {
						var comm = comments[comment].toObject();
						comm.upvotes = upvotes.length;

						if (req.query.user !== undefined) {
							comm.upvoted = upvoted(upvotes, req.query.user);
						}

						temp.comments.push(comm);

						if ( temp.comments.length === comments.length) {
							res.json(temp);
						}
					});
				}(comment);
			}
		});
	});
});

// Function to upvote a post
router.put('/posts/:post/upvote', auth, function (req, res, next) {
	// search the username and post id 
	// in the database
	Upvote.find({user: req.payload.username, post: req.post}, {}, {limit: 1}, 
		function(err, upvote) {
		console.log(upvote);
		if (err) {
			// return the error
			return next(err);
		} else if (upvote[0] !== undefined) {
			// select the _id for the upvote
			// and remove it
			// selecting object using id you should use
			// the object itself which will in turn become
			// the id to be selcted
			console.log(upvote[0]._id);
			Upvote.remove({_id: upvote[0]}, function(err, temp) {
				if (err) {
					// return error
					return next(err);
				}
				// reduce -1 to reduce the upvotes
				console.log("reomve");
				res.json(-1);
			});
		} else {
			var upvote = new Upvote();
			// set the value to one
			// store the userId and also
			// the postId
			upvote.user = req.payload.username;
			upvote.post = req.post;
			upvote.date = new Date();
			//call the save function to save this
			// upvote
			upvote.save(function(err, upvote) {
				//return if error
				if (err) {
					return next(err);
				}
				// return 1 to increase the upvote
				console.log("upvote");
				res.json(1);
			});
		}
	});
});

// Function to create new comments for a post
router.post('/posts/:post/comments', auth, function (req, res, next) {
	// create new comments using the
	// data provided in the request
	var comment = new Comment(req.body);
	// To store the id of the post
	// for which this post has been written
	// then store the author name for that post
	comment.post = req.post;
	comment.author = req.payload.username;
	commnet.date = new Date();
	//save the comment on the collection comments
	comment.save(function (err, comment) {
		// return the error if their is one
		// while saving the comment
		if (err) {
			return next(err);
		}
		// return the comment to append
		// to the post
		res.json(comment);
	});
});

// This is where we detect the comment 
// parameter in the route and
// call this function
// Used to get comments
router.param('comment', function (req, res, next, id) {
	//Comment to find the
	// comments represented by the id
	var query = Comment.findById(id);
	// Execute the query,
	// If error return the erro,
	// if not and there is no comment 
	// retur a null message,
	// if found return the comment
	// and call the next route
	query.exec(function (err, comment) {
		if (err) {
			return next(err);
		}

		if (!comment) {
			return next(new Error("can't find comment"));
		}

		req.comment = comment;
		return next();
	});
});

// Function or route to upvote a comment.
// It is similar to upvote but only the commit
// field will be updated in the upvote.
router.put('/posts/:post/comments/:comment/upvote', auth, 
	// finding upvote using comment and username
	// the user
	function (req, res, next) {
	Upvote.find({user: req.payload.username, comment: req.comment}, {}, {limit: 1},
		function(err, upvote) {
			if (err) {
				return next(err);
			}
			// javascript can be uncertain 
			// many time so it is best to
			// make sure every element you are passing
			// is the correct element, which I did not do and wasted
			// 3 days to design a simple upvote system
			// which was created masny years before
			// so just remember to check all variables
			// before you start solving the equation
			// for reference see post upvoting route
			if (upvote[0] != undefined) {
				// remove the upvote using the upvote
				// itself
				Upvote.remove({_id: upvote[0]}, function(err) {
					if (err) {
						return next(err);
					}

					// to decrement upvote
					res.json(-1);
				});
			} else {
				// create the new upvote object
				// which will contain the comment
				// and the user details
				var upvote = new Upvote();
				upvote.comment = req.comment;
				upvote.user = req.payload.username;
				upvote.date = new Date();
				// save the upvote
				upvote.save(function(err, upvote) {
					if (err) {
					return next(err);
					}

					// to increment upvote
					res.json(1);
				});
			}
		}
	);
});

router.post('/register', function (req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({message: "Please fill out all fields"});
	}
	
	passport.authenticate('local-signup', function (err, user, info) {
		if (err) {
			next(err);
		}
		if (!user) {
			return res.status(400).json({message: "Username already exists"});
		}

		return res.json({token: user.generateJWT()});
	})(req, res, next);
});

router.post('/login', function (req, res, next) {
	if (!req.body.username || !req.body.password) {
		return res.status(400).json({message: "Please fill out all fields"});
	}

	passport.authenticate('local', function (err, user, info) {
		if (err) {
			next(err);
		}

		if (user) {
			return res.json({token: user.generateJWT()});
		} else {
			return res.status(401).json(info);
		}
	})(req, res, next);
});

// detects the parameter in the url
// it then uses the parameter to get the user object
// from the database
router.param('user', function(req, res, next, username) {
	// query to look for 
	// user object	
	var query = User.find({"username": username});
	query.exec(function (err, user) {
		if (err) {
			return next(err);
		}
		// if not found return error
		if (!user) {
			return next (new Error("Can't find user"));	
		}
		// if found send it to the get middleware
		req.user = user;
		return next();
	});
});

// middleware to obtain all posts
// related to the user
router.get('/user/:user', function(req, res, next) {
	// query to find all the post by the username	
	var query = Post.find({"username": req.user.username});
	query.exec(function (err, posts) {
		// if not found return error
		var post = [];

		if (err) {
			return next(err);
		}

		for (var i in posts) {
			!function fml(i) {
				var temp = posts[i].toObject();
				Upvote.find({post: temp}, function(err, upvotes) {
					if (err) {
						return next(err);
					}

					temp.upvotes = upvotes.length;

					if (req.query.user != undefined) {
						temp.upvoted = upvoted(upvotes, req.query.user);
					}

					Comment.find({post: temp}, function(err, comments) {
						if (err) {
							return next(err);
						}

						temp.comments = comments.length;

						post.push(temp);

						if (post.length === posts.length) {
							var user = {"name": req.user[0], "post": post};
							res.json(user);
						}
					});
				});
			} (i);
		}
	});
});

function upvoted(upvotes, username) {
	for (var i in upvotes) {
		if (upvotes[i].user === username) {
			return true;
		}
	}

	return false;
}

function sortUpvote(a, b) {
	return b.upvotes > a.upvotes;
}

function sortTime(a, b) {
	return b.date > a.date;
}

module.exports = router;