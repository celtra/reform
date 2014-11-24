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
      var dataGroups, item, _i, _len, _ref, _results;
      dataGroups = [];
      _results = [];
      for (_i = 0, _len = data.length; _i < _len; _i++) {
        item = data[_i];
        if (_ref = item.group, __indexOf.call(dataGroups, _ref) < 0) {
          _results.push(dataGroups.push(item.group));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
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
