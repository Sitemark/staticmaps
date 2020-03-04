"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _sharp = _interopRequireDefault(require("sharp"));

var _lodash = _interopRequireDefault(require("lodash.last"));

var _asyncQueue = _interopRequireDefault(require("./helper/asyncQueue"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { (0, _defineProperty2["default"])(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

var Image =
/*#__PURE__*/
function () {
  function Image() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, Image);
    this.options = options;
    this.width = this.options.width;
    this.height = this.options.height;
    this.quality = this.options.quality || 100;
  }
  /**
   * Prepare all tiles to fit the baselayer
   */


  (0, _createClass2["default"])(Image, [{
    key: "prepareTileParts",
    value: function prepareTileParts(data) {
      var _this = this;

      if (!data.body) return {
        success: false
      };
      return new Promise(function (resolve) {
        var tile = (0, _sharp["default"])(data.body);
        tile.metadata().then(function (metadata) {
          var x = data.box[0];
          var y = data.box[1];
          var sx = x < 0 ? 0 : x;
          var sy = y < 0 ? 0 : y;
          var dx = x < 0 ? -x : 0;
          var dy = y < 0 ? -y : 0;
          var extraWidth = x + (metadata.width - _this.width);
          var extraHeight = y + (metadata.width - _this.height);
          var w = metadata.width + (x < 0 ? x : 0) - (extraWidth > 0 ? extraWidth : 0);
          var h = metadata.height + (y < 0 ? y : 0) - (extraHeight > 0 ? extraHeight : 0); // Fixed #20 https://github.com/StephanGeorg/staticmaps/issues/20

          if (!w || !h) {
            resolve({
              success: false
            });
            return null;
          }

          return tile.extract({
            left: dx,
            top: dy,
            width: w,
            height: h
          }).toBuffer().then(function (part) {
            resolve({
              success: true,
              position: {
                top: Math.round(sy),
                left: Math.round(sx)
              },
              data: part
            });
          })["catch"](function () {
            return resolve({
              success: false
            });
          });
        })["catch"](function () {
          return resolve({
            success: false
          });
        });
      });
    }
  }, {
    key: "draw",
    value: function () {
      var _draw = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee2(tiles) {
        var _this2 = this;

        var baselayer, tempbuffer, tileParts, preparedTiles, queue;
        return _regenerator["default"].wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                // Generate baseimage
                baselayer = (0, _sharp["default"])({
                  create: {
                    width: this.width,
                    height: this.height,
                    channels: 4,
                    background: {
                      r: 0,
                      g: 0,
                      b: 0,
                      alpha: 0
                    }
                  }
                }); // Save baseimage as buffer

                _context2.next = 3;
                return baselayer.png().toBuffer();

              case 3:
                tempbuffer = _context2.sent;
                // Prepare tiles for composing baselayer
                tileParts = [];
                tiles.forEach(function (tile, i) {
                  tileParts.push(_this2.prepareTileParts(tile, i));
                });
                _context2.next = 8;
                return Promise.all(tileParts);

              case 8:
                _context2.t0 = function (v) {
                  return v.success;
                };

                preparedTiles = _context2.sent.filter(_context2.t0);
                // Compose all prepared tiles to the baselayer
                queue = [];
                preparedTiles.forEach(function (preparedTile) {
                  queue.push(
                  /*#__PURE__*/
                  (0, _asyncToGenerator2["default"])(
                  /*#__PURE__*/
                  _regenerator["default"].mark(function _callee() {
                    var position, data;
                    return _regenerator["default"].wrap(function _callee$(_context) {
                      while (1) {
                        switch (_context.prev = _context.next) {
                          case 0:
                            if (preparedTile) {
                              _context.next = 2;
                              break;
                            }

                            return _context.abrupt("return");

                          case 2:
                            position = preparedTile.position, data = preparedTile.data;
                            position.top = Math.round(position.top);
                            position.left = Math.round(position.left);
                            _context.next = 7;
                            return (0, _sharp["default"])(tempbuffer).composite([_objectSpread({
                              input: data
                            }, position)]).toBuffer();

                          case 7:
                            tempbuffer = _context.sent;

                          case 8:
                          case "end":
                            return _context.stop();
                        }
                      }
                    }, _callee);
                  })));
                });
                _context2.next = 14;
                return (0, _asyncQueue["default"])(queue);

              case 14:
                this.image = tempbuffer;
                return _context2.abrupt("return", true);

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this);
      }));

      function draw(_x) {
        return _draw.apply(this, arguments);
      }

      return draw;
    }()
    /**
     * Save image to file
     */

  }, {
    key: "save",
    value: function () {
      var _save = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3() {
        var fileName,
            outOpts,
            format,
            outputOptions,
            _args3 = arguments;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                fileName = _args3.length > 0 && _args3[0] !== undefined ? _args3[0] : 'output.png';
                outOpts = _args3.length > 1 && _args3[1] !== undefined ? _args3[1] : {};
                format = (0, _lodash["default"])(fileName.split('.'));
                outputOptions = outOpts;
                outputOptions.quality = outputOptions.quality || this.quality;
                _context3.t0 = format.toLowerCase();
                _context3.next = _context3.t0 === 'webp' ? 8 : _context3.t0 === 'jpg' ? 11 : _context3.t0 === 'jpeg' ? 11 : _context3.t0 === 'png' ? 14 : 14;
                break;

              case 8:
                _context3.next = 10;
                return (0, _sharp["default"])(this.image).webp(outputOptions).toFile(fileName);

              case 10:
                return _context3.abrupt("break", 17);

              case 11:
                _context3.next = 13;
                return (0, _sharp["default"])(this.image).jpeg(outputOptions).toFile(fileName);

              case 13:
                return _context3.abrupt("break", 17);

              case 14:
                _context3.next = 16;
                return (0, _sharp["default"])(this.image).png(outputOptions).toFile(fileName);

              case 16:
                return _context3.abrupt("break", 17);

              case 17:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function save() {
        return _save.apply(this, arguments);
      }

      return save;
    }()
    /**
     * Return image as buffer
     */

  }, {
    key: "buffer",
    value: function buffer() {
      var mime = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'image/png';
      var outOpts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      var outputOptions = outOpts;
      outputOptions.quality = outputOptions.quality || this.quality;

      switch (mime.toLowerCase()) {
        case 'image/webp':
          return (0, _sharp["default"])(this.image).webp(outputOptions).toBuffer();

        case 'image/jpeg':
        case 'image/jpg':
          return (0, _sharp["default"])(this.image).jpeg(outputOptions).toBuffer();

        case 'image/png':
        default:
          return (0, _sharp["default"])(this.image).png(outputOptions).toBuffer();
      }
    }
  }]);
  return Image;
}();

exports["default"] = Image;
module.exports = Image;