var passport = require( 'passport' );
var localStrategy = require( 'passport-local' ).Strategy;
var mongoose = require( 'mongoose' );
var User = mongoose.model( 'User' );

passport.use( 'local', new localStrategy(
	function( username, password, done ) {
		User.findOne( {username: username}, function ( err, user ) {
			if ( err ) {
				return done( err );
			}

			if ( !user ) {
				return done( null, false,  {message: "Incorrect Username"} );
			}

			if ( !user.validPassword( password ) ) {
				return done( null, false, {message: "Incorrect password"});
			}

			return done( null, user );
		} );
	}
) );

passport.use( 'local-signup', new localStrategy(
    function( username, password, done ) {

        // asynchronous
        // User.findOne wont fire unless data is sent back
        process.nextTick(function() {

	        // find a user whose email is the same as the forms email
	        // we are checking to see if the user trying to login already exists
	        User.findOne( { 'username' :  username }, function( err, user ) {
	            // if there are any errors, return the error
	            if ( err )
	                return done( err );

	            // check to see if theres already a user with that email
	            if ( user ) {
	                return done( null, false, {message: 'That username'+ 
	                	'is already taken.'} );
	            } else {

	                // if there is no user with that email
	                // create the user
	                var user = new User();

	                // set the user's local credentials
	                user.username = username;
	                user.setPassword( password );
	                user.date = new Date();

	                // save the user
	                user.save( function( err ) {
	                    if ( err ) {
	                        throw err;
	                    }
	                    return done( null, user );
	                } );
	            }

	        } );    

        } );

    } ) 
);