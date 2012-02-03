(function() {

  Element.prototype._setAttribute = Element.prototype.setAttribute;

  Element.prototype.setAttribute = function(name, val) {
    var e, prev;
    e = document.createEvent("MutationEvents");
    prev = this.getAttribute(name);
    this._setAttribute(name, val);
    e.initMutationEvent("DOMAttrModified", true, true, null, prev, val, name, 2);
    return this.dispatchEvent(e);
  };

}).call(this);
