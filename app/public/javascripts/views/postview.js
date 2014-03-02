define([
	'backbone',
	'views/postfullview',
	'text!../../../views/templates/post.html',
	'jscrollpane'
],
function(Backbone, PostFullView, template) {

	var PostView = Backbone.View.extend({
	    className: 'post',
		template: template,
		paneAPI: null,
		/*
		initialize: function(){
			_.bind(this.model, 'change', render);
		},
		*/
		events: {
			'click .more': 'showMore'
		},

		showMore: function(event){
			event.preventDefault();
			var new_model = this.model.clone();

			var new_view = new PostFullView({
				el: '#lightbox-el',
				model: new_model
			});

			if(new_view.render()){
				$('#post-full').height(window.innerHeight);
				$('#lightbox-el, #lightbox-bg').show();

				$('#post-full img').load(function(){
					$('#post-full .inner').jScrollPane();
					$(window).resize(new_view.resizer);
				});
			}
		},


		render: function(){
			//use Underscore template, pass it the attributes from this model

			var attributes = this.model.attributes;

			var attr = {
				data: attributes
			};

			var content = _.template(this.template, attr);
			$(this.el).html(content);

			// return ```this``` so calls can be chained.
			return this;
	    },
	});

	return PostView;

});