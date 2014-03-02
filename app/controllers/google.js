/*
 *******************************************************************************************************
 *******************************************************************************************************
 *  MODULES
 *******************************************************************************************************
 *******************************************************************************************************
*/

var GoogleSpreadsheets = require("google-spreadsheets")
    , gm = require('gm')
    , fs = require('fs');

var _  = require('underscore');

// Import Underscore.string to separate object, because there are conflict functions (include, reverse, contains)
_.str = require('underscore.string');

// Mix in non-conflict functions to Underscore namespace if you want
_.mixin(_.str.exports());

// All functions, include conflict, will be available through _.str object
_.str.include('Underscore.string', 'string'); // => true
/* 
var Server = mongo.Server,
    Db = mongo.Db,
    BSON = mongo.BSONPure;
*/
/*
 *******************************************************************************************************
 *******************************************************************************************************
 *  GLOBALS
 *******************************************************************************************************
 *******************************************************************************************************
*/
var RESPONSE_LIMIT = 500;
var col = 'posts';

var googleSpreadsheetKey = '0AtTSh9uOIaD3dGVWMHJoNzJvaGYzZHJfdzU4WVc0SlE';
var googleSpreadsheetSheet = 'timeline';
var googleSpreadsheetKey = 'cell';
var googleSpreadsheetCallback = 'googleJSONtoMongo';

var googleSpreadsheetURL = 'http://spreadsheets.google.com/feeds/'+googleSpreadsheetKey+'/'+googleSpreadsheetKey+'/'+googleSpreadsheetSheet+'/public/basic?alt=json-in-script&callback='+googleSpreadsheetCallback;

/*
 *******************************************************************************************************
 *******************************************************************************************************
 *  DATABASE INIT
 *******************************************************************************************************
 *******************************************************************************************************
*/

/////// SET UP DATABASE CONNECTION WITH MONGOOSE ///////
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/extremecities');
var ObjectId = mongoose.Schema.Types.ObjectId;
var Schema = mongoose.Schema;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback () {
  console.log('opened extremecities db with mongoose!');
});


var ElementSchema = new Schema({
  title:  String,
  type: String,
  description: String,
  description_teaser: String,
  start_date: { type: Date, default: null },
  end_date: { type: Date, default: null },
  future_date: { type: Date, default: null },
  location_city: String,
  location_state: String,
  authors: [String],
  designers: [String],
  urban_qualities: [String],
  image: String,
  tags: [String]
}, { 
  autoIndex: false
});

var Element = mongoose.model('Element', ElementSchema);




/*
 *******************************************************************************************************
 *******************************************************************************************************
 *  GLOBALS
 *******************************************************************************************************
 *******************************************************************************************************
*/
var TIMESTRIP_ARRAYS = [];
TIMESTRIP_ARRAYS['mobile'] = ['20s', '30s', '40s', '50s', '60s', '70s', '80s', '90s', '00s', '10s'];
TIMESTRIP_ARRAYS['tablet'] = ['20s', '30s', '40s', '50s', '60', '65', '70', '75', '80', '85', '90', '95', '00', '05', '10', '15'];
TIMESTRIP_ARRAYS['desktop'] = ['20s', '30s', '40s', '50s', '60', '62', '64', '66', '68', '70', '72', '74', '76', '78', '80', '82', '84', '86', '88', '90', '92', '94', '96', '98', '00', '02', '04', '06', '08', '10', '12', '14'];

var GEARS_SET_FLAG = false;
var GEAR_ARRAY = [];
var GEAR_ARRAY_FILTERED = [];
var GEARS_FILTERED_SET_FLAG = [];
/*
 *******************************************************************************************************
 *******************************************************************************************************
 *  FUNCTIONS
 *******************************************************************************************************
 *******************************************************************************************************
*/
/*
 *  renderTimeline(req, res)
 *
 *  Renders timeline from Mongo DB 
 *
*/
exports.renderTimeline = function(req, res){

    console.log('google.js::renderTimeline() with col: '+ col);

    Element
        .find()
        .sort('end_date')
        .exec(function(err, items){

            if(err){
                console.log('Error: attempted to renderTimeline() with msg: '+ err);
                res.send(500, 'Error: attempted to renderTimeline() with err msg: '+err);
            }else{
                console.log('SUCCESS: with '+ items.length +' items');
                console.dir(items);

                var data = {};
                data.items = items;

                if(GEARS_SET_FLAG == false){

                    for(var i = 0; i < items.length; i++){
                        if(typeof GEAR_ARRAY[ parseInt(new Date(items[i].end_date).getFullYear()) ] == 'undefined'){
                            GEAR_ARRAY[ parseInt(new Date(items[i].end_date).getFullYear()) ] = 1;
                        }else{
                            GEAR_ARRAY[ parseInt(new Date(items[i].end_date).getFullYear()) ]++;
                        }                    
                    }
                    GEARS_SET_FLAG = true;//only want to run it once after a server reset
                    computeRunningTotal();
                }

                res.render('../views/index', {
                    title: 'Extreme Cities',
                    data: data
                });
                    
            }
        });
       
}

