/**
 * Components:
 * - DOM Element
 * - Actual list of items
 * - Each element has a corresponding cache with element, scope, and pointer to its corresponding item value
 */

angular.module('ionic')

.factory('$collectionView', [
  '$rootScope',
function($rootScope) {
  return function CollectionView(options) {
    var self = {};
    var element = self.element = options.element;
    var scrollView = self.scrollView = options.scrollView;

    self.handleScroll = function(e) {
    };
    self.renderItem = function(value) {
    };
    self.getRenderStartIndex = function() {
    };
    self.getRenderEndIndex = function() {
    };
    self.setDataSource = function() {
    };

    return self;
  };

}])

.factory('$collectionViewDataSource', [
  '$collectionViewItem',
  '$cacheFactory',
function() {
  function CollectionViewDataSource(options) {
    this.dataGetter = options.dataGetter;
    this.key = options.key;
    this.scope = options.scope;
    this.transcludeFn = options.transcludeFn;

    this.itemCache = new HashMap();

    scope.$watch(this.dataGetter, angular.bind(this, this.dataWatchAction));
  }
  CollectionViewDataSource.prototype = {
    getRenderedData: function(dataValue) {
      var renderedItem = this.itemCache.get(dataValue);

      if (!renderedItem) {
        var itemScope = this.scope.$new();
        var itemElement = this.transcludeFn(itemScope);
        renderedItem = new $collectionViewItem(itemScope, itemElement);
        this.itemCache.put(dataValue, renderedItem);
      }

      return renderedItem;
    },
    dataWatchAction: function(newValue, oldValue) {
    }
  };

  return CollectionViewDataSource;
}])

.factory('$collectionViewItem', [
  '$compile',
function($compile) {
  function CollectionViewItem(scope, element) {
    this.scope = scope;
    this.element = element;
  }
  CollectionViewItem.prototype = {
    detach: function() {
      var parent = this.element[0].parentNode;
      if (parent) {
        parent.removeChild(this.element);
      }
      disconnectScope(this.scope);
    },
    attachTo: function(parent, before) {
      parent[0].insertBefore(this.element[0], before[0]);
      reconnectScope(this.scope);
    },
    destroy: function() {
      this.scope.$destroy();
      this.element.remove();
    }
  };
  return CollectionViewItem;
}])

.controller('$collectionContainer', [
  '$scope',
  '$element',
  '$attrs',
  '$collectionView',
function($scope, $element, $attrs, $collectionView) {
  var scrollCtrl = $element.data('$$ionicScrollController');
  if (!scrollCtrl) {
    throw new Error("TODO WRITE ERROR");
  }
  var collectionView = this.collectionView = $collectionView($element, scrollCtrl.scrollView);
}])

.directive('scrollCollectionContainer', [
function() {
  return {
    controller: '$collectionContainer'
  };
}])

.directive('scrollCollectionRepeat', [
  '$collectionViewDataSource',
  '$parse',
function($collectionViewDataSource) {
  return {
    transclude: 'element',
    priority: 1000,
    terminal: true,
    $$tlb: true,
    require: '^scrollCollectionContainer',
    link: function($scope, $element, $attr, scrollContainerCtrl, $transclude) {
      var keys = $attr.scrollCollectionRepeat.split(/\s+in\s+/);
      var dataSource = $collectionViewDataSource({
        dataGetter: $parse(keys[1]),
        key: keys[0],
        scope: $scope,
        transcludeFn: $transclude
      });
      scrollContainerCtrl.collectionView.setDataSource(dataSource);

      $scope.$on('$destroy'); //TODO
    }
  };
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
      key = obj.$$hashKey = nextUid();
    }
  } else {
    key = obj;
  }

  return objType + ':' + key;
}

function HashMap(){
}
HashMap.prototype = {
  /**
   * Store key value pair
   * @param key key to store can be any type
   * @param value value to store can be any type
   */
  put: function(key, value) {
    this[hashKey(key)] = value;
  },

  /**
   * @param key
   * @returns the value for the key
   */
  get: function(key) {
    return this[hashKey(key)];
  },

  /**
   * Remove the key/value pair
   * @param key
   */
  remove: function(key) {
    var value = this[key = hashKey(key)];
    delete this[key];
    return value;
  }
};

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
  scope.$$prevSibling = parent.$$scopeTail;
  if (parent.$$scopeHead) {
    parent.$$scopeTail.$$nextSibling = scope;
    parent.$$scopeTail = scope;
  } else {
    parent.$$scopeHead = parent.$$scopeTail = scope;
  }
}
