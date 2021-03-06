var nedb = require('nedb');
var persistenceConfig = require('./persistenceConfig.json');
var request = require('request');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var db = new nedb({ filename: __dirname+'/IncomingData.db', autoload: true });

function Layer(config){
    // Layer class
    Object.keys(layers).forEach(function(key){
      if (!(key in config)) delete layers[key];
      if (config[key] === false) delete layers[key];
    });

    this.on('store', function(obj) {
        Object.keys(layers).forEach(function(key){
          layers[key](obj);
        });
    });

}

util.inherits(Layer, EventEmitter);

Layer.prototype.store = function(obj) {
    this.emit('store', obj);
};


module.exports = function(desired_layers){
  return new Layer(desired_layers);
};

var layers = {
  // store layers
  nedb: function(obj){
    db.insert(obj, function (err, newDoc) {
      console.log('NEDB, data stored:', newDoc);
    });
  },
  thingspeak: function(obj){
    var data = {};
    data[obj.channel] = obj.payload;
    data.api_key = persistenceConfig.thingspeakAPIKEY;
    request.post('https://api.thingspeak.com/update', {form:data});
    console.log('Data sent to ThinkSpeak:', data);
  }
};
