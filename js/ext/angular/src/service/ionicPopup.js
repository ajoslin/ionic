
var TPL_POPUP =
  '<div class="popup">' +
    '<div class="popup-head">' +
      '<h3 class="popup-title" ng-bind-html="title"></h3>' +
      '<h5 class="popup-sub-title" ng-bind-html="subTitle" ng-if="subTitle"></h5>' +
    '</div>' +
    '<div class="popup-body" ng-bind-html="content" ng-if="content">' +
    '</div>' +
    '<div class="popup-buttons row">' +
      '<button ng-repeat="button in buttons" ng-click="$buttonTapped(button, $event)" class="button col" ng-class="button.type || \'button-default\'" ng-bind-html="button.text"></button>' +
    '</div>' +
  '</div>';

angular.module('ionic.service.popup', ['ionic.service.templateLoad'])

/**
 * @ngdoc service
 * @name $ionicPopup
 * @module ionic
 * @restrict E
 * @codepen zkmhJ
 * @description
 *
 * The Ionic Popup service makes it easy to programatically create and show popup
 * windows that require the user to respond in order to continue:
 *
 * The popup system has support for nicer versions of the built in `alert()` `prompt()` and `confirm()` functions
 * you are used to in the browser, but with more powerful support for customizing input types in the case of
 * prompt, or customizing the look of the window.
 *
 * But the true power of the Popup is when a built-in popup just won't cut it. Luckily, the popup window
 * has full support for arbitrary popup content, and a simple promise-based system for returning data
 * entered by the user.
 *
 * @usage
 * To trigger a Popup in your code, use the $ionicPopup service in your angular controllers:
 *
 * ```js
 * angular.module('mySuperApp', ['ionic'])
 * .controller(function($scope, $ionicPopup) {
 *
 *  // Triggered on a button click, or some other target
    $scope.showPopup = function() {
      $scope.data = {}

      // An elaborate, custom popup
      $ionicPopup.show({
        templateUrl: 'popup-template.html',
        title: 'Enter Wi-Fi Password',
        subTitle: 'Please use normal things',
        scope: $scope,
        buttons: [
          { text: 'Cancel', onTap: function(e) { return true; } },
          {
            text: '<b>Save</b>',
            type: 'button-positive',
            onTap: function(e) {
              return $scope.data.wifi;
            }
          },
        ]
      }).then(function(res) {
        console.log('Tapped!', res);
      }, function(err) {
        console.log('Err:', err);
      }, function(popup) {
        // If you need to access the popup directly, do it in the notify method
        // This is also where you can programatically close the popup:
        // popup.close();
      });

      // A confirm dialog
      $scope.showConfirm = function() {
        $ionicPopup.confirm({
          title: 'Consume Ice Cream',
          content: 'Are you sure you want to eat this ice cream?'
        }).then(function(res) {
          if(res) {
            console.log('You are sure');
          } else {
            console.log('You are not sure');
          }
        });
      };

      // A prompt dialog
      $scope.showPrompt = function() {
        $ionicPopup.prompt({
          title: 'ID Check',
          content: 'What is your name?'
        }).then(function(res) {
          console.log('Your name is', res);
        });
      };

      // A prompt with password input dialog
      $scope.showPasswordPrompt = function() {
        $ionicPopup.prompt({
          title: 'Password Check',
          content: 'Enter your secret password',
          inputType: 'password',
          inputPlaceholder: 'Your password'
        }).then(function(res) {
          console.log('Your password is', res);
        });
      };

      // An alert dialog
      $scope.showAlert = function() {
        $ionicPopup.alert({
          title: 'Don\'t eat that!',
          content: 'It might taste good'
        }).then(function(res) {
          console.log('Thank you for not eating my delicious ice cream cone');
        });
      };
    };
  });
  ```


 */
