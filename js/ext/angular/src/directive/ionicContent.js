(function() {
'use strict';

angular.module('ionic.ui.content', ['ionic.ui.service', 'ionic.ui.scroll'])

/**
 * Panel is a simple 100% width and height, fixed panel. It's meant for content to be
 * added to it, or animated around.
 */
.directive('ionPane', function() {
  return {
    restrict: 'E',
    link: function(scope, element, attr) {
      element.addClass('pane');
    }
  };
})

// The content directive is a core scrollable content area
// that is part of many View hierarchies
.directive('ionContent', [
  '$parse',
  '$timeout',
  '$ionicScrollDelegate',
  '$controller',
  '$ionicBind',
function($parse, $timeout, $ionicScrollDelegate, $controller, $ionicBind) {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    require: '^?ionNavView',
    scope: true,
    template:
    '<div class="scroll-content">' +
      '<div class="scroll"></div>' +
    '</div>',
    compile: function(element, attr, transclude) {
      if(attr.hasHeader == "true") { element.addClass('has-header'); }
      if(attr.hasSubheader == "true") { element.addClass('has-subheader'); }
      if(attr.hasFooter == "true") { element.addClass('has-footer'); }
      if(attr.hasTabs == "true") { element.addClass('has-tabs'); }
      if(attr.padding == "true") { element.find('div').addClass('padding'); }

      return {
        //Prelink <ion-content> so it can compile before other directives compile.
        //Then other directives can require ionicScrollCtrl
        pre: prelink
      };

      function prelink($scope, $element, $attr, navViewCtrl) {
        var clone, sc, scrollView, scrollCtrl,
          scrollContent = angular.element($element[0].querySelector('.scroll'));

        transclude($scope, function(clone) {
          scrollContent.append(clone);
        });

        $ionicBind($scope, $attr, {
          //Use $ to stop onRefresh from recursively calling itself
          $onRefresh: '&onRefresh',
          $onRefreshOpening: '&onRefreshOpening',
          $onScroll: '&onScroll',
          $onScrollComplete: '&onScrollComplete',
          $onInfiniteScroll: '&onInfiniteScroll',
          refreshComplete: '=',
          infiniteScrollDistance: '@',
          hasBouncing: '@',
          scroll: '@',
          padding: '@',
          hasScrollX: '@',
          hasScrollY: '@',
          scrollbarX: '@',
          scrollbarY: '@',
          startX: '@',
          startY: '@',
          scrollEventInterval: '@'
        });

        if($scope.scroll === "false") {
          // No scrolling
          return;
        }

        if(attr.overflowScroll === "true") {
          $element.addClass('overflow-scroll');
          return;
        }

        scrollCtrl = $controller('$ionicScroll', {
          $scope: $scope,
          scrollViewOptions: {
            el: $element[0],
            bouncing: $scope.$eval($scope.hasBouncing),
            startX: $scope.$eval($scope.startX) || 0,
            startY: $scope.$eval($scope.startY) || 0,
            scrollbarX: $scope.$eval($scope.scrollbarX) !== false,
            scrollbarY: $scope.$eval($scope.scrollbarY) !== false,
            scrollingX: $scope.$eval($scope.hasScrollX) === true,
            scrollingY: $scope.$eval($scope.hasScrollY) !== false,
            scrollEventInterval: parseInt($scope.scrollEventInterval, 10) || 20,
            scrollingComplete: function() {
              $scope.$onScrollComplete({
                scrollTop: this.__scrollTop,
                scrollLeft: this.__scrollLeft
              });
            }
          }
        });

        //Publish scrollView to parent so children can access it
        scrollView = $scope.$parent.scrollView = scrollCtrl.scrollView;

        $scope.$on('$viewContentLoaded', function(e, viewHistoryData) {
          viewHistoryData || (viewHistoryData = {});
          var scroll = viewHistoryData.scrollValues;
          if (scroll) {
            $timeout(function() {
              scrollView.scrollTo(+scroll.left || null, +scroll.top || null);
            }, 0);
          }

          //Save scroll onto viewHistoryData when scope is destroyed
          $scope.$on('$destroy', function() {
            viewHistoryData.scrollValues = scrollView.getValues();
          });
        });

        if(attr.refreshComplete) {
          $scope.refreshComplete = function() {
            if($scope.scrollView) {
              scrollCtrl.refresher && scrollCtrl.refresher.classList.remove('active');
              scrollView.finishPullToRefresh();
              $scope.$parent.$broadcast('scroll.onRefreshComplete');
            }
          };
        }
      }
    }
  };
}])

.directive('ionRefresher', function() {
  return {
    restrict: 'E',
    replace: true,
    require: ['^?ionContent', '^?ionList'],
    template: '<div class="scroll-refresher"><div class="ionic-refresher-content"><i class="icon ion-arrow-down-c icon-pulling"></i><i class="icon ion-loading-d icon-refreshing"></i></div></div>',
    scope: true
  };
})

.directive('ionScrollRefresher', function() {
  return {
    restrict: 'E',
    replace: true,
    transclude: true,
    template: '<div class="scroll-refresher"><div class="scroll-refresher-content" ng-transclude></div></div>'
  };
})

.directive('ionInfiniteScroll', ['$ionicBind', function($ionicBind) {
  return {
    restrict: 'E',
    require: '^?$ionicScroll',
    template:
    '<div class="scroll-infinite">' +
      '<div class="scroll-infinite-content">' +
        '<i class="icon ion-loading-d icon-refreshing"></i>' +
      '</div>' +
    '</div>',
    link: function($scope, $element, $attrs, scrollCtrl) {
      setTimeout(function() {
        var scrollCtrl = $element.controller('$ionicScroll');
        var scrollView = scrollCtrl.scrollView;

        $ionicBind($scope, $attrs, {
          distance: '@infiniteScrollDistance'
        });
        function maxScroll() {
          var dist = $scope.distance || '1%';
          return dist.indexOf('%') > -1 ?
            scrollView.getScrollMax().top * (1 - parseInt(dist,10) / 100) :
            scrollView.getScrollMax().top - parseInt(dist, 10);
        }

        var infiniteScrolling = false;
        $scope.$on('scroll.infiniteScrollComplete', function() {
          $element[0].classList.remove('active');
          setTimeout(function() {
            scrollView.resize();
          });
          infiniteScrolling = false;
        });

        scrollCtrl.$element.on('scroll', ionic.animationFrameThrottle(function() {
          if (!infiniteScrolling && scrollView.getValues().top >= maxScroll()) {
            $element[0].classList.add('active');
            infiniteScrolling = true;
            $scope.$apply(angular.bind($scope, $scope.$onInfiniteScroll));
          }
        }));
      });
    }
  };
}]);

})();
