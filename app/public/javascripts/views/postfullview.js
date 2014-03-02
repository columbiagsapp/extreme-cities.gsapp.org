define([
	'init',
	'globals',
	'backbone',
	'text!../../../views/templates/postfull.html',
	'collections/posts',
	'jscrollpane',
],
function(init, global, Backbone, template, Posts) {

	var PostView = Backbone.View.extend({
		template: template,
	
		events: {
			'click .close': 'close',
			'click .filter': 'filter'
		},

		initialize: function(){
			_.bind(this, 'filter', 'close');
		},

		filter: function(event){	

			var filter = $(event.target).text().toLowerCase();
		    console.log('*******filtering by: '+ filter);
		    /*
		    $('#filter .selected').removeClass('selected');
		    $(event.target).addClass('selected');
			*/
			init.reinitializeTimeline(Posts, event.target.innerText.toLowerCase());
			this.close();
		},

		//appended to the $(window).resize() function queue
		//when a new post-full is rendered
		resizer: function(){
			console.log('reinitialising');
			$('#post-full').height(window.innerHeight);
			var paneAPI = $('#post-full .inner').data('jsp');
			paneAPI.reinitialise();
		},

		close: function(event){
			console.log('close');
			if(event){
				event.preventDefault();
			}
			//garbage collection
			this.unrender();
			this.undelegateEvents();
			this.model = null;
			$('#lightbox-el, #lightbox-bg').hide();

			$(window).off("resize", this.resizer);
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
			return true;
	    },
	    
	    unrender: function(){
	    	$(this.el).html('');
	    	return this;
	    }
	});

	return PostView;

});