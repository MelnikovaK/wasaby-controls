import BaseController = require('Controls/_lookup/BaseController');
import showSelector = require('Controls/_lookup/showSelector');

var Controller = BaseController.extend({
    showSelector: function(popupOptions) {
        showSelector(this, popupOptions, this._options.multiSelect);
    }
});

export = Controller;
