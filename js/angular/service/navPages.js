IonicModule.provider('$navPages', [
function() {
  var pages = {};

  function registerPage(templateUrl, data) {
    data = data || {};
    data.templateUrl = templateUrl;
    pages[templateUrl] = data;
    return this;
  }

  this.register = angular.bind(this, registerPage);

  this.$get = [function() {
    var self = {};

    self.register = angular.bind(this, registerPage);

    self.get = function(templateUrl) {
      return pages[templateUrl];
    };
    return self;
  }];

}]);
