
IonicModule
.factory('$scrollRepeatManager', [
  '$rootScope',
  '$timeout',
function($rootScope, $timeout) {
  var BUFFER_SPACES = 1;
  function ScrollRepeatManager(options) {
    var self = this;
    this.dataSource = options.dataSource;
    this.element = options.element;
    this.scrollView = options.scrollView;
    this.itemSizePrimary = options.itemSizePrimary;
    this.itemSizeSecondary = options.itemSizeSecondary;

    if (this.scrollView.options.scrollingX && this.scrollView.options.scrollingY) {
      throw new Error("TODO MOVE THIS ERROR TO THE DIRECTIVE. Cannot create a scrollScrollRepeatManager on an element that scrolls both x and y. Choose one, yo!");
    }

    this.isVertical = !!this.scrollView.options.scrollingY;
    this.renderedItems = {};

    this.lastRenderScrollValue = this.bufferTransformOffset = this.bufferStartIndex =
      this.bufferEndIndex = this.bufferItemsLength = 0;

    this.scrollView.__$callback = this.scrollView.__callback;
    this.scrollView.__callback = angular.bind(this, this.renderScroll);

    function getter(prop) {
      return self[prop];
    }

    if (this.isVertical) {
      this.scrollView.options.getContentHeight = function() {
        return self.viewportSize;
      };
      this.getScrollValue = function() {
        return this.scrollView.__scrollTop;
      };
      this.getScrollMaxValue = function() {
        return this.scrollView.__maxScrollTop;
      };
      this.getScrollSize = function() {
        return this.scrollView.__clientHeight;
      };
      this.getScrollSizeSecondary = function() {
        return this.scrollView.__clientWidth;
      };
      this.transformString = function(y, x) {
        return 'translate3d('+x+'px,'+y+'px,0)';
      };
    } else {
      this.scrollView.options.getContentWidth = angular.bind(this, this.getContentSize);
      this.getScrollValue = function() {
        return this.scrollView.__scrollLeft;
      };
      this.getScrollMaxValue = function() {
        return this.scrollView.__maxScrollLeft;
      };
      this.getScrollSize = function() {
        return this.scrollView.__clientWidth;
      };
      this.getScrollSizeSecondary = function() {
        return this.scrollView.__clientHeight;
      };
      this.transformString = function(x, y) {
        return 'translate3d('+x+'px,'+y+'px,0)';
      };
    }
  }

  ScrollRepeatManager.prototype = {
    resize: function() {
      var size = 0;
      var item;
      var i = 0, ii = this.dataSource.getLength();
      if (this.isVertical) {
        for (; i < ii; i++) {
          size += this.dataSource.getItem(i).height;
        }
      } else {
        for (; i < ii; i++) {
          size += this.dataSource.getItem(i).width;
        }
      }
      this.viewportSize = size;
      this.setCurrentIndex(0);
      this.lastRenderScrollValue = 0;
      this.scrollView.resize();
      this.render(true);
      return size;
    },
    setCurrentIndex: function(index) {
      this.currentIndex = index;
      this.currentScroll = this.dataSource.getItem(index).height;

      this.hasPrevIndex = index > 0;
      if (this.hasPrevIndex) {
        this.prevScrollValue = this.dataSource.getItem(index-1).height;
      }
      this.hasNextIndex = index + 1 < this.dataSource.getLength();
      if (this.hasNextIndex) {
        this.nextScrollValue = this.dataSource.getItem(index+1).height;
      }
    },
    renderScroll: ionic.animationFrameThrottle(function(transformLeft, transformTop, zoom, wasResize) {
      if (this.isVertical) {
        transformTop = this.getTransformPosition(transformTop);
      } else {
        transformLeft = this.getTransformPosition(transformLeft);
      }
      return this.scrollView.__$callback(transformLeft, transformTop, zoom, wasResize);
    }),
    getTransformPosition: function(transformPos) {
      var scrollDelta = this.getScrollValue() - this.lastRenderScrollValue;
      var isGoingNext = scrollDelta >= this.nextScrollValue;
      var isGoingPrev = scrollDelta <= -this.prevScrollValue;
      if (isGoingNext || isGoingPrev) {
        this.render();
      }
      return 0;
    },
    render: function() {
      var scrollDelta = this.getScrollValue() - this.lastRenderScrollValue;
      var scrollSize = this.getScrollSize();

      var height = 0;
      var i = this.currentIndex;
      while (height < scrollDelta) {
        this.renderItem(i);
        this.dataSource.getItem(i).element[0].style[ionic.CSS.TRANSFORM] =
          this.transformString(height, 0);
        height += this.dataSource.getItem(i).height;
        i += 1;
      }

      this.lastRenderScrollValue = this.getScrollValue();

      if (!this.dataSource.scope.$$phase) {
        this.dataSource.scope.$digest();
      }
    },
    renderItem: function(dataIndex) {
      var item = this.dataSource.getItem(dataIndex);
      if (item) {
        this.dataSource.compileItem(dataIndex);
        this.dataSource.attachItem(item);
        this.renderedItems[dataIndex] = item;
      }
    },
    removeItem: function(dataIndex) {
      var item = this.renderedItems[dataIndex];
      if (item) {
        this.dataSource.detachItem(item);
        delete this.renderedItems[dataIndex];
      }
    },
    positionItem: function(dataIndex, viewportIndex) {
      var item = this.renderedItems[dataIndex];
      var primarySize = 0;
      var secondarySize = 0;
      var i;
      if (item) {
        item.element[0].style[ionic.CSS.TRANSFORM] = this.transformString(
          Math.floor(viewportIndex / this.itemsPerSpace) * this.itemSizePrimary,
          (viewportIndex % this.itemsPerSpace) * (this.itemSizeSecondary || 0)
        );
      }
    }
  };

  return ScrollRepeatManager;
}]);


