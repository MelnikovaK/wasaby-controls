define(['Controls/Container/Suggest/Layout', 'WS.Data/Collection/List'], function(Suggest, List){
   
   describe('Controls.Container.Suggest.Layout', function () {
   
      var hasMoreTrue = {
         hasMore: true
      };
      var hasMoreFalse = {
         hasMore: false
      };
      
      var getComponentObject = function() {
         var self = {};
         self._options = {};
         return self;
      };
      
      it('Suggest::_private.hasMore', function () {
         assert.isTrue(Suggest._private.hasMore(hasMoreTrue));
         assert.isFalse(Suggest._private.hasMore(hasMoreFalse));
      });
   
      it('Suggest::_private.shouldShowFooter', function () {
         var self = getComponentObject();
         self._options.footerTemplate = 'anyTemplate';
         assert.isTrue(!!Suggest._private.shouldShowFooter(self, hasMoreTrue));
         assert.isFalse(!!Suggest._private.shouldShowFooter(self, hasMoreFalse));
      });
   
      it('Suggest::_private.suggestStateNotify', function () {
         var self = getComponentObject();
         var stateNotifyed = false;
         self._options.suggestState = true;
         self._notify = function(eventName, args) {
            stateNotifyed = true;
         };
   
         Suggest._private.suggestStateNotify(self, true);
         assert.isFalse(stateNotifyed);
   
         Suggest._private.suggestStateNotify(self, false);
         assert.isTrue(stateNotifyed);
      });
   
      it('Suggest::_private.close', function () {
         var self = getComponentObject();
         var state;
         self._options.suggestState = true;
         self._notify = function(eventName, args) {
            state = args[0];
         };
         Suggest._private.close(self);
         assert.isFalse(state);
      });
   
      it('Suggest::_private.open', function () {
         var self = getComponentObject();
         var state;
         self._options.suggestState = false;
         self._notify = function(eventName, args) {
            state = args[0];
         };
         Suggest._private.open(self);
         assert.isTrue(state);
      });
   
      it('Suggest::_private.shouldSearch', function () {
         var self = getComponentObject();
         self._options.minSearchLength = 3;
         
         self._active = true;
         assert.isTrue(Suggest._private.shouldSearch(self, 'test'));
         assert.isFalse(Suggest._private.shouldSearch(self, 't'));
   
         self._active = false;
         assert.isFalse(Suggest._private.shouldSearch(self, 'test'));
         assert.isFalse(Suggest._private.shouldSearch(self, 't'));
      });
   
      it('Suggest::_private.shouldShowSuggest', function () {
         var self = getComponentObject();
         var result = {
            data: new List({items: [1,2,3]})
         };
         var emptyResult = {
            data: new List()
         };
         
         assert.isTrue(!!Suggest._private.shouldShowSuggest(self, result));
         assert.isFalse(!!Suggest._private.shouldShowSuggest(self, emptyResult));
   
         self._options.emptyTemplate = {};
         assert.isTrue(!!Suggest._private.shouldShowSuggest(self, result));
         assert.isTrue(!!Suggest._private.shouldShowSuggest(self, emptyResult));
      });
   
      it('Suggest::_private.updateFilter', function () {
         var self = getComponentObject();
         self._options.searchParam = 'searchParam';
         var tab = 1;
         var value = 'test';
         var resultFilter = {
            currentTab: 1,
            searchParam: 'test'
         };
   
         Suggest._private.updateFilter(self, 'test', 1);
         assert.deepEqual(self._filter, resultFilter);
      });
   
      it('Suggest::_inputActivated with autoDropDown', function() {
         var self = getComponentObject();
         var suggestComponent = new Suggest();
         var suggestState = false;
         
         self._options.searchParam = 'searchParam';
         self._options.autoDropDown = true;
         self._options.minSearchLength = 3;
         suggestComponent.saveOptions(self._options);
         suggestComponent._notify = function(event, val) {
            if (event === 'suggestStateChanged') {
               suggestState = val[0];
            }
         };
         suggestComponent._inputActivated();
         
         assert.isTrue(suggestState);
      });
      
   });
   
});