//return a single post by _id
exports.getPost = function(req, res, _id){

    Element
        .findOne({ '_id': _id })
        .exec(function(err, doc){
            if(err){
                res.send(500, "Error: cannot get element with id: "+ _id + " returned with err msg: "+ err);
            }else{

                res.send(200, doc);
            }
        });           
}

//used in the filter menu
var TYPES = ['book', 'built', 'unbuilt', 'event', 'plan', 'policy', 'quote'];
var QUALITIES = ['transgenerational', 'complexity', 'asymmetry', 'generosity', 'migration'];
var TAGS = [];

//return timeline entry posts
exports.getPosts = function(req, res, filter){
    console.log('google.js::getPosts() with filter: '+ filter);
    if(typeof filter === 'undefined'){//return all posts
        Element
            .find()
            .sort('end_date')
            .exec(function(err, items){
                res.send(200, items);
            });

    }else{//return posts by filter
        if(TYPES.indexOf(filter) > -1){

            Element
                .find({ type : filter })
                .sort('end_date')
                .exec(function(err, items){
                    
                    if(typeof GEARS_FILTERED_SET_FLAG[filter] == 'undefined'){
                        GEAR_ARRAY_FILTERED[filter] = [];

                        for(var i = 0; i < items.length; i++){
                            if(typeof GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] == 'undefined'){
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] = 1;
                            }else{
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ]++;
                            }                    
                        }
                        GEARS_FILTERED_SET_FLAG[filter] = true;//only want to run it once after a server reset
                        computeRunningTotal(filter);
                    }

                    res.send(200, items);
                });

        }else if(QUALITIES.indexOf(filter) > -1){

            Element
                .find({ urban_qualities : filter })
                .sort('end_date')
                .exec(function(err, items){
                    if(typeof GEARS_FILTERED_SET_FLAG[filter] == 'undefined'){
                        GEAR_ARRAY_FILTERED[filter] = [];

                        for(var i = 0; i < items.length; i++){
                            if(typeof GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] == 'undefined'){
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] = 1;
                            }else{
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ]++;
                            }                    
                        }
                        GEARS_FILTERED_SET_FLAG[filter] = true;//only want to run it once after a server reset
                        computeRunningTotal(filter);
                    }

                    res.send(200, items);
                });

        }else if(filter == 'submitted'){//user-submitted posts


            Element
                .find({ submitted : true })
                .sort('end_date')
                .exec(function(err, items){
                    if(typeof GEARS_FILTERED_SET_FLAG[filter] == 'undefined'){
                        GEAR_ARRAY_FILTERED[filter] = [];

                        for(var i = 0; i < items.length; i++){
                            if(typeof GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] == 'undefined'){
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] = 1;
                            }else{
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ]++;
                            }                    
                        }
                        GEARS_FILTERED_SET_FLAG[filter] = true;//only want to run it once after a server reset
                        computeRunningTotal(filter);
                    }

                    res.send(200, items);
                });

        }else{
            Element
                .find({ tags : filter })
                .sort('end_date')
                .exec(function(err, items){

                    if(typeof GEARS_FILTERED_SET_FLAG[filter] == 'undefined'){
                        GEAR_ARRAY_FILTERED[filter] = [];

                        for(var i = 0; i < items.length; i++){
                            if(typeof GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] == 'undefined'){
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ] = 1;
                            }else{
                                GEAR_ARRAY_FILTERED[filter][ parseInt(new Date(items[i].end_date).getFullYear()) ]++;
                            }                    
                        }
                        GEARS_FILTERED_SET_FLAG[filter] = true;//only want to run it once after a server reset
                        computeRunningTotal(filter);
                    }

                    res.send(200, items);
                });
        }//end last else for tags
    }//end else return tags by filter
}


