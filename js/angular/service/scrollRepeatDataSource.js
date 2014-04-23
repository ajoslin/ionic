IonicModule
.factory('$scrollRepeatDataSource', [
  '$cacheFactory',
  '$parse',
function($cacheFactory, $parse) {
  var nextCacheId = 0;
  function ScrollRepeatDataSource(options) {
    var self = this;
    this.scope = options.scope;
    this.transcludeFn = options.transcludeFn;
    this.transcludeParent = options.transcludeParent;

    this.keyExpr = options.keyExpr;
    this.listExpr = options.listExpr;
    this.trackByExpr = options.trackByExpr;

    this.heightGetter = options.heightGetter;
    this.widthGetter = options.widthGetter;

    if (this.trackByExpr) {
      var trackByGetter = $parse(this.trackByExpr);
      var hashFnLocals = {$id: hashKey};
      this.trackByIdGetter = function(index, value) {
        hashFnLocals[self.keyExpr] = value;
        hashFnLocals.$index = index;
        return trackByGetter(self.scope, hashFnLocals);
      };
    } else {
      this.trackByIdGetter = function(index, value) {
        return hashKey(value);
      };
    }

    var cache = this.$cache = $cacheFactory(nextCacheId++, {size: 500});
    this.itemCache = {
      put: function(index, value, item) {
        return cache.put(self.trackByIdGetter(index, value), item);
      },
      get: function(index, value) {
        return cache.get(self.trackByIdGetter(index, value));
      }
    };

  }
  ScrollRepeatDataSource.prototype = {
    initItem: function(index) {
      var value = this.data[index];
      var cachedItem = this.itemCache.get(index, value);
      if (cachedItem) return cachedItem;

      var locals = { $index: index };
      locals[this.keyExpr] = value;

      return this.itemCache.put(index, value, {
        width: this.widthGetter(this.scope, locals),
        height: this.heightGetter(this.scope, locals)
      });
    },
    compileItem: function(index) {
      var value = this.data[index];
      var item = this.itemCache.get(index, value);

      if (!item.scope) {
        item.scope = this.scope.$new();
        item.scope[this.keyExpr] = value;
      }
      if (!item.element) {
        this.transcludeFn(item.scope, function(clone) {
          item.element = clone;
          item.element[0].style.position = 'absolute';
        });
      }
      if (item.scope.$index !== index) {
        item.scope.$index = item.index = index;
        item.scope.$first = (index === 0);
        item.scope.$last = (index === (this.getLength() - 1));
        item.scope.$middle = !(item.scope.$first || item.scope.$last);
        item.scope.$odd = !(item.scope.$even = (index&1) === 0);
      }
      return item;
    },
    getItem: function(index) {
      var value = this.data[index];
      return this.itemCache.get(index, value);
    },
    detachItem: function(item) {
      var i, node, parent;
      //Don't .remove(), that will destroy element data
      for (i = 0; i < item.element.length; i++) {
        node = item.element[i];
        parent = node.parentNode;
        parent && parent.removeChild(node);
      }
      //Don't .$destroy(), just stop watchers and events firing
      disconnectScope(item.scope);
    },
    attachItem: function(item) {
      this.transcludeParent[0].appendChild(item.element[0]);
      reconnectScope(item.scope);
    },
    getLength: function() {
      return this.data && this.data.length || 0;
    },
    setData: function(value) {
      this.data = value;
      for (var i = 0, ii = value.length; i < ii; i++) {
        this.initItem(i);
      }
    },
  };

  return ScrollRepeatDataSource;
}]);
