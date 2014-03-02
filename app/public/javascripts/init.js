
define([
    'jquery',
    'underscore',
    'backbone',
    'globals',
    'jquery-mousewheel',
    'jscrollpane',
    'jquery-ui'
],

function($, _, Backbone, global) {

    jQuery.fn.removeAttributes = function() {
        return this.each(function() {
            var attributes = $.map(this.attributes, function(item) {
                return item.name;
            });
            var img = $(this);
            $.each(attributes, function(i, item) {
                img.removeAttr(item);
            });
        });
    }

    var init = {

        loadTimestrip: function(){
            $('#timestrip').html('');
            //mobile
            if(window.innerWidth < global.GEAR_RATIO_WIDTHS['mobile']){
                global.SCREEN_TYPE = 'mobile';
                _.each(global.TIMESTRIP_ARRAYS.mobile, function(value, index){
                    $('#timestrip').append('<div id="yearmark-'+value+'" class="yearmark pos-'+index+'">'+value+'</div>')
                });
            }else if(window.innerWidth < global.GEAR_RATIO_WIDTHS['tablet']){//tablet
                global.SCREEN_TYPE = 'tablet';
                _.each(global.TIMESTRIP_ARRAYS.tablet, function(value, index){
                    $('#timestrip').append('<div id="yearmark-'+value+'" class="yearmark pos-'+index+'">'+value+'</div>')
                });
            }else{
                global.SCREEN_TYPE = 'desktop';
                _.each(global.TIMESTRIP_ARRAYS.desktop, function(value, index){
                    $('#timestrip').append('<div id="yearmark-'+value+'" class="yearmark pos-'+index+'">'+value+'</div>')
                });
            }

            return true;
        },

        

        initTimeCursor: function(filter){
            filter = filter || null;

            global.TIMECURSOR_END_POINTS['start'] = $('#yearmark-20s').position().left+parseInt($('#yearmark-20s').css('paddingLeft'));

            switch(global.SCREEN_TYPE){
                case 'desktop':
                    global.TIMECURSOR_END_POINTS['end'] = $('#yearmark-14').position().left+parseInt($('#yearmark-14').css('paddingLeft'));
                    break;
                case 'tablet':
                    global.TIMECURSOR_END_POINTS['end'] = $('#yearmark-15').position().left+parseInt($('#yearmark-15').css('paddingLeft'));
                    break;
                case 'mobile':
                    global.TIMECURSOR_END_POINTS['end'] = $('#yearmark-10s').position().left+parseInt($('#yearmark-10s').css('paddingLeft'));
                    break;
            }

            
            $('#timecursor img').css('left', global.TIMECURSOR_END_POINTS['start'] ).show();

            var targetURL = '/api/scrollratios';

            console.log('filter: '+ filter);

            if(filter != null){
                targetURL = targetURL + '/' + filter;
            }

            console.log('ajaxing with url: '+targetURL);

            var that = this;

            $.ajax(targetURL, {
                type: 'GET',
                dataType: 'json',
                success: function(data){
                    global.LOADING = false;//ready to go!

                    console.log("AJAX DATA: ");
                    console.dir(data);

                    console.log('TOTAL_POSTS: '+ global.TOTAL_POSTS);

                    global.RUNNING_TOTAL = data.running_total;
                    global.RUNNING_TOTAL_OBJECTS = data.running_total_objects;
                    global.RUNNING_TOTAL_DESKTOP = data.running_total_desktop;
                    global.RUNNING_TOTAL_TABLET = data.running_total_tablet;
                    global.RUNNING_TOTAL_MOBILE = data.running_total_mobile;

                    global.API.scrollByX(Math.random() * global.TOTAL_POSTS * global.POST_WIDTH);

                    that.repositionTimeCursorByPercent(global.API.getContentPositionX());
                    $('#wrapper').css('opacity', 1);

                    that.bindYearmarkClick();
                },
                error: function(err){
                    console.log('ajax positionTimeCursor() error: '+err);
                }
            });

        },

        bindYearmarkClick: function(){
            $('.yearmark').bind('click', this.clickTimestripYearmark);
        },

        clickTimestripYearmark: function(event){
            event.preventDefault();


            var classes = $(this).attr('class');
            var idx = classes.indexOf('pos-');
            var pos = classes.substr(idx+4);

            var R_T;
            switch(global.SCREEN_TYPE){
                case 'desktop':
                    R_T = global.RUNNING_TOTAL_DESKTOP;
                    break;
                case 'tablet':
                    R_T = global.RUNNING_TOTAL_TABLET;
                    break;
                case 'mobile':
                    R_T = global.RUNNING_TOTAL_MOBILE;
                    break;
                default:
                    return false;
                    break;
            }

            var index = parseInt(pos)-1;
            if(index < 0){
                var left = 0;
            }else{
                var left = global.POST_WIDTH* parseInt( R_T[index].value );
            }

            
            $('.jspPane').css('left', left);
            //console.log('left: '+ left);
            global.API.scrollToX( parseInt(left) , true);

            $('#timecursor img').animate({
                'left': $(this).position().left + $('#timecursor img').width()/2
                }, 250 );
        },

        //called when timeline is scrolled
        repositionTimeCursorByPercent: function(positionx){
            
            if(global.LOADING){
                return false;
            }

            var absolute_value = positionx / global.POST_WIDTH;//api.getPercentScrolledX() * TOTAL_POSTS;//doesn't account for the width of screen

            var R_T;
            switch(global.SCREEN_TYPE){
                case 'desktop':
                    R_T = global.RUNNING_TOTAL_DESKTOP;
                    break;
                case 'tablet':
                    R_T = global.RUNNING_TOTAL_TABLET;
                    break;
                case 'mobile':
                    R_T = global.RUNNING_TOTAL_MOBILE;
                    break;
                default:
                    return false;
                    break;
            }
            //hard bottom
            R_T[-1] = {
                value: 0
            };

            var index = 0;
            var upper_bound_value = parseInt( R_T[ index ].value );

            while( absolute_value > upper_bound_value ){
                index++;
                upper_bound_value = R_T[ index ].value;
            }

                
            var percent_offset = (absolute_value - R_T[ index-1 ].value) / (R_T[ index ].value - R_T[ index-1 ].value);
            index++;

            var x0_selector = '#yearmark-'+R_T[index-1].year;
            var x1_selector = '#yearmark-'+R_T[index].year;

            var x0_pos_left = $(x0_selector).position().left + parseInt( $(x0_selector).css('paddingLeft') );
            var x1_pos_left = $(x1_selector).position().left+ parseInt( $(x1_selector).css('paddingLeft') );

            var offset = (x1_pos_left - x0_pos_left) * percent_offset;

            var cursor_position_left = x0_pos_left + offset;

            $('#timecursor img').css({
                'left': cursor_position_left
            });
        },


        verticalSize: function(){
            var min_height = 110//$('#header').height()
                + 470//$('#timeline-wrapper').height()
                + $('#footer').height();

            //offset vertically to fill the page with push-top and push-bottom
            if(window.innerHeight > min_height){
                var diff = window.innerHeight - min_height;
                var pushTopHeight = Math.floor(diff/2);
                $('#push-top').height(pushTopHeight);
                $('#push-bottom').height( diff-pushTopHeight );
            }else{
                $('#push-top').height( 0 );
                $('#push-bottom').height( 0 );
            }

            clearTimeout(global.VERTICAL_SIZE_TIMEOUT_ID);
        },

        initJScrollPane: function(){
            console.log('initJScrollPane()');

            global.PANE = $('#timeline');

            var that = this;
            global.PANE
                //disable the vertical scroll to be overridden by mousewheel
                .bind('jsp-scroll-y',
                    function(event, scrollPositionY, isAtTop, isAtBottom){
                        event.preventDefault();
                    }
                )
                .bind('jsp-scroll-x',
                    function(event, scrollPositionX, isAtTop, isAtBottom){
                        event.preventDefault();
                        that.repositionTimeCursorByPercent(scrollPositionX);
                    }
                )
                .jScrollPane({
                    hijackInternalLinks: true
                });
            global.API = global.PANE.data('jsp');

            global.PANE.mousewheel(function(event, delta, deltaX, deltaY) {
                event.preventDefault();
                //console.log(delta);
                global.API.scrollByX(-10*delta, false);
            });

            console.log('global.API');
            console.dir(global.API);

        },

        initialize: function(filter){
            filter = filter || null;
            if(filter != null){
                $('#filter .selected').removeClass('selected').hide();
                $("#filter .item[filter='"+filter+"']").addClass('selected').show();

                if(filter.toLowerCase() == 'all'){
                    filter = null;
                }
            }else{
                $("#filter .item[filter='all']").addClass('selected').show();
            }

            global.TOTAL_POSTS = $('#timeline li').length;
            this.loadTimestrip();
            this.initTimeCursor(filter);
            $(window).on('load', this.verticalSize);
            var that = this;
            global.VERTICAL_SIZE_TIMEOUT_ID = setTimeout(function(){
                that.verticalSize();
            }, 250);
            
            this.initJScrollPane();
        },

        initializeTimeline: function(Posts, PostsView, filter){
            filter = filter || null;
            var that = this;
            global.POSTS = new Posts({
                filter: filter
            });

            global.POSTS.fetch({
                success: function(collection, response, options){

                    global.POSTS_VIEW = new PostsView({
                        collection: collection,
                        el: '#timeline'
                    });

                    if(global.POSTS_VIEW.render()){
                        //add a fakepost with full height to fix vertical alignment
                        $('#timeline').append('<li class="fakepost"></li>');
                        that.initialize();
                    }else{
                        console.log('init.js::ERROR: timeline didnt render so not calling init()');
                    }
                }
            });
        },

        reinitializeTimeline: function(Posts, filter){
            filter = filter || null;
            console.log('reinitializeTimeline() with filter: '+ filter);
            var that = this;

            global.POSTS = null;

            global.POSTS = new Posts({
                filter: filter
            });

            global.POSTS.fetch({
                success: function(collection, response, options){

                    global.POSTS_VIEW.undelegateEvents();
                    global.POSTS_VIEW.unrender();

                    $('#timeline-wrapper').append('<ul id="timeline"></ul>');
                    
                    global.POSTS_VIEW.reinitialize('#timeline', collection);

                    if(global.POSTS_VIEW.render()){
                        //add a fakepost with full height to fix vertical alignment
                        $('#timeline').append('<li class="fakepost"></li>');
                        that.initialize(filter);
                    }else{
                        console.log('init.js::ERROR: timeline didnt render so not calling init()');
                    }
                }
            });
        }

    }

    return init;

});






















