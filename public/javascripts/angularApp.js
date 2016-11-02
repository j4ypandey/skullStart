var app = angular.module('flapperNews', ['ui.router']);

app.config([
	'$stateProvider',
	'$urlRouterProvider',
	function ($stateProvider, $urlRouterProvider) {
		$stateProvider
			.state('addPost', {
				url: '/addPost',
				templateUrl: '/addPost.html',
				controller: 'MainCtrl'
			})
			.state('posts', {
				url: '/posts/{id}',
				templateUrl: '/posts.html',
				controller: 'PostsCtrl',
				resolve: {
					post: ['$stateParams', 'posts', function ($stateParams, posts) {
						return posts.get($stateParams.id);
					}]
				}
			})
			.state('home', {
				url: '/home',
				templateUrl: '/home.html',
				controller: 'MainCtrl',
				resolve: {
					postPromise: ['posts', function (posts) {
						return posts.getAll();
					}]
				}
			})
			.state('login', {
				url: '/login',
				templateUrl: '/login.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function ($state, auth) {
					if (auth.isLoggedIn()) {
						$state.go('home');
					}
				}]
			})
			.state('register', {
				url: '/register',
				templateUrl: '/register.html',
				controller: 'AuthCtrl',
				onEnter: ['$state', 'auth', function($state, auth) {
					if (auth.isLoggedIn()) {
						$state.go('home');
					}
				}]
			})
			.state('users', {
				url: '/user/{id}',
				templateUrl: '/users.html',
				controller: 'UserCtrl',
				resolve: {
					user: ['$stateParams', 'posts', function ($stateParams, posts) {
						return posts.getUser($stateParams.id);
					}]
				}
			})
		;

		$urlRouterProvider.otherwise('home');
	}
]);


app.factory('posts', ['$http', 'auth', function ($http, auth) {
	var o = {
		posts: []
	};

	o.getAll = function () {
		return $http.get('/posts', {params: {user: auth.currentUser()}})
		.success(function (data) {
			angular.copy(data, o.posts);
		});
	};

	o.create = function (post) {
		return $http.post('/posts', post, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function (data) {
			window.location = '/#/posts/' + data._id;
		});
	};

	o.upvote = function (post) {
		return $http.put('/posts/' + post._id + '/upvote', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function (data) {
			post.upvotes += data;
			post.upvoted = !post.upvoted;
		});
	};

	o.get = function (id) {
		return $http.get('/posts/' + id, {params: {user: auth.currentUser()}})
		.then(function (res) {
			console.log(res.data);
			return res.data;
		});
	};

	o.getUser = function(id){
		return $http.get('/user/' + id, {params: {user: auth.currentUser()}})
		.then(function(res) {
			return res.data;
		});
	};

	o.addComment = function (id, comment) {
		return $http.post('/posts/' + id + '/comments/', comment, {
			headers: {Authorization: "Bearer " + auth.getToken()}
		});
	};

	o.upvoteComment = function (post, comment) {
		return $http.put('/posts/' + post._id + '/comments/' + comment._id + '/upvote', null, {
			headers: {Authorization: 'Bearer ' + auth.getToken()}
		}).success(function (data) {
			comment.upvotes += data;
			comment.upvoted = !comment.upvoted;
		});
	};

	return o;
}])

.factory('auth', ['$http', '$window', function($http, $window) {
	var auth = {};

	auth.saveToken = function (token) {
		$window.localStorage['flapper-news-token'] = token;
	};

	auth.getToken = function () {
		return $window.localStorage['flapper-news-token'];
	};

	auth.isLoggedIn = function () {
		var token = auth.getToken();

		if (token) {
			var payload = JSON.parse($window.atob(token.split('.')[1]));
			return payload.exp > Date.now() / 1000;
		} else {
			return false;
		}
	};

	auth.currentUser = function () {
		if (auth.isLoggedIn()) {
			var token = auth.getToken();
			var payload= JSON.parse($window.atob(token.split('.')[1]));

			return payload.username;
		}
	};

	auth.register = function (user) {
		return $http.post('/register', user).
			success(function(data) {
				auth.saveToken(data.token);
			});
	};

	auth.logIn = function (user) {
		return $http.post('/login', user).success(function (data) {
			auth.saveToken(data.token);
		});
	};

	auth.logOut = function () {
		$window.localStorage.removeItem('flapper-news-token');
	};

	return auth;
}]);

app.controller('PostsCtrl', [
	'$scope',
	'posts',
	'post',
	'auth',
	function ($scope, posts, post, auth) {
		$scope.post = post;
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addComment = function () {
			if ($scope.body === '') {
				return;
			}

			posts.addComment(post._id, {
				body: $scope.body
			}).success(function (comment) {
				$scope.post.comments.push(comment);
			});
			
			$scope.body = '';
		};

		$scope.incrementUpvotes = function (comment) {
			posts.upvoteComment($scope.post, comment);
		};

		$scope.upvote = function() {
			posts.upvote($scope.post);
		};

		// $scope.decrementUpvotes = function (comment) {
		// 	posts.downvoteComment($scope.post, comment);
		// }
	}
]);

app.controller('AuthCtrl', [
	'$scope',
	'$state',
	'auth',
	function ($scope, $state, auth) {
		$scope.user = {};

		$scope.register = function () {
			auth.register($scope.user).error(function (error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			})
		};

		$scope.logIn = function () {
			auth.logIn($scope.user).error(function (error) {
				$scope.error = error;
			}).then(function() {
				$state.go('home');
			})
		};
	}
]);

app.controller('NavCtrl', [
	'$scope',
	'auth',
	function ($scope, auth) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.currentUser = auth.currentUser;
		$scope.logOut = auth.logOut;
	}
]);

app.controller('MainCtrl', [
	'$scope',
	'posts',
	'auth',
	function ($scope, posts, auth) {
		$scope.posts = posts.posts;
		$scope.isLoggedIn = auth.isLoggedIn;

		$scope.addPost = function () {
			posts.create({
				title: $scope.title,
				body: $scope.body,
				type: $scope.type,
				tags: $scope.tags
			});
			$scope.title = '';
			$scope.body = '';
			$scope.type = '';
			$scope.tags = '';
		};

		$scope.incrementUpvotes = function (post) {
			posts.upvote(post);
		};

	}
]);

app.controller('UserCtrl', [
	'$scope',
	'auth',
	'posts',
	'user',
	function($scope, auth, posts, user) {
		$scope.isLoggedIn = auth.isLoggedIn;
		$scope.user = user.name;
		$scope.post = user.post;
	}
]);