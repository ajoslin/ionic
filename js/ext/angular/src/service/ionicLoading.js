
var TPL_LOADING =
  '<div class="loading ng-hide" ng-bind-html="html">' +
  '</div>';

var HIDE_DEPRECATED_MSG = '$ionicLoading instance.hide() has been deprecated. Use $ionicLoading.hide().';
var SHOW_DEPRECATED_MSG = '$ionicLoading instance.show() has been deprecated. Use $ionicLoading.show().';
var SET_DEPRECATED_MSG = '$ionicLoading instance.setContent() has been deprecated. Use $ionicLoading.show({ content: \'my content\' }).';
var SHOW_DELAY_DEPRECATED_MSG = '$ionicLoading options.showDelay has been deprecated. Use options.delay instead.';
var SHOW_BACKDROP_DEPRECATED_MSG = '$ionicLoading options.showBackdrop has been deprecated. Use options.noBackdrop instead.';

angular.module('ionic.service.loading', ['ionic.ui.loading'])

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
 *     $ionicLoading.show({
 *       content: 'Loading...'
 *     });
 *   };
 *   $scope.hide = function(){
 *     $ionicLoading.hide();
 *   };
 * });
 * ```
 */
.factory('$ionicLoading', [
  '$animate',
  '$document',
  '$ionicTemplateLoader',
  '$ionicBackdrop',
  '$timeout',
  '$q',
  '$log',
function($animate, $document, $ionicTemplateLoader, $ionicBackdrop, $timeout, $q, $log) {

  var _loaderData;
  var loaderIsShown = false;
  var durationPromise;
  var hasBackdrop;

  return {
    /**
     * @ngdoc method
     * @name $ionicLoading#show
     * @param {object} opts The options for the loading indicator. Available properties:
     *  - `{string=}` `content` The html content of the indicator.
     *  - `{boolean=}` `noBackdrop` Whether to hide the backdrop.
     *  - `{number=}` `delay` How many milliseconds to delay showing the indicator.
     *  - `{number=} `duration` How many milliseconds to wait until automatically hiding the
     *  indicator.
     */
    show: showLoader,
    /**
     * @ngdoc method
     * @name $ionicLoading#hide
     * @description Hides the loading indicator, if shown.
     */
    hide: hideLoader,
    /**
     * @private for testing
     */
    _getLoader: getLoader
  };

  function getLoader() {
    if (!_loaderData) {
      _loaderData = $ionicTemplateLoader.compile({
        template: TPL_LOADING,
        appendTo: $document[0].body
      });
    }
    return $q.when(_loaderData);
  }

  function showLoader(options) {
    var self = this;
    options || (options = {});
    if (loaderIsShown) {
      return getLoader().then(function(loader) {
        if (options.content) {
          loader.scope.html = options.content;
        }
        ionic.DomUtil.centerElementByMargin(loader.element[0]);
      });
    }

    deprecated.field(SHOW_DELAY_DEPRECATED_MSG, $log.warn, options, 'showDelay', options.showDelay);
    deprecated.field(SHOW_BACKDROP_DEPRECATED_MSG, $log.warn, options, 'showBackdrop', options.showBackdrop);

    loaderIsShown = true;

    //deprecated options.showBackdrop
    hasBackdrop = !options.noBackdrop || options.showBackdrop === false;
    //deprecated options.showDelay
    var delay = +options.delay || +options.showDelay || 0;
    var duration = +options.duration || 0;
    if (options.showDelay) {
      $log.warn(SHOW_DELAY_DEPRECATED_MSG);
    }

    var promise = $timeout(getLoader, delay || 0).then(function(loader) {
      if (options.content) {
        loader.scope.html = options.content;
      }

      $animate.removeClass(loader.element, 'ng-hide');

      hasBackdrop && $ionicBackdrop.retain();
      durationPromise = options.duration && $timeout(self.hide, duration);

      ionic.requestAnimationFrame(function() {
        ionic.DomUtil.centerElementByMargin(loader.element[0]);
      });
    });

    promise.hide = deprecated.method(HIDE_DEPRECATED_MSG, $log.warn, hideLoader);
    promise.show = deprecated.method(SHOW_DEPRECATED_MSG, $log.warn, function() {
      showLoader(options);
    });
    promise.setContent = deprecated.method(SET_DEPRECATED_MSG, $log.warn, function(content) {
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
}]);