.factory('$ionicPopup', [
  '$animate',
  '$ionicTemplateLoader',
  '$ionicBackdrop',
  '$q',
  '$timeout',
  '$rootScope',
  '$document',
function($animate, $ionicTemplateLoader, $ionicBackdrop, $q, $timeout, $rootScope, $document) {
  //TODO allow this to be configured
  var config = {
    stackPushDelay: 50
  };

  var popupStack = [];

  return {
    /**
     * @ngdoc method
     * @name $ionicPopup#show
     * @description show a complex popup. This is the master show function for all popups
     * @param {data} object The options for showing a popup, of the form:
     * @returns {Promise} an Angular promise which resolves when the user enters the correct data, and also
     * sends the constructed popup in the notify function (for programatic closing, as shown in the example above).
     * ```
     * {
     *   content: '', // String. The content of the popup
     *   title: '', // String. The title of the popup
     *   subTitle: '', // String (optional). The sub-title of the popup
     *   templateUrl: '', // URL String (optional). The URL of a template to load as the content (instead of the `content` field)
     *   scope: null, // Scope (optional). A scope to apply to the popup content (for using ng-model in a template, for example)
     *   buttons: [{
     *     text: 'Cancel',
     *     type: 'button-default',
     *     onTap: function(e) {
     *       // e.preventDefault() is the only way to return a false value
     *       e.preventDefault();
     *     }
     *   }, {
     *     text: 'OK',
     *     type: 'button-positive',
     *     onTap: function(e) {
     *       // When the user taps one of the buttons, you need to return the
     *       // Data you want back to the popup service which will then resolve
     *       // the promise waiting for a response.
     *       //
     *       // To return "false", call e.preventDefault();
     *       return scope.data.response;
     *     }
     *   }]
     * }
     * ```
     */
    show: showPopup,

    /**
     * @ngdoc method
     * @name $ionicPopup#alert
     * @description show a simple popup with one button that the user has to tap
     *
     * Show a simple alert dialog
     *
     * ```javascript
     *  $ionicPopup.alert({
     *    title: 'Hey!',
     *    content: 'Don\'t do that!'
     *  }).then(function(res) {
     *    // Accepted
     *  });
     * ```
     *
     * @returns {Promise} that resolves when the alert is accepted
     * @param {data} object The options for showing an alert, of the form:
     *
     * ```
     * {
     *   content: '', // String. The content of the popup
     *   title: '', // String. The title of the popup
     *   okText: '', // String. The text of the OK button
     *   okType: '', // String (default: button-positive). The type of the OK button
     * }
     * ```
     */
    alert: showAlert,

    /**
     * @ngdoc method
     * @name $ionicPopup#confirm
     * @description
     * Show a simple confirm popup with a cancel and accept button:
     *
     * ```javascript
     *  $ionicPopup.confirm({
     *    title: 'Consume Ice Cream',
     *    content: 'Are you sure you want to eat this ice cream?'
     *  }).then(function(res) {
     *    if(res) {
     *      console.log('You are sure');
     *    } else {
     *      console.log('You are not sure');
     *    }
     *  });
     * ```
     *
     * @returns {Promise} that resolves with the chosen option
     * @param {data} object The options for showing a confirm dialog, of the form:
     *
     * ```
     * {
     *   content: '', // String. The content of the popup
     *   title: '', // String. The title of the popup
     *   cancelText: '', // String. The text of the Cancel button
     *   cancelType: '', // String (default: button-default). The type of the kCancel button
     *   okText: '', // String. The text of the OK button
     *   okType: '', // String (default: button-positive). The type of the OK button
     * }
     * ```
     */
    confirm: showConfirm,

    /**
     * @ngdoc method
     * @name $ionicPopup#prompt
     * @description show a simple prompt dialog.
     *
     * ```javascript
     *  $ionicPopup.prompt({
     *    title: 'Password Check',
     *    content: 'Enter your secret password',
     *    inputType: 'password',
     *    inputPlaceholder: 'Your password'
     *  }).then(function(res) {
     *    console.log('Your password is', res);
     *  });
     * ```
     *
     * @returns {Promise} that resolves with the entered data
     * @param {data} object The options for showing a prompt dialog, of the form:
     *
     * ```
     * {
     *   content: // String. The content of the popup
     *   title: // String. The title of the popup
     *   subTitle: // String. The sub title of the popup
     *   inputType: // String (default: "text"). The type of input to use
     *   inputPlaceholder: // String (default: ""). A placeholder to use for the input.
     *   cancelText: // String. The text of the Cancel button
     *   cancelType: // String (default: button-default). The type of the kCancel button
     *   okText: // String. The text of the OK button
     *   okType: // String (default: button-positive). The type of the OK button
     * }
     * ```
     */
    prompt: showPrompt
  };



  function showPopup(options) {
    options = angular.extend({
      scope: null,
      title: '',
      buttons: []
    }, options || {});

    var popupPromise = $ionicTemplateLoader.compile({
      template: TPL_POPUP,
      scope: options.scope && options.scope.$new(),
      appendTo: $document[0].body
    });
    var popupContentPromise = options.templateUrl ?
      $ionicTemplateLoader.load(options.templateUrl) :
      $q.when(options.template || options.content || '');
    var popupShowDelay;

    var visiblePopup = getVisiblePopup();
    if (visiblePopup) {
      popupShowDelay = config.stackPushDelay;
      visiblePopup.hide();
    } else {
      popupShowDelay = 0;
    }

    return $timeout(angular.noop, popupShowDelay).then(function() {
      return popupPromise;
    }).then(function(popup) {
      var responseDeferred = $q.defer();

      var innerEl = popup.element.children();

      popup.scope.title = options.title;
      popup.scope.buttons = options.buttons,
      popup.scope.subTitle = options.subTitle;

      popupContentPromise.then(function(content) {
        popup.scope.content = content;
      });

      popup.scope.$buttonTapped = function(button, event) {
        var result = button.onTap && button.onTap(event);
        event = event.originalEvent || event;

        if (!event.defaultPrevented && result) {
          popup.remove();
          responseDeferred.resolve(result);
          return;
        }
        return options.onButtonTap(button, event);
      };

      popup.show = function() {
        popup.element.removeClass('popup-hidden');
        popup.element.addClass('popup-showing active');
        $ionicBackdrop.retain();
        $document[0].body.classList.add('popup-open');

        ionic.requestAnimationFrame(function() {
          focusLastButton(popup.element);
          ionic.DomUtil.centerElementByMargin(popup.element[0]);
        });
      };
      popup.hide = function(cb) {
        ionic.requestAnimationFrame(function() {
          if (!popup.element.hasClass('popup-hidden')) {
            $ionicBackdrop.release();
          }
          popup.element.removeClass('active');
          popup.element.addClass('popup-hidden');
          $timeout(cb, 200, false);
        });
      };
      popup.remove = function() {
        popupStack.splice(popupStack.indexOf(popup), 1);
        popup.hide(function() {
          popup.element.remove();
          popup.scope.$destroy();
          if (!getVisiblePopup()) {
            $document[0].body.classList.add('popup-open');
          }
        });
      };

      popupStack.push(popup);
      popup.show();
    });
  }

  function getVisiblePopup() {
    return popupStack[popupStack.length - 1];
  }

  function focusLastButton(element) {
    var buttons = element[0].querySelectorAll('button');
    var lastButton = buttons[buttons.length-1];
    if(lastButton) {
      lastButton.focus();
    }
  }

  function showAlert(options) {
    return showPopup({
      content: opts.content,
      title: opts.title,
      buttons: [{
        text: opts.okText || 'OK',
        type: opts.okType || 'button-positive',
        onTap: function(e) {
          return true;
        }
      }]
    });
  }

  function showConfirm(opts) {
    return showPopup({
      content: opts.content || '',
      title: opts.title || '',
      buttons: [{
        text: opts.cancelText || 'Cancel' ,
        type: opts.cancelType || 'button-default',
        onap: function(e) { e.preventDefault(); }
      }, {
        text: opts.okText || 'OK',
        type: opts.okType || 'button-positive',
        onTap: function(e) {
          return true;
        }
      }]
    });
  }

  function showPrompt(opts) {
    var scope = $rootScope.$new(true);
    scope.data = {};
    return showPopup({
      content: opts.content || 
        '<input ng-model="data.response" type="' + (opts.inputType || 'text') + '" placeholder="' + (opts.inputPlaceholder || '') + '">',
      title: opts.title || '',
      subTitle: opts.subTitle || '',
      scope: scope,
      buttons: [{
        text: opts.cancelText || 'Cancel',
        type: opts.cancelType|| 'button-default',
        onTap: function(e) { e.preventDefault(); }
      }, {
        text: opts.okText || 'OK',
        type: opts.okType || 'button-positive',
        onTap: function(e) {
          return scope.data.response;
        }
      }]
    });
  }
}]);

