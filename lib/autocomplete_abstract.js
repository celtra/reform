(function() {
  var AutocompleteAbstract, Cache,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  Cache = require("./cache");

  AutocompleteAbstract = (function() {
    AutocompleteAbstract.prototype.KEY = {
      UP: 38,
      DOWN: 40,
      DEL: 46,
      RETURN: 13,
      ESC: 27,
      PAGEUP: 33,
      PAGEDOWN: 34
    };

    function AutocompleteAbstract(select, options) {
      var inlineOptions;
      this.select = select;
      this.refreshState = __bind(this.refreshState, this);
      this.options = {
        url: null,
        dataType: 'json',
        max: 1000,
        minChars: 0,
        delay: 0,
        caseSensitive: false,
        highlightTitles: true,
        highlightSelection: true,
        showArrows: true,
        hyphenate: true,
        exactMatch: false,
        title: null,
        placeholderText: 'Type to search...',
        reformClass: 'reform-autocomplete',
        uiClass: 'reform-autocomplete-ui',
        fakeClass: 'reform-autocomplete-fake',
        filterClass: 'reform-autocomplete-filter',
        emptyClass: 'reform-autocomplete-empty',
        disabledClass: 'disabled',
        arrowDownClass: 'arrow-down',
        arrowUpClass: 'arrow-up',
        hoverClass: 'hover',
        selectedClass: 'selected',
        floaterClass: 'reform-floater',
        listClass: 'reform-floater-list',
        itemClass: 'reform-floater-item',
        overlayClass: 'reform-floater-overlay'
      };
      this.orig = $(this.select);
      if (this.orig.is(".reformed")) {
        return;
      }
      inlineOptions = this.orig.data();
      $.extend(this.options, options);
      $.extend(this.options, inlineOptions);
      if (!!this.options.extraParams) {
        this.options.customParams = this.options.extraParams;
      }
      if (!!this.options.matchCase) {
        this.options.caseSensitive = this.options.matchCase;
      }
      if (!!this.options.colorTitle) {
        this.options.highlightTitles = this.options.colorTitle;
      }
      if (!!this.options.matchAll) {
        this.options.exactMatch = this.options.matchAll;
      }
      if (!!this.options.placeholder) {
        this.options.placeholderText = this.options.placeholder;
      }
      if (!!this.options.arrow) {
        this.options.showArrows = this.options.arrow;
      }
      this.data = [];
      if (this.options.title != null) {
        this.filterValue = this.options.title;
      } else {
        this.filterValue = '';
      }
      if (this.orig.val().length === 0) {
        this.selectedItem = {
          value: null,
          title: ''
        };
      } else {
        this.selectedItem = {
          value: this.orig.val(),
          title: this.options.title
        };
      }
      if (this.options.url != null) {
        this.cache = new Cache(this.options);
      }
      this.el = null;
      this.floater = null;
      this.list = null;
      this.filter = null;
      this.customClass = null;
      this.initCustomClass();
      this.el = this.createClosed();
      this.orig.hide().attr("class", "reformed");
      this.orig.after(this.el).appendTo(this.el);
      $('body').on("reform.open", (function(_this) {
        return function(e) {
          if (e.target !== _this.select) {
            return _this.close();
          }
        };
      })(this));
      this.orig.on("reform.sync change DOMSubtreeModified", (function(_this) {
        return function() {
          return setTimeout(_this.refreshState, 0);
        };
      })(this));
      this.orig.on("reform.close", (function(_this) {
        return function(e) {
          return _this.close();
        };
      })(this));
      this.orig.on("reform.fill", (function(_this) {
        return function(e, data) {
          return _this.handleDataFill(data);
        };
      })(this));
      this.el.on('filterChanged', (function(_this) {
        return function() {
          return _this.handleFilterChanged();
        };
      })(this));
      this.el.on('selectedItemChanged', (function(_this) {
        return function() {
          return _this.handleSelectionChanged();
        };
      })(this));
      this.refreshState();
    }

    AutocompleteAbstract.prototype.initCustomClass = function() {
      var origClass;
      origClass = this.orig.attr('class');
      this.customClass = origClass.replace(this.options.reformClass, '');
      return this.customClass = this.customClass.trim();
    };

    AutocompleteAbstract.prototype.handleSelectionChanged = function() {
      this.orig.val(this.selectedItem.value);
      this.orig.data('title', this.selectedItem.title);
      return this.orig.trigger('change', this.selectedItem);
    };

    AutocompleteAbstract.prototype.handleDataFill = function(data) {
      if (this.options.url) {
        return;
      }
      this.close();
      return this.data = this.parse(data);
    };

    AutocompleteAbstract.prototype.handleFilterChanged = function() {
      if (!this.floater) {
        return;
      }
      return this.getData((function(_this) {
        return function(data) {
          var $list;
          $list = _this.createList(data);
          return _this.insertList($list);
        };
      })(this));
    };

    AutocompleteAbstract.prototype.handleDisabledToggle = function() {
      if (this.orig.is(':disabled') && !this.el.hasClass(':disabled')) {
        this.close();
        return this.el.addClass(this.options.disabledClass);
      } else if (!this.orig.is(':disabled') && !this.el.hasClass(':disabled')) {
        return this.el.removeClass(this.options.disabledClass);
      }
    };

    AutocompleteAbstract.prototype.setFilterValue = function(value) {
      var oldValue;
      oldValue = this.filterValue;
      this.filterValue = value;
      return this.el.trigger('filterChanged', {
        oldValue: oldValue,
        newValue: this.filterValue
      });
    };

    AutocompleteAbstract.prototype.setSelectedItem = function(item) {
      this.selectedItem = item;
      return this.el.trigger('selectedItemChanged', item);
    };

    AutocompleteAbstract.prototype.refreshState = function() {
      return this.handleDisabledToggle();
    };

    AutocompleteAbstract.prototype.createClosed = function() {
      var $el;
      $el = $("<div/>");
      $el.addClass('reform');
      $el.addClass(this.customClass);
      $el.addClass(this.options.uiClass);
      $el.addClass(this.options.fakeClass);
      if (this.orig.is(":disabled")) {
        $el.addClass(this.options.disabledClass);
      }
      if (this.options.showArrows) {
        $el.addClass(this.options.arrowDownClass);
      }
      return $el;
    };

    AutocompleteAbstract.prototype.createFloater = function() {
      var $floater;
      $floater = $("<div/>");
      $floater.addClass('reform');
      $floater.addClass(this.customClass);
      $floater.addClass(this.options.uiClass);
      $floater.addClass(this.options.floaterClass);
      return $floater.css("min-width", this.el.outerWidth());
    };

    AutocompleteAbstract.prototype.createFilter = function() {
      var $filter;
      $filter = $("<input/>");
      $filter.addClass(this.options.filterClass);
      if (this.orig.is(':disabled')) {
        $filter.attr('disabled', 'disabled');
      }
      if (this.options.placeholderText != null) {
        $filter.attr('placeholder', this.options.placeholderText);
      }
      $filter.on('blur', (function(_this) {
        return function() {
          return _this.handleFilterBlur();
        };
      })(this));
      $filter.on("keyup.autocomplete", (function(_this) {
        return function(e) {
          return _this.handleKeyUp(e);
        };
      })(this));
      $filter.on("keydown.autocomplete", (function(_this) {
        return function(e) {
          return _this.handleKeyDown(e);
        };
      })(this));
      return $filter;
    };

    AutocompleteAbstract.prototype.handleFilterBlur = function() {};

    AutocompleteAbstract.prototype.createEmptyList = function() {
      var $list;
      $list = $('<div></div>');
      $list.addClass(this.options.listClass);
      return $list;
    };

    AutocompleteAbstract.prototype.createList = function(data) {
      var $item, $list, count, item, _i, _len;
      $list = this.createEmptyList();
      if (!data) {
        return;
      }
      count = 0;
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        if (this.options.max > count) {
          $item = this.createItem(item);
          $item.appendTo($list);
        }
        count++;
      }
      return $list;
    };

    AutocompleteAbstract.prototype.createItem = function(item) {
      var $item, highlightedText, leadingString, position, text, trailingString;
      $item = $('<div></div>');
      $item.addClass(this.options.itemClass);
      $item.data('title', item.title);
      $item.data('value', item.value);
      position = item.title.toLowerCase().indexOf(this.filterValue.toLowerCase());
      if (this.options.highlightTitles && this.filterValue.length !== 0 && position !== -1) {
        text = item.title.substring(position, position + this.filterValue.length);
        leadingString = item.title.substring(0, position);
        trailingString = item.title.substring(position + this.filterValue.length, item.title.length);
        highlightedText = "<strong>" + (this.hyphenate(text)) + "</strong>";
        $item.html(this.hyphenate(leadingString) + highlightedText + this.hyphenate(trailingString));
      } else {
        $item.html(this.hyphenate(item.title));
      }
      if (this.options.highlightSelection && (this.selectedItem.value != null)) {
        if (item.value === this.selectedItem.value) {
          $item.addClass(this.options.selectedClass);
        }
      }
      $item.on('mousedown', function(e) {
        return e.preventDefault();
      });
      $item.on('click', (function(_this) {
        return function(e) {
          return _this.handleItemSelect($(e.target));
        };
      })(this));
      $item.on('mouseenter', (function(_this) {
        return function(e) {
          return _this.setHover($(e.target));
        };
      })(this));
      return $item;
    };

    AutocompleteAbstract.prototype.handleItemSelect = function($item) {
      if ($item.length === 0) {
        return;
      }
      if ($item.is('strong')) {
        $item = $item.closest('div');
      }
      if (this.options.highlightSelection) {
        this.list.children().removeClass(this.options.selectedClass);
        $item.addClass(this.options.selectedClass);
      }
      this.setSelectedItem({
        value: $item.data('value'),
        title: $item.data('title')
      });
      return this.close();
    };

    AutocompleteAbstract.prototype.insertList = function($list) {
      if (!this.floater) {
        return;
      }
      this.list.empty();
      this.list.append($list.children());
      if (this.list.children().length === 0) {
        this.handleEmptyList();
      }
      return this.list;
    };

    AutocompleteAbstract.prototype.handleEmptyList = function() {
      return this.close();
    };

    AutocompleteAbstract.prototype.open = function() {
      var $body, $overlay;
      if ((this.floater != null) || this.el.hasClass(this.options.disabledClass)) {
        return;
      }
      this.orig.trigger("reform.open");
      this.floater = this.createFloater();
      $overlay = $('<div></div>');
      $overlay.addClass('reform');
      $overlay.addClass(this.options.overlayClass);
      $overlay.addClass(this.customClass);
      $overlay.one('click', (function(_this) {
        return function() {
          return _this.close();
        };
      })(this));
      this.list = this.createEmptyList();
      this.list.appendTo(this.floater);
      this.floater.css(this.getFloaterPosition());
      $body = $('body');
      $body.append($overlay);
      $body.append(this.floater);
      return this.getData((function(_this) {
        return function(data) {
          var $list;
          $list = _this.createList(data);
          return _this.insertList($list);
        };
      })(this));
    };

    AutocompleteAbstract.prototype.close = function() {
      if (!this.floater) {
        return;
      }
      this.floater.siblings('.' + this.options.overlayClass).remove();
      this.floater.remove();
      this.floater = null;
      this.list = null;
      this.filterValue = '';
      return this.orig.trigger("reform.closed");
    };

    AutocompleteAbstract.prototype.cancelChanges = function() {
      this.filterValue = this.selectedItem.title;
      this.filter.val(this.filterValue);
      return this.el.trigger('selectedItemChanged', this.selectedItem);
    };

    AutocompleteAbstract.prototype.handleKeyDown = function(e) {
      if (this.orig.is(':disabled')) {
        return;
      }
      if (e.keyCode === this.KEY.UP) {
        e.preventDefault();
      }
      switch (e.keyCode) {
        case this.KEY.DOWN:
          return this.moveHover('down');
        case this.KEY.UP:
          return this.moveHover('up');
        case this.KEY.ESC:
          if (this.floater != null) {
            return e.preventDefault();
          }
          break;
        case this.KEY.RETURN:
          if (this.floater != null) {
            e.preventDefault();
          }
          return this.handleReturnKeyPress();
      }
    };

    AutocompleteAbstract.prototype.handleKeyUp = function(e) {
      if (this.orig.is(':disabled')) {
        return;
      }
      switch (e.keyCode) {
        case this.KEY.DOWN:
        case this.KEY.UP:
        case this.KEY.RETURN:
          break;
        case this.KEY.ESC:
          this.cancelChanges();
          return this.close();
        default:
          this.setFilterValue(this.filter.val());
          this.orig.val(this.filter.val());
          return this.orig.trigger('keyup', e);
      }
    };

    AutocompleteAbstract.prototype.handleReturnKeyPress = function() {
      var $item;
      if (this.floater != null) {
        $item = this.list.find('.' + this.options.hoverClass);
        this.handleItemSelect($item);
      }
      return $item;
    };

    AutocompleteAbstract.prototype.moveHover = function(direction) {
      var $current, $nextHover;
      if (direction == null) {
        direction = 'down';
      }
      if (!this.floater) {
        return;
      }
      $current = this.list.find('.' + this.options.hoverClass);
      if ($current.length === 0) {
        $nextHover = this.list.find('.' + this.options.itemClass + ':first-child');
      } else if (direction === 'down') {
        $nextHover = $current.next();
      } else if (direction === 'up') {
        $nextHover = $current.prev();
      }
      if ($nextHover.length !== 0) {
        this.setHover($nextHover);
        return this.scrollTo($nextHover);
      }
    };

    AutocompleteAbstract.prototype.scrollTo = function($item) {
      var $container, newScrollTop, scrollTop;
      if (!this.floater) {
        return;
      }
      $container = $item.parent();
      newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop();
      if (newScrollTop > ($container.outerHeight() - $item.outerHeight())) {
        scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight();
        return $container.scrollTop(scrollTop);
      } else {
        return $container.scrollTop(0);
      }
    };

    AutocompleteAbstract.prototype.setHover = function($item) {
      var $items;
      if (!this.floater) {
        return;
      }
      $items = this.list.find('.' + this.options.itemClass);
      $items.removeClass(this.options.hoverClass);
      return $item.addClass(this.options.hoverClass);
    };

    AutocompleteAbstract.prototype.getFloaterPosition = function() {
      return this.el.offset();
    };

    AutocompleteAbstract.prototype.hyphenate = function(value) {
      var char, chars, hyphenatedValue, seperator, _i, _len;
      if (!this.options.hyphenate) {
        return value;
      }
      seperator = '&shy;';
      chars = value.split('');
      hyphenatedValue = '';
      for (_i = 0, _len = chars.length; _i < _len; _i++) {
        char = chars[_i];
        if (hyphenatedValue.length === 0 || (char === ' ' || char === '-')) {
          hyphenatedValue += char;
        } else {
          hyphenatedValue += seperator + char;
        }
      }
      return hyphenatedValue;
    };

    AutocompleteAbstract.prototype.parse = function(data) {
      var parsed;
      parsed = [];
      $.each(data, (function(_this) {
        return function(num, item) {
          return parsed.push({
            value: item.value,
            title: _this.options.formatResult && _this.options.formatResult(item) || item.title
          });
        };
      })(this));
      return parsed;
    };

    AutocompleteAbstract.prototype.getData = function(callback) {
      var data;
      if (!callback) {
        return;
      }
      if (this.options.url) {
        return this.loadDataFromUrl(callback);
      } else {
        data = this.filterData();
        return callback(data);
      }
    };

    AutocompleteAbstract.prototype.filterData = function() {
      var filterValue, filteredData, item, title, _i, _len, _ref;
      filteredData = [];
      _ref = this.data;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        item = _ref[_i];
        if (!this.options.exactMatch && (this.filterValue != null)) {
          title = item.title;
          filterValue = this.filterValue;
          if (!this.options.caseSensitive) {
            title = title.toLowerCase();
            filterValue = filterValue.toLowerCase();
          }
          if (title.indexOf(filterValue) !== -1) {
            filteredData.push(item);
          }
        } else {
          filteredData.push(item);
        }
      }
      return filteredData;
    };

    AutocompleteAbstract.prototype.loadDataFromUrl = function(callback) {
      var currentFilter, customParams, data, fetchDataCallback, key, param, params, _i, _len, _ref;
      currentFilter = this.filterValue;
      data = this.cache.load(currentFilter);
      if (data != null) {
        callback(data);
        return;
      }
      params = {
        q: currentFilter,
        matchCase: this.options.caseSensitive,
        limit: this.options.max,
        timeStamp: new Date()
      };
      if (this.options.customParams != null) {
        customParams = [];
        _ref = this.options.customParams;
        for (param = _i = 0, _len = _ref.length; _i < _len; param = ++_i) {
          key = _ref[param];
          customParams[key] = typeof param === "function" ? param() : param;
        }
        $.extend(params, customParams);
      }
      fetchDataCallback = (function(_this) {
        return function() {
          return _this.fetchData(params, function(data) {
            var parsedData;
            parsedData = _this.parse(data);
            _this.cache.add(currentFilter, parsedData);
            if (callback != null) {
              return callback(parsedData);
            }
          });
        };
      })(this);
      clearTimeout(this.fetchTimeout);
      return this.fetchTimeout = setTimeout(fetchDataCallback, this.options.delay);
    };

    AutocompleteAbstract.prototype.fetchData = function(params, successCallback) {
      if (this.ajaxInProgress) {
        this.lastXHR.abort();
      }
      this.ajaxInProgress = true;
      this.orig.trigger('ajaxRequestStarted');
      return this.lastXHR = $.ajax({
        dataType: this.options.dataType,
        url: this.options.url,
        data: params,
        success: (function(_this) {
          return function(data) {
            _this.ajaxInProgress = false;
            _this.orig.trigger('ajaxRequestFinished');
            return successCallback(data);
          };
        })(this),
        error: (function(_this) {
          return function(data) {
            _this.ajaxInProgress = false;
            _this.orig.trigger('ajaxRequestFinished');
            return console.log(data);
          };
        })(this)
      });
    };

    return AutocompleteAbstract;

  })();

  module.exports = AutocompleteAbstract;

}).call(this);
