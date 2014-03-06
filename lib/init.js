(function() {
  var Reform, reform;

  Reform = require("./reform");

  reform = new Reform;

  reform.observe();

  window.Reform = reform;

}).call(this);
