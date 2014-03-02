define([
	'backbone',
	'models/post'
],
function(Backbone, Post) {
  var Posts = Backbone.Collection.extend({
	model: Post,
	filter: null,
	url: '/api/posts',
	initialize: function(vars){
		if(vars){
			if(vars.filter){
				this.filter = vars.filter;
				if(this.filter.toLowerCase() != 'all'){
					this.url = "/api/posts/"+vars.filter;
				}
				
			}
		}
		
	},
	comparator: function(post) {
		return post.get("end_date");
	}
  });

  return Posts;
});