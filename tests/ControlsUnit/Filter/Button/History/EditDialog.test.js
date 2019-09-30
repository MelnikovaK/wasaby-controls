define(
   [
      'Controls/filterPopup'
   ],
   function(filterPopup) {
      describe('FilterHistory:EditDialog', function() {
         let items = [
            {id: 'period', value: [2], textValue: 'Today'},
            {id: 'warehouse', value: [], textValue: ''},
            {id: 'sender', value: '', textValue: ''},
            {id: 'author', value: 'Ivanov K.K.', textValue: 'Ivanov K.K.', visibility: true},
            {id: 'responsible', value: '',  textValue: 'Petrov T.T.', visibility: false}
         ];

         let defaultConfig = {
            items: items,
            globalParams: 0,
            isFavorite: false,
            editedTextValue: 'Today, Ivanov K.K.'
         };

         it('prepareConfig', function() {
            let dialog = new filterPopup._EditDialog();
            dialog.prepareConfig(dialog, defaultConfig);
            assert.equal(dialog._placeholder, defaultConfig.editedTextValue);
            assert.equal(dialog._textValue, '');
            assert.equal(dialog._globalKey, 0);
            assert.deepEqual(dialog._selectedFilters, ['period', 'author']);
            assert.isOk(dialog._source);
         });

         it('_beforeUpdate', function() {
            let dialog = new filterPopup._EditDialog();
            dialog.saveOptions(defaultConfig);

            let newConfig = {...defaultConfig};
            newConfig.editedTextValue = 'new text';
            newConfig.isFavorite = true;
            newConfig.globalParams = 1;
            dialog._beforeUpdate(newConfig);
            assert.equal(dialog._textValue, newConfig.editedTextValue);
            assert.equal(dialog._globalKey, newConfig.globalParams);
            assert.deepEqual(dialog._selectedFilters, ['period', 'author']);
         });

         it('_delete', function() {
            let dialog = new filterPopup._EditDialog();

            let expectedResult, isClosed = false;
            dialog._notify = (event, data) => {
               if (event === 'sendResult') {
                  expectedResult = data[0];
               } else if (event === 'close') {
                  isClosed = true;
               }
            };

            dialog._delete();
            assert.deepEqual(expectedResult, {action: 'delete'});
            assert.isTrue(isClosed);
         });

         it('_apply', function() {
            let dialog = new filterPopup._EditDialog();
            dialog.saveOptions(defaultConfig);
            dialog.prepareConfig(dialog, defaultConfig);
            dialog._selectedFilters = [];
            let expectedResult = {}, isClosed = false;
            dialog._notify = (event, data) => {
               if (event === 'sendResult') {
                  expectedResult = data[0];
               } else if (event === 'close') {
                  isClosed = true;
               }
            };

            dialog._apply();
            assert.deepEqual(expectedResult, {});
            assert.isFalse(isClosed);

            dialog._selectedFilters = ['author'];
            dialog._apply();
            assert.equal(expectedResult.action, 'save');
            assert.deepEqual(expectedResult.record.get('filterPanelItems')[0], {id: 'period', textValue: ''});
            assert.equal(expectedResult.record.get('linkText'), '');
            assert.equal(expectedResult.record.get('globalParams'), 0);
            assert.isTrue(isClosed);
         });
      });
   });
