
define([
],

function() {



    var globals = {

        LOADING: true,
        POST_WIDTH: 240,
        VERTICAL_SIZE_TIMEOUT_ID: null,
        TOTAL_POSTS: 0,

        TIMESTRIP_ARRAYS: [],
        GEAR_RATIO_WIDTHS: [],

        SCREEN_TYPE: '',
        RUNNING_TOTAL: [],
        RUNNING_TOTAL_OBJECTS: [],

        TIMECURSOR_END_POINTS: [],

        PANE: null,
        API: null,

        POSTS: null,
        POSTS_VIEW: null,

        initialize: function(){
            this.TIMESTRIP_ARRAYS['mobile'] = ['20s', '30s', '40s', '50s', '60s', '70s', '80s', '90s', '00s', '10s'];
            this.TIMESTRIP_ARRAYS['tablet'] = ['20s', '30s', '40s', '50s', '60', '65', '70', '75', '80', '85', '90', '95', '00', '05', '10', '15'];
            this.TIMESTRIP_ARRAYS['desktop'] = ['20s', '30s', '40s', '50s', '60', '62', '64', '66', '68', '70', '72', '74', '76', '78', '80', '82', '84', '86', '88', '90', '92', '94', '96', '98', '00', '02', '04', '06', '08', '10', '12', '14'];
            
            this.GEAR_RATIO_WIDTHS['tablet'] = 1080;
            this.GEAR_RATIO_WIDTHS['mobile'] = 480;
        }

    }

    return globals;

    
    

});






















