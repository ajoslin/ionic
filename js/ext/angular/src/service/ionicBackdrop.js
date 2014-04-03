angular.module('ionic')

/**
 * @private
 */
.factory('$ionicBackdrop', [
  '$animate',
  '$document',
function($animate, $document) {
  var el;
  function backdropEl() {
    if (!el) {
      el = angular.element('<div class="backdrop ng-hide">');
      $document[0].body.appendChild(el[0]);
    }
    return el;
  }

  var backdropHolds = 0;

  return {
    retain: retain,
    release: release
  };

  function retain() {
    if ( (++backdropHolds) === 1 ) {
      $animate.removeClass(backdropEl(), 'ng-hide');
    }
    console.log('retain', backdropHolds);
  }
  function release() {
    if ( (--backdropHolds) === 0 ) {
      $animate.addClass(backdropEl(), 'ng-hide');
    }
    console.log('release', backdropHolds);
  }
}]);
