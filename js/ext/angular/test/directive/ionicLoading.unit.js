describe('$ionicLoading directive', function() {
  beforeEach(module('ionic'));

  var $ionicLoading, $timeout;
  beforeEach(inject(function(_$ionicLoading_, _$timeout_) {
    $ionicLoading = _$ionicLoading_;
    $timeout = _$timeout_;
  }));

  it('getLoader() should compile loader then return same thing', inject(function($ionicTemplateLoader) {
    var data = TestUtil.unwrapPromise($ionicLoading._getLoader());

    expect(data.element.hasClass('loading')).toBe(true);
    expect(data.element[0].parentNode).toBe(document.body);

    var data2 = TestUtil.unwrapPromise($ionicLoading._getLoader());

    expect(data).toBe(data2);
  }));

  it('should remove ng-hide on show', inject(function($animate) {
    var loader = TestUtil.unwrapPromise($ionicLoading._getLoader());
    $ionicLoading.show({});
    spyOn($animate,'removeClass');
    $timeout.flush();
    expect($animate.removeClass).toHaveBeenCalledWith(loader.element, 'ng-hide');
  }));

  it('should add ng-hide on hide if shown', inject(function($animate) {
    var loader = TestUtil.unwrapPromise($ionicLoading._getLoader());
    spyOn($animate,'addClass');
    $ionicLoading.hide();
    //do nothing if hiding and not already shown
    expect($animate.addClass).not.toHaveBeenCalled();
    $ionicLoading.show();
    $timeout.flush();
    $ionicLoading.hide();
    $timeout.flush();
    expect($animate.addClass).toHaveBeenCalledWith(loader.element, 'ng-hide');
  }));

  it('should set content option and bind it each time show is called, if content is provided', function() {
    var loader = TestUtil.unwrapPromise($ionicLoading._getLoader());
    $ionicLoading.show({
      content: '<b>abc</b>'
    });
    $timeout.flush();
    expect(loader.scope.html).toBe('<b>abc</b>');
    expect(loader.element.html()).toBe(loader.scope.html);
    $ionicLoading.show({
      content: '123'
    });
    $timeout.flush();
    expect(loader.scope.html).toBe('123');
    expect(loader.element.html()).toBe(loader.scope.html);

    //no content given should keep same content
    $ionicLoading.show();
    $timeout.flush();
    expect(loader.scope.html).toBe('123');
    $ionicLoading.hide();
    $timeout.flush();
    $ionicLoading.show();
    $timeout.flush();
    expect(loader.scope.html).toBe('123');
    $ionicLoading.hide();
  });

  it('should use backdrop by default', inject(function($ionicBackdrop) {
    spyOn($ionicBackdrop, 'retain');
    spyOn($ionicBackdrop, 'release');
    $ionicLoading.show();
    $timeout.flush();
    expect($ionicBackdrop.retain).toHaveBeenCalled();
    $ionicLoading.hide();
    $timeout.flush();
    expect($ionicBackdrop.release).toHaveBeenCalled();
  }));

  it('should not use backdrop if noBackdrop is specified', inject(function($ionicBackdrop) {
    spyOn($ionicBackdrop, 'retain');
    spyOn($ionicBackdrop, 'release');
    $ionicLoading.show({
      noBackdrop: true
    });
    $timeout.flush();
    expect($ionicBackdrop.retain).not.toHaveBeenCalled();
    $ionicLoading.hide();
    $timeout.flush();
    expect($ionicBackdrop.release).not.toHaveBeenCalled();
  }));

  it('should hide after duration if specified', function() {
    spyOn($ionicLoading, 'hide');
    $ionicLoading.show({
      duration: 1000
    });
    $ionicLoading.show();
    //Initialy delay timeout
    $timeout.flush();
    expect($ionicLoading.hide).not.toHaveBeenCalled();
    //Duration timeout
    $timeout.flush();
    expect($ionicLoading.hide).toHaveBeenCalled();
  });
});
