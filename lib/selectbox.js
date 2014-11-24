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
