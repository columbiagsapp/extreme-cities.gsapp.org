requirejs.config({
  paths: {
    "jquery": '../components/jquery/jquery',
    "underscore": '../components/underscore-amd/underscore',
    "backbone": '../components/backbone-amd/backbone',
    "jquery-mousewheel": '../components/jquery-mousewheel/jquery.mousewheel',
    "jquery-ui": '../components/jquery-ui/ui/jquery-ui',
    "jscrollpane": '../components/jscrollpane/script/jquery.jscrollpane'
  }
});

require([
    'jquery',
    'init',
    'globals',
    'collections/posts',
    'views/postsview'
],

function($, init, global, Posts, PostsView) {

    global.initialize();

    switch(document.location.pathname){
        case '/'://switch later to '/'
            init.initializeTimeline(Posts, PostsView);
            break;

        default:
            $('#wrapper').css('opacity', 1);
    }

    function resizeFunc(){
        init.loadTimestrip();
        init.verticalSize();
        global.API.reinitialise();
    }

    $(window).resize(resizeFunc);


    $('#filter .selection').hover(function(){
        $('.menu', this).addClass('hover');
        $('.menu .item:not(.selected)', this).show();
    }, function(){
        $('.menu', this).removeClass('hover');
        $('.menu .item:not(.selected)', this).hide();
    });

    function filterClickFunc(){
        if(!$(this).hasClass('selected')){
            var filter = $(this).attr('filter').toLowerCase();
            console.log('filtering by: '+ filter);
            init.reinitializeTimeline(Posts, filter);
        }
    }

    $('#filter .item').click(filterClickFunc);

    

});











































