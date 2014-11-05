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
