define(['Controls/List/Grid/GridView'], function(GridView) {
   var
      gridColumns = [
         {
            displayProperty: 'title'
         },
         {
            displayProperty: 'price',
            width: 'auto'
         },
         {
            displayProperty: 'balance',
            width: '100px'
         }
      ],
      preparedColumnsWithMultiselect = 'auto 1fr auto 100px ',
      preparedColumnsWithoutMiltiselect = '1fr auto 100px ';

   describe('Controls.List.Grid.GridView', function() {
      it('GridView.prepareGridTemplateColumns', function() {
         assert.equal(preparedColumnsWithMultiselect, GridView._private.prepareGridTemplateColumns(gridColumns, true),
            'Incorrect result "prepareGridTemplateColumns(gridColumns, true)".');
         assert.equal(preparedColumnsWithoutMiltiselect, GridView._private.prepareGridTemplateColumns(gridColumns, false),
            'Incorrect result "prepareGridTemplateColumns(gridColumns, false)".');
      });
      
   });
});