var RUNNING_TOTAL = [];
var RUNNING_TOTAL_OBJECTS = [];
var RUNNING_TOTAL_DESKTOP = [];//delete?

var RUNNING_TOTAL_FILTERED = [];
var RUNNING_TOTAL_OBJECTS_FILTERED = [];


//TIMESTRIP_ARRAYS[2] = desktop

function computeRunningTotal(filter){

    filter = filter || false;

    if(filter == false){
        //serialize GEAR_ARRAY
        var temp_array = [];

        for(var i in GEAR_ARRAY){
            temp_array.push({
                index: i,
                value: parseInt(GEAR_ARRAY[i])
            });
        }

        for(var i = 0; i < temp_array.length; i++){
            if(i == 0){
                RUNNING_TOTAL[ temp_array[i].index ] = temp_array[i].value;
            }else{
                RUNNING_TOTAL[ temp_array[i].index ] = temp_array[i].value + RUNNING_TOTAL[ temp_array[i-1].index ];
            }        
        }

        for(var i in RUNNING_TOTAL){
            RUNNING_TOTAL_OBJECTS.push({
                year: i,
                running_total: RUNNING_TOTAL[i]
            });
        }
        //@todo these can be consolidated into a single function
        computeRunningTotalDesktop();
        computeRunningTotalTablet();
        computeRunningTotalMobile();
    }else{
        //serialize GEAR_ARRAY
        var temp_array = [];
        RUNNING_TOTAL_FILTERED[filter] = [];
        RUNNING_TOTAL_OBJECTS_FILTERED[filter] = [];

        for(var i in GEAR_ARRAY_FILTERED[filter]){
            temp_array.push({
                index: i,
                value: parseInt(GEAR_ARRAY_FILTERED[filter][i])
            });
        }

        for(var i = 0; i < temp_array.length; i++){
            if(i == 0){
                RUNNING_TOTAL_FILTERED[filter][ temp_array[i].index ] = temp_array[i].value;
            }else{
                RUNNING_TOTAL_FILTERED[filter][ temp_array[i].index ] = temp_array[i].value + RUNNING_TOTAL_FILTERED[filter][ temp_array[i-1].index ];
            }        
        }

        for(var i in RUNNING_TOTAL_FILTERED[filter]){
            RUNNING_TOTAL_OBJECTS_FILTERED[filter].push({
                year: i,
                running_total: RUNNING_TOTAL_FILTERED[filter][i]
            });
        }
        //@todo these can be consolidated into a single function
        computeRunningTotalDesktop(filter);
        computeRunningTotalTablet(filter);
        computeRunningTotalMobile(filter);
    }
}

var SECTION_TOTALS = [];
var SECTION_TOTALS_FILTERED = [];

function computeRunningTotalDesktop(filter){
    console.log('computeRunningTotalDesktop()');
    filter = filter || false;

    if(filter == false){
        SECTION_TOTALS['desktop'] = [];
        var year_int;

        for(var i = 0; i < TIMESTRIP_ARRAYS['desktop'].length; i++){

            var segment_str = TIMESTRIP_ARRAYS['desktop'][i];

            var value,
                upper_bound,
                lower_bound;

            var segment_int = parseInt( segment_str.substr(0,2) );

            if(segment_int < 20){
                segment_int = segment_int + 2000;
            }else{
                segment_int = segment_int + 1900;
            }

            if(segment_str.length == 3){//is full decade
                upper_bound = segment_int+9;
            }else{
                upper_bound = segment_int+1;
            }

            lower_bound = upper_bound;//for the next time around

            value = RUNNING_TOTAL[upper_bound];

            var iterations = 0;
            while(value == null){
                upper_bound--;
                value = RUNNING_TOTAL[upper_bound];
                iterations++;
                if(iterations > 10){
                    value = 0;
                    break;
                }
            }

            SECTION_TOTALS['desktop'][i] = {
                value: value,
                year: TIMESTRIP_ARRAYS['desktop'][i]
            };

        }
    }else{
        SECTION_TOTALS_FILTERED[filter] = [];
        SECTION_TOTALS_FILTERED[filter]['desktop'] = [];
        var year_int;

        for(var i = 0; i < TIMESTRIP_ARRAYS['desktop'].length; i++){

            var segment_str = TIMESTRIP_ARRAYS['desktop'][i];

            var value,
                upper_bound,
                lower_bound;

            var segment_int = parseInt( segment_str.substr(0,2) );

            if(segment_int < 20){
                segment_int = segment_int + 2000;
            }else{
                segment_int = segment_int + 1900;
            }

            if(segment_str.length == 3){//is full decade
                upper_bound = segment_int+9;
            }else{
                upper_bound = segment_int+1;
            }

            lower_bound = upper_bound;//for the next time around


            value = RUNNING_TOTAL_FILTERED[filter][upper_bound];

            var iterations = 0;
            while(value == null){
                upper_bound--;
                value = RUNNING_TOTAL_FILTERED[filter][upper_bound];
                iterations++;
                if(iterations > 10){
                    value = 0;
                    break;
                }
            }

            SECTION_TOTALS_FILTERED[filter]['desktop'][i] = {
                value: value,
                year: TIMESTRIP_ARRAYS['desktop'][i]
            };

        }
    }

}

