Reform = require "./reform.coffee"

# Init the Reform object and observe this page for custom controls
reform = new Reform
reform.observe()

window.Reform = reform