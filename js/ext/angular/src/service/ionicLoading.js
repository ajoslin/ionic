
var TPL_LOADING =
  '<div class="center-flex-container loading-container ng-hide">' +
    '<div class="loading" ng-bind-html="html">' +
    '</div>' +
  '</div>';
var HIDE_DEPRECATED_MSG = '$ionicLoading instance.hide() has been deprecated. Use $ionicLoading.hide().';
var SHOW_DEPRECATED_MSG = '$ionicLoading instance.show() has been deprecated. Use $ionicLoading.show().';
var SET_DEPRECATED_MSG = '$ionicLoading instance.setContent() has been deprecated. Use $ionicLoading.show({ content: \'my content\' }).';
var SHOW_DELAY_DEPRECATED_MSG = '$ionicLoading options.showDelay has been deprecated. Use options.delay instead.';

angular.module('ionic.service.loading', ['ionic.ui.loading'])

.factory('$ionicLoading2', [
  '$animate',
  '$document',
  '$ionicTemplateLoader',
  '$ionicBackdrop',
  '$timeout',
  '$q',
  '$log',
function($animate, $document, $ionicTemplateLoader, $ionicBackdrop, $timeout, $q, $log) {

  var _loaderData;
  function getLoader() {
    if (!_loaderData) {
      _loaderData = $ionicTemplateLoader.compile({
        template: TPL_LOADING,
        appendTo: $document[0].body
      });
    }
    return $q.when(_loaderData);
  }

  var loaderIsShown = false;
  var durationPromise;
  var hasBackdrop;

  return {
    isShown: function() {
      return loaderIsShown;
    },
    show: showLoader,
    hide: hideLoader
  };

  function showLoader(options) {
    if (loaderIsShown) {
      return getLoader().then(function(loader) {
        loader.scope.html = options.content;
      });
    }
    loaderIsShown = true;
    hasBackdrop = !options.noBackdrop;

    var delay = +options.delay || +options.showDelay || 0;
    var duration = +options.duration || 0;
    if (options.showDelay) {
      $log.error(SHOW_DELAY_DEPRECATED_MSG);
    }

    var promise = $timeout(getLoader, delay || 0).then(function(loader) {
      loader.scope.html = options.content;

      $animate.removeClass(loader.element, 'ng-hide');
      hasBackdrop && $ionicBackdrop.retain();
      durationPromise = options.duration && $timeout(hideLoader, duration);
    });

    promise.hide = deprecated.method(HIDE_DEPRECATED_MSG, $log.error, hideLoader);
    promise.show = deprecated.method(SHOW_DEPRECATED_MSG, $log.error, function() {
      showLoader(options);
    });
    promise.setContent = deprecated.method(SET_DEPRECATED_MSG, $log.error, function(content) {
      getLoader().then(function(loader) {
        loader.scope.html = content;
      });
    });

    return promise;

  }
  function hideLoader() {
    if (!loaderIsShown) return;
    loaderIsShown = false;

    return getLoader().then(function(loader) {
      $animate.addClass(loader.element, 'ng-hide');
      durationPromise && $timeout.cancel(durationPromise);
      hasBackdrop && $ionicBackdrop.release();
    });
  }
}])

/**
 * @ngdoc service
 * @name $ionicLoading
 * @module ionic
 * @description
 * An overlay that can be used to indicate activity while blocking user
 * interaction.
 *
 * @usage
 * ```js
 * angular.module('LoadingApp', ['ionic'])
 * .controller('LoadingCtrl', function($scope, $ionicLoading) {
 *   $scope.show = function() {
 *     $scope.loading = $ionicLoading.show({
 *       content: 'Loading',
 *     });
 *   };
 *   $scope.hide = function(){
 *     $scope.loading.hide();
 *   };
 * });
 * ```
 */
.factory('$ionicLoading', ['$rootScope', '$document', '$compile', function($rootScope, $document, $compile) {
  return {
    /**
     * @ngdoc method
     * @name $ionicLoading#show
     * @param {object} opts The options for the indicator. Available properties:
     *  - `{string=}` `content` The content of the indicator. Default: none.
     *  - `{string=}` `animation` The animation of the indicator.
     *    Default: 'fade-in'.
     *  - `{boolean=}` `showBackdrop` Whether to show a backdrop. Default: true.
     *  - `{number=}` `maxWidth` The maximum width of the indicator, in pixels.
     *    Default: 200.
     *  - `{number=}` `showDelay` How many milliseconds to delay showing the
     *    indicator.  Default: 0.
     * @returns {object} A shown loader with the following methods:
     *  - `hide()` - Hides the loader.
     *  - `show()` - Shows the loader.
     *  - `setContent(string)` - Sets the html content of the loader.
     */
    show: function(opts) {
      var defaults = {
        content: '',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
      };

      opts = angular.extend(defaults, opts);

      var scope = $rootScope.$new(true);
      angular.extend(scope, opts);

      // Make sure there is only one loading element on the page at one point in time
      var existing = angular.element($document[0].querySelector('.loading-backdrop'));
      if(existing.length) {
        existing.remove();
      }

      // Compile the template
      var element = $compile('<ion-loading>' + opts.content + '</ion-loading>')(scope);

      $document[0].body.appendChild(element[0]);

      var loading = new ionic.views.Loading({
        el: element[0],
        maxWidth: opts.maxWidth,
        showDelay: opts.showDelay
      });

      loading.show();

      scope.loading = loading;

      return loading;
    }
  };
}]);
