define([
	'init',
	'backbone',
	'views/postview',
	'globals'
],
function(init, Backbone, PostView, global) {

	var PostsView = Backbone.View.extend({
		tagName: 'div',
	    className: 'posts',
		_postViews: null,
		collection: null,

	    initialize : function() {
		    var that = this;
		    this._postViews = [];

		    _.each(this.collection.models, function(model, index){
                that._postViews.push( new PostView({
                    model: model,
                    tagName: 'li'
                }));
            });
		},

		reinitialize: function(el, collection){
			this.el = el;
			this.collection = collection;
			var that = this;
		    this._postViews = [];

		    _.each(this.collection.models, function(model, index){
                that._postViews.push( new PostView({
                    model: model,
                    tagName: 'li'
                }));
            });
		},
		 
		render : function() {
			var that = this;
		    // Clear out this element.
		    $(this.el).empty();
		 
		    // Render each sub-view and append it to the parent view's element.
		    _.each(this._postViews, function(postView) {
		      $(that.el).append(postView.render().el);
		    });

		    return true;
		},

		unrender: function(){
			$(this.el).remove();

			_.each(this._postViews, function(postView) {
		      postView.remove();
		    });

			this._postViews = null;
			return true;
		}
	});

	return PostsView;

});