function computeRunningTotalTablet(filter){
    console.log('computeRunningTotalTablet()');
    filter = filter || false;

    if(filter == false){
        SECTION_TOTALS['tablet'] = [];
        var year_int;

        for(var i = 0; i < TIMESTRIP_ARRAYS['tablet'].length; i++){

            var segment_str = TIMESTRIP_ARRAYS['tablet'][i];

            var value,
                upper_bound,
                lower_bound;

            var segment_int = parseInt( segment_str.substr(0,2) );
            if(segment_int < 20){
                segment_int = segment_int + 2000;
            }else{
                segment_int = segment_int + 1900;
            }

            if(segment_str.length == 3){//is full decade
                upper_bound = segment_int+9;
            }else{
                upper_bound = segment_int+4;
            }

            lower_bound = upper_bound;//for the next time around

            value = RUNNING_TOTAL[upper_bound];

            var iterations = 0;
            while(value == null){
                upper_bound--;
                value = RUNNING_TOTAL[upper_bound];
                iterations++;
                if(iterations > 10){
                    value = 0;
                    break;
                }
            }

            SECTION_TOTALS['tablet'][i] = {
                value: value,
                year: TIMESTRIP_ARRAYS['tablet'][i]
            };
        }
    }else{
        SECTION_TOTALS_FILTERED[filter]['tablet'] = [];
        var year_int;

        for(var i = 0; i < TIMESTRIP_ARRAYS['tablet'].length; i++){

            var segment_str = TIMESTRIP_ARRAYS['tablet'][i];

            var value,
                upper_bound,
                lower_bound;

            var segment_int = parseInt( segment_str.substr(0,2) );
            if(segment_int < 20){
                segment_int = segment_int + 2000;
            }else{
                segment_int = segment_int + 1900;
            }

            if(segment_str.length == 3){//is full decade
                upper_bound = segment_int+9;
            }else{
                upper_bound = segment_int+4;
            }

            lower_bound = upper_bound;//for the next time around

            value = RUNNING_TOTAL_FILTERED[filter][upper_bound];

            var iterations = 0;
            while(value == null){
                upper_bound--;
                value = RUNNING_TOTAL_FILTERED[filter][upper_bound];
                iterations++;
                if(iterations > 10){
                    value = 0;
                    break;
                }
            }

            SECTION_TOTALS_FILTERED[filter]['tablet'][i] = {
                value: value,
                year: TIMESTRIP_ARRAYS['tablet'][i]
            };
        }
    }
}

function computeRunningTotalMobile(filter){
    console.log('computeRunningTotalMobile()');
    filter = filter || false;

    if(filter == false){
        SECTION_TOTALS['mobile'] = [];
        var year_int;

        for(var i = 0; i < TIMESTRIP_ARRAYS['mobile'].length; i++){

            var segment_str = TIMESTRIP_ARRAYS['mobile'][i];

            var value,
                upper_bound,
                lower_bound;



            var segment_int = parseInt( segment_str.substr(0,2) );
            if(segment_int < 20){
                segment_int = segment_int + 2000;
            }else{
                segment_int = segment_int + 1900;
            }

            upper_bound = segment_int+9;


            lower_bound = upper_bound;//for the next time around

            value = RUNNING_TOTAL[upper_bound];

            var iterations = 0;
            while(value == null){
                upper_bound--;
                value = RUNNING_TOTAL[upper_bound];
                iterations++;
                if(iterations > 10){
                    value = 0;
                    break;
                }
            }

            SECTION_TOTALS['mobile'][i] = {
                value: value,
                year: TIMESTRIP_ARRAYS['mobile'][i]
            };

        }
    }else{
        SECTION_TOTALS_FILTERED[filter]['mobile'] = [];
        var year_int;

        for(var i = 0; i < TIMESTRIP_ARRAYS['mobile'].length; i++){

            var segment_str = TIMESTRIP_ARRAYS['mobile'][i];

            var value,
                upper_bound,
                lower_bound;



            var segment_int = parseInt( segment_str.substr(0,2) );
            if(segment_int < 20){
                segment_int = segment_int + 2000;
            }else{
                segment_int = segment_int + 1900;
            }

            upper_bound = segment_int+9;


            lower_bound = upper_bound;//for the next time around


            value = RUNNING_TOTAL_FILTERED[filter][upper_bound];

            var iterations = 0;
            while(value == null){
                upper_bound--;
                value = RUNNING_TOTAL_FILTERED[filter][upper_bound];
                iterations++;
                if(iterations > 10){
                    value = 0;
                    break;
                }
            }

            SECTION_TOTALS_FILTERED[filter]['mobile'][i] = {
                value: value,
                year: TIMESTRIP_ARRAYS['mobile'][i]
            };

        }
    }
  
}

