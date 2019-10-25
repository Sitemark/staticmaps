"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _regenerator = _interopRequireDefault(require("@babel/runtime/regenerator"));

var _asyncToGenerator2 = _interopRequireDefault(require("@babel/runtime/helpers/asyncToGenerator"));

var workOnQueue =
/*#__PURE__*/
function () {
  var _ref = (0, _asyncToGenerator2["default"])(
  /*#__PURE__*/
  _regenerator["default"].mark(function _callee(queue) {
    var index,
        _args = arguments;
    return _regenerator["default"].wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            index = _args.length > 1 && _args[1] !== undefined ? _args[1] : 0;

            if (queue[index]) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return", true);

          case 3:
            _context.next = 5;
            return queue[index]();

          case 5:
            _context.next = 7;
            return workOnQueue(queue, index + 1);

          case 7:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function workOnQueue(_x) {
    return _ref.apply(this, arguments);
  };
}();

var _default = workOnQueue;
exports["default"] = _default;