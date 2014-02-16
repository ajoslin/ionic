angular.module('ionic.ui.tabs', ['ionic.service.view', 'ionic.ui.bindHtml'])

/**
 * @description
 *
 * The Tab Controller renders a set of pages that switch based on taps
 * on a tab bar. Modelled off of UITabBarController.
 */

.run(['$ionicViewService', function($ionicViewService) {
  // set that the tabs directive should not animate when transitioning
  // to it. Instead, the children <tab> directives would animate
  $ionicViewService.disableRegisterByTagName('tabs');
}])

.controller('$ionicTabs', ['$scope', '$ionicViewService', '$element', function($scope, $ionicViewService, $element) {
  var self = $scope.tabsController = this;
  self.tabs = $scope.tabs = [];
  self.selectedTab = null;

  self.add = function(tab) {
    self.tabs.push(tab);
    if(self.tabs.length === 1) {
      self.select(tab);
    }
  };

  self.remove = function(tab) {
    var tabIndex = self.tabs.indexOf(tab);
    if (tabIndex === -1) {
      return;
    }
    if (tab.isVisible) {
      self.deselect(tab);
      //Try to select a new tab if we're removing a tab
      if (self.tabs.length === 1) {
        //do nothing if there are no other tabs to select
      } else {
        //Select previous tab if it's the last tab, else select next tab
        var newTabIndex = tabIndex === self.tabs.length - 1 ? tabIndex - 1 : tabIndex + 1;
        self.select(self.tabs[newTabIndex]);
      }
    }
    self.tabs.splice(tabIndex, 1);
  };

  self.select = function(tab, shouldEmitEvent) {
    var tabIndex = self.tabs.indexOf(tab);
    if (tabIndex === -1) {
      throw new Error("Cannot select tab that is not added!");
    }

    if (self.selectedTab && self.selectedTab.$historyId == tab.$historyId) {
      if (shouldEmitEvent) {
        $ionicViewService.goToHistoryRoot(tab.$historyId);
      }
    } else {
      angular.forEach(self.tabs, function(tab) {
        if (tab.isVisible) {
          tab.isVisible = false;
          tab.onDeselect();
        }
      });
      self.selectedTab = tab;
      tab.isVisible = true;
      tab.onSelect();

      if (shouldEmitEvent) {
        var viewData = {
          type: 'tab',
          tabIndex: tabIndex,
          historyId: tab.$historyId,
          navViewName: tab.navViewName,
          hasNavView: !!tab.navViewName,

          title: tab.$tabHeading.getTitle(),
          //Skip the first character of href if it's #
          url: tab.$tabHeading.href,
          uiSref: tab.$tabHeading.uiSref
        };
        $scope.$emit('viewState.changeHistory', viewData);
      }
    }
  };
}])

.directive('tabs', ['$ionicViewService', '$ionicBind', function($ionicViewService, $ionicBind) {
  return {
    restrict: 'E',
    replace: true,
    scope: true,
    transclude: true,
    controller: '$ionicTabs',
    template:
    '<div class="view {{$animation}}">' +
      '<div class="tabs {{$tabsStyle}} {{$tabsType}}">' +
      '</div>' +
    '</div>',
    compile: function(element, attr, transclude) {
      if(angular.isUndefined(attr.tabsType)) attr.$set('tabsType', 'tabs-positive');

      return function link($scope, $element, $attr, tabsCtrl) {

        $ionicBind($scope, $attr, {
          $animation: '@animation',
          $tabsStyle: '@tabsStyle',
          $tabsType: '@tabsType'
        });

        tabsCtrl.$scope = $scope;
        tabsCtrl.$element = $element;
        tabsCtrl.$tabsElement = angular.element($element[0].querySelector('.tabs'));

        $scope.animateNav = $scope.$eval($attr.animateNav);
        if($scope.animateNav !== false) {
          $scope.animateNav = true;
        }

        $scope.$watch('$tabsStyle', function(val) {
          var isTabsTop = val.indexOf('tabs-top') > -1;
          $scope.$hasSubheader = isTabsTop;
          $scope.$hasTabs = !isTabsTop;
        });

        transclude($scope, function(clone) {
          $element.append(clone);
        });
      };
    }
  };
}])

