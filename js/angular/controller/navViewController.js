IonicModule.controller('$navViewController', [
  '$q',
  '$scope',
  '$element',
  '$navHistory',
  '$navPages',
  '$navCompiler',
function($q, $scope, $element, $navHistory, $navPages, $navCompiler) {
  $scope.$nav = this;

  this.currentPage;
  this.history = new $navHistory.History();

  this.history.onGo = function(data) {
    var enterPage = data.page;
    var leavePage = this.currentPage;
    if (leavePage) {
      leavePage.element.css('position','absolute');
      leavePage.animation.onComplete();
    }

    $element.append(enterPage.element);
    if (!enterPage.scope) {
      linkPage(enterPage);
    }

    enterPage.animation.reverse = !!data.options.reverse;
    enterPage.animation.context || (enterPage.animation.context = {});
    enterPage.animation.context.enterEl = enterPage.element;
    enterPage.animation.context.leaveEl = leavePage && leavePage.element;

    enterPage.animation.onComplete = function() {
      if (leavePage) {
        detachElement(leavePage.element);
        leavePage.element.css('position', '');
      }
    };
    enterPage.animation.start();
    this.currentPage = data.page;
  };

  this.push = function(urlOrData, params, options) {
    var self = this;
    var pageData;
    if (isString(urlOrData)) {
      pageData = $navPages.get(urlOrData);
    }

    return compilePage(pageData || {}, params, options)
      .then(function(page) {
        self.history.push(page);
      });
  };

  this.back = function() {
    this.history.go(this.history.current.index - 1, {
      reverse: true
    });
  };

  function compilePage(pageData, pageParams, options) {
    var compileOptions = extend({}, pageData, options);
    compileOptions.resolve = compileOptions.resolve || {};
    compileOptions.locals = { $pageParams: pageParams || {} };

    return $navCompiler.compilePage(compileOptions).then(function(compileData) {
      return extend(compileOptions, compileData);
    });
  }
  function linkPage(page) {
    page.scope = $scope.$new();
    page.link(page.scope);
  }
}]);
function detachElement(el) {
  var i, node, parent;
  for (i = 0; i < el.length; i++) {
    node = el[i];
    parent = node.parentNode;
    if (parent) {
      parent.removeChild(node);
    }
  }
}
