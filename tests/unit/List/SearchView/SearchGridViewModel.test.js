define(['Controls/List/SearchView/SearchGridViewModel', 'WS.Data/Collection/RecordSet', 'WS.Data/Entity/Model'], function(SearchGridViewModel, RecordSet, Model) {
   
   describe('Controls.List.SearchView.SearchGridViewModel', function() {
   
      describe('_private', function() {
      
         it('isNeedToHighlight', function() {
            var item = new Model({
               rawData: {
                  id: 0,
                  title: 'test'
               },
               idProperty: 'id'
            });
            assert.isFalse(!!SearchGridViewModel._private.isNeedToHighlight(item, 'title', 'xxx'));
            assert.isFalse(!!SearchGridViewModel._private.isNeedToHighlight(item, 'title', ''));
            assert.isTrue(!!SearchGridViewModel._private.isNeedToHighlight(item, 'title', 'tes'));
         });
         
      });
   
      describe('instance tests', function() {
      
         it('getCurrent', function () {
            var items = new RecordSet({
               rawData: [{id: 1, title: 'test'}],
               idProperty: 'id'
            });
            var model = new SearchGridViewModel({
               items: items,
               searchValue: 'tes',
               columns: [{displayProperty: 'id'}, {displayProperty: 'title'}],
               multiSelectVisibility: 'hidden'
            });
            model._curIndex = 0;
   
            var current = model.getCurrent();
            current.resetColumnIndex();
            assert.isFalse(!!current.getCurrentColumn().column.needSearchHighlight);
            assert.equal(current.getCurrentColumn().searchValue, 'tes');
            
            current.goToNextColumn();
            assert.isTrue(!!current.getCurrentColumn().column.needSearchHighlight);
            assert.equal(current.getCurrentColumn().searchValue, 'tes');
         });
      
      });
   
   });
   
});
