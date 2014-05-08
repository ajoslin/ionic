IonicModule.directive('ionNavViewTwo', [
function() {
  return {
    restrict: 'E',
    controller: '$navViewController',
    link: function($scope, $element, $attrs, ctrls) {
    }
  };

}]);
