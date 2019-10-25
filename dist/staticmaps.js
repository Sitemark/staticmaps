"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var _toConsumableArray2 = _interopRequireDefault(require("@babel/runtime/helpers/toConsumableArray"));

var _classCallCheck2 = _interopRequireDefault(require("@babel/runtime/helpers/classCallCheck"));

var _createClass2 = _interopRequireDefault(require("@babel/runtime/helpers/createClass"));

var _requestPromise = _interopRequireDefault(require("request-promise"));

var _sharp = _interopRequireDefault(require("sharp"));

var _lodash = _interopRequireDefault(require("lodash.find"));

var _lodash2 = _interopRequireDefault(require("lodash.uniqby"));

var _url = _interopRequireDefault(require("url"));

var _process = _interopRequireDefault(require("process"));

var _lodash3 = _interopRequireDefault(require("lodash.chunk"));

var _image = _interopRequireDefault(require("./image"));

var _marker = _interopRequireDefault(require("./marker"));

var _polyline = _interopRequireDefault(require("./polyline"));

var _text = _interopRequireDefault(require("./text"));

var _asyncQueue = _interopRequireDefault(require("./helper/asyncQueue"));

var _package = _interopRequireDefault(require("../package.json"));

/* transform longitude to tile number */
var lonToX = function lonToX(lon, zoom) {
  return (lon + 180) / 360 * Math.pow(2, zoom);
};
/* transform latitude to tile number */


var latToY = function latToY(lat, zoom) {
  return (1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom);
};

var yToLat = function yToLat(y, zoom) {
  return Math.atan(Math.sinh(Math.PI * (1 - 2 * y / Math.pow(2, zoom)))) / Math.PI * 180;
};

var xToLon = function xToLon(x, zoom) {
  return x / Math.pow(2, zoom) * 360 - 180;
};

var LINE_RENDER_CHUNK_SIZE = 1000;

