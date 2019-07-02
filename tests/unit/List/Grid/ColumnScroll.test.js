define(['Controls/_grid/ColumnScroll', 'Types/entity'], function(ColumnScroll, Entity) {

   'use strict';

   describe('Controls.ColumnScroll', function() {
      var
         cfg = {
            multiSelectVisibility: 'visible'
         },
         columnScroll = new ColumnScroll(cfg);
      columnScroll._children = {
         contentStyle: {
            innerHTML: ''
         },
         content: {
            scrollWidth: 500,
            offsetWidth: 250,
            querySelector: function() {
               return {
                  offsetLeft: 24,
                  offsetWidth: 76
               };
            }
         }
      };
      it('_beforeMount', function() {
         var
            baseCreateGuid = Entity.Guid.create;
         Entity.Guid.create = function() {
            return '1234567890';
         };
         columnScroll._beforeMount(cfg);
         Entity.Guid.create = baseCreateGuid;
         assert.equal(columnScroll._transformSelector, 'controls-ColumnScroll__transform-1234567890');
         assert.equal(columnScroll._scrollPosition, 0);
      });
      it('_afterMount', function() {
         columnScroll._afterMount(cfg);
         assert.equal(columnScroll._contentSize, 500);
         assert.equal(columnScroll._contentContainerSize, 250);
         assert.deepEqual(columnScroll._shadowState, 'end');
         assert.deepEqual(columnScroll._fixedColumnsWidth, 100);
      });
      it('_isColumnScrollVisible', function() {
         assert.isTrue(columnScroll._isColumnScrollVisible());
      });
      it('_calculateShadowStyles', function() {
         assert.equal(columnScroll._calculateShadowStyles('start'), '');
         assert.equal(columnScroll._calculateShadowStyles('end'), '');
      });
      it('_calculateShadowClasses', function() {
         assert.equal(columnScroll._calculateShadowClasses('start'),
            'controls-ColumnScroll__shadow controls-ColumnScroll__shadow-start controls-ColumnScroll__shadow_invisible');
         assert.equal(columnScroll._calculateShadowClasses('end'),
            'controls-ColumnScroll__shadow controls-ColumnScroll__shadow-end');
      });
      it('_resizeHandler', function() {
         var
            innerHTML,
            changesInnerHTML = [],
            resultChangesInnerHTML = [
               '.controls-ColumnScroll__transform-1234567890 .controls-Grid__cell_transform { transform: translateX(-50px); }',
               '.controls-ColumnScroll__transform-1234567890 .controls-Grid__cell_transform { transform: translateX(-0px); }',
               '.controls-ColumnScroll__transform-1234567890 .controls-Grid__cell_transform { transform: translateX(-50px); }'
            ];
         columnScroll._children = {
            contentStyle: {},
            content: {
               scrollWidth: 450,
               offsetWidth: 200,
               querySelector: function() {
                  return {
                     offsetLeft: 24,
                     offsetWidth: 76
                  };
               }
            }
         };
         Object.defineProperty(columnScroll._children.contentStyle, 'innerHTML', {
            set: function(newValue) {
               changesInnerHTML.push(newValue);
               innerHTML = newValue;
            },
            get: function() {
               return innerHTML;
            }
         });
         columnScroll._positionChangedHandler({}, 50);
         columnScroll._resizeHandler();
         assert.equal(450, columnScroll._contentSize);
         assert.equal(200, columnScroll._contentContainerSize);
         assert.deepEqual('startend', columnScroll._shadowState);
         assert.deepEqual(100, columnScroll._fixedColumnsWidth);
         assert.deepEqual(resultChangesInnerHTML, changesInnerHTML);
      });
      it('_positionChangedHandler', function() {
         // Scroll to 100px
         columnScroll._positionChangedHandler({}, 100);
         assert.equal(columnScroll._scrollPosition, 100);
         assert.deepEqual(columnScroll._shadowState, 'startend');
         assert.equal(columnScroll._calculateShadowStyles('start'), 'left: 100px;');
         assert.equal(columnScroll._calculateShadowStyles('end'), '');
         assert.equal(columnScroll._calculateShadowClasses('start'),
            'controls-ColumnScroll__shadow controls-ColumnScroll__shadow-start');
         assert.equal(columnScroll._calculateShadowClasses('end'),
            'controls-ColumnScroll__shadow controls-ColumnScroll__shadow-end');
         assert.equal(columnScroll._children.contentStyle.innerHTML, '.controls-ColumnScroll__transform-1234567890' +
            ' .controls-Grid__cell_transform { transform: translateX(-100px); }');

         // Scroll to 200px (to the end of content)
         columnScroll._positionChangedHandler({}, 250);
         assert.equal(columnScroll._scrollPosition, 250);
         assert.deepEqual(columnScroll._shadowState, 'start');
         assert.equal(columnScroll._calculateShadowStyles('start'), 'left: 100px;');
         assert.equal(columnScroll._calculateShadowStyles('end'), '');
         assert.equal(columnScroll._calculateShadowClasses('start'),
            'controls-ColumnScroll__shadow controls-ColumnScroll__shadow-start');
         assert.equal(columnScroll._calculateShadowClasses('end'),
            'controls-ColumnScroll__shadow controls-ColumnScroll__shadow-end controls-ColumnScroll__shadow_invisible');
         assert.equal(columnScroll._children.contentStyle.innerHTML, '.controls-ColumnScroll__transform-1234567890' +
            ' .controls-Grid__cell_transform { transform: translateX(-250px); }');
      });
   });
});