//sends CURSOR_GEAR and TIMELINE_GEAR arrays based on screen
exports.getScrollRatio = function(req, res, filter){
    
    filter = filter || false;

    var data;

    if(filter == false){
        data = {
            running_total: RUNNING_TOTAL,
            running_total_objects: RUNNING_TOTAL_OBJECTS,
            running_total_desktop: SECTION_TOTALS['desktop'],
            running_total_tablet: SECTION_TOTALS['tablet'],
            running_total_mobile: SECTION_TOTALS['mobile']
        };
    }else{
        data = {
            running_total: RUNNING_TOTAL_FILTERED[filter],
            running_total_objects: RUNNING_TOTAL_OBJECTS_FILTERED[filter],
            running_total_desktop: SECTION_TOTALS_FILTERED[filter]['desktop'],
            running_total_tablet: SECTION_TOTALS_FILTERED[filter]['tablet'],
            running_total_mobile: SECTION_TOTALS_FILTERED[filter]['mobile']
        };

    }

    res.send(200, data);
}

/*
 *  storeGoogleSpreadsheet(req, res)
 *
 *  Stores contents of a Google spreadsheet in Mongo DB 
 *
*/
exports.resetFromGoogleSpreadsheet = function(req, res){

    var _range = "R1C1:R236C12";

    GoogleSpreadsheets({
        key: '0AtTSh9uOIaD3dDJ0ODNvZmdEZWh6Yi1CMkdGZVZNLWc'
    }, function(err, spreadsheet) {
        if(err){
            console.log('GoogleSpreadsheets err');
            console.log(err);
            res.send(500, 'GoogleSpreadsheets error: '+err);
        }else{
            spreadsheet.worksheets[0].cells({
                range: _range
            }, function(err, cells) {
                if(err){
                   console.log('GoogleSpreadsheets.cell() err');
                    console.log(err);
                    res.send(500, 'GoogleSpreadsheets.cell() error: '+err); 


                }else{
                    var headers = [];
                    var rows = [];

                    //populate the rows array with data
                    _.each(cells.cells, function(row, row_index){
                        rows[row_index-1] = [];

                        _.each(row, function(col, col_index){
                            rows[row_index-1][col_index-1] = col.value;

                        });
                    });

                    //pull the headers out to be more explicit in the code
                    headers = rows[0];

                    for(var i = 1; i < rows.length; i++){
                        var element = new Element();
                        for(var j = 0; j < headers.length; j++){
                            if(j >= 2 && j <= 4){//convert dates!
                                if(rows[i][j] != undefined){
                                    var d = new Date();
                                    d.setFullYear(rows[i][j]);
                                    d.setDate(1);
                                    d.setMonth(0);
                                    d.setHours(0);
                                    d.setMinutes(0);
                                    d.setSeconds(0);
                                    d.setMilliseconds(0);
                                    element[headers[j]] = d;
                                }else{
                                    element[headers[j]] = undefined;
                                }
                            }else if(j >=8 && j <= 9){//split designers and authors into arrays
                                console.log(headers[j]);
                                if(rows[i][j] != undefined){
                                    element[headers[j]] = rows[i][j].split(', ');
                                }else{
                                    element[headers[j]] = undefined;
                                }

                            }else if(j == 10){//split urban_qualities into array
                                console.log(headers[j]);
                                if(rows[i][j] != undefined){
                                    element[headers[j]] = rows[i][j].replace(/ /g,'').toLowerCase().split(',');
                                }else{
                                    element[headers[j]] = undefined;
                                }
                            }else{
                                element[headers[j]] = rows[i][j];
                            }
                        }

                        //add a teaser
                        element.description_teaser = _.prune(element.description, 220);

                        element.save(function(err){
                            if(err){
                                console.log('Error: attempted to insert google spreadsheet into mongodb fired an error:'+ err);
                            }else{
                                console.log('Success: inserted element from google spreadsheet number: '+ i);
                            }
                        });
                    }

                    res.send(200, 'done!');
                        
                }
            });//end .cells()
        }
    });//end resetFromGoogleSpreadsheet()
}