.controller('$ionicTab', ['$scope', '$ionicViewService', '$rootScope', '$element',
function($scope, $ionicViewService, $rootScope, $element) {
  var stateListener;

  this.$scope = $scope;
  this.setNavViewName = function(name) {
    $scope.navViewName = name;
    selectTabIfMatchesState();

    if (!stateListener) {
      stateListener = $rootScope.$on('$stateChangeSuccess', selectTabIfMatchesState);
      $scope.$on('$destroy', stateListener);
    }
  };

  $ionicViewService.registerHistory($scope);

  function selectTabIfMatchesState() {
    // this tab's ui-view is the current one, go to it!
    if ($scope.navViewName &&
        $ionicViewService.isCurrentStateNavView($scope.navViewName)) {
      $element.controller('tabs').select($scope);
    }
  }
}])

// Generic controller directive
.directive('tab', ['$rootScope', '$animate', '$ionicBind', function($rootScope, $animate, $ionicBind) {
  return {
    restrict: 'E',
    require: ['^tabs', 'tab'],
    replace: true,
    transclude: 'element',
    controller: '$ionicTab',
    scope: true,
    compile: function(element, attr, transclude) {
      return function link($scope, $element, $attr, ctrls) {
        var childScope, childElement,
          tabsCtrl = ctrls[0],
          tabCtrl = ctrls[1];

        $ionicBind($scope, $attr, {
          hideBackButton: '=',
          animate: '=',
          leftButtons: '=',
          rightButtons: '=',
          onSelect: '&',
          onDeselect: '&'
        });

        tabsCtrl.add($scope);
        $scope.$on('$destroy', function() {
          tabsCtrl.remove($scope);
        });

        $scope.$watch('isVisible', function(value) {
          if (!value) {
            $scope.$broadcast('tab.hidden');
          }
          childScope && childScope.$destroy();
          childScope = null;
          childElement && $animate.leave(childElement);
          childElement = null;
          if (value) {
            childScope = $scope.$new();
            transclude(childScope, function(clone) {
              clone.data('$tabController', tabCtrl);
              clone.data('$tabsController', tabsCtrl);

              $animate.enter(clone, tabsCtrl.$element);
              clone.addClass('pane');
              childElement = clone;
            });
            $scope.$broadcast('tab.shown');
          }
        });

        transclude($scope, function(clone) {
          clone.data('$tabController', tabCtrl);
          clone.data('$tabsController', tabsCtrl);
          var navView = clone[0].querySelector('nav-view');
          if (navView) {
            tabCtrl.setNavViewName(navView.getAttribute('name'));
          }
        });
      };
    }
  };
}])

.directive('tabHeading', function() {
  return {
    restrict: 'E',
    require: ['^?tabs', '^?tab'],
    replace: true,
    transclude: true,
    template:
    '<div ng-class="{active: isTabActive(), \'has-badge\':badge}" ' +
      'ng-click="selectTab()" class="tab-item tab-heading">' +
      '<span class="badge {{badgeStyle}}" ng-show="badge">{{badge}}</span>' +
      '<i class="icon {{iconOn}}" ng-show="isTabActive()"></i>' +
      '<i class="icon {{iconOff}}" ng-hide="isTabActive()"></i>' +
      '<span class="tab-title" ng-transclude></span>' +
    '</div>',
    scope: {
      icon: '@',
      iconOn: '@',
      iconOff: '@',
      uiSref: '@',
      href: '@',
      badge: '=',
      badgeStyle: '@'
    },
    compile: function(element, attr, transclude) {
      if (attr.icon) {
        attr.$set('iconOn', attr.icon);
        attr.$set('iconOff', attr.icon);
      }
      return function link($scope, $element, $attr, ctrls) {
        var tabsCtrl = ctrls[0],
          tabCtrl = ctrls[1];

        var title = angular.element($element[0].querySelector('.tab-title'));

        // The first time we process this tabHeading, we want to append it to the tabs'
        // tab heading area.  All the following times we want to just have it gone.
        if (tabCtrl.headingProcessed) {
          $element.remove();
          $scope.$destroy();
          return;
        }

        var tab = tabCtrl.$scope;
        tabCtrl.headingProcessed = true;
        tabsCtrl.$tabsElement.append($element);

        tab.$tabHeading = $scope;

        $scope.getTitle = function() {
          return title.text().trim();
        };

        $scope.isTabActive = function() {
          return tab.isVisible;
        };
        $scope.selectTab = function(e) {
          tabsCtrl.select(tab, true);
        };
      };
    }
  };
});