var StaticMaps =
/*#__PURE__*/
function () {
  function StaticMaps() {
    var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    (0, _classCallCheck2["default"])(this, StaticMaps);
    this.options = options;
    this.width = this.options.width;
    this.height = this.options.height;
    this.paddingX = this.options.paddingX || 0;
    this.paddingY = this.options.paddingY || 0;
    this.padding = [this.paddingX, this.paddingY];
    this.tileUrl = this.options.tileUrl || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    this.tileSize = this.options.tileSize || 256;
    this.tileRequestTimeout = this.options.tileRequestTimeout;
    this.tileRequestHeader = this.options.tileRequestHeader;
    this.reverseY = this.options.reverseY || false;
    this.maxZoom = this.options.maxZoom;
    this.zoomRange = this.options.zoomRange || {
      min: 1,
      max: 17
    }; // # features

    this.markers = [];
    this.lines = [];
    this.polygons = [];
    this.text = []; // # fields that get set when map is rendered

    this.center = [];
    this.centerX = 0;
    this.centerY = 0;
    this.zoom = 0;
  }

  (0, _createClass2["default"])(StaticMaps, [{
    key: "addLine",
    value: function addLine(options) {
      this.lines.push(new _polyline["default"](options));
    }
  }, {
    key: "addMarker",
    value: function addMarker(options) {
      this.markers.push(new _marker["default"](options));
    }
  }, {
    key: "addPolygon",
    value: function addPolygon(options) {
      this.lines.push(new _polyline["default"](options));
    }
  }, {
    key: "addText",
    value: function addText(options) {
      this.text.push(new _text["default"](options));
    }
    /**
      * Render static map with all map features that were added to map before
      */

  }, {
    key: "render",
    value: function render(center, zoom) {
      if (!this.lines && !this.markers && !this.polygons && !(center && zoom)) {
        throw new Error('Cannot render empty map: Add  center || lines || markers || polygons.');
      }

      this.center = center;
      this.zoom = zoom || this.calculateZoom();

      if (this.maxZoom && this.zoom > this.maxZoom) {
        this.zoom = this.maxZoom;
      }

      if (center && center.length === 2) {
        this.centerX = lonToX(center[0], this.zoom);
        this.centerY = latToY(center[1], this.zoom);
      } else {
        // # get extent of all lines
        var extent = this.determineExtent(this.zoom); // # calculate center point of map

        var centerLon = (extent[0] + extent[2]) / 2;
        var centerLat = (extent[1] + extent[3]) / 2;
        this.centerX = lonToX(centerLon, this.zoom);
        this.centerY = latToY(centerLat, this.zoom);
      }

      this.image = new _image["default"](this.options);
      return this.drawBaselayer().then(this.drawFeatures.bind(this));
    }
    /**
      * calculate common extent of all current map features
      */

  }, {
    key: "determineExtent",
    value: function determineExtent(zoom) {
      var extents = []; // Add bbox to extent

      if (this.center && this.center.length >= 4) extents.push(this.center); // Add polylines and polygons to extent

      if (this.lines.length) {
        this.lines.forEach(function (line) {
          extents.push(line.extent());
        });
      } // extents.push(this.lines.map(function(line){ return line.extent(); }));
      // Add marker to extent


      for (var i = 0; i < this.markers.length; i++) {
        var marker = this.markers[i];
        var e = [marker.coord[0], marker.coord[1]];

        if (!zoom) {
          extents.push([marker.coord[0], marker.coord[1], marker.coord[0], marker.coord[1]]);
          continue;
        } // # consider dimension of marker


        var ePx = marker.extentPx();
        var x = lonToX(e[0], zoom);
        var y = latToY(e[1], zoom);
        extents.push([xToLon(x - parseFloat(ePx[0]) / this.tileSize, zoom), yToLat(y + parseFloat(ePx[1]) / this.tileSize, zoom), xToLon(x + parseFloat(ePx[2]) / this.tileSize, zoom), yToLat(y - parseFloat(ePx[3]) / this.tileSize, zoom)]);
      }

      return [Math.min.apply(Math, (0, _toConsumableArray2["default"])(extents.map(function (e) {
        return e[0];
      }))), Math.min.apply(Math, (0, _toConsumableArray2["default"])(extents.map(function (e) {
        return e[1];
      }))), Math.max.apply(Math, (0, _toConsumableArray2["default"])(extents.map(function (e) {
        return e[2];
      }))), Math.max.apply(Math, (0, _toConsumableArray2["default"])(extents.map(function (e) {
        return e[3];
      })))];
    }
    /**
      * calculate the best zoom level for given extent
      */

  }, {
    key: "calculateZoom",
    value: function calculateZoom() {
      for (var z = this.zoomRange.max; z >= this.zoomRange.min; z--) {
        var extent = this.determineExtent(z);
        var width = (lonToX(extent[2], z) - lonToX(extent[0], z)) * this.tileSize;
        if (width > this.width - this.padding[0] * 2) continue;
        var height = (latToY(extent[1], z) - latToY(extent[3], z)) * this.tileSize;
        if (height > this.height - this.padding[1] * 2) continue;
        return z;
      }

      return this.zoomRange.min;
    }
    /**
      * transform tile number to pixel on image canvas
      */

  }, {
    key: "xToPx",
    value: function xToPx(x) {
      var px = (x - this.centerX) * this.tileSize + this.width / 2;
      return Number(Math.round(px));
    }
    /**
      * transform tile number to pixel on image canvas
      */

  }, {
    key: "yToPx",
    value: function yToPx(y) {
      var px = (y - this.centerY) * this.tileSize + this.height / 2;
      return Number(Math.round(px));
    }
  }, {
    key: "drawBaselayer",
    value: function drawBaselayer() {
      var _this = this;

      var xMin = Math.floor(this.centerX - 0.5 * this.width / this.tileSize);
      var yMin = Math.floor(this.centerY - 0.5 * this.height / this.tileSize);
      var xMax = Math.ceil(this.centerX + 0.5 * this.width / this.tileSize);
      var yMax = Math.ceil(this.centerY + 0.5 * this.height / this.tileSize);
      var result = [];

      for (var x = xMin; x < xMax; x++) {
        for (var y = yMin; y < yMax; y++) {
          // # x and y may have crossed the date line
          var maxTile = Math.pow(2, this.zoom);
          var tileX = (x + maxTile) % maxTile;
          var tileY = (y + maxTile) % maxTile;
          if (this.reverseY) tileY = (1 << this.zoom) - tileY - 1;
          result.push({
            url: this.tileUrl.replace('{z}', this.zoom).replace('{x}', tileX).replace('{y}', tileY),
            box: [this.xToPx(x), this.yToPx(y), this.xToPx(x + 1), this.yToPx(y + 1)]
          });
        }
      }

      var tilePromises = [];
      result.forEach(function (r) {
        tilePromises.push(_this.getTile(r));
      });
      return new Promise(function (resolve, reject) {
        Promise.all(tilePromises).then(function (values) {
          return _this.image.draw(values.filter(function (v) {
            return v.success;
          }).map(function (v) {
            return v.tile;
          }));
        }).then(resolve)["catch"](reject);
      });
    }
  }, {
    key: "drawFeatures",
    value: function drawFeatures() {
      return this.drawLines().then(this.loadMarker.bind(this)).then(this.drawMarker.bind(this)).then(this.drawText.bind(this));
    }
  }, {
    key: "drawText",
    value: function drawText() {
      var _this2 = this;

      return new Promise(
      /*#__PURE__*/
      function () {
        var _ref = (0, _asyncToGenerator2["default"])(
        /*#__PURE__*/
        _regenerator["default"].mark(function _callee2(resolve) {
          var queue;
          return _regenerator["default"].wrap(function _callee2$(_context2) {
            while (1) {
              switch (_context2.prev = _context2.next) {
                case 0:
                  if (!_this2.text.length) resolve(true);
                  queue = [];

                  _this2.text.forEach(function (text) {
                    queue.push(
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee() {
                      return _regenerator["default"].wrap(function _callee$(_context) {
                        while (1) {
                          switch (_context.prev = _context.next) {
                            case 0:
                              _context.next = 2;
                              return _this2.renderText(text);

                            case 2:
                            case "end":
                              return _context.stop();
                          }
                        }
                      }, _callee);
                    })));
                  });

                  _context2.next = 5;
                  return (0, _asyncQueue["default"])(queue);

                case 5:
                  resolve(true);

                case 6:
                case "end":
                  return _context2.stop();
              }
            }
          }, _callee2);
        }));

        return function (_x) {
          return _ref.apply(this, arguments);
        };
      }());
    }
    /**
     * Render text on a baseimage
     */

  }, {
    key: "renderText",
    value: function () {
      var _renderText = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee3(text) {
        var _this3 = this;

        var baseImage;
        return _regenerator["default"].wrap(function _callee3$(_context3) {
          while (1) {
            switch (_context3.prev = _context3.next) {
              case 0:
                baseImage = (0, _sharp["default"])(this.image.image);
                return _context3.abrupt("return", new Promise(function (resolve, reject) {
                  var mapcoords = [_this3.xToPx(lonToX(text.coord[0], _this3.zoom)), _this3.yToPx(latToY(text.coord[1], _this3.zoom))];
                  baseImage.metadata().then(function (imageMetadata) {
                    var svgPath = "\n            <svg\n              width=\"".concat(imageMetadata.width, "px\"\n              height=\"").concat(imageMetadata.height, "px\"\n              version=\"1.1\"\n              xmlns=\"http://www.w3.org/2000/svg\">\n              <text\n                x=\"").concat(mapcoords[0], "\"\n                y=\"").concat(mapcoords[1], "\"\n                style=\"fill-rule: inherit; font-family: ").concat(text.font, ";\"\n                font-size=\"").concat(text.size, "pt\"\n                stroke=\"").concat(text.color, "\"\n                fill=\"").concat(text.fill ? text.fill : 'none', "\"\n                stroke-width=\"").concat(text.width, "\"\n                text-anchor=\"").concat(text.anchor, "\"\n              >\n                  ").concat(text.text, "</text>\n            </svg>");
                    baseImage.composite([{
                      input: Buffer.from(svgPath),
                      top: 0,
                      left: 0
                    }]).toBuffer().then(function (buffer) {
                      _this3.image.image = buffer;
                      resolve(buffer);
                    })["catch"](reject);
                  })["catch"](reject);
                }));

              case 2:
              case "end":
                return _context3.stop();
            }
          }
        }, _callee3, this);
      }));

      function renderText(_x2) {
        return _renderText.apply(this, arguments);
      }

      return renderText;
    }()
  }, {
    key: "drawLines",
    value: function () {
      var _drawLines = (0, _asyncToGenerator2["default"])(
      /*#__PURE__*/
      _regenerator["default"].mark(function _callee4() {
        var _this4 = this;

        var chunks, baseImage, imageMetadata, processedChunks;
        return _regenerator["default"].wrap(function _callee4$(_context4) {
          while (1) {
            switch (_context4.prev = _context4.next) {
              case 0:
                if (this.lines.length) {
                  _context4.next = 2;
                  break;
                }

                return _context4.abrupt("return", true);

              case 2:
                chunks = (0, _lodash3["default"])(this.lines, LINE_RENDER_CHUNK_SIZE);
                baseImage = (0, _sharp["default"])(this.image.image);
                _context4.next = 6;
                return baseImage.metadata();

              case 6:
                imageMetadata = _context4.sent;
                processedChunks = chunks.map(function (c) {
                  return _this4.processChunk(c, imageMetadata);
                });
                _context4.next = 10;
                return baseImage.composite(processedChunks).toBuffer();

              case 10:
                this.image.image = _context4.sent;
                return _context4.abrupt("return", true);

              case 12:
              case "end":
                return _context4.stop();
            }
          }
        }, _callee4, this);
      }));

      function drawLines() {
        return _drawLines.apply(this, arguments);
      }

      return drawLines;
    }()
  }, {
    key: "lineToSvg",
    value: function lineToSvg(line) {
      var _this5 = this;

      var points = line.coords.map(function (coord) {
        return [_this5.xToPx(lonToX(coord[0], _this5.zoom)), _this5.yToPx(latToY(coord[1], _this5.zoom))];
      });
      return "<".concat(line.type === 'polyline' ? 'polyline' : 'polygon', "\n                style=\"fill-rule: inherit;\"\n                points=\"").concat(points.join(' '), "\"\n                stroke=\"").concat(line.color, "\"\n                fill=\"").concat(line.fill ? line.fill : 'none', "\"\n                stroke-width=\"").concat(line.width, "\"/>");
    }
  }, {
    key: "processChunk",
    value: function processChunk(lines, imageMetadata) {
      var _this6 = this;

      var svgPath = "\n            <svg\n              width=\"".concat(imageMetadata.width, "px\"\n              height=\"").concat(imageMetadata.height, "\"\n              version=\"1.1\"\n              xmlns=\"http://www.w3.org/2000/svg\">\n              ").concat(lines.map(function (line) {
        return _this6.lineToSvg(line);
      }), "              \n            </svg>");
      return {
        input: Buffer.from(svgPath),
        top: 0,
        left: 0
      };
    }
  }, {
    key: "drawMarker",
    value: function drawMarker() {
      var _this7 = this;

      return new Promise(
      /*#__PURE__*/
      function () {
        var _ref3 = (0, _asyncToGenerator2["default"])(
        /*#__PURE__*/
        _regenerator["default"].mark(function _callee6(resolve) {
          var queue;
          return _regenerator["default"].wrap(function _callee6$(_context6) {
            while (1) {
              switch (_context6.prev = _context6.next) {
                case 0:
                  queue = [];

                  _this7.markers.forEach(function (marker) {
                    queue.push(
                    /*#__PURE__*/
                    (0, _asyncToGenerator2["default"])(
                    /*#__PURE__*/
                    _regenerator["default"].mark(function _callee5() {
                      return _regenerator["default"].wrap(function _callee5$(_context5) {
                        while (1) {
                          switch (_context5.prev = _context5.next) {
                            case 0:
                              _context5.next = 2;
                              return (0, _sharp["default"])(_this7.image.image).composite([{
                                input: marker.imgData,
                                top: Math.round(marker.position[1]),
                                left: Math.round(marker.position[0])
                              }]).toBuffer();

                            case 2:
                              _this7.image.image = _context5.sent;

                            case 3:
                            case "end":
                              return _context5.stop();
                          }
                        }
                      }, _callee5);
                    })));
                  });

                  _context6.next = 4;
                  return (0, _asyncQueue["default"])(queue);

                case 4:
                  resolve(true);

                case 5:
                case "end":
                  return _context6.stop();
              }
            }
          }, _callee6);
        }));

        return function (_x3) {
          return _ref3.apply(this, arguments);
        };
      }());
    }
    /**
      *   Preloading the icon image
      */

  }, {
    key: "loadMarker",
    value: function loadMarker() {
      var _this8 = this;

      return new Promise(function (resolve, reject) {
        if (!_this8.markers.length) resolve(true);
        var icons = (0, _lodash2["default"])(_this8.markers.map(function (m) {
          return {
            file: m.img
          };
        }), 'file');
        var count = 1;
        icons.forEach(
        /*#__PURE__*/
        function () {
          var _ref5 = (0, _asyncToGenerator2["default"])(
          /*#__PURE__*/
          _regenerator["default"].mark(function _callee7(ico) {
            var icon, isUrl, img;
            return _regenerator["default"].wrap(function _callee7$(_context7) {
              while (1) {
                switch (_context7.prev = _context7.next) {
                  case 0:
                    icon = ico;
                    isUrl = !!_url["default"].parse(icon.file).hostname;
                    _context7.prev = 2;

                    if (!isUrl) {
                      _context7.next = 12;
                      break;
                    }

                    _context7.next = 6;
                    return _requestPromise["default"].get({
                      rejectUnauthorized: false,
                      url: icon.file,
                      encoding: null
                    });

                  case 6:
                    img = _context7.sent;
                    _context7.next = 9;
                    return (0, _sharp["default"])(img).toBuffer();

                  case 9:
                    icon.data = _context7.sent;
                    _context7.next = 15;
                    break;

                  case 12:
                    _context7.next = 14;
                    return (0, _sharp["default"])(icon.file).toBuffer();

                  case 14:
                    icon.data = _context7.sent;

                  case 15:
                    _context7.next = 20;
                    break;

                  case 17:
                    _context7.prev = 17;
                    _context7.t0 = _context7["catch"](2);
                    reject(_context7.t0);

                  case 20:
                    if (count++ === icons.length) {
                      // Pre loaded all icons
                      _this8.markers.forEach(function (mark) {
                        var marker = mark;
                        marker.position = [_this8.xToPx(lonToX(marker.coord[0], _this8.zoom)) - marker.offset[0], _this8.yToPx(latToY(marker.coord[1], _this8.zoom)) - marker.offset[1]];
                        var imgData = (0, _lodash["default"])(icons, {
                          file: marker.img
                        });
                        marker.set(imgData.data);
                      });

                      resolve(true);
                    }

                  case 21:
                  case "end":
                    return _context7.stop();
                }
              }
            }, _callee7, null, [[2, 17]]);
          }));

          return function (_x4) {
            return _ref5.apply(this, arguments);
          };
        }());
      });
    }
    /**
     *  Fetching tiles from endpoint
     */

  }, {
    key: "getTile",
    value: function getTile(data) {
      var _this9 = this;

      return new Promise(function (resolve) {
        var options = {
          url: data.url,
          encoding: null,
          resolveWithFullResponse: true,
          headers: _this9.tileRequestHeader || {},
          timeout: _this9.tileRequestTimeout
        };
        var defaultAgent = "staticmaps@".concat(_package["default"].version, " (Node.js ").concat(_process["default"].version, ")");
        options.headers['User-Agent'] = options.headers['User-Agent'] || defaultAgent;

        _requestPromise["default"].get(options).then(function (res) {
          resolve({
            success: true,
            tile: {
              url: data.url,
              box: data.box,
              body: res.body
            }
          });
        })["catch"](function (error) {
          return resolve({
            success: false,
            error: error
          });
        });
      });
    }
  }]);
  return StaticMaps;
}();

var _default = StaticMaps;
exports["default"] = _default;
module.exports = StaticMaps;