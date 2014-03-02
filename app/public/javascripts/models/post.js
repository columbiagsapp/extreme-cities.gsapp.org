define(
[
	'backbone'
], function(Backbone){

	var Post = Backbone.Model.extend({
		urlRoot: "/api/post"
	});

	return Post;

});