IonicModule
.directive('scrollItemRepeat', [
  '$scrollRepeatManager',
  '$scrollRepeatDataSource',
  '$parse',
function($scrollRepeatManager, $scrollRepeatDataSource, $parse) {
  return {
    priority: 1000,
    transclude: 'element',
    terminal: true,
    $$tlb: true,
    require: '^$ionicScroll',
    link: function($scope, $element, $attr, scrollCtrl, $transclude) {
      var scrollView = scrollCtrl.scrollView;
      if (scrollView.options.scrollingX && scrollView.options.scrollingY) {
        throw new Error("Cannot create a scroll-item-repeat within a scrollView that is scrollable on both x and y axis.  Choose only one.");
      }

      var isVertical = !!scrollView.options.scrollingY;
      if (isVertical && !$attr.scrollItemHeight) {
        throw new Error("scroll-item-repeat expected attribute scroll-item-height to be a an expression that returns a number.");
      } else if (!isVertical && !$attr.scrollItemWidth) {
        throw new Error("scroll-item-repeat expected attribute scroll-item-width to be a an expression that returns a number.");
      }
      var heightGetter = $attr.scrollItemHeight ?
        $parse($attr.scrollItemHeight) :
        function() { return scrollView.__clientHeight; };
      var widthGetter = $attr.scrollItemWidth ?
        $parse($attr.scrollItemWidth) :
        function() { return scrollView.__clientWidth; };

      var match = $attr.scrollItemRepeat.match(/^\s*([\s\S]+?)\s+in\s+([\s\S]+?)(?:\s+track\s+by\s+([\s\S]+?))?\s*$/);
      if (!match) {
        throw new Error("scroll-item-repeat expected expression in form of '_item_ in _collection_[ track by _id_]' but got '" + $attr.scrollItemRepeat + "'.");
      }

      var dataSource = new $scrollRepeatDataSource({
        scope: $scope,
        transcludeFn: $transclude,
        transcludeParent: $element.parent(),
        keyExpr: match[1],
        listExpr: match[2],
        trackByExpr: match[3],
        heightGetter: heightGetter,
        widthGetter: widthGetter
      });
      var scrollRepeatManager = new $scrollRepeatManager({
        dataSource: dataSource,
        element: scrollCtrl.$element,
        scrollView: scrollCtrl.scrollView,
      });

      $scope.$watchCollection(dataSource.listExpr, function(value) {
        if (value && !angular.isArray(value)) {
          throw new Error("scroll-item-repeat expects an array to repeat over, but instead got '" + typeof value + "'.");
        }
        dataSource.setData(value);
        scrollRepeatManager.resize();
      });
      ionic.on('resize', function() {
        scrollRepeatManager.render();
      }, window);

      $scope.$on('$destroy'); //TODO
    }
  };
}]);
