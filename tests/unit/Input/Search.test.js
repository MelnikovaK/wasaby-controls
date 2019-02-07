define(
   [
      'Core/Control',
      'Controls/Input/Search'
   ],
   function(Control, Search) {
      'use strict';

      describe('Controls/Input/Search', function() {

         var valueSearch;


         describe('search', function() {
            it('Click on search', function() {
               let search = new Search();
               let searched = false;
               let activated = false;
               
               search._notify = (e, args) => {
                  searched = true;
               };
               search.activate = () => {
                  activated = true;
               };

               search._searchClick();
               assert.isTrue(searched);
               assert.isTrue(activated);
               searched = activated = false;
               search._options.readOnly = true;
               search._searchClick();
               assert.isFalse(searched);
               assert.isFalse(activated);
            });

            it('_resetClick', function() {
               let search = new Search();
               let resetClicked = false;
               let activated = false;

               search._beforeMount({
                  value: ''
               });

               search._notify = (e, args) => {
                  if ( e == 'resetClick') {
                     resetClicked = true;
                  } else if (e == 'valueChanged'){
                     assert.equal(args[0], '');
                  }
               };
               search.activate = () => {
                  activated = true;
               };

               search._resetClick();
               assert.isTrue(resetClicked);
               assert.isTrue(activated);
               resetClicked = activated = false;
               search._options.readOnly = true;
               search._searchClick();
               assert.isFalse(resetClicked);
               assert.isFalse(activated);
            });

            it('Enter click', function() {
               let search = new Search();
               let activated = false;
               search._notify = (e, args) => {
                  assert.equal(e, 'searchClick');
               };
               search.activate = () => {
                  activated = true;
               };
               search._keyUpHandler({
                  nativeEvent: {
                     which: 13 //enter key
                  }
               });
               assert.isTrue(activated);
            });
         });
      });
   });
