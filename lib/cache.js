(function() {
  var Cache,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  Cache = (function() {
    Cache.prototype.data = {};

    Cache.prototype.length = 0;

    Cache.prototype.options = {
      cacheLength: 100,
      matchContains: false,
      matchSubset: true
    };

    function Cache(options) {
      this.load = __bind(this.load, this);
      $.extend(this.options, options);
    }

    Cache.prototype.matchSubset = function(s, sub) {
      var i;
      if (!this.options.matchCase) {
        s = s.toLowerCase();
      }
      i = s.indexOf(sub);
      if (this.options.matchContains === "word") {
        i = s.toLowerCase().search("\\b" + sub.toLowerCase());
      }
      if (i === -1) {
        return false;
      }
      return i === 0 || this.options.matchContains;
    };

    Cache.prototype.add = function(q, value) {
      if (this.length > this.options.cacheLength) {
        flush();
      }
      if (!this.data[q]) {
        this.length++;
      }
      return this.data[q] = value;
    };

    Cache.prototype.flush = function() {
      this.data = {};
      return this.length = 0;
    };

    Cache.prototype.load = function(q) {
      var c, csub, i, self;
      if (!this.options.cacheLength || !this.length) {
        return null;
      }
      if (this.data[q]) {
        return this.data[q];
      } else if (this.options.matchSubset) {
        i = q.length - 1;
        while (i >= this.options.minChars) {
          c = this.data[q.substr(0, i)];
          if (c) {
            csub = [];
            self = this;
            $.each(c, function(i, x) {
              if (self.matchSubset(x.title, q)) {
                return csub[csub.length] = x;
              }
            });
            return csub;
          }
          i--;
        }
      }
      return null;
    };

    return Cache;

  })();

  module.exports = Cache;

}).call(this);