/**
 * Computes a hash of an 'obj'.
 * Hash of a:
 *  string is string
 *  number is number as string
 *  object is either result of calling $$hashKey function on the object or uniquely generated id,
 *         that is also assigned to the $$hashKey property of the object.
 *
 * @param obj
 * @returns {string} hash string such that the same input will have the same hash string.
 *         The resulting string key is in 'type:hashKey' format.
 */
function hashKey(obj) {
  var objType = typeof obj,
      key;

  if (objType == 'object' && obj !== null) {
    if (typeof (key = obj.$$hashKey) == 'function') {
      // must invoke on object to keep the right this
      key = obj.$$hashKey();
    } else if (key === undefined) {
      key = obj.$$hashKey = ionic.Utils.nextUid();
    }
  } else {
    key = obj;
  }

  return objType + ':' + key;
}

function disconnectScope(scope) {
  if (scope.$root === scope) {
    return; // we can't disconnect the root node;
  }
  var parent = scope.$parent;
  scope.$$disconnected = true;
  // See Scope.$destroy
  if (parent.$$childHead === scope) {
    parent.$$childHead = scope.$$nextSibling;
  }
  if (parent.$$childTail === scope) {
    parent.$$childTail = scope.$$prevSibling;
  }
  if (scope.$$prevSibling) {
    scope.$$prevSibling.$$nextSibling = scope.$$nextSibling;
  }
  if (scope.$$nextSibling) {
    scope.$$nextSibling.$$prevSibling = scope.$$prevSibling;
  }
  scope.$$nextSibling = scope.$$prevSibling = null;
}

function reconnectScope(scope) {
  if (scope.$root === scope) {
    return; // we can't disconnect the root node;
  }
  if (!scope.$$disconnected) {
    return;
  }
  var parent = scope.$parent;
  scope.$$disconnected = false;
  // See Scope.$new for this logic...
  scope.$$prevSibling = parent.$$childTail;
  if (parent.$$childHead) {
    parent.$$childTail.$$nextSibling = scope;
    parent.$$childTail = scope;
  } else {
    parent.$$childHead = parent.$$childTail = scope;
  }
}
