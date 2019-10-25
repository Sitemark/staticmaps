"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _lodash = _interopRequireDefault(require("lodash.isequal"));

var _lodash2 = _interopRequireDefault(require("lodash.first"));

var _lodash3 = _interopRequireDefault(require("lodash.last"));

var Polyline =
/*#__PURE__*/
function () {
  function Polyline() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, Polyline);
    this.options = options;
    this.coords = this.options.coords;
    this.color = this.options.color || '#000000BB';
    this.fill = this.options.fill;
    this.width = this.options.width || 3;
    this.simplify = this.options.simplify || false;
    this.type = (0, _lodash["default"])((0, _lodash2["default"])(this.coords), (0, _lodash3["default"])(this.coords)) ? 'polygon' : 'polyline';
  }
  /**
   * calculate the coordinates of the envelope / bounding box: (min_lon, min_lat, max_lon, max_lat)
   */


  (0, _createClass2["default"])(Polyline, [{
    key: "extent",
    value: function extent() {
      return [Math.min.apply(Math, (0, _toConsumableArray2["default"])(this.coords.map(function (c) {
        return c[0];
      }))), Math.min.apply(Math, (0, _toConsumableArray2["default"])(this.coords.map(function (c) {
        return c[1];
      }))), Math.max.apply(Math, (0, _toConsumableArray2["default"])(this.coords.map(function (c) {
        return c[0];
      }))), Math.max.apply(Math, (0, _toConsumableArray2["default"])(this.coords.map(function (c) {
        return c[1];
      })))];
    }
  }]);
  return Polyline;
}();

exports["default"] = Polyline;