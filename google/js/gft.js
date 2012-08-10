(function(global) {

  var gft = {
  
    URL: 'https://fusiontables.googleusercontent.com/fusiontables/api/query',
    
    /**
     * Load data from Google Fusion Tables.
     *
     * @param {Object} query Query parameters.
     * @param {Function} callback Callback Function when data is loaded.
     */
    query: function(query, callback) {
    
      var sql;
    
      // If SQL defined by user
      if (typeof query === 'string') {
        sql = query;
        
      } else if (typeof query === 'number'){
        sql = 'SELECT * FROM ' + query;
          
      } else { // Build SQL string from query object    
        query.format = query.format || 'geojson'; 
        sql = 'SELECT ' + (query.cols || '*') + ' FROM ' + query.id; 
        if (query.where) sql += ' WHERE ' + query.where;  
        if (query.order) sql += ' ORDER BY ' + query.order;
        if (query.offset) sql += ' OFFSET ' + query.offset;
        if (query.limit) sql += ' LIMIT ' + query.limit;
      }
      
      this.jsonp(this.URL + '?sql=' + escape(sql), function(data){
        if (query.format === 'geojson'){
          callback(gft.toGeoJSON(data));
        } else {
          callback(data);
        }
      });      
    },
    
    
    
    /**
     * @param {string} url URL
     * @param {Function} callback Callback function
     * @constructor
     */
    jsonp: function(url, callback){
    
      // Create random function name
      var randomName = '';
      var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz_';
      var length = 10;
      while (length--) {
        randomName += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    
      // Called when data is loaded
      gft.jsonp[randomName] = function(data) {
        callback(data);
        delete gft.jsonp[randomName];
        script.parentNode.removeChild(script);
      }
          
      // Add script to page    
      var script = document.createElement('script');
      script.src = url + '&jsonCallback=gft.jsonp.' + randomName;
      script.async = true;
      script = document.getElementsByTagName('head')[0].appendChild(script);      
    },
    
    
    
    /** 
     * @param {Object} data Data object returned from Google Fusion Tables.
     * @param {Object=} keys Keys to translate table values to object properties.
     * @return {Object} GeoJSON object.
     */
    toGeoJSON: function(data, keys){
      
      var cols = data.table.cols;
      var rows = data.table.rows;
      
      if (!keys) { // Keys missing
        keys = { 'properties': {} };
            
        // Identify geometry column in first row
        var value;
        for (var i = 0, len = rows[0].length; i < len; i++) {    
          value = rows[0][i];
              
          if (typeof value === 'object' && (value.coordinates || value.geometries)){
            keys.geometry = i;
          } else {
            keys.properties[cols[i]] = i; 
          }
              
        }
      };  
  
      this.formatKeys(keys, cols);
          
      var geojson = { 
        type: 'FeatureCollection',
        features: [] 
      };
      var feature;
         
      for (var i = 0, len = rows.length; i < len; i++) {
        feature = { type: 'Feature' };
        this.rowToFeature( feature, keys, rows[i] );
        geojson.features.push(feature);
      }
    
      return geojson;
    
    },
    
    
    /** 
     * @param {Object} keys
     * @param {Array} cols
     * @private
     */
    formatKeys: function(keys, cols) {
        
      for (var property in keys) {
        if (!(typeof keys[property] === 'object')){
          if (typeof keys[property] === 'string'){
            keys[property] = this.indexOf(cols, keys[property]);
          }
        } else {
          this.formatKeys(keys[property], cols ); // Recursive call
        }
      }    
          
    },
        
        
    /** 
     * Map row values to feature object
     * @param {Object} feature
     * @param {Object} keys
     * @param {Array} row
     * @private
     */
    rowToFeature: function(feature, keys, row) {
        
      for (var property in keys) {
        if (!(typeof keys[property] === 'object')){
          feature[property] = row[keys[property]];
        } else {
          feature[property] = {};
          this.rowToFeature(feature[property], keys[property], row ); // Recursive call
        }
      }    
        
    },
    
    
    indexOf: function (array, obj){
      if (array.indexOf) {
        return array.indexOf(obj);
      } else {
        for(var i=0; i < array.length; i++) {
          if (array[i] == obj) return i;
        }
        return -1;
      }   
    }
  
  };
  
  
  // if node.js
  if (typeof document == 'undefined' && typeof window == 'undefined'){
    
    gft.jsonp = function(url, callback){
  
      // Extract hostname from url
      var hostname = new RegExp('^(?:f|ht)tp(?:s)?\://([^/]+)', 'im');
    
      var options = {
        host: url.match(hostname)[1],
        path: url + '&jsonCallback=gft'
      };
    
      var request = require('https').request(options, function(res){
    
    
        if (res.statusCode == 200){
          var data = '';
          res.on('data', function(chunk){
            data += chunk;
          });
          res.on('end', function(){
            // Remove callback function and parse JSON string
            var json = JSON.parse( data.substr(0, data.length-2).substr(4));
            callback(json);
          });
        } else {
          callback(false);
        }
    
      });
    
      request.end();
    
    };
    
  };
  
  global.gft = gft;

})(typeof exports != 'undefined' ? exports : this);  