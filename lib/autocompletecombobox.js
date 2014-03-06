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
