"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _default =
/*#__PURE__*/
function () {
  function _default() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, _default);
    this.options = options;
    if (!(options.width && options.height)) throw new Error('Please specify width and height of the marker image.');
    this.coord = this.options.coord;
    this.img = this.options.img;
    this.offsetX = this.options.offsetX || options.width / 2;
    this.offsetY = this.options.offsetY || options.height;
    this.offset = [this.offsetX, this.offsetY];
    this.height = this.options.height;
    this.width = this.options.width;
  }
  /**
   *  Set icon data
   */


  (0, _createClass2["default"])(_default, [{
    key: "set",
    value: function set(img) {
      this.imgData = img;
    }
  }, {
    key: "extentPx",
    value: function extentPx() {
      return [this.offset[0], this.height - this.offset[1], this.width - this.offset[0], this.offset[1]];
    }
  }]);
  return _default;
}();

exports["default"] = _default;