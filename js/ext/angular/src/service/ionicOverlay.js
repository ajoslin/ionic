angular.module('ionic.service.overlay', [])

.factory('$ionicOverlay', [
  '$compile',
  '$controller',
  '$ionicTemplateLoader',
  '$q',
  '$rootScope',
function($compile, $controller, $ionicTemplateLoader, $q, $rootScope) {

  function Overlay(options) {
    options = angular.extend({
      template: '',
      templateUrl: '',
      scope: null,
      controller: null,
      locals: {}
    }, options || {});

    var templatePromise = options.templateUrl ?
      $ionicTemplateLoader.load(options.templateUrl) :
      $q.when(options.template);

    return templatePromise.then(function(template) {
      var controller;
      var scope = options.scope ?
        options.scope.$new() :
        $rootScope.$new();
      //Incase template doesn't have just one root element, do this
      var element = angular.element('<div>').html(template).contents();

      if (options.controller) {
        controller = $controller(
          options.controller,
          angular.extend(options.locals, {
            $scope: scope
          })
        );
        element.children().data('$ngControllerController', controller);
      }
      $compile(element)(scope);

      return {
        element: element,
        scope: scope
      };
    });
  }

}])

;

