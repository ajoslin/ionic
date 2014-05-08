angular.module('test', ['ionic'])
.config(function($navPagesProvider, $ionicAnimationProvider) {
  var slide = $ionicAnimationProvider.create({
    curve: 'ease-in-out',
    name: 'test',
    duration: 500,
    repeat: 0,
    step: function(v) {
      var fromRight = (100 - 100 * v);
      var fromLeft = -100 * v + '%';
      translateXPercent(
        this.context.enterEl,
        this.reverse ? fromLeft : fromRight
      );
      translateXPercent(
        this.context.leaveEl,
        this.reverse ? fromRight : fromLeft
      );
    }
  });
  $navPagesProvider
    .register('1.html', {
      controller: 'OneCtrl',
      animation: slide
    })
    .register('2.html', {
      controller: 'TwoCtrl',
      animation: slide
    });
})
.controller('OneCtrl', function($scope) {
  $scope.one = 'uno';

})
.controller('TwoCtrl', function($scope) {
  $scope.two = 'dos';
})
.controller('AppCtrl', function($scope) {
  setTimeout(function() {
    window.nav = $scope.$nav;
  });
});
function translateXPercent(el, x) {
  if (!el) return;
  el[0].style[ionic.CSS.TRANSFORM] = 'translate3d('+x+'%,0,0)';
}
