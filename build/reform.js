(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);throw new Error("Cannot find module '"+o+"'")}var f=n[o]={exports:{}};t[o][0].call(f.exports,function(e){var n=t[o][1][e];return s(n?n:e)},f,f.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function() {
  var AutocompleteAbstract, Cache,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

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
        hyphenate: true,
        exactMatch: false,
        title: null,
        placeholderText: 'Type to search...',
        fakeClass: 'reform-autocomplete-fake',
        filterClass: 'reform-autocomplete-filter',
        emptyClass: 'reform-autocomplete-empty',
        disabledClass: 'disabled',
        arrowDownClass: 'arrow-down',
        arrowUpClass: 'arrow-up',
        hoverClass: 'hover',
        selectedClass: 'selected',
        floaterClass: 'reform-floater',
        groupClass: 'reform-group',
        listClass: 'reform-floater-list',
        itemClass: 'reform-floater-item',
        overlayClass: 'reform-floater-overlay'
      };
      this.orig = $(this.select);
      if (this.orig.is('.reformed')) {
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
      this.orig.hide().attr('class', 'reformed');
      this.orig.after(this.el).appendTo(this.el);
      $('body').on('reform.open', (function(_this) {
        return function(e) {
          if (e.target !== _this.select) {
            return _this.close();
          }
        };
      })(this));
      this.orig.on('reform.sync change DOMSubtreeModified', (function(_this) {
        return function() {
          return setTimeout(_this.refreshState, 0);
        };
      })(this));
      this.orig.on('reform.close', (function(_this) {
        return function(e) {
          return _this.close();
        };
      })(this));
      this.orig.on('reform.fill', (function(_this) {
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
      $el = $('<div/>');
      $el.addClass('reform');
      $el.addClass(this.customClass);
      $el.addClass(this.options.uiClass);
      $el.addClass(this.options.fakeClass);
      if (this.orig.is(':disabled')) {
        $el.addClass(this.options.disabledClass);
      }
      if (this.options.showArrows) {
        $el.addClass(this.options.arrowDownClass);
      }
      return $el;
    };

    AutocompleteAbstract.prototype.createFloater = function() {
      var $floater;
      $floater = $('<div/>');
      $floater.addClass('reform');
      $floater.addClass(this.customClass);
      $floater.addClass(this.options.uiClass);
      $floater.addClass(this.options.floaterClass);
      return $floater.css('min-width', this.el.outerWidth());
    };

    AutocompleteAbstract.prototype.createFilter = function() {
      var $filter;
      $filter = $('<input/>');
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
      $filter.on('keyup.autocomplete', (function(_this) {
        return function(e) {
          return _this.handleKeyUp(e);
        };
      })(this));
      $filter.on('keydown.autocomplete', (function(_this) {
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
      var $group, $item, $list, count, group, groups, groupsToHide, groupsToOpen, item, listItems, position, _i, _j, _k, _l, _len, _len1, _len2, _len3;
      $list = this.createEmptyList();
      if (!data) {
        return;
      }
      groups = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        if (item.isGroup) {
          $group = this.createGroup(item);
          groups.push(encodeURIComponent(item.group));
          $group.appendTo($list);
        }
      }
      count = 0;
      listItems = [];
      for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
        item = data[_j];
        if (this.options.max > count) {
          if (!item.isGroup) {
            $item = this.createItem(item);
            listItems.push(item);
            if (item.group) {
              $item.appendTo($list.find("[data-group-id='" + encodeURIComponent(item.group) + "']"));
            } else {
              $item.appendTo($list);
            }
          }
        }
        count++;
      }
      groupsToOpen = [];
      for (_k = 0, _len2 = listItems.length; _k < _len2; _k++) {
        item = listItems[_k];
        position = item.title.toLowerCase().indexOf(this.filterValue.toLowerCase());
        if (this.filterValue.length && position !== -1) {
          group = encodeURIComponent(item.group);
          if (__indexOf.call(groupsToOpen, group) < 0) {
            groupsToOpen.push(group);
            this.handleGroupSelect($list.find('[data-group-id="' + group + '"]'));
          }
        }
      }
      if (this.filterValue.length) {
        groupsToHide = groups.filter(function(group) {
          return groupsToOpen.indexOf(group) < 0;
        });
        for (_l = 0, _len3 = groupsToHide.length; _l < _len3; _l++) {
          group = groupsToHide[_l];
          $list.find('[data-group-id="' + group + '"]').remove();
        }
      }
      return $list;
    };

    AutocompleteAbstract.prototype.createGroup = function(group) {
      var $group;
      $group = $("<div><span>" + group.title + "</span></div>");
      $group.attr('data-group-id', encodeURIComponent(group.group));
      $group.addClass(this.options.groupClass);
      $group.on('mousedown', function(e) {
        return e.preventDefault();
      });
      $group.on('click', (function(_this) {
        return function(e) {
          return _this.handleGroupSelect($(e.target).closest('div'));
        };
      })(this));
      $group.on('mouseenter', (function(_this) {
        return function(e) {
          return _this.setHover($(e.target));
        };
      })(this));
      return $group;
    };

    AutocompleteAbstract.prototype.createItem = function(item) {
      var $item, highlightedText, leadingString, position, text, trailingString;
      $item = $('<div></div>');
      $item.addClass(this.options.itemClass);
      $item.data('title', item.title);
      $item.data('value', item.value);
      if (item.tooltip) {
        $item.attr('title', item.tooltip);
      }
      if (item.group) {
        $item.attr('data-group', encodeURIComponent(item.group));
      }
      if (item.disabled) {
        $item.addClass(this.options.disabledClass);
      }
      position = item.title.toLowerCase().indexOf(this.filterValue.toLowerCase());
      if (this.options.highlightTitles && this.filterValue.length && position !== -1) {
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

    AutocompleteAbstract.prototype.handleGroupSelect = function($group) {
      return $group.toggleClass('opened');
    };

    AutocompleteAbstract.prototype.handleItemSelect = function($item) {
      if ($item.length === 0) {
        return;
      }
      if ($item.hasClass(this.options.disabledClass)) {
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
      var _ref;
      if (!this.floater) {
        return;
      }
      this.list.empty();
      this.list.append($list.children());
      if (this.list.children().length === 0) {
        this.handleEmptyList();
      }
      if ((_ref = this.list) != null) {
        _ref.on('mousewheel DOMMouseScroll', function(e) {
          var delta, e0;
          e0 = e.originalEvent;
          delta = e0.wheelDelta || -e0.detail;
          this.scrollTop += (delta < 0 ? 1 : -1) * 30;
          return e.preventDefault();
        });
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
      this.orig.trigger('reform.open');
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
      return this.orig.trigger('reform.closed');
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
        $nextHover = this.list.find('.' + this.options.itemClass).first();
      } else if (direction === 'down') {
        $nextHover = $current.next();
        if ($nextHover.length === 0) {
          $nextHover = $current.parent().next('.' + this.options.groupClass).children().first();
        }
      } else if (direction === 'up') {
        $nextHover = $current.prev();
        if ($nextHover.length === 0) {
          $nextHover = $current.parent().prev('.' + this.options.groupClass).children().last();
        }
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
      if (!this.floater) {
        return;
      }
      this.list.find('.' + this.options.hoverClass).removeClass(this.options.hoverClass);
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
      var addItem, group, item, parsed, _i, _j, _k, _len, _len1, _len2, _ref;
      parsed = [];
      addItem = (function(_this) {
        return function(item) {
          return parsed.push({
            value: item.value,
            title: _this.options.formatResult && _this.options.formatResult(item) || item.title,
            group: item.group != null ? item.group : null,
            tooltip: item.tooltip != null ? item.tooltip : null,
            disabled: item.disabled != null ? item.disabled : null
          });
        };
      })(this);
      if (data[0].group) {
        _ref = this.getDataGroups(data);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          group = _ref[_i];
          parsed.push({
            title: group,
            group: group,
            isGroup: true
          });
          for (_j = 0, _len1 = data.length; _j < _len1; _j++) {
            item = data[_j];
            if (item['group'] === group) {
              addItem(item);
            }
          }
        }
      } else {
        for (_k = 0, _len2 = data.length; _k < _len2; _k++) {
          item = data[_k];
          addItem(item);
        }
      }
      return parsed;
    };

    AutocompleteAbstract.prototype.getDataGroups = function(data) {
      var dataGroups, item, _i, _len, _ref;
      dataGroups = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        if (_ref = item.group, __indexOf.call(dataGroups, _ref) < 0) {
          dataGroups.push(item.group);
        }
      }
      return dataGroups;
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
        if (item.isGroup) {
          filteredData.push(item);
        } else if (!this.options.exactMatch && (this.filterValue != null)) {
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
          customParams[key] = typeof param === 'function' ? param() : param;
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
            return console.log('Error: ', data);
          };
        })(this)
      });
    };

    return AutocompleteAbstract;

  })();

  module.exports = AutocompleteAbstract;

}).call(this);

},{"./cache":4,"jquery-commonjs":11}],2:[function(require,module,exports){
(function() {
  var AutocompleteAbstract, AutocompleteBox,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  AutocompleteAbstract = require("./autocomplete_abstract");

  AutocompleteBox = (function(_super) {
    __extends(AutocompleteBox, _super);

    function AutocompleteBox(select, options) {
      this.select = select;
      this.handleDisabledToggle = __bind(this.handleDisabledToggle, this);
      this.options = $.extend({
        showArrows: false,
        reformClass: 'reform-autocompletebox',
        uiClass: 'reform-autocompletebox-ui'
      }, options);
      AutocompleteBox.__super__.constructor.call(this, this.select, this.options);
      if (!this.el) {
        return;
      }
      this.filter = this.createFilter();
      if (this.selectedItem.value != null) {
        this.filter.val(this.selectedItem.title);
      }
      this.el.append(this.filter);
      this.el.on('click', (function(_this) {
        return function() {
          if (_this.options.minChars === 0) {
            return _this.open();
          }
        };
      })(this));
    }

    AutocompleteBox.prototype.handleSelectionChanged = function() {
      this.filter.val(this.selectedItem.title);
      return AutocompleteBox.__super__.handleSelectionChanged.apply(this, arguments);
    };

    AutocompleteBox.prototype.handleDisabledToggle = function() {
      AutocompleteBox.__super__.handleDisabledToggle.apply(this, arguments);
      if (!this.filter) {
        return;
      }
      if (this.orig.is(':disabled') && !this.filter.is(':disabled')) {
        return this.filter.attr('disabled', 'disabled');
      } else {
        return this.filter.removeAttr('disabled');
      }
    };

    AutocompleteBox.prototype.createClosed = function() {
      var $el;
      $el = AutocompleteBox.__super__.createClosed.apply(this, arguments);
      $el.on('click', (function(_this) {
        return function() {
          if (!_this.floater && _this.filter.val().length > _this.options.minChars) {
            _this.open();
            return _this.filter.focus();
          }
        };
      })(this));
      return $el;
    };

    AutocompleteBox.prototype.handleFilterBlur = function() {
      this.setSelectedItemByCurrentFilterValue();
      this.close();
      return AutocompleteBox.__super__.handleFilterBlur.apply(this, arguments);
    };

    AutocompleteBox.prototype.open = function() {
      this.filterValue = this.filter.val();
      AutocompleteBox.__super__.open.apply(this, arguments);
      return this.handleArrowsToggle();
    };

    AutocompleteBox.prototype.close = function() {
      AutocompleteBox.__super__.close.apply(this, arguments);
      return this.handleArrowsToggle();
    };

    AutocompleteBox.prototype.handleReturnKeyPress = function() {
      var $item;
      $item = AutocompleteBox.__super__.handleReturnKeyPress.apply(this, arguments);
      if (!$item || $item.length === 0) {
        this.setSelectedItemByCurrentFilterValue();
        return this.close();
      }
    };

    AutocompleteBox.prototype.handleArrowsToggle = function() {
      if (!this.options.showArrows) {
        return;
      }
      if (this.floater != null) {
        this.el.removeClass(this.options.arrowDownClass);
        return this.el.addClass(this.options.arrowUpClass);
      } else {
        this.el.removeClass(this.options.arrowUpClass);
        return this.el.addClass(this.options.arrowDownClass);
      }
    };

    AutocompleteBox.prototype.handleKeyUp = function(e) {
      if (e.keyCode === this.KEY.RETURN) {
        return;
      }
      if (this.filter.val().length >= this.options.minChars) {
        if (this.floater == null) {
          this.open();
        }
      } else if (this.floater != null) {
        this.close();
        return;
      } else {
        if (e.keyCode === this.KEY.ESC) {
          this.cancelChanges();
        }
        return;
      }
      return AutocompleteBox.__super__.handleKeyUp.apply(this, arguments);
    };

    AutocompleteBox.prototype.getFloaterPosition = function() {
      var position;
      position = AutocompleteBox.__super__.getFloaterPosition.apply(this, arguments);
      position.top += this.el.outerHeight();
      return position;
    };

    AutocompleteBox.prototype.setSelectedItemByCurrentFilterValue = function() {
      var title;
      if (this.selectedItem.title !== this.filter.val()) {
        title = this.filter.val();
        return this.getData((function(_this) {
          return function(data) {
            var item, itemTitle, matchingItem, searchTitle, _i, _len;
            matchingItem = null;
            if (title.length !== 0) {
              for (_i = 0, _len = data.length; _i < _len; _i++) {
                item = data[_i];
                if (_this.options.caseSensitive) {
                  itemTitle = item.title;
                  searchTitle = title;
                } else {
                  itemTitle = item.title.toLowerCase();
                  searchTitle = title.toLowerCase();
                }
                if (!matchingItem && itemTitle === searchTitle) {
                  matchingItem = item;
                }
              }
            }
            if (matchingItem != null) {
              return _this.setSelectedItem({
                value: matchingItem.value,
                title: matchingItem.title
              });
            } else {
              return _this.setSelectedItem({
                value: null,
                title: title
              });
            }
          };
        })(this));
      }
    };

    return AutocompleteBox;

  })(AutocompleteAbstract);

  module.exports = AutocompleteBox;

}).call(this);

},{"./autocomplete_abstract":1,"jquery-commonjs":11}],3:[function(require,module,exports){
(function() {
  var AutocompleteAbstract, AutocompleteCombobox,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  AutocompleteAbstract = require("./autocomplete_abstract");

  AutocompleteCombobox = (function(_super) {
    __extends(AutocompleteCombobox, _super);

    function AutocompleteCombobox(select, options) {
      var $title;
      this.select = select;
      this.options = $.extend({
        emptySelectionText: 'Select an item...',
        emptyText: 'No results.',
        showArrows: true,
        reformClass: 'reform-autocompletecombobox',
        uiClass: 'reform-autocompletecombobox-ui',
        floaterLabelClass: 'reform-autocomplete-floater-label',
        titleClass: 'selected-item',
        placeholderClass: 'placeholder'
      }, options);
      AutocompleteCombobox.__super__.constructor.call(this, this.select, this.options);
      if (!this.el) {
        return;
      }
      this.filterValue = '';
      $title = this.createTitle();
      if (this.selectedItem.value != null) {
        $title.text(this.selectedItem.title);
        $title.removeClass(this.options.placeholderClass);
      }
      this.el.append($title);
    }

    AutocompleteCombobox.prototype.handleSelectionChanged = function() {
      var $title;
      $title = this.el.find('span');
      if (this.selectedItem.value != null) {
        $title.text(this.selectedItem.title);
        $title.removeClass(this.options.placeholderClass);
      }
      return AutocompleteCombobox.__super__.handleSelectionChanged.apply(this, arguments);
    };

    AutocompleteCombobox.prototype.createClosed = function() {
      var $el;
      $el = AutocompleteCombobox.__super__.createClosed.apply(this, arguments);
      $el.on('click', (function(_this) {
        return function() {
          return _this.open();
        };
      })(this));
      return $el;
    };

    AutocompleteCombobox.prototype.createTitle = function() {
      var $title;
      $title = $('<span></span>');
      $title.addClass(this.options.titleClass);
      if ($title.text(this.options.emptySelectionText != null)) {
        $title.addClass(this.options.placeholderClass);
        $title.text(this.options.emptySelectionText);
      }
      return $title;
    };

    AutocompleteCombobox.prototype.createFloaterLabel = function() {
      var $title;
      $title = $('<span></span>');
      $title.addClass(this.options.floaterLabelClass);
      if (this.options.showArrows) {
        $title.addClass(this.options.arrowUpClass);
      }
      if (this.selectedItem.value) {
        $title.text(this.selectedItem.title);
      } else {
        $title.text(this.options.emptySelectionText);
      }
      $title.one('click', (function(_this) {
        return function() {
          return _this.close();
        };
      })(this));
      return $title;
    };

    AutocompleteCombobox.prototype.createNoResults = function() {
      var $empty;
      $empty = $('<div></div>');
      $empty.addClass(this.options.emptyClass);
      return $empty.text(this.options.emptyText);
    };

    AutocompleteCombobox.prototype.handleEmptyList = function() {
      return this.list.append(this.createNoResults());
    };

    AutocompleteCombobox.prototype.open = function() {
      var $title;
      AutocompleteCombobox.__super__.open.apply(this, arguments);
      $title = this.createFloaterLabel();
      $title.insertBefore(this.list);
      this.filter = this.createFilter();
      this.filter.insertBefore(this.list);
      return this.filter.focus();
    };

    return AutocompleteCombobox;

  })(AutocompleteAbstract);

  module.exports = AutocompleteCombobox;

}).call(this);

},{"./autocomplete_abstract":1,"jquery-commonjs":11}],4:[function(require,module,exports){
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
      var c, csub, i;
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
            $.each(c, (function(_this) {
              return function(i, x) {
                if (_this.matchSubset(x.title, q)) {
                  return csub[csub.length] = x;
                }
              };
            })(this));
            csub;
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

},{"jquery-commonjs":11}],5:[function(require,module,exports){
(function() {
  var CheckBox,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  CheckBox = (function() {
    function CheckBox(input, options) {
      this.refresh = __bind(this.refresh, this);
      this.orig = $(input);
      if (this.orig.is('.reformed')) {
        return;
      }
      if (this.orig.is(':radio')) {
        this.siblings = $("[name='" + (this.orig.attr("name")) + "']").not(this.orig);
      }
      this.fake = $('<label/>').addClass(this.orig.attr('class'));
      this.orig.hide().attr('class', 'reformed');
      this.fake.removeClass('reform-checkbox').addClass('reform-checkbox-fake');
      this.fake.addClass('reform reform-checkbox-ui');
      if (this.orig.is(':checked')) {
        this.fake.addClass('checked');
      }
      if (this.orig.is(':disabled')) {
        this.fake.addClass('disabled');
      }
      if (this.orig.is(':radio')) {
        this.fake.addClass('radio');
      }
      this.orig.after(this.fake).appendTo(this.fake);
      this.fake.on('mousedown', function(e) {
        return e.preventDefault();
      });
      this.orig.on('reform.sync change DOMSubtreeModified', (function(_this) {
        return function() {
          return setTimeout(_this.refresh, 0);
        };
      })(this));
    }

    CheckBox.prototype.refresh = function() {
      var _ref;
      this.fake.toggleClass('disabled', this.orig.is(':disabled'));
      this.fake.removeClass('checked');
      if (this.orig.is(':checked')) {
        this.fake.addClass('checked');
      }
      this.fake.trigger('reform-checkbox-attribute-change', this.fake.hasClass('checked'));
      if (!this.orig.is(':checked')) {
        return;
      }
      return (_ref = this.siblings) != null ? _ref.each(function() {
        return $(this).parent().removeClass('checked');
      }) : void 0;
    };

    return CheckBox;

  })();

  module.exports = CheckBox;

}).call(this);

},{"jquery-commonjs":11}],6:[function(require,module,exports){
(function() {
  var Reform, reform;

  Reform = require("./reform");

  reform = new Reform;

  reform.observe();

  window.Reform = reform;

}).call(this);

},{"./reform":8}],7:[function(require,module,exports){
(function() {
  var MultilineSelectBox, SelectBoxAbstract,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  SelectBoxAbstract = require('./selectbox_abstract');

  MultilineSelectBox = (function(_super) {
    __extends(MultilineSelectBox, _super);

    function MultilineSelectBox($select, options) {
      this.options = $.extend({
        noSelectionText: 'Select an item',
        reformClass: 'reform-multilineselectbox',
        uiClass: 'reform-multilineselectbox-ui'
      }, options);
      MultilineSelectBox.__super__.constructor.call(this, $select, this.options);
    }

    MultilineSelectBox.prototype.createItemContent = function($option) {
      var $desc, $itemContent, $title;
      $title = $('<p></p>');
      $title.text($option.text());
      $title.appendTo($itemContent);
      $desc = $('<span></span>');
      $desc.text($option.data('desc'));
      $desc.appendTo($itemContent);
      return $itemContent = $title.add($desc);
    };

    MultilineSelectBox.prototype.createClosedItem = function() {
      var $closedItem, $desc, $selected, $title, desc, title;
      $selected = this.orig.find('option').filter(function() {
        return this.selected;
      });
      if ($selected != null) {
        title = $selected.text();
        desc = $selected.data('desc');
      } else {
        title = this.options.noSelectionText;
      }
      $title = $('<p></p>');
      $title.text(title);
      if (desc) {
        $desc = $('<span></span>');
        $desc.text(desc);
        $closedItem = $title.add($desc);
      } else {
        $closedItem = $title;
      }
      return $closedItem;
    };

    return MultilineSelectBox;

  })(SelectBoxAbstract);

  module.exports = MultilineSelectBox;

}).call(this);

},{"./selectbox_abstract":10,"jquery-commonjs":11}],8:[function(require,module,exports){
(function() {
  var AutocompleteBox, AutocompleteCombobox, CheckBox, MultilineSelectBox, Reform, SelectBox;

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  CheckBox = require("./checkbox");

  SelectBox = require("./selectbox");

  MultilineSelectBox = require("./multilineselectbox");

  AutocompleteBox = require("./autocompletebox");

  AutocompleteCombobox = require("./autocompletecombobox");

  Reform = (function() {
    var selectboxList;

    function Reform() {}

    selectboxList = [];

    Reform.prototype.process = function(node) {
      var cls, control, n, select, _ref, _results;
      _ref = Reform.controls;
      _results = [];
      for (cls in _ref) {
        control = _ref[cls];
        _results.push((function() {
          var _i, _len, _ref1, _results1;
          _ref1 = $(node).parent().find("." + cls);
          _results1 = [];
          for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
            n = _ref1[_i];
            if (cls === 'reform-selectbox' || cls === 'reform-multilineselectbox') {
              select = new control(n);
              _results1.push(selectboxList.push(select));
            } else {
              _results1.push(new control(n));
            }
          }
          return _results1;
        })());
      }
      return _results;
    };

    Reform.prototype.observe = function() {
      $(document).on('ready', (function(_this) {
        return function() {
          return _this.process('body');
        };
      })(this));
      $(document).on('DOMNodeInserted', (function(_this) {
        return function(e) {
          return _this.process(e.target);
        };
      })(this));
      return $(window).resize((function(_this) {
        return function() {
          return _this.refresh();
        };
      })(this));
    };

    Reform.prototype.register = function(controlName, controlObj) {
      return Reform.controls[controlName] = controlObj;
    };

    Reform.prototype.refresh = function() {
      var n, _i, _len, _results;
      _results = [];
      for (_i = 0, _len = selectboxList.length; _i < _len; _i++) {
        n = selectboxList[_i];
        _results.push(n.positionFloater());
      }
      return _results;
    };

    return Reform;

  })();

  Reform.controls = {
    'reform-checkbox': CheckBox,
    'reform-selectbox': SelectBox,
    'reform-multilineselectbox': MultilineSelectBox,
    'reform-autocompletebox': AutocompleteBox,
    'reform-autocompletecombobox': AutocompleteCombobox
  };

  module.exports = Reform;

}).call(this);

},{"./autocompletebox":2,"./autocompletecombobox":3,"./checkbox":5,"./multilineselectbox":7,"./selectbox":9,"jquery-commonjs":11}],9:[function(require,module,exports){
(function() {
  var SelectBox, SelectBoxAbstract,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  SelectBoxAbstract = require("./selectbox_abstract");

  SelectBox = (function(_super) {
    __extends(SelectBox, _super);

    function SelectBox(select, options) {
      this.select = select;
      this.options = $.extend({
        reformClass: 'reform-selectbox',
        uiClass: 'reform-selectbox-ui'
      }, options);
      SelectBox.__super__.constructor.call(this, this.select, this.options);
    }

    SelectBox.prototype.createItemContent = function($option) {
      return $('<div/>').text($option.text()).html();
    };

    SelectBox.prototype.createClosedItem = function() {
      var plural, selected, title;
      selected = this.orig.find('option').filter(function() {
        return this.selected && $(this).data('count-option') !== 'no';
      });
      plural = this.orig.data('plural');
      title = (plural != null) && selected.length > 1 ? "" + selected.length + " " + plural : selected.map(function() {
        return $(this).text();
      }).get().join(', ');
      if (!title) {
        title = this.orig.attr('title');
      }
      if (title == null) {
        title = 'Select';
      }
      return title;
    };

    return SelectBox;

  })(SelectBoxAbstract);

  module.exports = SelectBox;

}).call(this);

},{"./selectbox_abstract":10}],10:[function(require,module,exports){
(function() {
  var SelectBoxAbstract,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  if (window.$ == null) {
    window.$ = require("jquery-commonjs");
  }

  SelectBoxAbstract = (function() {
    function SelectBoxAbstract(select, options) {
      var $selectedItem, origClass;
      this.select = select;
      this.positionFloater = __bind(this.positionFloater, this);
      this.refresh = __bind(this.refresh, this);
      this.close = __bind(this.close, this);
      this.open = __bind(this.open, this);
      this.createOptions = __bind(this.createOptions, this);
      this.orig = $(this.select);
      this.options = $.extend({
        fakeClass: 'reform-selectbox-fake'
      }, options);
      if (this.orig.is('.reformed')) {
        return;
      }
      this.body = $('body');
      this.fake = $('<div/>').addClass('closed');
      this.fake.attr('tabindex', 0);
      origClass = this.orig.attr('class');
      this.customClass = origClass.replace(this.options.reformClass, '');
      this.customClass = this.customClass.trim();
      this.fake.addClass('reform').addClass(this.customClass).addClass(this.options.fakeClass).addClass(this.options.uiClass);
      if (this.orig.is(':disabled')) {
        this.fake.addClass('disabled');
      }
      this.orig.hide().attr('class', 'reformed');
      $selectedItem = $('<div></div>').addClass('selected-item');
      $selectedItem.appendTo(this.fake);
      this.refresh();
      this.orig.after(this.fake).appendTo(this.fake);
      this.fake.on('keyup', (function(_this) {
        return function(ev) {
          if (ev.keyCode === 27) {
            ev.preventDefault();
            return ev.stopPropagation();
          }
        };
      })(this));
      this.fake.on('keydown', (function(_this) {
        return function(ev) {
          var $current, $item, $nextItem, done, goDown, goUp, itemDoesNotExist, itemIsDisabled;
          ev.preventDefault();
          ev.stopPropagation();
          if (_this.orig.is('[multiple]')) {
            return;
          }
          _this.fake.focus();
          goUp = ev.keyCode === 38;
          goDown = ev.keyCode === 40;
          if (goUp || goDown) {
            if (_this.floater == null) {
              return _this.open();
            } else {
              $current = $('.hover', _this.floater).length === 0 ? $('.selected', _this.floater) : $('.hover', _this.floater);
              if (goUp) {
                $nextItem = $current.prev().length === 0 ? $current.parent().children().last() : $current.prev();
              } else {
                $nextItem = $current.next().length === 0 ? $current.parent().children().first() : $current.next();
              }
              _this.hover($nextItem);
              return _this.scrollTo($nextItem);
            }
          } else if (ev.keyCode === 13) {
            $item = $(_this.floater).find('.hover');
            itemDoesNotExist = $item.length === 0;
            itemIsDisabled = $item.is('.disabled');
            if (itemDoesNotExist || itemIsDisabled) {
              return;
            }
            $item.siblings().andSelf().removeClass('selected');
            $item.addClass('selected');
            _this.orig.val(_this.value()).trigger('change');
            return _this.close();
          } else if (ev.keyCode === 27) {
            if (_this.floater != null) {
              return _this.close();
            }
          } else {
            done = false;
            return _this.$list.children().each(function(i, item) {
              if (!done) {
                if ($(item).text().charAt(0).toLowerCase() === String.fromCharCode(ev.keyCode).toLowerCase()) {
                  done = true;
                  _this.hover($(item));
                  return _this.scrollTo($(item));
                }
              }
            });
          }
        };
      })(this));
      this.floater = null;
      this.fake.on('click', (function(_this) {
        return function(e) {
          if (_this.orig.is(':disabled')) {
            return;
          }
          e.stopPropagation();
          if (_this.floater === null) {
            return _this.open();
          } else {
            return _this.close();
          }
        };
      })(this));
      this.fake.on('mousedown', function(e) {
        return e.preventDefault();
      });
      this.orig.on('reform.sync change DOMSubtreeModified', this.refresh);
      this.body.on('reform.open', (function(_this) {
        return function(e) {
          if (e.target !== _this.select) {
            return _this.close();
          }
        };
      })(this));
    }

    SelectBoxAbstract.prototype.hover = function($item) {
      $item.siblings().andSelf().removeClass('hover');
      return $item.addClass('hover');
    };

    SelectBoxAbstract.prototype.scrollTo = function($item) {
      var $container, newScrollTop, scrollTop;
      $container = this.list;
      newScrollTop = $item.offset().top - $container.offset().top + $container.scrollTop();
      this.ignoreMouse = true;
      if (newScrollTop > ($container.outerHeight() - $item.outerHeight())) {
        scrollTop = newScrollTop - $container.outerHeight() + $item.outerHeight();
        $container.scrollTop(scrollTop);
      } else {
        $container.scrollTop(0);
      }
      if (this.to) {
        clearTimeout(this.to);
      }
      return this.to = setTimeout((function(_this) {
        return function() {
          return _this.ignoreMouse = false;
        };
      })(this), 500);
    };

    SelectBoxAbstract.prototype.createOptions = function() {
      var $itemMultiple;
      if (this.floater == null) {
        return;
      }
      this.fake.focus();
      this.floater.empty();
      this.height = $(document).height();
      this.width = $(document).width();
      this.$list = $('<div/>').attr('class', 'reform-floater-list').addClass(this.options.uiClass).appendTo(this.floater);
      this.textMultiple = '';
      $itemMultiple = $('<div/>').addClass('reform-floater-item selected');
      this.listMultiple = [];
      this.selectBoxTitle = this.orig.data('title');
      this.orig.find('option').each((function(_this) {
        return function(i, option) {
          var $item, $itemSelected, $option;
          $option = $(option);
          $item = $('<div/>').addClass('reform-floater-item');
          if ($option.is(':selected')) {
            $item.addClass('selected');
          }
          if ($option.is(':disabled')) {
            $item.addClass('disabled');
          }
          $item.attr('title', $option.attr('title'));
          $item.attr('value', $option.val());
          $item.append(_this.createItemContent($option));
          if ($option.is(':selected')) {
            if (_this.orig.is('[multiple]')) {
              _this.listMultiple.push($option.html());
            } else {
              $item.addClass('selected');
              if (_this.selectBoxTitle) {
                $itemSelected = $item.clone();
                $itemSelected.addClass(_this.attributeType);
                $itemSelected.prependTo(_this.$list);
              }
            }
          }
          $item.appendTo(_this.$list);
          $item.on('mousedown', function(e) {
            return e.preventDefault();
          });
          $item.hover(function() {
            if (!_this.ignoreMouse) {
              return _this.hover($item);
            }
          });
          return $item.on('click', function(e) {
            if ($item.is('.disabled')) {
              return;
            }
            if (_this.orig.is('[multiple]')) {
              $item.toggleClass('selected');
              e.stopPropagation();
            } else {
              $item.siblings().andSelf().removeClass('selected');
              $item.addClass('selected');
            }
            return _this.orig.val(_this.value()).trigger('change');
          });
        };
      })(this));
      if (this.selectBoxTitle && this.listMultiple.length > 0) {
        $itemMultiple.html(this.listMultiple.join(", "));
        $itemMultiple.prependTo(this.$list);
      }
      return this.$list.on('mousewheel DOMMouseScroll', function(e) {
        var delta, e0;
        e0 = e.originalEvent;
        delta = e0.wheelDelta || -e0.detail;
        this.scrollTop += (delta < 0 ? 1 : -1) * 30;
        return e.preventDefault();
      });
    };

    SelectBoxAbstract.prototype.value = function() {
      return this.$list.find('.reform-floater-item.selected').map(function() {
        return $(this).val();
      });
    };

    SelectBoxAbstract.prototype.open = function() {
      this.orig.trigger('reform.open');
      this.floater = $('<div/>');
      this.floater.css('min-width', this.fake.outerWidth());
      this.floater.addClass('reform-floater reform reform-floater-ui').addClass(this.customClass).addClass(this.orig.data('floater-class')).addClass(this.options.uiClass).addClass('reform-' + this.options.theme);
      this.body.append(this.floater);
      this.createOptions();
      this.body.one('click', this.close);
      this.floater.show();
      this.positionFloater();
      return this.fake.addClass('opened').removeClass('closed');
    };

    SelectBoxAbstract.prototype.close = function() {
      var _ref;
      if ((_ref = this.floater) != null) {
        _ref.remove();
      }
      this.floater = null;
      this.fake.removeClass('opened');
      this.fake.addClass('closed');
      if (!this.orig.is(':disabled')) {
        return this.fake.removeClass('disabled');
      }
    };

    SelectBoxAbstract.prototype.refresh = function() {
      var $selectedItem, $title;
      this.fake.toggleClass('disabled', this.orig.is(':disabled'));
      $selectedItem = this.fake.find('.selected-item');
      $selectedItem.empty();
      if (this.orig.data('title')) {
        $selectedItem.append(this.orig.data('title'));
      } else {
        $title = this.createClosedItem();
        $selectedItem.append($title);
      }
      return this.createOptions();
    };

    SelectBoxAbstract.prototype.positionFloater = function() {
      var pos, posTopAfterAnimation;
      if (this.floater != null) {
        pos = this.fake.offset();
        if (pos.top + this.floater.outerHeight() > this.height) {
          pos.top = pos.top - this.floater.outerHeight();
          if (this.orig.data('shift')) {
            posTopAfterAnimation = pos.top - parseInt(this.orig.data('shift'));
            pos.top -= 1;
          }
        } else {
          pos.top = pos.top + this.fake.outerHeight();
          if (this.orig.data('shift')) {
            posTopAfterAnimation = pos.top + parseInt(this.orig.data('shift'));
            pos.top += 1;
          }
        }
        if (pos.left + this.floater.outerWidth() > this.width) {
          pos.left = pos.left - this.floater.outerWidth() + this.fake.outerWidth();
        }
        this.floater.css(pos);
        if (this.orig.data('shift')) {
          return this.floater.animate({
            top: posTopAfterAnimation
          }, 200);
        }
      }
    };

    return SelectBoxAbstract;

  })();

  module.exports = SelectBoxAbstract;

}).call(this);

},{"jquery-commonjs":11}],11:[function(require,module,exports){

},{}]},{},[6])