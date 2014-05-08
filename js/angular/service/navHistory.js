IonicModule.service('$navHistory', [
function() {
  this.History = NavHistory;
}]);

function NavHistory(options) {
  this.pages = [];
  this.current = null;

  this.onGo = function(){};
}

NavHistory.prototype.push = function(page, options) {
  this.pages.push(page);
  return this.go(this.pages.length - 1, options || {});
};

NavHistory.prototype.replace = function(page, options) {
  var self = this;
  var oldIndex = this.current.index;
  return this.push(page, options).then(function() {
    self.pages.splice(oldIndex, 1);
  });
};

NavHistory.prototype.go = function(index, options) {
  if (index >= 0 && index < this.pages.length) {
    this.current = {
      index: index,
      page: this.pages[index],
      options: options
    };
    this.onGo(this.current);
  }
};

NavHistory.prototype.length = function() {
  return this.pages.length;
};
NavHistory.prototype.get = function(index) {
  return this.pages[index];
};