function cacheThumbnailImages(array, index){

    console.log('cacheThumbnailImages(items, '+index+')');

    if(array[index].image != null){

        var imageStubArray = array[index].image.split('.');
        var imageStub = imageStubArray[0];

        gm('/srv/www/server/projects/extreme-cities/public/images/timeline/'+array[index].image)
            .resize(200)
            .noProfile()
            .write('/srv/www/server/projects/extreme-cities/public/images/thumbnails/'+imageStub+'.png', function (err) {
                if (!err){
                    console.log('done resizing image '+imageStub);
                }else{
                    console.log(err);
                }
                //run recursively
                if(index < (array.length-1)){
                    cacheThumbnailImages(array, index+1);
                }
            });
    }else{
        if(index < (array.length-1)){
            cacheThumbnailImages(array, index+1);
        }
    }

}


function cacheFullImages(array, index){

    console.log('cacheFullImages(items, '+index+')');

    if(array[index].image != null){

        var imageStubArray = array[index].image.split('.');
        var imageStub = imageStubArray[0];

        gm('/srv/www/server/projects/extreme-cities/public/images/timeline/'+array[index].image)
            .resize(400, '>')//only shrink larger images, don't size up
            .noProfile()
            .write('/srv/www/server/projects/extreme-cities/public/images/full/'+imageStub+'.png', function (err) {
                if (!err){
                    console.log('done resizing image '+imageStub);
                }else{
                    console.log(err);
                }
                //run recursively
                if(index < (array.length-1)){
                    cacheFullImages(array, index+1);
                }
            });
    }else{
        if(index < (array.length-1)){
            cacheFullImages(array, index+1);
        }
    }

}


exports.recacheImages = function(req, res){
    console.log('recacheImages()');

    Element
        .find()
        .exec(function(err, items){
            if(err){
                console.log("Error: trying to recacheImages() with err: "+err);
                res.send(500, "Error: trying to recacheImages() with err: "+err)
            }else{
                var thumbIndex = 0;
                cacheThumbnailImages(items, thumbIndex);

                var fullIndex = 0;
                cacheFullImages(items, fullIndex);

            }
        });
}



/*
 *  logAll(col)
 *
 *  logs all tweets in collection col to the console
 *
*/
exports.logAll = function(req, res){
    console.log('-------logAll() from collection: '+ col);

    Element
        .find()
        .exec(function(err, items){
            if(err){
                console.log('Error: logAll() fired an error:');
                console.log(err);
            }else{
                console.log(items);
                res.json(200, items);
            }
        });
}

/*
exports.clearDB = function(req, res){
    db.collection(col, function(err, collection) {
        collection.remove({}, 0);
    });

    res.send(200, 'Cleared!')

}


exports.convertQualities = function(req, res){

    db.collection(col, function(err, collection) {
        collection.find().toArray(function(err, items) {
            var index = 0;

            convertQuality(items, index);

        });
    }); 
}


function convertQuality(items, i){

    var qs = _.words(items[i].urban_quality, ',');

    for(var q = 0; q < qs.length; q++){
        
        qs[q] = _.humanize(qs[q])
        qs[q] = qs[q].toLowerCase();
        console.dir(qs[q]);

    }
    console.log('');
    console.log('');

    
    var the_id = items[i]._id;
    console.log('*** about to update _id: '+ the_id);

    items[i].urban_quality = qs;


    db.collection(col, function(err, collection) {
        collection.update({'title': items[i].title }, {"$set": { 'urban_quality' : qs} }, {safe:true, upsert:true}, function(err, result) {

            console.log('returned from update of _id: '+ items[i]._id+' with err: '+ err+' and result: '+result);
            console.log('');
            i++;

            if(i < items.length){
                convertQuality(items, i);
            }

        });
    }); 

    

    

}

*/












