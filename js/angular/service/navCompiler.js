IonicModule.service('$navCompiler', [
  '$q',
  '$http',
  '$compile',
  '$injector',
  '$controller',
  '$templateCache',
function($q, $http, $compile, $injector, $controller, $templateCache) {

  this.compilePage = function compilePage(options) {
    var templateUrl = options.templateUrl;
    var template = options.template;
    var controller = options.controller;
    var controllerAs = options.controllerAs;
    var resolve = options.resolve || {};

    forEach(resolve, function(value, key) {
      resolve[key] = isString(key) ?
        $injector.get(value) :
        $injector.invoke(value);
    });
    extend(resolve, options.locals || {});

    if (templateUrl) {
      resolve.$template = $http.get(templateUrl, {cache: $templateCache})
        .then(function(response) { return response.data; });
    } else {
      resolve.$template = $q.when(template || '');
    }

    return $q.all(resolve).then(function(locals) {
      var element = jqLite('<ion-pane>').html(locals.$template);

      var linkFn = $compile(element);

      return {
        element: element,
        link: function link($scope) {
          locals.$scope = $scope;
          if (controller) {
            var ctrl = $controller(controller, locals);
            element.data('$ngControllerController', ctrl);
            element.children().data('$ngControllerController', ctrl);
            if (controllerAs) {
              $scope[controllerAs] = ctrl;
            }
          }
          return linkFn($scope);
        }
      };
    });
  };

}]);
